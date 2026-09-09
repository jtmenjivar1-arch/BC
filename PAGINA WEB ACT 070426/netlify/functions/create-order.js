'use strict';
const {quote,saveOrder}=require('./lib/store');
const {randomUUID}=require('crypto');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return {statusCode:405,body:'Method not allowed'};
 try{
  const p=JSON.parse(event.body||'{}'),q=await quote(p.items);
  if(Math.round(Number(p.total)*100)!==Math.round(q.total*100))return {statusCode:409,body:JSON.stringify({error:'Los precios cambiaron. Actualiza el carrito antes de confirmar.'})};
  const ref='BC-'+randomUUID();
  const order=await saveOrder(q,ref,'whatsapp',p.customer||{},p.message||'');
  return {statusCode:200,headers:{'content-type':'application/json'},body:JSON.stringify({ok:true,orderRef:ref,order})};
 }catch(e){return {statusCode:400,body:JSON.stringify({error:e.message})};}
};
