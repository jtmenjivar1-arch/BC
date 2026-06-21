'use strict';

const crypto = require('crypto');

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
  return data.identificadorEnlaceComercio ||
    data.IdentificadorEnlaceComercio ||
    data.transaccionCompra?.idExterno ||
    data.transaccionCompra?.identificadorEnlaceComercio ||
    data.idExterno ||
    '';
}

function isApprovedPayment(data = {}) {
  const tx = data.transaccionCompra || data.TransaccionCompra || data;
  return tx.esAprobada === true || tx.EsAprobada === true || String(tx.esAprobada).toLowerCase() === 'true';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const body = event.body || '';
  const apiSecret = process.env.WOMPI_API_SECRET || '';
  const receivedHash = getHeader(event.headers, 'Wompi_Hash') || getHeader(event.headers, 'wompi_hash');

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

  // En esta primera integración se confirma el webhook y se deja listo para logs.
  // Para cambiar status a paid con precisión, conviene guardar orderRef en una columna de orders.
  console.log('BlackCat Wompi webhook:', JSON.stringify({ orderRef, approved }));

  return json(200, { ok: true, orderRef, approved });
};
