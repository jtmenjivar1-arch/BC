'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const fields=[['price_basic_2xl','Regular Fit 2XL'],['price_basic_3xl','Regular Fit 3XL'],['price_oversize_2xl','Oversize 2XL'],['price_oversize_3xl','Oversize 3XL'],['price_hoodie_xl','Hoodie XL (vacío: usa precio base)'],['price_hoodie_2xl','Hoodie 2XL (vacío: usa precio base)']];
 const priceHost=$('priceBasicWrap');
 for(const [key,label] of fields)priceHost.insertAdjacentHTML('beforebegin',`<div class="field"><label for="${key}">${label}</label><input id="${key}" type="number" min="0.01" step="0.01" placeholder="Precio por unidad"></div>`);
 priceHost.insertAdjacentHTML('beforebegin','<div class="field"><label><input type="checkbox" id="boxEligible" checked> Participa en BOX (solo Oversize S–XL, no premium)</label></div>');
 let currentConfig={};
 const section=document.createElement('section');section.className='form-section';
 section.innerHTML='<h3>BOX, envío y contacto</h3><p>Los importes se guardan en Supabase y se usan también al cobrar.</p><div id="commerceFields" class="form-grid"></div><p>Guarda con el botón “Guardar configuración” del bloque principal.</p>';
 $('heroSettingsSection').before(section);
 const configFields=[['box2','BOX 2'],['box3','BOX 3'],['box4','BOX 4'],['shipping','Envío'],['freeAbove','Envío gratis por encima de']];
 configFields.forEach(([key,label])=>$('commerceFields').insertAdjacentHTML('beforeend',`<div class="field"><label for="cfg_${key}">${label} ($)</label><input type="number" min="0" step=".01" id="cfg_${key}"></div>`));
 for(const key of ['whatsapp','instagram','tiktok','email'])$('commerceFields').insertAdjacentHTML('beforeend',`<div class="field"><label for="contact_${key}">${key}</label><input id="contact_${key}" type="text"></div>`);
 for(const n of [2,3,4])$('commerceFields').insertAdjacentHTML('beforeend',`<div class="field"><label>Slide BOX ${n}: título</label><input id="slide_title_${n}"><label>URL de fotografía (opcional)</label><input id="slide_image_${n}"></div>`);
 window.bcAdminFillPrices=p=>{fields.forEach(([key])=>$(key).value=p[key]??'');$('boxEligible').checked=p.box_eligible!==false;};
 window.bcAdminReadPrices=()=>Object.fromEntries([...fields.map(([key])=>[key,$(key).value===''?null:Number($(key).value)]),['box_eligible',$('boxEligible').checked]]);
 window.bcAdminFillCommerce=data=>{
  currentConfig=data.commerce_config||{};
  configFields.forEach(([key])=>{const cents=key.startsWith('box')?currentConfig.boxes?.[key.slice(3)]:currentConfig[key];$('cfg_'+key).value=cents==null?'':cents/100;});
  ['whatsapp','instagram','tiktok','email'].forEach(key=>$('contact_'+key).value=data[key]||'');
  [2,3,4].forEach(n=>{ $('slide_title_'+n).value=currentConfig.slides?.[n]?.title||'';$('slide_image_'+n).value=currentConfig.slides?.[n]?.image||'';});
 };
 window.bcAdminReadCommerce=()=>{
  const cents=key=>{const input=$('cfg_'+key);const n=Number(input.value);if(input.value===''||!Number.isFinite(n)||n<0||(key.startsWith('box')&&n===0))throw Error('Completa las tarifas de BOX y envío con importes válidos.');return Math.round(n*100);};
  const commerce_config={...currentConfig,boxes:{2:cents('box2'),3:cents('box3'),4:cents('box4')},shipping:cents('shipping'),freeAbove:cents('freeAbove'),slides:{}};
  [2,3,4].forEach(n=>commerce_config.slides[n]={title:$('slide_title_'+n).value.trim(),image:$('slide_image_'+n).value.trim()});
  return {commerce_config,...Object.fromEntries(['whatsapp','instagram','tiktok','email'].map(key=>[key,$('contact_'+key).value.trim()]))};
 };
 const orders=document.createElement('section');orders.className='form-section';orders.innerHTML='<h3>Pedidos Black Cat</h3><button type="button" class="btn" id="refreshOrders">Actualizar pedidos</button><div id="ordersStatus"></div><div id="ordersList" style="overflow:auto"></div>';
 section.after(orders);let client=null;
 async function load(){
  if(!client)return;
  const {data,error}=await client.from('orders').select('id,order_ref,created_at,product_name,total,status,payment_status,customer_phone,whatsapp_message').eq('brand','blackcat').order('created_at',{ascending:false}).limit(100);
  $('ordersStatus').textContent=error?'No se pudieron cargar los pedidos. Revisa tu acceso de administrador.':'Últimos 100 pedidos. Pago y estado se consultan directamente en Supabase.';
  if(error)return;$('ordersList').replaceChildren();
  for(const row of data){const article=document.createElement('details');const summary=document.createElement('summary');summary.textContent=`${row.order_ref||row.id} · $${Number(row.total).toFixed(2)} · ${row.status} · Pago: ${row.payment_status||'pendiente'}`;const p=document.createElement('pre');p.style.whiteSpace='pre-wrap';p.textContent=row.whatsapp_message||row.product_name;article.append(summary,p);$('ordersList').append(article);}
 }
 $('refreshOrders').onclick=load;
 window.bcAdminLoadOrders=c=>{client=c;return load();};
 setInterval(()=>{if(client&&!document.hidden)load();},30000);
})();
