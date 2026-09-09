'use strict';
const createPricing=require('../../../js/pricing.js').create;
async function db(path,options={}){
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Falta configurar la conexión segura a Supabase en Netlify.');
 const r=await fetch(`${url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...options.headers}});
 if(!r.ok)throw Error(`No se pudo sincronizar Supabase (${r.status}).`);
 return r.status===204?null:r.json();
}
async function quote(items){
 if(!Array.isArray(items)||!items.length||items.length>100)throw Error("Carrito vacío o inválido.");
 const [products,settings]=await Promise.all([db('products?brand=eq.blackcat&active=eq.true&select=*'),db('site_settings?id=eq.1&select=*')]);
 const pricing=createPricing();if(!pricing.configure(products,settings[0]))throw Error('Configura las tarifas de envío y BOX en Supabase.');
 const canonical=pricing.quote(items);return {items:canonical,...pricing.totals(canonical)};
}
async function saveOrder(q,orderRef,channel,customer,message){
 const order={order_ref:orderRef,brand:'blackcat',product_id:String(q.items[0].id),product_name:q.items.map(i=>i.title).join(' + '),product_price:q.items[0].unitPrice,quantity:q.items.reduce((n,i)=>n+i.qty*(i.boxSize||1),0),size:q.items.map(i=>i.size).join(', '),subtotal:q.subtotal,shipping:q.shipping,total:q.total,items:q.items,status:'pending',payment_status:'pending',source:'website',checkout_channel:channel,customer_phone:customer.phone||'',whatsapp_message:message};
 await db('orders',{method:'POST',body:JSON.stringify(order)});return order;
}
module.exports={db,quote,saveOrder};
