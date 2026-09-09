'use strict';
function syncCommerceText(){
 if(!BCPricing.ready())return;
 document.querySelectorAll('.promo-track span:nth-child(4),.promo-track span:nth-child(8)').forEach(e=>e.textContent=BCPricing.shippingText());
 document.querySelectorAll('[data-box-start]').forEach(b=>{
  const price=BCPricing.boxes[b.dataset.boxStart]/100;
  const compact=b.querySelector('span');if(b.closest('.box-compact-options')&&compact)compact.textContent=MONEY.format(price);
  const slide=b.closest('.hero-slide');if(slide){
   slide.querySelector('.campaign-price').textContent=MONEY.format(price);
   const note=document.createElement('small');note.textContent=price*100>BC.settings.commerceConfig.freeAbove?' Envío gratis':' + envío';slide.querySelector('.campaign-price').append(note);
   const custom=BC.settings.commerceConfig.slides?.[b.dataset.boxStart];
   if(custom?.image)slide.querySelector('img').src=custom.image;
   if(custom?.title)slide.querySelector('h2').textContent=custom.title;
  }
 });
 for(const [pattern,value] of [['wa.me',`https://wa.me/${BC.settings.whatsapp}`],['instagram.com',BC.settings.instagram],['tiktok.com',BC.settings.tiktok],['mailto:',`mailto:${BC.settings.email}`]]){
  if(!value)continue;document.querySelectorAll('a[href]').forEach(a=>{if(a.getAttribute('href').includes(pattern))a.href=value;});
 }
 const contact=document.querySelector('.footer-layout>div:nth-child(2)');
 if(contact){const links=contact.querySelectorAll('a');if(links[0])links[0].textContent=`WhatsApp: +${BC.settings.whatsapp}`;if(links[1])links[1].textContent=BC.settings.email;}
}
document.addEventListener('DOMContentLoaded',()=>{
 let busy=false;
 async function refresh(){
  if(busy||document.hidden||document.querySelector('#bcCheckoutOverlay')||document.body.classList.contains('modal-open'))return;
  busy=true;try{const before=JSON.stringify([BC.products,BC.settings]);await loadData();if(before===JSON.stringify([BC.products,BC.settings]))return;applySettings();syncCommerceText();renderSeries();renderCatalog();renderCart();if(boxDraft)renderBoxBuilder();}finally{busy=false;}
 }
 setInterval(refresh,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
});
