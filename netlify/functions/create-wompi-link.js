'use strict';

const WOMPI_TOKEN_URL = 'https://id.wompi.sv/connect/token';
const WOMPI_PAYMENT_LINK_URL = 'https://api.wompi.sv/EnlacePago';

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify(payload),
});

function cleanSiteUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function money(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function makeOrderRef() {
  return `BC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function buildDescription(items = [], message = '', customer = {}) {
  const itemLines = items.slice(0, 8).map((item, index) => {
    const title = String(item.title || 'Producto').slice(0, 80);
    const size = String(item.size || '').slice(0, 20);
    const color = String(item.color || '').slice(0, 30);
    const qty = Number(item.qty || 1);
    return `${index + 1}. ${title} | Talla: ${size} | Color: ${color} | Cant: ${qty}`;
  });

  const customerLines = customer && customer.name ? [
    `Cliente: ${customer.name || ''}`,
    `WhatsApp: ${customer.phone || ''}`,
    `Entrega: ${customer.department || ''} ${customer.municipality || ''}`.trim(),
  ] : [];

  return [...itemLines, ...customerLines, message ? String(message).slice(0, 500) : '']
    .filter(Boolean)
    .join('\n')
    .slice(0, 1500);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, {
      error: 'Method Not Allowed',
      detail: 'Esta función solo acepta POST desde el checkout de BlackCat.',
    });
  }

  const appId = process.env.WOMPI_APP_ID;
  const apiSecret = process.env.WOMPI_API_SECRET;
  const siteUrl = cleanSiteUrl(process.env.SITE_URL || 'https://blackcatsv.shop');
  const notifyEmail = process.env.WOMPI_NOTIFY_EMAIL || 'blackcat2811@hotmail.com';

  if (!appId || !apiSecret) {
    return json(500, {
      error: 'Faltan variables de Wompi en Netlify.',
      detail: 'Configura WOMPI_APP_ID y WOMPI_API_SECRET.',
    });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return json(400, { error: 'JSON inválido.' });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const customer = payload.customer || {};
  const message = String(payload.message || '');

  if (!items.length) {
    return json(400, { error: 'No hay productos para pagar.' });
  }

  const calculatedTotal = money(
    items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1), 0)
  );

  const requestedTotal = money(payload.total || calculatedTotal);
  const total = calculatedTotal > 0 ? calculatedTotal : requestedTotal;

  if (!total || total < 0.01) {
    return json(400, { error: 'El total del pedido no es válido.' });
  }

  const orderRef = makeOrderRef();
  const productName = items.length === 1
    ? String(items[0].title || 'Pedido BlackCat').slice(0, 120)
    : `Pedido BlackCat (${items.length} productos)`;

  try {
    const tokenResponse = await fetch(WOMPI_TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: apiSecret,
        audience: 'wompi_api',
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok || !tokenData.access_token) {
      return json(502, {
        error: 'Wompi no entregó token de acceso.',
        status: tokenResponse.status,
        detail: tokenData.error_description || tokenData.error || tokenData,
      });
    }

    const wompiPayload = {
      identificadorEnlaceComercio: orderRef,
      monto: total,
      nombreProducto: productName,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: false,
        permitirPagoEnCuotasAgricola: false,
        permitirPagoEnBitcoin: false,
        permitePagoQuickPay: false,
      },
      infoProducto: {
        descripcionProducto: buildDescription(items, message, customer),
      },
      configuracion: {
        urlRedirect: `${siteUrl}/pago-wompi.html`,
        urlRetorno: siteUrl,
        esMontoEditable: false,
        esCantidadEditable: false,
        cantidadPorDefecto: 1,
        duracionInterfazIntentoMinutos: 30,
        emailsNotificacion: notifyEmail,
        urlWebhook: `${siteUrl}/.netlify/functions/wompi-webhook`,
        notificarTransaccionCliente: true,
      },
      limitesDeUso: {
        cantidadMaximaPagosExitosos: 1,
        cantidadMaximaPagosFallidos: 5,
      },
    };

    const wompiResponse = await fetch(WOMPI_PAYMENT_LINK_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokenData.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(wompiPayload),
    });

    const wompiData = await wompiResponse.json().catch(() => ({}));

    if (!wompiResponse.ok || !wompiData.urlEnlace) {
      return json(502, {
        error: 'Wompi no pudo crear el enlace de pago.',
        status: wompiResponse.status,
        detail: wompiData,
      });
    }

    return json(200, {
      ok: true,
      orderRef,
      urlEnlace: wompiData.urlEnlace,
      idEnlace: wompiData.idEnlace || null,
      estaProductivo: wompiData.estaProductivo,
    });
  } catch (error) {
    return json(500, {
      error: 'Error interno creando pago con Wompi.',
      detail: error.message,
    });
  }
};
