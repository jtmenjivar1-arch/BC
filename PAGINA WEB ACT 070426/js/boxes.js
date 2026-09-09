'use strict';
// Select a pack, then choose variants directly on the catalogue cards.
let boxDraft = null;
const BOX_DRAFT_KEY = 'blackcat-box-draft-v2';
function boxProducts() {
  return BC.products.filter(p => p.category === 'catalog' && p.box_eligible !== false && !BCPricing.isPremium(p) && getTypesForProduct(p).includes('oversize') && boxSizes(p).length);
}
function boxSizes(product) {
  const declared = Array.isArray(product.sizes) ? product.sizes : [];
  return BCPricing.sizes.filter(s => (!declared.length || declared.includes(s)) && getSizesForType(product, 'oversize').includes(s));
}
function validBoxPart(slot) {
  const p = boxProducts().find(p => String(p.id) === String(slot?.id));
  if (!p || !boxSizes(p).includes(slot.size) || !getAvailableColors(p).some(c => c.name === slot.color)) return null;
  return {id:p.id, title:p.title, image:p.image, category:'catalog', type:'oversize', size:slot.size, color:slot.color, qty:1};
}
function persistBoxDraft() {
  try { localStorage.setItem(BOX_DRAFT_KEY, JSON.stringify(boxDraft)); } catch (_) {}
}
function initBoxes() {
  document.querySelectorAll('[data-box-start]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => startBox(Number(button.dataset.boxStart)));
  });
  try {
    const saved = JSON.parse(localStorage.getItem(BOX_DRAFT_KEY) || 'null');
    if (saved && BCPricing.boxes[saved.size] && Array.isArray(saved.slots) && saved.slots.length <= 4) {
      const editKey = BC.cart.some(i => i.key === saved.editKey) ? saved.editKey : null;
      boxDraft = {size:Number(saved.size), slots:saved.slots.map(validBoxPart).filter(Boolean), editKey};
    }
  } catch (_) {}
  const requested = Number(new URLSearchParams(location.search).get('box'));
  if (BCPricing.boxes[requested]) startBox(requested, false);
  else if (boxDraft) { showCatalog(false); renderBoxBuilder(); renderCart(); }
}
function startBox(size, scroll = true, item = null) {
  if (!BCPricing.boxes[size]) return;
  const notice = document.getElementById('boxComplete');
  if (notice) notice.hidden = true;
  // Keep existing selections when switching size; never silently discard shirts.
  boxDraft = {size, slots:item ? item.contents.map(p => ({...p})) : (boxDraft?.slots || []), editKey:item?.key || boxDraft?.editKey || null};
  const url = new URL(location.href);
  url.searchParams.delete('product'); url.searchParams.set('box', size); url.hash = 'catalogo';
  history.replaceState({}, '', url);
  persistBoxDraft();
  showCatalog(false); renderBoxBuilder(); renderCart();
  if (scroll) scrollToCatalog();
}
function addCatalogToBox(product, size, color) {
  if (!boxDraft || boxDraft.slots.length >= boxDraft.size) return false;
  const part = validBoxPart({id:product.id,size,color});
  if (!part) { alert('Elige la talla y el color de esta camisa.'); return false; }
  boxDraft.slots.push(part); persistBoxDraft();
  if (boxDraft.slots.length === boxDraft.size) commitBox();
  else renderBoxBuilder();
  return true;
}
function renderBoxBuilder() {
  const host = document.getElementById('boxBuilder');
  if (!host) return;
  host.hidden = !boxDraft;
  document.querySelectorAll('[data-box-start]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.boxStart) === boxDraft?.size)));
  if (!boxDraft) return;
  const count = boxDraft.slots.length;
  const price = BCPricing.boxes[boxDraft.size] / 100;
  const excess = count - boxDraft.size;
  host.innerHTML = `<div class="box-progress-heading"><span role="status"><strong>BOX ${boxDraft.size} · ${MONEY.format(price)}</strong> · ${count}/${boxDraft.size} camisas</span><button type="button" id="cancelBox">${boxDraft.editKey ? 'Cancelar edición' : 'Quitar BOX'}</button></div>
    ${excess > 0 ? `<p>Retira ${excess} camisa(s) para usar BOX ${boxDraft.size}.</p>` : ''}
    ${count ? `<details class="box-selection-details"><summary>Revisar selección</summary><ul>${boxDraft.slots.map((p,i)=>`<li>${escapeHTML(p.title)} · ${escapeHTML(p.size)} · ${escapeHTML(p.color)} <button type="button" data-box-remove="${i}" aria-label="Retirar ${escapeAttr(p.title)}">Retirar</button></li>`).join('')}</ul></details>` : '<small>Agrega camisas Oversize de S a XL desde sus opciones habituales.</small>'}
    ${count === boxDraft.size ? '<button type="button" id="saveBoxSelection">Guardar BOX</button>' : ''}`;
  host.querySelector('#cancelBox').onclick = cancelBox;
  host.querySelector('#saveBoxSelection')?.addEventListener('click', commitBox);
  host.querySelectorAll('[data-box-remove]').forEach(b => b.onclick = () => {
    boxDraft.slots.splice(Number(b.dataset.boxRemove),1); persistBoxDraft(); renderBoxBuilder(); renderCatalog();
  });
}
function cancelBox() {
  boxDraft = null; persistBoxDraft();
  const url = new URL(location.href); url.searchParams.delete('box'); history.replaceState({}, '', url);
  renderBoxBuilder(); renderCatalog(); renderCart();
}
function commitBox() {
  if (!boxDraft) return false;
  const contents = boxDraft.slots.map(validBoxPart);
  if (contents.length !== boxDraft.size || contents.some(p => !p)) { alert('Completa las camisas, tallas y colores de tu BOX.'); return false; }
  const index = BC.cart.findIndex(i => i.key === boxDraft.editKey);
  const item = {key:boxDraft.editKey || `box-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, id:contents[0].id,
    title:`BOX ${boxDraft.size} · ${boxDraft.size} Oversize`, category:'box',type:'box',typeLabel:'BOX · 100% algodón',
    boxSize:boxDraft.size,contents,image:contents[0].image,size:contents.map(p=>p.size).join(', '),color:contents.map(p=>p.color).join(', '),
    qty:index >= 0 ? BC.cart[index].qty : 1,unitPrice:BCPricing.boxes[boxDraft.size]/100};
  BCPricing.totals([item]);
  if (index >= 0) BC.cart[index] = item; else BC.cart.push(item);
  saveCart();
  boxDraft = null; persistBoxDraft();
  const url = new URL(location.href); url.searchParams.delete('box'); history.replaceState({}, '', url);
  renderBoxBuilder(); renderCatalog(); renderCart();
  trackMetaEvent('AddToCart',{value:item.unitPrice,currency:'USD',content_name:item.title});
  const notice = document.getElementById('boxComplete');
  if (notice) {
    notice.hidden = false;
    notice.innerHTML = `<span role="status"><strong>BOX ${item.boxSize} ${index >= 0 ? 'actualizada' : 'agregada'}</strong> · ${MONEY.format(item.unitPrice)}. Puedes seguir comprando.</span><button type="button" id="reviewBoxCart">Ver carrito</button>`;
    notice.querySelector('button').onclick = openCart;
  }
  return true;
}
function boxDetailsHTML(item) {
  if (!item.boxSize) return '';
  return `<ul class="box-cart-details">${item.contents.map(p=>`<li>${escapeHTML(p.title)} · ${escapeHTML(p.size)} · ${escapeHTML(p.color)}</li>`).join('')}</ul>`;
}
