'use strict';

const crypto = require('crypto');
const {db}=require('./lib/store');

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

function safeCompare(a = '', b = '') {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getHeader(headers = {}, name) {
  const found = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return found ? headers[found] : '';
}

function findOrderRef(data = {}) {
  return data.EnlacePago?.IdentificadorEnlaceComercio || data.enlacePago?.identificadorEnlaceComercio || data.identificadorEnlaceComercio ||
    data.IdentificadorEnlaceComercio ||
    data.transaccionCompra?.idExterno ||
    data.transaccionCompra?.identificadorEnlaceComercio ||
    data.idExterno ||
    '';
}

function isApprovedPayment(data = {}) {
  const tx = data.transaccionCompra || data.TransaccionCompra || data;
  return data.ResultadoTransaccion === 'ExitosaAprobada' || tx.esAprobada === true || tx.EsAprobada === true || String(tx.esAprobada).toLowerCase() === 'true';
}

function paymentValue(data = {}) {
  const tx = data.transaccionCompra || data.TransaccionCompra || data;
  const candidates = [tx.monto, tx.Monto, tx.montoTransaccion, tx.MontoTransaccion, data.monto, data.Monto];
  const value = candidates.map(Number).find((candidate) => Number.isFinite(candidate) && candidate > 0);
  return value || 0;
}

async function sendMetaPurchase({ orderRef, value }) {
  const pixelId = process.env.META_PIXEL_ID || '1550108226705883';
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !accessToken || !orderRef || !value) return { sent: false };

  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: orderRef,
        action_source: 'website',
        event_source_url: process.env.SITE_URL || 'https://blackcatsv.shop/pago-wompi.html',
        custom_data: { currency: 'USD', value, order_id: orderRef },
      }],
    }),
  });

  if (!response.ok) throw new Error(`Meta CAPI respondió ${response.status}`);
  return { sent: true };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const body = event.isBase64Encoded ? Buffer.from(event.body||'', 'base64').toString('utf8') : event.body || '';
  const apiSecret = process.env.WOMPI_API_SECRET || '';
  if (!apiSecret) return json(503,{error:'Verificación de Wompi no configurada.'});
  const receivedHash = getHeader(event.headers, 'Wompi_Hash') || getHeader(event.headers, 'wompi_hash');

  if (apiSecret && !receivedHash) {
    return json(401, { error: 'Falta firma de Wompi.' });
  }

  if (apiSecret && receivedHash) {
    const expectedHash = crypto.createHmac('sha256', apiSecret).update(body).digest('hex');
    if (!safeCompare(expectedHash, receivedHash)) {
      return json(401, { error: 'Hash inválido.' });
    }
  }

  let data = {};
  try {
    data = JSON.parse(body || '{}');
  } catch (_) {
    return json(400, { error: 'JSON inválido.' });
  }

  const orderRef = findOrderRef(data);
  const approved = isApprovedPayment(data);
  const value = paymentValue(data);
  let metaPurchaseSent = false;

  if (approved) {
    try {
      if (!orderRef || !value) return json(400,{error:'Falta referencia o importe.'});
      const path=`orders?brand=eq.blackcat&order_ref=eq.${encodeURIComponent(orderRef)}`;
      const orders=await db(path+'&select=id,total,status,payment_status');
      if (orders.length!==1) return json(404,{error:'Pedido no encontrado.'});
      const order=orders[0];
      if (Math.round(Number(order.total)*100)!==Math.round(value*100)) return json(409,{error:'El importe no coincide con el pedido.'});
      if (order.payment_status==='paid') return json(200,{ok:true,duplicate:true});
      const updated=await db(path+'&payment_status=eq.pending',{method:'PATCH',body:JSON.stringify({payment_status:'paid',status:order.status==='pending'?'paid':order.status,paid_at:new Date().toISOString(),wompi_transaction_id:String(data.IdTransaccion||''),wompi_payment_attempt_id:String(data.IdIntentoPago||''),wompi_authorization_code:String(data.CodigoAutorizacion||''),wompi_result:String(data.ResultadoTransaccion||'ExitosaAprobada')})});
      if (!updated?.length) return json(200,{ok:true,duplicate:true});
    } catch(error) { return json(503,{error:'No se pudo sincronizar el pago. Wompi debe reintentar.'}); }
    try {
      metaPurchaseSent = (await sendMetaPurchase({ orderRef, value })).sent;
    } catch (error) {
      console.error('BlackCat Meta Purchase:', error.message);
    }
  }

  console.log('BlackCat Wompi webhook:', JSON.stringify({ orderRef, approved, value, metaPurchaseSent }));

  return json(200, { ok: true, orderRef, approved, metaPurchaseSent });
};
