'use strict';
// Vista previa aislada de un feed de Meta. No modifica productos ni enlaza cuentas.
// Para activar en un despliegue de prueba: META_CATALOG_FEED_ENABLED=true.
// SOLO incluye registros activos de meta_products. Revisar registros antes de activarlo.
const {db} = require('./lib/store.js');
const columns = ['id','title','description','availability','condition','price','link','image_link','brand'];
const csv = v => '"' + String(v == null ? '' : v).replace(/"/g,'""').replace(/[\r\n]+/g,' ') + '"';
const isHttps = v => { try { return new URL(String(v)).protocol === 'https:'; } catch { return false; } };
exports.handler = async event => {
  if(event.httpMethod !== 'GET') return {statusCode:405,body:'Method not allowed'};
  if(process.env.META_CATALOG_FEED_ENABLED !== 'true') return {statusCode:404,body:'Feed de prueba desactivado'};
  try {
    const rows = await db('meta_products?active=eq.true&select=id,sku,title,description,availability,condition,price,currency,image_url,website_url&order=id.asc');
    const lines = [columns.join(',')];
    for(const p of rows) {
      if(!p.title || !isHttps(p.image_url) || !isHttps(p.website_url) || !(Number(p.price)>0)) continue;
      const item = [
        p.sku || 'BC-META-' + p.id, p.title, p.description || p.title,
        p.availability || 'in stock', p.condition || 'new',
        Number(p.price).toFixed(2) + ' ' + (p.currency || 'USD'),
        p.website_url, p.image_url, 'Black Cat'
      ];
      lines.push(item.map(csv).join(','));
    }
    return {statusCode:200,headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store'},body:'\uFEFF'+lines.join('\r\n')+'\r\n'};
  } catch(e) {
    return {statusCode:500,body:'No se pudo preparar el catálogo'};
  }
};
