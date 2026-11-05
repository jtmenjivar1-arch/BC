import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const path = new URL('./supabase/functions/blackcat-whatsapp-ai/index.ts', import.meta.url);
const source = stripTypeScriptTypes(readFileSync(path, 'utf8').replace(/^import .*;\n/, ''));
const settings = {
  META_APP_SECRET: 'synthetic-app-secret',
  META_VERIFY_TOKEN: 'synthetic-verify-token',
  META_ACCESS_TOKEN: 'synthetic-token',
  META_PHONE_NUMBER_ID: '12345',
  BLACKCAT_WHATSAPP_TEST_SENDERS: '+12025550101',
  SUPABASE_URL: 'https://supabase.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key',
};

function harness(overrides = {}, commerce = { shipping: 399, freeAbove: 5500, boxes: { 2: 3999, 3: 5599, 4: 7499 } }) {
  const env = { ...settings, ...overrides };
  const sends = [];
  const writes = new Set();
  let handoff = false;
  let connections = 0;
  let handler;
  const db = {
    from(table) {
      const query = {
        insert({ message_id }) {
          if (writes.has(message_id)) return { error: { code: '23505' } };
          writes.add(message_id);
          return {};
        },
        update() { return query; },
        delete() { handoff = false; return query; },
        upsert() { handoff = true; return {}; },
        select() { return query; },
        eq() { return query; },
        in() { return query; },
        order() { return query; },
        maybeSingle() {
          if (table === 'site_settings') return { data: { commerce_config: commerce } };
          return { data: { needs_human: handoff } };
        },
        limit() {
          if (table === 'orders') return { data: [] };
          assert.equal(table, 'products');
          return { data: [
            { title: 'Naruto', anime: 'Naruto', category: 'camisa', types: ['oversize'], price_basic: 18.99, price_oversize: 24.99 },
            { title: 'Sudadera negra', category: 'hoodie', price: 28.99 },
          ] };
        },
      };
      return query;
    },
  };
  vm.runInNewContext(source, {
    Deno: { env: { get: (key) => env[key] }, serve: (callback) => { handler = callback; } },
    createClient: () => { connections++; return db; },
    fetch: async (url, request) => {
      assert.equal(url, 'https://graph.facebook.com/v23.0/12345/messages');
      sends.push(JSON.parse(request.body));
      return new Response('{}');
    },
    crypto: globalThis.crypto, URL, Response, TextEncoder, console,
  });
  function event({ to = '12345', from = '12025550101', id = 'synthetic-1', field = 'messages', text = '¿Cuánto cuesta Naruto?', signature = true, timestamp = String(Math.floor(Date.now() / 1000)) } = {}) {
    const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{
      field, value: { metadata: { phone_number_id: to }, messages: [{ from, id, timestamp, type: 'text', text: { body: text } }] },
    }] }] });
    const digest = createHmac('sha256', signature ? settings.META_APP_SECRET : 'wrong-secret').update(body).digest('hex');
    return handler(new Request('https://webhook.invalid', { method: 'POST', headers: { 'X-Hub-Signature-256': `sha256=${digest}` }, body }));
  }
  return { event, handler, sends, writes, get connections() { return connections; } };
}

test('Meta challenge is verified even with responses disabled', async () => {
  const { handler } = harness();
  const url = 'https://webhook.invalid?hub.mode=subscribe&hub.challenge=synthetic-challenge&hub.verify_token=';
  const good = await handler(new Request(url + settings.META_VERIFY_TOKEN));
  assert.equal(await good.text(), 'synthetic-challenge');
  assert.equal((await handler(new Request(url + 'wrong'))).status, 403);
});

test('signed events do not read data or send with a missing, disabled or unknown mode', async () => {
  for (const mode of [undefined, 'disabled', 'unknown']) {
    const app = harness({ BLACKCAT_WHATSAPP_MODE: mode });
    assert.equal((await app.event()).status, 200);
    assert.equal(app.connections, 0);
    assert.equal(app.writes.size, 0);
    assert.equal(app.sends.length, 0);
  }
});

test('invalid Meta signatures are rejected', async () => {
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  assert.equal((await app.event({ signature: false })).status, 401);
  assert.equal(app.connections, 0);
  assert.equal(app.sends.length, 0);
});

test('test mode ignores an empty list, other senders, another destination and app echoes', async () => {
  const empty = harness({ BLACKCAT_WHATSAPP_MODE: 'test', BLACKCAT_WHATSAPP_TEST_SENDERS: '' });
  assert.equal((await empty.event()).status, 200);
  assert.equal(empty.connections, 0);
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  for (const options of [{ from: '12025550102' }, { to: '45678' }, { field: 'smb_message_echoes' }]) {
    assert.equal((await app.event(options)).status, 200);
  }
  assert.equal(app.writes.size, 0);
  assert.equal(app.sends.length, 0);
});

test('allowed test sender sees catalog and shipping from data, with duplicate delivery suppressed', async () => {
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  assert.equal((await app.event()).status, 200);
  assert.equal((await app.event()).status, 200);
  assert.equal((await app.event({ id: 'synthetic-2', text: '¿Cuánto vale el envío?' })).status, 200);
  assert.equal(app.sends.length, 2);
  assert.equal(app.sends[0].to, '12025550101');
  assert.match(app.sends[0].text.body, /Naruto.*\$24\.99/);
  assert.doesNotMatch(app.sends[0].text.body, /Regular/);
  assert.match(app.sends[1].text.body, /\$3\.99/);
  assert.match(app.sends[1].text.body, /mayores de \$55\.00/);
});

test('hoodies use their product price and expired or invalid timestamps never send', async () => {
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  const yesterday = String(Math.floor(Date.now() / 1000) - 86401);
  await app.event({ id: 'expired', text: 'Sudadera', timestamp: yesterday });
  await app.event({ id: 'invalid', text: 'Sudadera', timestamp: 'invalid' });
  await app.event({ id: 'valid', text: 'Sudadera' });
  assert.equal(app.writes.size, 1);
  assert.equal(app.sends.length, 1);
  assert.match(app.sends[0].text.body, /Sudadera negra: \$28\.99/);
  assert.doesNotMatch(app.sends[0].text.body, /Oversize/);
});

test('web BOX quotes use the current package price and shipping threshold together', async () => {
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  await app.event({ id: 'box2', text: '¿Cuánto sale la BOX 2 con envío?' });
  await app.event({ id: 'box3', text: '¿Cuánto cuesta el box de 3?' });
  assert.equal(app.sends.length, 2);
  assert.match(app.sends[0].text.body, /BOX 2.*\$39\.99/);
  assert.match(app.sends[0].text.body, /envío nacional cuesta \$3\.99.*\$43\.98/i);
  assert.match(app.sends[1].text.body, /BOX 3.*\$55\.99/);
  assert.match(app.sends[1].text.body, /envío nacional es gratis/i);
});

test('web BOX quotes charge at the threshold and omit a total without shipping settings', async () => {
  const options = { BLACKCAT_WHATSAPP_MODE: 'test' };
  const atThreshold = harness(options, { shipping: 399, freeAbove: 5500, boxes: { 2: 5500 } });
  await atThreshold.event({ text: 'BOX 2' });
  assert.match(atThreshold.sends[0].text.body, /envío nacional cuesta \$3\.99.*\$58\.99/i);
  const missing = harness(options, { boxes: { 2: 3999 } });
  await missing.event({ text: 'BOX 2 con envío' });
  assert.match(missing.sends[0].text.body, /envío por confirmar/i);
  assert.doesNotMatch(missing.sends[0].text.body, /total/i);
});

test('requesting an advisor suppresses future replies until the test sender opts back in', async () => {
  const app = harness({ BLACKCAT_WHATSAPP_MODE: 'test' });
  await app.event({ id: 'advisor', text: 'Quiero hablar con un asesor' });
  await app.event({ id: 'pause', text: 'Naruto' });
  await app.event({ id: 'resume', text: 'Volver al bot' });
  await app.event({ id: 'order', text: 'Estado de mi pedido' });
  assert.equal(app.sends.length, 3);
  assert.match(app.sends[0].text.body, /atención humana/);
  assert.match(app.sends[1].text.body, /vuelve a atenderte/);
  assert.match(app.sends[2].text.body, /No encontré una orden/);
});
