'use strict';

const BC = {
  storageKey: 'blackcat_cart_v14',
  defaultWhatsApp: '50361900185',
  defaultInstagram: 'blackcat.sivar',
  defaultTikTok: 'blackcat.sivar',
  defaultEmail: 'blackcat2811@hotmail.com',
  view: 'catalog', // catalog | hoodies | extras
  activeAnime: 'all',
  search: '',
  products: [],
  settings: {},
  selectedProduct: null,
  selectedVariant: {
    type: '',
    size: '',
    color: '',
    qty: 1,
  },
  cart: [],
  heroIndex: 0,
  heroTimer: null,
};

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const SERIES_IMAGES = {
  BlackCat: 'assets/logo-gato.png',
};

const HOODIE_WORDS = ['hoodie', 'hoodies', 'sudadera', 'sudaderas', 'sueter', 'suéter', 'hoddie'];
const EXTRAS_WORDS = ['termo', 'termos', 'accesorio', 'accesorios', 'extra', 'extras', 'vaso', 'taza'];

const PRODUCT_TYPES = [
  { key: 'basic', label: 'Basic', price: 16.99 },
  { key: 'oversize', label: 'Oversize', price: 19.99 },
];

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const HOODIE_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const HOODIE_SIZE_PRICES = { S: 29.99, M: 29.99, L: 32.99, XL: 34.00, '2XL': 36.99 };

const COLORS = [
  { name: 'Negro', value: '#111111' },
  { name: 'Blanco', value: '#f4f4f4' },
  { name: 'Beige', value: '#d7c7aa' },
  { name: 'Gris', value: '#8e96a3' },
  { name: 'Verde Militar', value: '#556b2f' },
];

const LOCAL_SEED_PRODUCTS = [
  {
    id: 'termo-taza-viaje-40oz-local',
    title: 'TAZA DE VIAJE 40 OZ',
    character: 'Acero inoxidable · doble pared',
    anime: 'Termos',
    badge: 'NEW',
    category: 'extras',
    image: 'mockups/extras/taza-viaje-40oz.png',
    price: 19.99,
    colors: ['Rosado', 'Negro'],
    sizes: ['40oz'],
    active: true,
    forceLocal: true,
  },
  {
    id: 'termo-lata-termica-12oz-local',
    title: 'LATA TÉRMICA ACERO',
    character: 'Acero inoxidable · tapa hermética',
    anime: 'Termos',
    badge: 'NEW',
    category: 'extras',
    image: 'mockups/extras/lata-termica-12oz.png',
    price: 13.99,
    colors: ['Blanco', 'Metal'],
    sizes: ['12oz'],
    active: true,
    forceLocal: true,
  },
  {
    id: 'termo-skinny-acero-pajilla-20oz-local',
    title: 'SKINNY DE 20 OZ',
    character: 'Incluye pajilla',
    anime: 'Termos',
    badge: 'NEW',
    category: 'extras',
    image: 'mockups/extras/skinny-acero-pajilla-20oz.png',
    price: 17.99,
    colors: ['Blanco'],
    sizes: ['20oz'],
    active: true,
    forceLocal: true,
  },
];

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const el = {
  grid: null,
  seriesReel: null,
  filterChips: null,
  search: null,
  cartPanel: null,
  cartItems: null,
  cartCount: null,
  bottomCartCount: null,
  cartTotal: null,
  backdrop: null,
  modal: null,
  modalImage: null,
  modalTitle: null,
  modalSubtitle: null,
  typeChoices: null,
  sizeChoices: null,
  colorChoices: null,
  qtyValue: null,
  modalPrice: null,
  addToCartBtn: null,
  buyNowBtn: null,
};

document.addEventListener('DOMContentLoaded', initBlackCat);

async function initBlackCat() {
  cacheElements();
  injectFunctionalStyles();
  loadCart();
  bindUI();
  initHeroSlider();
  await loadData();
  applySettings();
  renderSeries();
  showCatalog(false);
  renderCart();
}

function cacheElements() {
  el.grid = $('#shirtGrid');
  el.seriesReel = $('#seriesReel');
  el.filterChips = $('#filterChips');
  el.search = $('#catalogSearch');
  el.cartPanel = $('#cartPanel');
  el.cartItems = $('#cartItems');
  el.cartCount = $('#cartCount');
  el.bottomCartCount = $('#bottomCartCount');
  el.cartTotal = $('#cartTotal');
  el.backdrop = $('#backdrop');
  el.modal = $('#productModal');
  el.modalImage = $('#modalImage');
  el.modalTitle = $('#modalTitle');
  el.modalSubtitle = $('#modalSubtitle');
  el.typeChoices = $('#typeChoices');
  el.sizeChoices = $('#sizeChoices');
  el.colorChoices = $('#colorChoices');
  el.qtyValue = $('#qtyValue');
  el.modalPrice = $('#modalPrice');
  el.addToCartBtn = $('#addToCartBtn');
  el.buyNowBtn = $('#buyNowBtn');
}

async function loadData() {
  const fallback = window.DEFAULT_SITE_DATA || { hero: {}, contacts: {}, products: [] };

  BC.settings = normalizeSettings(fallback);
  BC.products = normalizeProducts((fallback.products || []).filter((p) => p.forceLocal !== true));

  if (window.supabaseClient) {
    try {
      const [settingsResult, productsResult] = await Promise.allSettled([
        window.supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        window.supabaseClient.from('products').select('*').order('order_index', { ascending: true }),
      ]);

      const settingsData = settingsResult.value?.data;
      const productsData = productsResult.value?.data;

      if (settingsData) BC.settings = normalizeSettings(settingsData);

      if (Array.isArray(productsData) && productsData.length) {
        BC.products = normalizeProducts(productsData);
      }
    } catch (error) {
      console.warn('BlackCat: Supabase no cargó, usando datos locales.');
    }
  }

  BC.products = mergeSeedProducts(BC.products, normalizeProducts(LOCAL_SEED_PRODUCTS));
}

function mergeSeedProducts(baseProducts, seedProducts) {
  const base = Array.isArray(baseProducts) ? [...baseProducts] : [];
  const exists = new Set(base.map((p) => normalize(`${p.title} ${p.category}`).replace(/[^a-z0-9]/g, '')));

  seedProducts.forEach((product) => {
    const key = normalize(`${product.title} ${product.category}`).replace(/[^a-z0-9]/g, '');
    if (!exists.has(key)) base.push(product);
  });

  return base;
}

function normalizeSettings(source) {
  const hero = source.hero || source || {};
  const contacts = source.contacts || source || {};

  return {
    heroTitlePrefix: hero.titlePrefix || source.hero_title_prefix || 'BLACK',
    heroTitleAccent: hero.titleAccent || source.hero_title_accent || 'CAT',
    heroSubtitle: hero.subtitle || source.hero_subtitle || 'Drop activo · XS a 3XL · pedido directo por WhatsApp',
    heroBadges: hero.badges || [source.hero_badge_1, source.hero_badge_2, source.hero_badge_3].filter(Boolean),
    heroImage: hero.image || source.hero_image_url || '',
    whatsapp: cleanPhone(contacts.whatsapp || source.whatsapp || BC.defaultWhatsApp),
    instagram: contacts.instagram || source.instagram || BC.defaultInstagram,
    tiktok: contacts.tiktok || source.tiktok || BC.defaultTikTok,
    email: contacts.email || source.email || BC.defaultEmail,
  };
}

function normalizeProducts(items) {
  return (items || [])
    .map((p, index) => {
      const title = p.title || p.name || p.nombre || `Producto ${index + 1}`;
      const character = p.character || p.personaje || '';
      const anime = p.anime || p.serie || p.series || p.category_anime || 'BlackCat';
      const badge = p.badge || p.etiqueta || 'NEW';
      const image = p.image_url || p.image || p.imagen || p.mockup || '';
      const rawCategory = p.category || p.categoria || p.product_category || p.tipo_categoria || p.line || p.linea || p.product_type || p.type || '';
      const category = detectProductCategory({ title, anime, badge, rawCategory });

      return {
        id: String(p.id || p.uuid || p.slug || `local-${index + 1}`),
        title,
        character,
        anime,
        badge,
        image,
        category,
        active: p.active === false || p.activo === false ? false : true,
        orderIndex: Number(p.order_index || p.orden || index + 1),
        price: Number(p.price || p.precio || (category === 'hoodies' ? 29.99 : 16.99)),
        colors: normalizeList(p.colors || p.colores || p.available_colors || p.color || p.availableColors),
        sizes: normalizeList(p.sizes || p.tallas || p.available_sizes || p.availableSizes),
      };
    })
    .filter((p) => p.active && p.image)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

function normalizeList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (_) {}

    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function detectProductCategory(product) {
  const text = normalize(`${product.rawCategory} ${product.title} ${product.anime} ${product.badge}`);

  if (HOODIE_WORDS.some((word) => text.includes(normalize(word)))) return 'hoodies';
  if (EXTRAS_WORDS.some((word) => text.includes(normalize(word)))) return 'extras';

  return 'catalog';
}

function applySettings() {
  const title = $('.hero h1');

  if (title) {
    title.innerHTML = `${escapeHTML(BC.settings.heroTitlePrefix)}<span class="gradient">${escapeHTML(BC.settings.heroTitleAccent)}</span>`;
  }

  const subline = $('.hero-subline');
  if (subline && BC.settings.heroSubtitle) subline.textContent = BC.settings.heroSubtitle;

  const badges = $$('.hero-badges span');
  badges.forEach((badge, index) => {
    if (BC.settings.heroBadges?.[index]) badge.textContent = BC.settings.heroBadges[index];
  });

  if (BC.settings.heroImage) {
    const firstHero = $('.hero-slide.active img') || $('.hero-main-image');
    if (firstHero) firstHero.src = BC.settings.heroImage;
  }

  updateContactLinks();
}

function updateContactLinks() {
  const wa = whatsappBaseUrl();

  $$('a[href*="wa.me"], a[href*="whatsapp"]').forEach((a) => {
    const old = a.getAttribute('href') || '';
    if (old.includes('?text=')) return;
    a.href = wa;
  });

  $$('a[href*="instagram.com"]').forEach((a) => {
    a.href = instagramUrl();
  });

  $$('a[href*="tiktok.com"]').forEach((a) => {
    a.href = tiktokUrl();
  });

  $$('a[href^="mailto:"]').forEach((a) => {
    a.href = `mailto:${BC.settings.email || BC.defaultEmail}`;
  });
}

function bindUI() {
  $('#menuToggle')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openDrawer();
  });

  $('#menuClose')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeDrawer(true);
  });

  $$('.drawer-links a, .bottom-app-nav a, .nav-links a, .hero-actions a, .promo-pack-actions a').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';

      if (href === '#catalogo') {
        event.preventDefault();
        showCatalog(true);

        if (link.closest('#mobileDrawer')) closeDrawer(true);
        return;
      }

      if (link.closest('#mobileDrawer')) {
        closeDrawer(true);
      }
    });
  });

  $$('[data-line]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const line = button.dataset.line;

      if (line === 'hoodie') showHoodies(true);
      if (line === 'extra') showExtras(true);

      if (button.closest('#mobileDrawer')) {
        event.preventDefault();
        closeDrawer(true);
      }
    });
  });

  $('.series-clear')?.addEventListener('click', () => {
    BC.activeAnime = 'all';
    renderSeries();
    renderCatalog();
    scrollToCatalog();
  });

  $('#seriesPrev')?.addEventListener('click', () => {
    el.seriesReel?.scrollBy({ left: -320, behavior: 'smooth' });
  });

  $('#seriesNext')?.addEventListener('click', () => {
    el.seriesReel?.scrollBy({ left: 320, behavior: 'smooth' });
  });

  el.search?.addEventListener('input', () => {
    BC.search = el.search.value.trim();
    renderCatalog();
  });

  $('#cartToggle')?.addEventListener('click', openCart);
  $('#bottomCartBtn')?.addEventListener('click', openCart);
  $('#cartClose')?.addEventListener('click', closePanels);
  $('#checkoutBtn')?.addEventListener('click', sendCartToWhatsApp);
  el.backdrop?.addEventListener('click', closePanels);

  $('#modalClose')?.addEventListener('click', closeModal);
  $('#qtyMinus')?.addEventListener('click', () => changeQty(-1));
  $('#qtyPlus')?.addEventListener('click', () => changeQty(1));
  el.addToCartBtn?.addEventListener('click', addSelectedToCart);
  el.buyNowBtn?.addEventListener('click', buySelectedNow);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanels();
  });
}

function showCatalog(scroll = true) {
  BC.view = 'catalog';
  BC.activeAnime = 'all';

  if (el.search) el.search.value = '';
  BC.search = '';

  setLineActive('catalog');
  updateCatalogHeader();
  renderSeries();
  renderCatalog();

  if (scroll) scrollToCatalog();
}

function showHoodies(scroll = true) {
  BC.view = 'hoodies';
  BC.activeAnime = 'all';

  if (el.search) el.search.value = '';
  BC.search = '';

  setLineActive('hoodies');
  updateCatalogHeader();
  renderSeries();
  renderCatalog();

  if (scroll) scrollToCatalog();
}

function showExtras(scroll = true) {
  BC.view = 'extras';
  BC.activeAnime = 'all';

  if (el.search) el.search.value = '';
  BC.search = '';

  setLineActive('extras');
  updateCatalogHeader();
  renderSeries();
  renderCatalog();

  if (scroll) scrollToCatalog();
}

function setLineActive(view) {
  $$('.special-card').forEach((card) => card.classList.remove('active-line'));

  if (view === 'hoodies') $('.hoodie-card')?.classList.add('active-line');
  if (view === 'extras') $('.extras-card')?.classList.add('active-line');
}

function updateCatalogHeader() {
  const eyebrow = $('#catalogo .eyebrow');
  const title = $('#catalogo .title');
  const head = $('.catalog-head');

  if (!head) return;

  let backRow = $('.catalog-back-row');

  if (!backRow) {
    backRow = document.createElement('div');
    backRow.className = 'catalog-back-row';
    backRow.innerHTML = '<button class="catalog-back-btn" type="button" aria-label="Regresar al catálogo total">← Atrás</button>';
    head.appendChild(backRow);

    $('.catalog-back-btn', backRow)?.addEventListener('click', () => showCatalog(true));
  }

  if (BC.view === 'hoodies') {
    if (eyebrow) eyebrow.textContent = 'Categoría independiente';
    if (title) title.textContent = 'Hoodies BlackCat';
    backRow.style.display = 'flex';
    return;
  }

  if (BC.view === 'extras') {
    if (eyebrow) eyebrow.textContent = 'Categoría independiente';
    if (title) title.textContent = 'Extras BlackCat';
    backRow.style.display = 'flex';
    return;
  }

  if (eyebrow) eyebrow.textContent = 'Catálogo BlackCat';
  if (title) title.textContent = 'Elige tu diseño';

  backRow.style.display = BC.activeAnime !== 'all' || BC.search ? 'flex' : 'none';
}

function renderSeries() {
  const series = getAvailableSeries();

  if (el.filterChips) {
    el.filterChips.innerHTML = [
      `<button class="filter ${BC.activeAnime === 'all' ? 'active' : ''}" type="button" data-anime="all">Todos</button>`,
      ...series.map((s) => `<button class="filter ${sameFilter(s.name, BC.activeAnime) ? 'active' : ''}" type="button" data-anime="${escapeAttr(s.name)}">${escapeHTML(s.name)}</button>`),
    ].join('');

    $$('[data-anime]', el.filterChips).forEach((btn) => {
      btn.addEventListener('click', () => setAnime(btn.dataset.anime));
    });
  }

  if (!el.seriesReel) return;

  el.seriesReel.innerHTML = series.map((s) => `
    <button class="category-card category-filter-card ${sameFilter(s.name, BC.activeAnime) ? 'active' : ''}" type="button" data-anime="${escapeAttr(s.name)}" data-badge="${escapeAttr(s.badge)}">
      <div class="category-bg">
        <img src="${escapeAttr(s.image)}" alt="${escapeAttr(s.name)}" loading="lazy">
      </div>
      <div class="category-card-content">
        <small>Serie</small>
        <h3>${escapeHTML(s.name)}</h3>
        <span class="category-count">${s.count} diseño${s.count === 1 ? '' : 's'}</span>
      </div>
    </button>
  `).join('');

  $$('[data-anime]', el.seriesReel).forEach((btn) => {
    btn.addEventListener('click', () => setAnime(btn.dataset.anime));
  });

  const clear = $('.series-clear');
  if (clear) clear.classList.toggle('active', BC.activeAnime === 'all');
}

function setAnime(anime) {
  BC.activeAnime = anime === 'all' ? 'all' : anime;

  renderSeries();
  renderCatalog();
  updateCatalogHeader();
  scrollToCatalog();
}

function getAvailableSeries() {
  const source = getProductsByView();
  const map = new Map();

  source.forEach((product) => {
    const key = product.anime || 'BlackCat';

    if (!map.has(key)) {
      map.set(key, {
        name: key,
        count: 0,
        image: product.image || SERIES_IMAGES[key] || SERIES_IMAGES.BlackCat,
        badge: product.badge || 'NEW',
      });
    }

    map.get(key).count += 1;
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function getProductsByView() {
  if (BC.view === 'hoodies') return BC.products.filter((p) => p.category === 'hoodies');
  if (BC.view === 'extras') return BC.products.filter((p) => p.category === 'extras');

  return BC.products.filter((p) => p.category === 'catalog');
}

function getVisibleProducts() {
  const search = normalize(BC.search);

  return getProductsByView().filter((p) => {
    const matchesAnime = BC.activeAnime === 'all' || sameFilter(p.anime, BC.activeAnime);
    const haystack = normalize(`${p.title} ${p.character} ${p.anime} ${p.badge}`);
    const matchesSearch = !search || haystack.includes(search);

    return matchesAnime && matchesSearch;
  });
}

function renderCatalog() {
  if (!el.grid) return;

  updateCatalogHeader();

  const items = getVisibleProducts();

  if (!items.length) {
    el.grid.innerHTML = renderEmptyState();
    $('.empty-back-btn', el.grid)?.addEventListener('click', () => showCatalog(true));
    return;
  }

  el.grid.innerHTML = items.map(renderProductCard).join('');

  $$('.shirt-card', el.grid).forEach((card) => {
    const id = card.dataset.id;
    const product = BC.products.find((p) => p.id === id);

    if (!product) return;

    $('.shirt-media', card)?.addEventListener('click', () => openProduct(product));
    $('.js-open-product', card)?.addEventListener('click', () => openProduct(product));
    $('.js-whatsapp-product', card)?.addEventListener('click', () => sendProductQuickWhatsApp(product));
  });
}

function renderProductCard(product) {
  const cardClasses = [
    'panel',
    'shirt-card',
    'improved-card',
    'product-card-v12',
    product.category === 'extras' ? 'is-extra-card' : '',
  ].filter(Boolean).join(' ');

  return `
    <article class="${cardClasses}" data-id="${escapeAttr(product.id)}">
      <button class="shirt-media" type="button" aria-label="Ver ${escapeAttr(product.title)}">
        <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)} ${escapeAttr(product.anime)}" loading="lazy">
        <span class="shirt-badge">${escapeHTML(product.badge || 'NEW')}</span>
      </button>

      <div class="shirt-body">
        <div class="card-title-block">
          <span class="mini-badge">${escapeHTML(product.category === 'hoodies' ? 'HOODIE' : product.category === 'extras' ? 'TERMO' : product.anime)}</span>
          <h3>${escapeHTML(product.title)}</h3>
          <p>${escapeHTML(product.character || product.anime || 'BlackCat')}</p>
        </div>

        <div class="card-commerce">
          <strong>${product.category === 'hoodies' ? 'desde $29.99' : product.category === 'extras' ? MONEY.format(product.price || 0) : 'desde $16.99'}</strong>
          <span>${escapeHTML(product.category === 'hoodies' ? 'Hoodie' : product.category === 'extras' ? 'Termo' : 'Camiseta')}</span>
        </div>

        <div class="card-actions product-card-actions-v12">
          <button class="btn-card primary js-open-product" type="button">Ver opciones</button>
          <button class="btn-card ghost js-whatsapp-product" type="button">WhatsApp</button>
        </div>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  const message = BC.view === 'hoodies'
    ? 'Aún no hay hoodies cargadas en esta categoría. Cuando agregues productos tipo hoodie aparecerán aquí automáticamente.'
    : BC.view === 'extras'
      ? 'Aún no hay extras cargados. Cuando agregues termos o accesorios aparecerán aquí automáticamente.'
      : 'No hay diseños disponibles con este filtro.';

  return `
    <div class="panel empty-state">
      <strong>${message}</strong>
      ${BC.view !== 'catalog' || BC.activeAnime !== 'all' || BC.search ? '<button class="btn-card primary empty-back-btn" type="button">Regresar al catálogo</button>' : ''}
    </div>
  `;
}

function openProduct(product) {
  BC.selectedProduct = product;
  BC.selectedVariant = {
    type: product.category === 'hoodies' ? 'hoodie' : (product.category === 'extras' ? 'termo' : 'basic'),
    size: product.category === 'extras' ? (product.sizes?.[0] || '20oz') : (product.category === 'hoodies' ? 'M' : 'M'),
    color: getDefaultColor(product),
    qty: 1,
  };

  renderModal();

  el.modal?.classList.add('open', 'show');
  el.modal?.setAttribute('aria-hidden', 'false');
  el.backdrop?.classList.add('show');
  document.body.classList.add('modal-open');
}

function renderModal() {
  const product = BC.selectedProduct;

  if (!product) return;

  if (el.modalImage) el.modalImage.src = product.image;
  if (el.modalTitle) el.modalTitle.textContent = product.title;
  if (el.modalSubtitle) el.modalSubtitle.textContent = `${product.anime}${product.character ? ' · ' + product.character : ''}`;

  updateModalOptionLabels(product);
  renderTypeChoices(product);
  renderSizeChoices(product);
  renderColorChoices(product);

  if (el.qtyValue) el.qtyValue.textContent = BC.selectedVariant.qty;
  if (el.modalPrice) el.modalPrice.textContent = MONEY.format(getSelectedUnitPrice() * BC.selectedVariant.qty);
  if (el.addToCartBtn) el.addToCartBtn.disabled = false;
  if (el.buyNowBtn) el.buyNowBtn.disabled = false;
}

function updateModalOptionLabels(product) {
  const groups = $$('.option-group', el.modal || document);

  if (!groups.length) return;

  const typeLabel = groups[0]?.querySelector('label');
  const sizeLabel = groups[1]?.querySelector('label');
  const colorLabel = groups[2]?.querySelector('label');

  if (product.category === 'extras') {
    if (typeLabel) typeLabel.textContent = 'Tipo de producto';
    if (sizeLabel) sizeLabel.textContent = 'Capacidad';
    if (colorLabel) colorLabel.textContent = 'Color disponible';
    return;
  }

  if (product.category === 'hoodies') {
    if (typeLabel) typeLabel.textContent = 'Tipo de prenda';
    if (sizeLabel) sizeLabel.textContent = 'Talla';
    if (colorLabel) colorLabel.textContent = 'Color disponible';
    return;
  }

  if (typeLabel) typeLabel.textContent = 'Tipo de camisa';
  if (sizeLabel) sizeLabel.textContent = 'Talla';
  if (colorLabel) colorLabel.textContent = 'Color';
}

function renderTypeChoices(product) {
  if (!el.typeChoices) return;

  if (product.category === 'hoodies') {
    el.typeChoices.innerHTML = `<button class="choice active" type="button" data-type="hoodie">Hoodie</button>`;
    BC.selectedVariant.type = 'hoodie';
    return;
  }

  if (product.category === 'extras') {
    el.typeChoices.innerHTML = `<button class="choice active" type="button" data-type="termo">Termo</button>`;
    BC.selectedVariant.type = 'termo';
    return;
  }

  el.typeChoices.innerHTML = PRODUCT_TYPES.map((type) => `
    <button class="choice ${BC.selectedVariant.type === type.key ? 'active' : ''}" type="button" data-type="${type.key}">
      ${type.label}
    </button>
  `).join('');

  $$('[data-type]', el.typeChoices).forEach((btn) => {
    btn.addEventListener('click', () => {
      BC.selectedVariant.type = btn.dataset.type;

      if (BC.selectedVariant.type === 'oversize' && BC.selectedVariant.size === 'XS') {
        BC.selectedVariant.size = 'M';
      }

      renderModal();
    });
  });
}

function renderSizeChoices(product) {
  if (!el.sizeChoices) return;

  const sizes = Array.isArray(product.sizes) && product.sizes.length
    ? product.sizes
    : (product.category === 'extras' ? ['20oz'] : (product.category === 'hoodies' ? HOODIE_SIZES : SHIRT_SIZES));

  el.sizeChoices.innerHTML = sizes.map((size) => {
    const disabled = product.category === 'catalog' && BC.selectedVariant.type === 'oversize' && size === 'XS';

    return `
      <button class="choice ${BC.selectedVariant.size === size ? 'active' : ''}" type="button" data-size="${escapeAttr(size)}" ${disabled ? 'disabled' : ''}>
        ${escapeHTML(size)}
      </button>
    `;
  }).join('');

  $$('[data-size]', el.sizeChoices).forEach((btn) => {
    btn.addEventListener('click', () => {
      BC.selectedVariant.size = btn.dataset.size;
      renderModal();
    });
  });
}

function renderColorChoices(product = BC.selectedProduct) {
  if (!el.colorChoices) return;

  const availableColors = getAvailableColors(product);

  if (!availableColors.some((color) => sameFilter(color.name, BC.selectedVariant.color))) {
    BC.selectedVariant.color = availableColors[0]?.name || 'Negro';
  }

  el.colorChoices.innerHTML = availableColors.map((color) => `
    <button class="choice ${sameFilter(BC.selectedVariant.color, color.name) ? 'active' : ''}" type="button" data-color="${escapeAttr(color.name)}" style="--swatch:${color.value}">
      <span class="color-dot" aria-hidden="true"></span>
      <span class="color-name">${escapeHTML(color.name)}</span>
    </button>
  `).join('');

  $$('[data-color]', el.colorChoices).forEach((btn) => {
    btn.addEventListener('click', () => {
      BC.selectedVariant.color = btn.dataset.color;
      renderModal();
    });
  });
}

function getAvailableColors(product = BC.selectedProduct) {
  const sourceColors = Array.isArray(product?.colors) ? product.colors.filter(Boolean) : [];

  if (product?.category === 'hoodies') {
    const hoodieColors = sourceColors.length ? sourceColors : [detectHoodieColor(product)];
    return hoodieColors.map(colorToOption).filter(Boolean).slice(0, 1);
  }

  if (sourceColors.length) return sourceColors.map(colorToOption).filter(Boolean);

  return COLORS;
}

function getDefaultColor(product = BC.selectedProduct) {
  return getAvailableColors(product)[0]?.name || 'Negro';
}

function detectHoodieColor(product = {}) {
  const text = normalize(`${product.title || ''} ${product.anime || ''} ${product.badge || ''} ${product.image || ''}`);

  if (text.includes('blanco') || text.includes('white')) return 'Blanco';
  if (text.includes('gris') || text.includes('gray') || text.includes('grey')) return 'Gris';
  if (text.includes('beige') || text.includes('cream') || text.includes('crema')) return 'Beige';

  return 'Negro';
}

function colorToOption(colorName) {
  const name = String(colorName || '').trim();

  if (!name) return null;

  const found = COLORS.find((color) => sameFilter(color.name, name));
  if (found) return found;

  const normalized = normalize(name);
  let value = '#777777';

  if (normalized.includes('negro') || normalized.includes('black')) value = '#111111';
  if (normalized.includes('blanco') || normalized.includes('white')) value = '#f4f4f4';
  if (normalized.includes('gris') || normalized.includes('gray') || normalized.includes('grey')) value = '#8e96a3';
  if (normalized.includes('rosado') || normalized.includes('pink') || normalized.includes('rosa')) value = '#e83e8c';
  if (normalized.includes('metal') || normalized.includes('acero') || normalized.includes('silver') || normalized.includes('plata')) value = '#b8bcc2';

  return { name, value };
}

function changeQty(delta) {
  BC.selectedVariant.qty = Math.max(1, Math.min(20, BC.selectedVariant.qty + delta));
  renderModal();
}

function getSelectedUnitPrice() {
  const product = BC.selectedProduct;

  if (!product) return 0;

  if (product.category === 'hoodies') {
    return HOODIE_SIZE_PRICES[BC.selectedVariant.size] || Number(product.price || 29.99);
  }

  if (product.category === 'extras') {
    return Number(product.price || 12.99);
  }

  if (BC.selectedVariant.type === 'oversize') {
    if (BC.selectedVariant.size === 'XL') return 22.99;
    if (BC.selectedVariant.size === '2XL') return 23.99;
    if (BC.selectedVariant.size === '3XL') return 28.99;
    return 19.99;
  }

  let price = 16.99;

  if (BC.selectedVariant.size === '2XL') price = 23.99;
  if (BC.selectedVariant.size === '3XL') price = 28.99;

  return price;
}

function addSelectedToCart() {
  const product = BC.selectedProduct;

  if (!product) return;

  const item = buildCartItem(product);
  const existing = BC.cart.find((entry) => entry.key === item.key);

  if (existing) existing.qty += item.qty;
  else BC.cart.push(item);

  saveCart();
  renderCart();
  closeModal();
  openCart();
}

function buySelectedNow() {
  const product = BC.selectedProduct;

  if (!product) return;

  const item = buildCartItem(product);
  openWhatsApp(buildWhatsAppMessage([item]));
}

function buildCartItem(product) {
  const unitPrice = getSelectedUnitPrice();
  const key = `${product.id}-${BC.selectedVariant.type}-${BC.selectedVariant.size}-${BC.selectedVariant.color}`;

  return {
    key,
    id: product.id,
    title: product.title,
    anime: product.anime,
    character: product.character,
    category: product.category,
    image: product.image,
    type: BC.selectedVariant.type,
    size: BC.selectedVariant.size,
    color: BC.selectedVariant.color,
    qty: BC.selectedVariant.qty,
    unitPrice,
  };
}

function renderCart() {
  const count = BC.cart.reduce((sum, item) => sum + item.qty, 0);
  const total = BC.cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  if (el.cartCount) el.cartCount.textContent = count;
  if (el.bottomCartCount) el.bottomCartCount.textContent = count;
  if (el.cartTotal) el.cartTotal.textContent = MONEY.format(total);

  if (!el.cartItems) return;

  if (!BC.cart.length) {
    el.cartItems.innerHTML = '<div class="cart-empty">Tu carrito está vacío.</div>';
    return;
  }

  el.cartItems.innerHTML = BC.cart.map((item) => `
    <article class="cart-item" data-key="${escapeAttr(item.key)}">
      <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}">

      <div class="cart-info">
        <strong>${escapeHTML(item.title)}</strong>
        <span class="cart-meta">${escapeHTML(item.category === 'hoodies' ? 'Hoodie' : item.type)} · ${escapeHTML(item.size)} · ${escapeHTML(item.color)}</span>
        <b class="cart-line-price">${MONEY.format(item.unitPrice * item.qty)}</b>
      </div>

      <div class="qty-mini">
        <button type="button" data-cart="minus">−</button>
        <span>${item.qty}</span>
        <button type="button" data-cart="plus">+</button>
      </div>

      <button class="cart-remove" type="button" data-cart="remove">×</button>
    </article>
  `).join('');

  $$('[data-cart]', el.cartItems).forEach((btn) => {
    btn.addEventListener('click', () => updateCart(btn.closest('.cart-item')?.dataset.key, btn.dataset.cart));
  });
}

function updateCart(key, action) {
  const item = BC.cart.find((entry) => entry.key === key);

  if (!item) return;

  if (action === 'plus') item.qty += 1;
  if (action === 'minus') item.qty -= 1;
  if (action === 'remove') item.qty = 0;

  BC.cart = BC.cart.filter((entry) => entry.qty > 0);

  saveCart();
  renderCart();
}

function sendProductQuickWhatsApp(product) {
  const item = {
    title: product.title,
    anime: product.anime,
    category: product.category,
    type: product.category === 'hoodies' ? 'hoodie' : (product.category === 'extras' ? 'termo' : 'basic'),
    size: product.category === 'extras' ? (product.sizes?.[0] || '20oz') : 'Por confirmar',
    color: product.category === 'extras' ? (getAvailableColors(product)[0]?.name || 'Por confirmar') : 'Por confirmar',
    qty: 1,
    unitPrice: product.category === 'hoodies' ? 29.99 : (product.category === 'extras' ? Number(product.price || 12.99) : 16.99),
  };

  openWhatsApp(buildWhatsAppMessage([item]));
}

function sendCartToWhatsApp() {
  if (!BC.cart.length) return;

  openWhatsApp(buildWhatsAppMessage(BC.cart));
}

function buildWhatsAppMessage(items) {
  const lines = items.map((item, index) => {
    const category = item.category === 'hoodies' ? 'Hoodie' : item.category === 'extras' ? 'Extra' : 'Camiseta';

    return `${index + 1}. ${item.title} | ${category} | ${item.type} | Talla: ${item.size} | Color: ${item.color} | Cant: ${item.qty} | ${MONEY.format(item.unitPrice * item.qty)}`;
  });

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  return [
    'Hola BlackCat, quiero consultar este pedido:',
    '',
    ...lines,
    '',
    `Total estimado: ${MONEY.format(total)}`,
    '',
    'Quedo pendiente para confirmar disponibilidad, pago y entrega.',
  ].join('\n');
}

function openWhatsApp(message) {
  window.open(`${whatsappBaseUrl()}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

function openCart() {
  closeDrawer(true);
  el.cartPanel?.classList.add('open');
  el.cartPanel?.setAttribute('aria-hidden', 'false');
  el.backdrop?.classList.add('show');
}

function closeCart() {
  el.cartPanel?.classList.remove('open');
  el.cartPanel?.setAttribute('aria-hidden', 'true');
}

function closeModal() {
  el.modal?.classList.remove('open', 'show');
  el.modal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  const cartOpen = el.cartPanel?.classList.contains('open');
  const drawerOpen = $('#mobileDrawer')?.classList.contains('open');

  if (!cartOpen && !drawerOpen) {
    el.backdrop?.classList.remove('show');
  }
}

function closePanels() {
  closeCart();
  closeModal();
  closeDrawer(true);
  el.backdrop?.classList.remove('show');
}

function openDrawer() {
  const drawer = $('#mobileDrawer');

  if (!drawer) return;

  closeCart();
  closeModal();

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  el.backdrop?.classList.add('show');
}

function closeDrawer(forceBackdrop = false) {
  const drawer = $('#mobileDrawer');

  drawer?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');

  const cartOpen = el.cartPanel?.classList.contains('open');
  const modalOpen = el.modal?.classList.contains('open') || el.modal?.classList.contains('show');

  if (forceBackdrop || (!cartOpen && !modalOpen)) {
    el.backdrop?.classList.remove('show');
  }
}

function saveCart() {
  localStorage.setItem(BC.storageKey, JSON.stringify(BC.cart));
}

function loadCart() {
  try {
    BC.cart = JSON.parse(localStorage.getItem(BC.storageKey) || '[]');
  } catch (_) {
    BC.cart = [];
  }
}

function initHeroSlider() {
  const slides = $$('.hero-slide');
  const dots = $$('.hero-dot');

  if (!slides.length) return;

  const show = (index) => {
    BC.heroIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => slide.classList.toggle('active', i === BC.heroIndex));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === BC.heroIndex));
  };

  $('#heroPrev')?.addEventListener('click', () => show(BC.heroIndex - 1));
  $('#heroNext')?.addEventListener('click', () => show(BC.heroIndex + 1));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => show(Number(dot.dataset.slide || 0)));
  });

  clearInterval(BC.heroTimer);
  BC.heroTimer = setInterval(() => show(BC.heroIndex + 1), 5200);
}

function scrollToCatalog() {
  $('#catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function whatsappBaseUrl() {
  return `https://wa.me/${cleanPhone(BC.settings.whatsapp || BC.defaultWhatsApp)}`;
}

function instagramUrl() {
  const value = String(BC.settings.instagram || BC.defaultInstagram).replace('@', '').trim();

  return value.startsWith('http') ? value : `https://instagram.com/${value}`;
}

function tiktokUrl() {
  const value = String(BC.settings.tiktok || BC.defaultTikTok).replace('@', '').trim();

  return value.startsWith('http') ? value : `https://tiktok.com/@${value}`;
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 8) return `503${digits}`;

  return digits || BC.defaultWhatsApp;
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function sameFilter(a, b) {
  return normalize(a).replace(/[^a-z0-9]/g, '') === normalize(b).replace(/[^a-z0-9]/g, '');
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHTML(value).replace(/`/g, '&#096;');
}

function injectFunctionalStyles() {
  if ($('#blackcatFunctionalStyles')) return;

  const style = document.createElement('style');
  style.id = 'blackcatFunctionalStyles';

  style.textContent = `
    .catalog-head{
      display:flex!important;
      align-items:flex-end!important;
      justify-content:space-between!important;
      gap:14px!important;
    }

    .catalog-back-row{
      display:none;
      justify-content:flex-end;
      align-items:center;
      margin-left:auto;
    }

    .catalog-back-btn{
      appearance:none;
      border:1px solid rgba(255,255,255,.22);
      background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.045));
      color:#fff;
      border-radius:999px;
      min-height:38px;
      padding:0 15px;
      font-size:12px;
      font-weight:950;
      letter-spacing:-.02em;
      cursor:pointer;
      box-shadow:0 12px 32px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.13);
      transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease;
    }

    .catalog-back-btn:hover{
      transform:translateY(-2px);
      border-color:rgba(255,255,255,.42);
      background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.07));
      box-shadow:0 18px 42px rgba(0,0,0,.36),0 0 0 3px rgba(255,255,255,.045);
    }

    .catalog-back-btn:active{
      transform:translateY(1px) scale(.97);
      box-shadow:0 7px 18px rgba(0,0,0,.32),inset 0 2px 8px rgba(0,0,0,.28);
    }

    .shirt-card,
    .product-card-v12{
      border-radius:24px!important;
      overflow:hidden!important;
      background-clip:padding-box!important;
      isolation:isolate;
    }

    .shirt-card .shirt-media{
      border-radius:24px 24px 0 0!important;
      overflow:hidden!important;
      display:block!important;
      width:100%!important;
      aspect-ratio:4/5!important;
      min-height:unset!important;
      padding:0!important;
      background:#111217!important;
    }

    .shirt-card .shirt-media img{
      border-radius:0!important;
      display:block!important;
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      object-position:center!important;
      background:transparent!important;
      padding:0!important;
      transform:none!important;
    }

    .shirt-card.is-extra-card .shirt-media{
      background:#111217!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
    }

    .shirt-card.is-extra-card .shirt-media img{
      object-fit:cover!important;
      object-position:center!important;
      width:100%!important;
      height:100%!important;
      max-width:none!important;
      max-height:none!important;
      background:transparent!important;
      transform:none!important;
    }

    .shirt-card .shirt-body{
      border-radius:0 0 24px 24px!important;
    }

    .category-filter-card.active,
    .series-clear.active{
      outline:2px solid rgba(255,255,255,.8)!important;
      outline-offset:2px;
    }

    .empty-back-btn{
      margin-top:14px;
      padding:0 18px;
    }

    .modal.open{
      opacity:1!important;
      visibility:visible!important;
      pointer-events:auto!important;
      display:flex!important;
    }

    .cart-item{
      display:grid;
      grid-template-columns:62px 1fr auto auto;
      gap:10px;
      align-items:center;
      padding:10px 0;
      border-bottom:1px solid rgba(255,255,255,.08);
    }

    .cart-item img{
      width:62px;
      height:78px;
      object-fit:cover;
      border-radius:13px;
      background:#15161a;
    }

    .cart-info{
      display:flex;
      flex-direction:column;
      gap:4px;
      min-width:0;
    }

    .cart-info strong{
      font-size:13px;
      line-height:1.15;
    }

    .cart-meta{
      font-size:11px;
      color:rgba(255,255,255,.62);
      line-height:1.2;
    }

    .qty-mini{
      display:flex;
      align-items:center;
      gap:6px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.1);
      border-radius:999px;
      padding:3px;
    }

    .qty-mini button,
    .cart-remove{
      width:26px;
      height:26px;
      border-radius:999px;
      border:0;
      cursor:pointer;
      font-weight:900;
    }

    .cart-remove{
      background:rgba(255,255,255,.08);
      color:#fff;
    }

    @media(max-width:720px){
      .catalog-head{
        align-items:flex-start!important;
      }

      .catalog-back-row{
        align-self:flex-start;
        padding-top:2px;
      }

      .catalog-back-btn{
        min-height:34px;
        padding:0 12px;
        font-size:11px;
      }

      .shirt-card,
      .product-card-v12{
        border-radius:18px!important;
      }

      .shirt-card .shirt-media{
        border-radius:18px 18px 0 0!important;
        padding:0!important;
      }

      .shirt-card .shirt-body{
        border-radius:0 0 18px 18px!important;
      }

      .shirt-card.is-extra-card .shirt-media{
        padding:0!important;
      }

      .shirt-card.is-extra-card .shirt-media img{
        object-fit:cover!important;
        object-position:center!important;
      }

      .cart-item{
        grid-template-columns:54px 1fr auto;
      }

      .cart-remove{
        grid-column:3;
      }

      .cart-item img{
        width:54px;
        height:70px;
      }
    }
  `;

  document.head.appendChild(style);
}

window.showCatalog = showCatalog;
window.showHoodies = showHoodies;
window.showCategory = (category) => {
  const text = normalize(category);

  if (HOODIE_WORDS.some((word) => text.includes(normalize(word)))) showHoodies(true);
  else if (EXTRAS_WORDS.some((word) => text.includes(normalize(word)))) showExtras(true);
  else showCatalog(true);
};

window.setAnimeFilter = setAnime;
