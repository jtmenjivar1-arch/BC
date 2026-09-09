(function(root,factory){
 const api=factory(); api.create=factory;
 if(typeof module==='object'&&module.exports) module.exports=api; else root.BCPricing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const sizes=['S','M','L','XL'];
 let catalog=new Map(),config=null;
 const boxes={};
 function money(v){const n=Number(v);if(v===null||v===undefined||v===''||!Number.isFinite(n)||n<=0)return null;return Math.round(n*100);}
 function category(p){const s=String(p.category||'').toLowerCase();if(/hoodie|sudadera/.test(s))return 'hoodies';if(/extra|termo|tote|accesorio|producto_fijo/.test(s))return 'extras';return 'catalog';}
 function types(p){
  if(category(p)==='hoodies')return ['hoodie'];if(category(p)==='extras')return ['producto','personalizado','termo'];
  const mode=String(p.shirt_mode||p.shirtMode||p.product_type||'basic');
  const list=Array.isArray(p.types)&&p.types.length?p.types:Array.isArray(p.adminTypes)&&p.adminTypes.length?p.adminTypes:mode==='both'?['basic','oversize']:mode.replace(/boxy_fit/g,'boxyfit').split('_');
  return [...new Set(list.map(t=>t==='boxyfit'?'oversize':t).filter(t=>['basic','oversize','croptop'].includes(t)))];
 }
 function isPremium(p){return p.premium===true||p.price_tier==='premium'||/premium/i.test(String(p.badge||''));}
 function isTote(p){return /tote/i.test([p.title,p.product_type,p.productType,p.type].join(' '));}
 function field(p,snake,camel){return p[snake]??p[camel];}
 function fixedPrice(input,type,size){
  const p=catalog.get(String(input.id))||input;
  if(type==='boxyfit')type='oversize';
  let value;
  if(category(p)==='extras')value=p.price??p.price_custom;
  else if(type==='hoodie')value=size==='XL'?field(p,'price_hoodie_xl','priceHoodieXL'):size==='2XL'?field(p,'price_hoodie_2xl','priceHoodie2XL'):p.price;
  else if(['basic','oversize'].includes(type)){
    const camel=type==='basic'?'priceBasic':'priceOversize';
    if(['2XL','3XL'].includes(size))return money(field(p,`price_${type}_${size.toLowerCase()}`,camel+size));
    else value=field(p,`price_${type}`,camel);
  }else if(type==='croptop')value=field(p,'price_croptop','priceCropTop');
  return money(value)??money(p.price);
 }
 function configure(products,settings){
  catalog=new Map(products.map(p=>[String(p.id),p]));
  const c=settings?.commerce_config||settings?.commerceConfig;
  config=null;Object.keys(boxes).forEach(k=>delete boxes[k]);
  if(!c||!c.boxes||![2,3,4].every(n=>Number.isInteger(c.boxes[n])&&c.boxes[n]>0)||!Number.isInteger(c.shipping)||c.shipping<0||!Number.isInteger(c.freeAbove)||c.freeAbove<0) return false;
  config={...c};Object.assign(boxes,c.boxes);return true;
 }
 function quantity(v){const n=Number(v);if(!Number.isInteger(n)||n<1||n>100)throw Error('Cantidad inválida.');return n;}
 function productFor(item){const p=catalog.get(String(item.id));if(!p||p.active===false||p.activo===false)throw Error('Un producto ya no está disponible. Actualiza tu carrito.');return p;}
 function validVariant(p,item){
  if(!types(p).includes(item.type))throw Error('Este corte ya no está disponible.');
  if(Array.isArray(p.sizes)&&p.sizes.length&&!p.sizes.includes(item.size)&&category(p)!=='extras')throw Error('La talla ya no está disponible.');
  if(Array.isArray(p.colors)&&p.colors.length&&!p.colors.some(c=>(typeof c==='object'?c.name:c)===item.color))throw Error('El color ya no está disponible.');
 }
 function unitCents(item){
  if(!config)throw Error('La configuración de precios no está disponible. Intenta nuevamente.');
  if(item.boxSize!=null||item.type==='box'){
    const n=Number(item.boxSize);if(!boxes[n]||!Array.isArray(item.contents)||item.contents.length!==n)throw Error('Completa las camisas de tu BOX.');
    item.contents.forEach(part=>{const p=productFor(part);validVariant(p,part);if(category(p)!=='catalog'||part.type!=='oversize'||!sizes.includes(part.size)||quantity(part.qty)!==1||isPremium(p)||p.box_eligible===false)throw Error('Este diseño no participa en BOX.');});
    return boxes[n];
  }
  const p=productFor(item);validVariant(p,item);
  const cents=fixedPrice(p,item.type,item.size);if(cents===null)throw Error('El producto no tiene precio configurado.');return cents;
 }
 function totals(items=[]){if(!config)throw Error('La configuración de precios no está disponible.');if(!Array.isArray(items)||items.length>100)throw Error('Carrito inválido.');const cents=items.reduce((s,i)=>s+unitCents(i)*quantity(i.qty),0);const shipping=items.length&&cents<=config.freeAbove?config.shipping:0;return {subtotal:cents/100,shipping:shipping/100,total:(cents+shipping)/100};}
 function quote(items){if(!Array.isArray(items)||items.length>100)throw Error('Carrito vacío o inválido.');return items.map(i=>{const price=unitCents(i)/100;const p=i.boxSize?productFor(i.contents[0]):productFor(i);return {...i,qty:quantity(i.qty),id:p.id,title:i.boxSize?`BOX ${i.boxSize} · ${i.boxSize} Oversize`:p.title,unitPrice:price,contents:i.boxSize?i.contents.map(part=>({...part,title:productFor(part).title})):undefined};});}
 function count(items){return items.reduce((s,i)=>s+quantity(i.qty)*(i.boxSize||1),0);}
 return {boxes,sizes,configure,fixedPrice,isPremium,isTote,unitCents,totals,quote,count,types,ready:()=>Boolean(config),shippingText:()=>config?`Envío $${(config.shipping/100).toFixed(2)} · GRATIS en compras mayores de $${(config.freeAbove/100).toFixed(2)}`:'Consultando envío…'};
});
