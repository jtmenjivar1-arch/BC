'use strict';
// Lote piloto aislado. No lee public.products, meta_products ni el catálogo manual de WhatsApp.
// Se activa únicamente en un entorno de prueba con META_CATALOG_FEED_ENABLED=true.
const pilot = require('../../data/catalogo-social-lote-01.json');
const columns = ['id','title','description','availability','condition','price','link','image_link','brand'];
const csv = value => '"' + String(value == null ? '' : value).replace(/"/g,'""').replace(/[\r\n]+/g,' ') + '"';
const https = value => { try { return new URL(String(value)).protocol === 'https:'; } catch { return false; } };
function approvedRows() {
  return (pilot.publicaciones || []).filter(p =>
    p.autorizado_para_publicar === true && p.estado === 'aprobado' &&
    p.sku_propuesto && p.nombre && Number(p.precio_usd) > 0 &&
    https(p.imagen_url) && https(p.destino_compra));
}
exports.handler = async event => {
  if(event.httpMethod !== 'GET') return {statusCode:405,body:'Method not allowed'};
  if(process.env.META_CATALOG_FEED_ENABLED !== 'true') return {statusCode:404,body:'Feed de prueba desactivado'};
  const lines = [columns.join(',')];
  for(const p of approvedRows()) {
    const values = [p.sku_propuesto, p.nombre, p.descripcion || p.nombre,
      'in stock', 'new', Number(p.precio_usd).toFixed(2)+' USD',
      p.destino_compra,p.imagen_url,'Black Cat'];
    lines.push(values.map(csv).join(','));
  }
  return {statusCode:200,headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store'},body:'\uFEFF'+lines.join('\r\n')+'\r\n'};
};
