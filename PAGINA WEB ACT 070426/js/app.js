const state = {
  data: {
    hero: {
      titlePrefix: 'BLACK',
      titleAccent: 'CAT',
      subtitle: '',
      badges: ['', '', ''],
      image: ''
    },
    contacts: {
      whatsapp: '50361900185',
      instagram: 'blackcat.sivar',
      tiktok: '@blackcat.sivar',
      email: 'blackcat2811@hotmail.com'
    },
    products: []
  },
  filter: 'all',
  badgeFilter: 'all',
  searchQuery: '',
  currentProduct: null,
  type: 'basic',
  size: 'M',
  color: 'Negro',
  qty: 1,
  cart: []
};

const typeOptions = [
  { id: 'basic', label: 'Básica' },
  { id: 'oversize', label: 'Oversize' }
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const colorOptions = [
  { id: 'Blanco', style: 'background:#f1f1f1' },
  { id: 'Negro', style: 'background:#111' },
  { id: 'Beige', style: 'background:#d7c7aa' },
  { id: 'Gris', style: 'background:#8e96a3' }
];

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function getUnitPrice(type, size) {
  if (size === '2XL') return 23.99;
  if (size === '3XL') return 28.99;
  return type === 'oversize' ? 19.99 : 16.99;
}

function isSizeAvailable(type, size) {
  return !(type === 'oversize' && size === 'XS');
}

function applyHero() {
  const hero = state.data.hero || {};
  const contacts = state.data.contacts || {};
  const heroTitle = document.querySelector('.hero h1');
  const heroP = document.querySelector('.hero p');
  const heroImg = document.getElementById('heroMainImage');
  const badgeEls = document.querySelectorAll('.hero-badges span');

  if (heroTitle) {
    heroTitle.innerHTML = `${hero.titlePrefix || 'BLACK'}<span class="gradient">${hero.titleAccent || 'CAT'}</span>`;
  }

  if (heroP) {
    heroP.textContent = hero.subtitle || '';
  }

  if (heroImg) {
    if (hero.image && hero.image.trim() !== '') {
      heroImg.src = hero.image;
      heroImg.style.display = 'block';
    } else {
      heroImg.removeAttribute('src');
      heroImg.style.display = 'none';
    }
  }

  (hero.badges || []).forEach((t, i) => {
    if (badgeEls[i]) badgeEls[i].textContent = t;
  });

  const instagramLinks = document.querySelectorAll('a[href*="instagram.com"], .hero-contact-instagram');
  instagramLinks.forEach(a => {
    a.href = `https://instagram.com/${contacts.instagram}`;
  });

  const tiktokLinks = document.querySelectorAll('a[href*="tiktok.com"], .hero-contact-tiktok');
  tiktokLinks.forEach(a => {
    a.href = `https://tiktok.com/@${(contacts.tiktok || '').replace(/^@/, '')}`;
  });

  const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], .wa-pill, .hero-contact-pill.wa');
  whatsappLinks.forEach(a => {
    a.href = `https://wa.me/${contacts.whatsapp}`;
  });

  const heroWhatsAppValue = document.querySelector('.hero-contact-pill.wa strong');
  if (heroWhatsAppValue) {
    heroWhatsAppValue.textContent = `+${contacts.whatsapp}`;
  }

  const heroInstagramValue = document.querySelector('.hero-contact-instagram strong');
  if (heroInstagramValue) {
    heroInstagramValue.textContent = `@${contacts.instagram}`;
  }

  const heroTikTokValue = document.querySelector('.hero-contact-tiktok strong');
  if (heroTikTokValue) {
    heroTikTokValue.textContent = `${contacts.tiktok || ''}`;
  }

  const emailRows = [...document.querySelectorAll('.contact-value')].find(el =>
    el.textContent.includes('@')
  );
  if (emailRows) emailRows.textContent = contacts.email || '';
}

function filteredProducts() {
  let list = [...state.data.products];

  if (state.filter !== 'all') {
    list = list.filter(p => p.anime === state.filter);
  }

  if (state.badgeFilter !== 'all') {
    list = list.filter(p => {
      const badge = (p.badge || '').toUpperCase();

      if (state.badgeFilter === 'NEW') {
        return badge === 'NEW' || badge === 'NUEVO';
      }

      return badge === state.badgeFilter;
    });
  }

  const query = (state.searchQuery || '').trim().toLowerCase();
  if (query) {
    list = list.filter(p => [
      p.title, p.character, p.anime, p.badge, p.description,
      Array.isArray(p.tags) ? p.tags.join(' ') : p.tags
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }

  return list.sort((a, b) => a.title.localeCompare(b.title));
}

function renderProducts() {
  const grid = document.getElementById('shirtGrid');
  if (!grid) return;

  const products = filteredProducts();
  if (!products.length) {
    grid.innerHTML = '<div class="panel empty-state">No encontramos productos con esa búsqueda. Prueba con otro anime, personaje o revisa el catálogo completo.</div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <article class="panel shirt-card improved-card">
      <button class="shirt-media" data-id="${p.id}" type="button" aria-label="Ver opciones de ${p.title}">
        <img src="${p.image}" alt="${p.title}">
        <span class="shirt-badge">${(p.badge || '').toUpperCase() === 'NUEVO' ? 'NEW' : p.badge}</span>
      </button>
      <div class="shirt-body">
        <div>
          <span class="mini-badge">${(p.badge || 'DROP').toUpperCase()}</span>
          <h3>${p.title}</h3>
          <p>${p.character ? `${p.character} · ` : ''}${p.anime}</p>
        </div>
        <div class="card-commerce">
          <strong>Desde ${formatPrice(16.99)}</strong>
          <span>XS-3XL</span>
        </div>
        <div class="card-actions">
          <button class="btn-card primary" type="button" data-id="${p.id}">Ver opciones</button>
          <button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', () => openProduct(Number(btn.dataset.id)));
  });

  grid.querySelectorAll('[data-wa-id]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const product = state.data.products.find(p => Number(p.id) === Number(btn.dataset.waId));
      if (!product) return;
      const msg = encodeURIComponent(`Hola, quiero información de ${product.title} (${product.anime}).`);
      window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`, '_blank');
    });
  });
}

function renderFilters() {
  const wrap = document.getElementById('filterChips');
  if (!wrap) return;

  const series = [...new Set(
    (state.data.products || [])
      .map(p => (p.anime || '').trim())
      .filter(Boolean)
  )];

  const filters = ['Todos', ...series];

  wrap.innerHTML = filters.map(name => {
    const value = name === 'Todos' ? 'all' : name;
    const active = state.filter === value ? 'active' : '';
    return `<button class="filter ${active}" data-filter="${value}">${name}</button>`;
  }).join('');

  wrap.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      state.badgeFilter = 'all';
      renderFilters();
      bindCategoryCards();
      renderProducts();
    });
  });
}

function bindCategoryCards() {
  const cards = document.querySelectorAll('.category-filter-card, .series-clear');

  cards.forEach(card => {
    const selectedAnime = card.dataset.anime;
    const selectedBadge = card.dataset.badge;

    const isActive = selectedAnime
      ? (selectedAnime === 'all' ? state.filter === 'all' && state.badgeFilter === 'all' : state.filter === selectedAnime)
      : selectedBadge === state.badgeFilter;

    card.classList.toggle('active', isActive);

    card.onclick = () => {
      if (selectedAnime) {
        state.filter = selectedAnime === 'all' ? 'all' : selectedAnime;
        state.badgeFilter = 'all';
        state.searchQuery = '';
        const search = document.getElementById('catalogSearch');
        if (search) search.value = '';
      } else if (selectedBadge) {
        state.badgeFilter = state.badgeFilter === selectedBadge ? 'all' : selectedBadge;
        state.filter = 'all';
      }

      bindCategoryCards();
      renderFilters();
      renderProducts();

      const catalogo = document.getElementById('catalogo');
      if (catalogo) {
        catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  });
}

function renderCategoryBackgrounds() {
  const map = {
    'Jujutsu Kaisen': document.getElementById('bg-jujutsu'),
    'One Piece': document.getElementById('bg-onepiece'),
    'Chainsaw Man': document.getElementById('bg-chainsaw'),
    'Frieren': document.getElementById('bg-frieren'),
    'Kaiju No. 8': document.getElementById('bg-kaiju'),
    'Hell Paradise': document.getElementById('bg-hell')
  };

  const products = state.data.products || [];

  Object.entries(map).forEach(([anime, img]) => {
    if (!img) return;

    const item = products.find(p => (p.anime || '').trim().toLowerCase() === anime.toLowerCase())
      || products.find(p => (p.anime || '').toLowerCase().includes(anime.split(' ')[0].toLowerCase()));

    if (item && item.image) {
      img.src = item.image;
      img.alt = item.title || anime;
      img.style.display = 'block';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
  });
}

function renderTypeChoices() {
  const wrap = document.getElementById('typeChoices');
  if (!wrap) return;

  wrap.innerHTML = typeOptions.map(opt => `
    <button class="choice ${state.type === opt.id ? 'active' : ''}" data-type="${opt.id}">
      ${opt.label}
    </button>
  `).join('');

  wrap.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.type = btn.dataset.type;
      if (!isSizeAvailable(state.type, state.size)) state.size = 'S';
      renderTypeChoices();
      renderSizeChoices();
      updateModalPrice();
    });
  });
}

function renderSizeChoices() {
  const wrap = document.getElementById('sizeChoices');
  if (!wrap) return;

  wrap.innerHTML = sizeOptions.map(size => {
    const available = isSizeAvailable(state.type, size);
    return `
      <button class="choice ${state.size === size ? 'active' : ''} ${available ? '' : 'disabled'}"
              data-size="${size}"
              ${available ? '' : 'disabled'}>
        ${size}
      </button>
    `;
  }).join('');

  wrap.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      state.size = btn.dataset.size;
      renderSizeChoices();
      updateModalPrice();
    });
  });
}

function applyPreviewColor() {
  return;
}

function renderColorChoices() {
  const wrap = document.getElementById('colorChoices');
  if (!wrap) return;

  wrap.innerHTML = colorOptions.map(color => `
    <button title="${color.id}"
            class="choice ${state.color === color.id ? 'active' : ''}"
            data-color="${color.id}"
            style="${color.style}">
    </button>
  `).join('');

  wrap.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.color = btn.dataset.color;
      renderColorChoices();
      applyPreviewColor();
      updateModalPrice();
    });
  });
}

function updateModalPrice() {
  if (!state.currentProduct) return;

  const unit = getUnitPrice(state.type, state.size);
  const total = unit * state.qty;

  document.getElementById('qtyValue').textContent = state.qty;
  document.getElementById('modalPrice').textContent = `${formatPrice(unit)} · total ${formatPrice(total)}`;
  document.getElementById('addToCartBtn').disabled = false;
  document.getElementById('buyNowBtn').disabled = false;

  const p = state.currentProduct;
  const msg = encodeURIComponent(
    `Hola, quiero pedir esta camisa:\n` +
    `Producto: ${p.title}\n` +
    `Personaje: ${p.character}\n` +
    `Anime: ${p.anime}\n` +
    `Tipo: ${state.type === 'basic' ? 'Básica' : 'Oversize'}\n` +
    `Talla: ${state.size}\n` +
    `Color: ${state.color}\n` +
    `Cantidad: ${state.qty}\n` +
    `Total: ${formatPrice(total)}`
  );

  document.getElementById('buyNowBtn').onclick = () => {
    window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`, '_blank');
  };
}

function openProduct(id) {
  const p = state.data.products.find(item => item.id === id);
  if (!p) return;

  state.currentProduct = p;
  state.type = 'basic';
  state.size = 'M';
  state.color = 'Negro';
  state.qty = 1;

  document.getElementById('modalImage').src = p.image;
  document.getElementById('modalImage').alt = p.title;
  document.getElementById('modalTitle').textContent = p.title;
  document.getElementById('modalSubtitle').textContent = `${p.character} · ${p.anime}`;

  renderTypeChoices();
  renderSizeChoices();
  renderColorChoices();
  applyPreviewColor();
  updateModalPrice();

  document.getElementById('productModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProduct() {
  document.getElementById('productModal').classList.remove('show');
  if (!document.getElementById('cartPanel').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function addCurrentToCart() {
  const p = state.currentProduct;
  if (!p) return;

  const unitPrice = getUnitPrice(state.type, state.size);
  const key = [p.id, state.type, state.size, state.color].join('|');
  const existing = state.cart.find(item => item.key === key);

  if (existing) {
    existing.qty += state.qty;
  } else {
    state.cart.push({
      key,
      title: p.title,
      character: p.character,
      anime: p.anime,
      image: p.image,
      type: state.type,
      typeLabel: state.type === 'basic' ? 'Básica' : 'Oversize',
      size: state.size,
      color: state.color,
      qty: state.qty,
      unitPrice
    });
  }

  renderCart();
  closeProduct();
  openCart();
}

function renderCart() {
  const wrap = document.getElementById('cartItems');
  if (!wrap) return;

  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = totalCount;
  const bottomCartCount = document.getElementById('bottomCartCount');
  if (bottomCartCount) bottomCartCount.textContent = totalCount;

  if (!state.cart.length) {
    wrap.innerHTML = '<p style="color:var(--muted)">Tu carrito está vacío.</p>';
    document.getElementById('cartTotal').textContent = '$0.00';
    return;
  }

  wrap.innerHTML = state.cart.map((item, idx) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">
      <div>
        <strong>${item.title}</strong>
        <div class="cart-meta">${item.character} · ${item.typeLabel} · ${item.size} · ${item.color}</div>
        <div>${formatPrice(item.unitPrice)} c/u · <strong>${formatPrice(item.unitPrice * item.qty)}</strong></div>
        <div class="cart-qty">
          <button data-minus="${idx}">−</button>
          <span>${item.qty}</span>
          <button data-plus="${idx}">+</button>
          <button class="choice" data-remove="${idx}">Quitar</button>
        </div>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.minus);
      state.cart[idx].qty = Math.max(1, state.cart[idx].qty - 1);
      renderCart();
    });
  });

  wrap.querySelectorAll('[data-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.plus);
      state.cart[idx].qty += 1;
      renderCart();
    });
  });

  wrap.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.remove);
      state.cart.splice(idx, 1);
      renderCart();
    });
  });

  const total = state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);
}

function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('backdrop').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('backdrop').classList.remove('show');
  if (!document.getElementById('productModal').classList.contains('show')) {
    document.body.style.overflow = '';
  }
}

function checkoutWhatsApp() {
  if (!state.cart.length) return;

  const total = state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const lines = state.cart.map(item =>
    `• ${item.title} | Personaje: ${item.character} | Anime: ${item.anime} | ${item.typeLabel} | ${item.size} | ${item.color} | Cantidad: ${item.qty} | Total: ${formatPrice(item.unitPrice * item.qty)}`
  ).join('%0A');

  const url = `https://wa.me/${state.data.contacts.whatsapp}?text=Hola, quiero confirmar este pedido:%0A${lines}%0A%0ASubtotal: ${encodeURIComponent(formatPrice(total))}`;
  window.open(url, '_blank');
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('backdrop').addEventListener('click', () => {
  closeCart();
  closeProduct();
  if (window.blackcatCloseMenu) window.blackcatCloseMenu();
});
document.getElementById('modalClose').addEventListener('click', closeProduct);
document.getElementById('productModal').addEventListener('click', e => {
  if (e.target.id === 'productModal') closeProduct();
});
document.getElementById('qtyMinus').addEventListener('click', () => {
  state.qty = Math.max(1, state.qty - 1);
  updateModalPrice();
});
document.getElementById('qtyPlus').addEventListener('click', () => {
  state.qty += 1;
  updateModalPrice();
});
document.getElementById('addToCartBtn').addEventListener('click', addCurrentToCart);
document.getElementById('checkoutBtn').addEventListener('click', checkoutWhatsApp);

function applyLocalFallbackData() {
  if (typeof getSiteData !== 'function') return;
  const localData = getSiteData();
  if (!localData || !Array.isArray(localData.products)) return;

  const fallbackContacts = {
    whatsapp: '50361900185',
    instagram: 'blackcat.sivar',
    tiktok: '@blackcat.sivar',
    email: 'blackcat2811@hotmail.com'
  };

  state.data = localData;
  state.data.contacts = { ...fallbackContacts, ...(localData.contacts || {}) };
  Object.keys(fallbackContacts).forEach(key => {
    if (!state.data.contacts[key]) state.data.contacts[key] = fallbackContacts[key];
  });

  applyHero();
  renderFilters();
  bindCategoryCards();
  renderCategoryBackgrounds();
  renderProducts();
  renderCart();
}

function bindMobileExperience() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('backdrop');
  const openMenu = () => {
    if (!drawer || !backdrop) return;
    drawer.classList.add('open');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    if (!drawer || !backdrop) return;
    drawer.classList.remove('open');
    if (!document.getElementById('cartPanel')?.classList.contains('open') && !document.getElementById('productModal')?.classList.contains('show')) {
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  document.getElementById('menuToggle')?.addEventListener('click', openMenu);
  document.getElementById('menuClose')?.addEventListener('click', closeMenu);
  document.getElementById('bottomCartBtn')?.addEventListener('click', openCart);
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  const search = document.getElementById('catalogSearch');
  search?.addEventListener('input', event => {
    state.searchQuery = event.target.value;
    state.filter = 'all';
    state.badgeFilter = 'all';
    renderFilters();
    bindCategoryCards();
    renderProducts();
  });

  document.querySelectorAll('[data-quick-badge]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.badgeFilter = btn.dataset.quickBadge;
      state.filter = 'all';
      state.searchQuery = '';
      if (search) search.value = '';
      renderFilters();
      bindCategoryCards();
      renderProducts();
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-quick-scroll]').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById(btn.dataset.quickScroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  });

  document.querySelectorAll('[data-quick-type], [data-quick-price]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.searchQuery = btn.dataset.quickType || btn.dataset.quickPrice || '';
      if (search) search.value = state.searchQuery;
      state.filter = 'all';
      state.badgeFilter = 'all';
      renderFilters();
      bindCategoryCards();
      renderProducts();
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  window.blackcatCloseMenu = closeMenu;
}

async function loadSupabaseData() {
  if (!supabaseClient) {
    console.warn('Supabase no disponible. La página está funcionando con respaldo local.');
    return;
  }

  try {
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });

    if (settingsError) console.error(settingsError);
    if (productsError) console.error(productsError);

    if (settings) {
      state.data.hero = {
        titlePrefix: settings.hero_title_prefix || 'BLACK',
        titleAccent: settings.hero_title_accent || 'CAT',
        subtitle: settings.hero_subtitle || '',
        badges: [
          settings.hero_badge_1 || '',
          settings.hero_badge_2 || '',
          settings.hero_badge_3 || ''
        ],
        image: settings.hero_image_url || ''
      };

      state.data.contacts = {
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        email: settings.email || ''
      };
    }

    if (products && Array.isArray(products) && products.length) {
      state.data.products = products.map(p => ({
        id: p.id,
        title: p.title || '',
        character: p.character || '',
        anime: p.anime || p.category || '',
        badge: p.badge || 'TOP',
        image: p.image_url || '',
        category: p.category || p.product_category || p.product_type || '',
        type: p.type || p.product_type || '',
        description: p.description || '',
        tags: p.tags || ''
      }));
    }

    applyHero();
    renderFilters();
    bindCategoryCards();
    renderCategoryBackgrounds();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error('Error cargando Supabase:', error);
  }
}

bindMobileExperience();
applyLocalFallbackData();
renderCart();
loadSupabaseData();
const heroSlider = document.getElementById("heroSlider");
const heroSlides = document.querySelectorAll(".hero-slide");
const heroPrev = document.getElementById("heroPrev");
const heroNext = document.getElementById("heroNext");
const heroDots = document.querySelectorAll(".hero-dot");

let heroIndex = 0;
let heroInterval = null;
const HERO_DELAY = 5200;

function showHeroSlide(index){
  if(!heroSlides.length) return;

  heroSlides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  heroDots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  heroIndex = index;
}

function nextHeroSlide(){
  const next = (heroIndex + 1) % heroSlides.length;
  showHeroSlide(next);
}

function prevHeroSlide(){
  const prev = (heroIndex - 1 + heroSlides.length) % heroSlides.length;
  showHeroSlide(prev);
}

function stopHeroAutoplay(){
  if(heroInterval){
    clearInterval(heroInterval);
    heroInterval = null;
  }
}

function startHeroAutoplay(){
  stopHeroAutoplay();
  heroInterval = setInterval(() => {
    nextHeroSlide();
  }, HERO_DELAY);
}

if(heroSlider && heroSlides.length){
  heroPrev?.addEventListener("click", () => {
    prevHeroSlide();
    startHeroAutoplay();
  });

  heroNext?.addEventListener("click", () => {
    nextHeroSlide();
    startHeroAutoplay();
  });

  heroDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const slideIndex = Number(dot.dataset.slide);
      showHeroSlide(slideIndex);
      startHeroAutoplay();
    });
  });

  heroSlider.addEventListener("mouseenter", stopHeroAutoplay);
  heroSlider.addEventListener("mouseleave", startHeroAutoplay);

  heroSlider.addEventListener("touchstart", stopHeroAutoplay, { passive:true });
  heroSlider.addEventListener("touchend", startHeroAutoplay, { passive:true });

  showHeroSlide(0);
  startHeroAutoplay();
}

/* ===== PATCH V4 - lógica dinámica: cards limpias, series reales, carrito/modal visible ===== */
function cleanText(value, fallback = '') { return String(value || fallback || '').trim(); }
function productSearchBlob(p) { return [p.title,p.character,p.anime,p.badge,p.description,p.type,p.category,Array.isArray(p.tags)?p.tags.join(' '):p.tags].filter(Boolean).join(' ').toLowerCase(); }
function productAnime(p) { return cleanText(p.anime || p.category || 'BlackCat'); }
function displaySeriesName(name) { const n=cleanText(name,'BlackCat'); const map={'Jujutsu Kaisen':'Jujutsu','Kaiju No. 8':'Kaiju 8','Hell Paradise':"Hell's",'Chainsaw Man':'Chainsaw'}; return map[n] || n; }
function filteredProducts() { let list=[...(state.data.products||[])]; if(state.filter!=='all') list=list.filter(p=>productAnime(p).toLowerCase()===String(state.filter).toLowerCase()); if(state.badgeFilter!=='all') list=list.filter(p=>{const badge=cleanText(p.badge).toUpperCase(); if(state.badgeFilter==='NEW') return badge==='NEW'||badge==='NUEVO'; return badge===state.badgeFilter;}); const query=cleanText(state.searchQuery).toLowerCase(); if(query) list=list.filter(p=>productSearchBlob(p).includes(query)); return list; }
function renderProducts() { const grid=document.getElementById('shirtGrid'); if(!grid) return; const products=filteredProducts(); if(!products.length){grid.innerHTML='<div class="panel empty-state">No hay productos en esta selección. Toca “Ver todo” o prueba otra búsqueda.</div>';return;} grid.innerHTML=products.map(p=>{const badge=cleanText(p.badge,'DROP').toUpperCase()==='NUEVO'?'NEW':cleanText(p.badge,'DROP').toUpperCase(); const anime=productAnime(p); const title=cleanText(p.title,'Diseño BlackCat'); const img=cleanText(p.image,'./mockups/hero.jpg'); return `<article class="panel shirt-card improved-card"><button class="shirt-media" data-id="${p.id}" type="button" aria-label="Ver opciones de ${title}"><img src="${img}" alt="${title}" loading="lazy"><span class="shirt-badge">${badge}</span></button><div class="shirt-body"><div><h3>${title}</h3><p>${anime}</p></div><div class="card-commerce"><strong>Desde ${formatPrice(16.99)}</strong><span>XS-3XL</span></div><div class="card-actions"><button class="btn-card primary" type="button" data-id="${p.id}">Opciones</button><button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button></div></div></article>`;}).join(''); grid.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',()=>openProduct(Number(btn.dataset.id)))); grid.querySelectorAll('[data-wa-id]').forEach(btn=>btn.addEventListener('click',event=>{event.stopPropagation(); const product=(state.data.products||[]).find(p=>Number(p.id)===Number(btn.dataset.waId)); if(!product)return; const msg=encodeURIComponent(`Hola, quiero información de ${cleanText(product.title)} (${productAnime(product)}).`); window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`,'_blank');})); }
function renderFilters() { const wrap=document.getElementById('filterChips'); if(!wrap)return; const series=[...new Set((state.data.products||[]).map(productAnime).filter(Boolean))]; const filters=['Todos',...series]; wrap.innerHTML=filters.map(name=>{const value=name==='Todos'?'all':name; const active=String(state.filter).toLowerCase()===String(value).toLowerCase()?'active':''; return `<button class="filter ${active}" data-filter="${value}">${name==='Todos'?'Todo':displaySeriesName(name)}</button>`;}).join(''); wrap.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{state.filter=btn.dataset.filter; state.badgeFilter='all'; state.searchQuery=''; const search=document.getElementById('catalogSearch'); if(search) search.value=''; renderFilters(); renderCategoryBackgrounds(); renderProducts();})); }
function renderCategoryBackgrounds() { const reel=document.getElementById('seriesReel')||document.querySelector('.series-reel'); if(!reel)return; const products=state.data.products||[]; const groups=new Map(); products.forEach(p=>{const anime=productAnime(p); if(!groups.has(anime)) groups.set(anime,[]); groups.get(anime).push(p);}); const entries=[...groups.entries()].filter(([,items])=>items.length>0); if(!entries.length){reel.innerHTML='<div class="panel empty-state">Aún no hay series disponibles.</div>';return;} reel.innerHTML=entries.map(([anime,items])=>{const item=items.find(p=>p.image)||items[0]; const active=String(state.filter).toLowerCase()===anime.toLowerCase()?'active':''; return `<button class="panel category-card category-filter-card ${active}" type="button" data-anime="${anime}"><div class="category-bg"><img src="${cleanText(item.image,'./mockups/hero.jpg')}" alt="${displaySeriesName(anime)}" loading="lazy"></div><span class="category-card-overlay"></span><div class="category-card-content"><h3>${displaySeriesName(anime)}</h3><span class="category-count">${items.length} diseños</span></div></button>`;}).join(''); bindCategoryCards(); }
function bindCategoryCards() { const cards=document.querySelectorAll('.category-filter-card,.series-clear'); cards.forEach(card=>{const selectedAnime=card.dataset.anime; const selectedBadge=card.dataset.badge; const isActive=selectedAnime?(selectedAnime==='all'?state.filter==='all'&&state.badgeFilter==='all':String(state.filter).toLowerCase()===String(selectedAnime).toLowerCase()):selectedBadge===state.badgeFilter; card.classList.toggle('active',isActive); card.onclick=()=>{if(selectedAnime){state.filter=selectedAnime==='all'?'all':selectedAnime; state.badgeFilter='all'; state.searchQuery=''; const search=document.getElementById('catalogSearch'); if(search) search.value='';}else if(selectedBadge){const hasProducts=(state.data.products||[]).some(p=>cleanText(p.badge).toUpperCase()===selectedBadge); state.badgeFilter=hasProducts&&state.badgeFilter!==selectedBadge?selectedBadge:'all'; state.filter='all';} renderFilters(); renderCategoryBackgrounds(); renderProducts(); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'});};}); }
function updateModalPrice() { if(!state.currentProduct)return; const unit=getUnitPrice(state.type,state.size); const total=unit*state.qty; const qtyValue=document.getElementById('qtyValue'); const modalPrice=document.getElementById('modalPrice'); if(qtyValue) qtyValue.textContent=state.qty; if(modalPrice) modalPrice.textContent=`${formatPrice(total)}`; const addBtn=document.getElementById('addToCartBtn'); const buyBtn=document.getElementById('buyNowBtn'); if(addBtn) addBtn.disabled=false; if(buyBtn) buyBtn.disabled=false; const p=state.currentProduct; const msg=encodeURIComponent(`Hola, quiero pedir esta camisa:
Producto: ${cleanText(p.title)}
Anime: ${productAnime(p)}
Tipo: ${state.type==='basic'?'Básica':'Oversize'}
Talla: ${state.size}
Color: ${state.color}
Cantidad: ${state.qty}
Total: ${formatPrice(total)}`); if(buyBtn) buyBtn.onclick=()=>window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`,'_blank'); }
function openProduct(id) { const p=(state.data.products||[]).find(item=>Number(item.id)===Number(id)); if(!p)return; state.currentProduct=p; state.type='basic'; state.size='M'; state.color='Negro'; state.qty=1; const image=document.getElementById('modalImage'); if(image){image.src=cleanText(p.image,'./mockups/hero.jpg'); image.alt=cleanText(p.title);} const title=document.getElementById('modalTitle'); if(title) title.textContent=cleanText(p.title,'Diseño BlackCat'); const sub=document.getElementById('modalSubtitle'); if(sub) sub.textContent=productAnime(p); renderTypeChoices(); renderSizeChoices(); renderColorChoices(); updateModalPrice(); document.getElementById('productModal')?.classList.add('show'); document.getElementById('backdrop')?.classList.add('show'); document.body.style.overflow='hidden'; }
function closeProduct() { document.getElementById('productModal')?.classList.remove('show'); if(!document.getElementById('cartPanel')?.classList.contains('open')&&!document.getElementById('mobileDrawer')?.classList.contains('open')){document.getElementById('backdrop')?.classList.remove('show'); document.body.style.overflow='';} }
function renderCart() { const wrap=document.getElementById('cartItems'); if(!wrap)return; const totalCount=state.cart.reduce((sum,item)=>sum+item.qty,0); const cartCount=document.getElementById('cartCount'); if(cartCount)cartCount.textContent=totalCount; const bottomCartCount=document.getElementById('bottomCartCount'); if(bottomCartCount)bottomCartCount.textContent=totalCount; if(!state.cart.length){wrap.innerHTML='<p style="color:var(--muted);padding:14px 0">Tu carrito está vacío.</p>'; const totalEl=document.getElementById('cartTotal'); if(totalEl)totalEl.textContent='$0.00'; return;} wrap.innerHTML=state.cart.map((item,idx)=>`<div class="cart-item"><img src="${cleanText(item.image,'./mockups/hero.jpg')}" alt="${cleanText(item.title)}"><div><strong>${cleanText(item.title)}</strong><div class="cart-meta">${cleanText(item.anime)} · ${item.typeLabel} · ${item.size} · ${item.color}</div><div class="cart-line-price">${formatPrice(item.unitPrice*item.qty)}</div><div class="cart-qty"><button data-minus="${idx}">−</button><span>${item.qty}</span><button data-plus="${idx}">+</button><button class="choice" data-remove="${idx}">Quitar</button></div></div></div>`).join(''); wrap.querySelectorAll('[data-minus]').forEach(btn=>btn.addEventListener('click',()=>{const idx=Number(btn.dataset.minus); state.cart[idx].qty=Math.max(1,state.cart[idx].qty-1); renderCart();})); wrap.querySelectorAll('[data-plus]').forEach(btn=>btn.addEventListener('click',()=>{const idx=Number(btn.dataset.plus); state.cart[idx].qty+=1; renderCart();})); wrap.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{const idx=Number(btn.dataset.remove); state.cart.splice(idx,1); renderCart();})); const total=state.cart.reduce((sum,item)=>sum+item.unitPrice*item.qty,0); const totalEl=document.getElementById('cartTotal'); if(totalEl)totalEl.textContent=formatPrice(total); }
function openCart() { document.getElementById('cartPanel')?.classList.add('open'); document.getElementById('backdrop')?.classList.add('show'); document.body.style.overflow='hidden'; }
function closeCart() { document.getElementById('cartPanel')?.classList.remove('open'); if(!document.getElementById('productModal')?.classList.contains('show')&&!document.getElementById('mobileDrawer')?.classList.contains('open')){document.getElementById('backdrop')?.classList.remove('show'); document.body.style.overflow='';} }
function checkoutWhatsApp() { if(!state.cart.length)return; const total=state.cart.reduce((sum,item)=>sum+item.unitPrice*item.qty,0); const lines=state.cart.map(item=>`• ${cleanText(item.title)} | ${cleanText(item.anime)} | ${item.typeLabel} | ${item.size} | ${item.color} | Cantidad: ${item.qty} | Total: ${formatPrice(item.unitPrice*item.qty)}`).join('%0A'); const url=`https://wa.me/${state.data.contacts.whatsapp}?text=Hola, quiero confirmar este pedido:%0A${lines}%0A%0ASubtotal: ${encodeURIComponent(formatPrice(total))}`; window.open(url,'_blank'); }
document.addEventListener('click',event=>{const quickSearch=event.target.closest('[data-quick-search]'); if(quickSearch){const query=quickSearch.dataset.quickSearch||''; const hasMatches=(state.data.products||[]).some(p=>productSearchBlob(p).includes(query.toLowerCase())); state.searchQuery=hasMatches?query:''; state.filter='all'; state.badgeFilter='all'; const search=document.getElementById('catalogSearch'); if(search)search.value=state.searchQuery; renderFilters(); renderCategoryBackgrounds(); renderProducts(); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'});}});

/* ===== PATCH V5 - render final más limpio ===== */
function renderProducts() {
  const grid = document.getElementById('shirtGrid');
  if (!grid) return;

  const products = filteredProducts();
  if (!products.length) {
    grid.innerHTML = '<div class="panel empty-state">No hay productos en esta selección. Usa “Todo” o escribe otra búsqueda.</div>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const badge = cleanText(p.badge, 'DROP').toUpperCase() === 'NUEVO' ? 'NEW' : cleanText(p.badge, 'DROP').toUpperCase();
    const anime = productAnime(p);
    const title = cleanText(p.title, 'Diseño BlackCat');
    const img = cleanText(p.image, './mockups/hero.jpg');
    return `
      <article class="panel shirt-card improved-card">
        <button class="shirt-media" data-id="${p.id}" type="button" aria-label="Ver opciones de ${title}">
          <img src="${img}" alt="${title}" loading="lazy">
          <span class="shirt-badge">${badge}</span>
        </button>
        <div class="shirt-body">
          <div class="card-title-block">
            <h3>${title}</h3>
            <p>${anime}</p>
          </div>
          <div class="card-commerce"><strong>Desde ${formatPrice(16.99)}</strong></div>
          <div class="card-actions">
            <button class="btn-card primary" type="button" data-id="${p.id}">Opciones</button>
            <button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button>
          </div>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openProduct(Number(btn.dataset.id))));
  grid.querySelectorAll('[data-wa-id]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const product = (state.data.products || []).find(p => Number(p.id) === Number(btn.dataset.waId));
    if (!product) return;
    const msg = encodeURIComponent(`Hola, quiero información de ${cleanText(product.title)} (${productAnime(product)}).`);
    window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`, '_blank');
  }));
}

function openProduct(id) {
  const p = (state.data.products || []).find(item => Number(item.id) === Number(id));
  if (!p) return;
  state.currentProduct = p;
  state.type = 'basic';
  state.size = 'M';
  state.color = 'Negro';
  state.qty = 1;

  const image = document.getElementById('modalImage');
  if (image) {
    image.src = cleanText(p.image, './mockups/hero.jpg');
    image.alt = cleanText(p.title, 'Diseño BlackCat');
  }

  const title = document.getElementById('modalTitle');
  if (title) title.textContent = cleanText(p.title, 'Diseño BlackCat');

  const sub = document.getElementById('modalSubtitle');
  if (sub) sub.textContent = productAnime(p);

  renderTypeChoices();
  renderSizeChoices();
  renderColorChoices();
  updateModalPrice();

  document.getElementById('productModal')?.classList.add('show');
  document.getElementById('backdrop')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/* ===== PATCH V6 - colores visibles y cards más limpias ===== */
function colorToHex(colorName){const map={Blanco:'#f1f1f1',Negro:'#111111',Beige:'#d7c7aa',Gris:'#8e96a3','Verde Militar':'#55604c','Verde militar':'#55604c'};return map[colorName]||'#8e96a3';}
function renderColorChoices(){const wrap=document.getElementById('colorChoices');if(!wrap)return;wrap.innerHTML=colorOptions.map(color=>{const hex=colorToHex(color.id);const active=state.color===color.id?'active':'';return `<button title="${color.id}" class="choice ${active}" data-color="${color.id}" style="--swatch:${hex}"><span class="color-dot"></span><span class="color-name">${color.id}</span></button>`;}).join('');wrap.querySelectorAll('[data-color]').forEach(btn=>btn.addEventListener('click',()=>{state.color=btn.dataset.color;renderColorChoices();applyPreviewColor();updateModalPrice();}));}
function renderProducts(){const grid=document.getElementById('shirtGrid');if(!grid)return;const products=filteredProducts();if(!products.length){grid.innerHTML='<div class="panel empty-state">No hay productos en esta selección. Usa “Todo” o busca otra serie.</div>';return;}grid.innerHTML=products.map(p=>{const badge=cleanText(p.badge,'DROP').toUpperCase()==='NUEVO'?'NEW':cleanText(p.badge,'DROP').toUpperCase();const anime=productAnime(p);const title=cleanText(p.title,'Diseño BlackCat');const img=cleanText(p.image,'./mockups/hero.jpg');return `<article class="panel shirt-card improved-card"><button class="shirt-media" data-id="${p.id}" type="button" aria-label="Ver opciones de ${title}"><img src="${img}" alt="${title}" loading="lazy"><span class="shirt-badge">${badge}</span></button><div class="shirt-body"><div class="card-title-block"><h3>${title}</h3><p>${anime}</p></div><div class="card-commerce"><strong>Desde ${formatPrice(16.99)}</strong></div><div class="card-actions"><button class="btn-card primary" type="button" data-id="${p.id}">Opciones</button><button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button></div></div></article>`;}).join('');grid.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',()=>openProduct(Number(btn.dataset.id))));grid.querySelectorAll('[data-wa-id]').forEach(btn=>btn.addEventListener('click',event=>{event.stopPropagation();const product=(state.data.products||[]).find(p=>Number(p.id)===Number(btn.dataset.waId));if(!product)return;const msg=encodeURIComponent(`Hola, quiero información de ${cleanText(product.title)} (${productAnime(product)}).`);window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`,'_blank');}));}
function openProduct(id){const p=(state.data.products||[]).find(item=>Number(item.id)===Number(id));if(!p)return;state.currentProduct=p;state.type='basic';state.size='M';state.color=(colorOptions[1]&&colorOptions[1].id)||'Negro';state.qty=1;const image=document.getElementById('modalImage');if(image){image.src=cleanText(p.image,'./mockups/hero.jpg');image.alt=cleanText(p.title,'Diseño BlackCat');}const title=document.getElementById('modalTitle');if(title)title.textContent=cleanText(p.title,'Diseño BlackCat');const sub=document.getElementById('modalSubtitle');if(sub)sub.textContent=productAnime(p);renderTypeChoices();renderSizeChoices();renderColorChoices();updateModalPrice();document.getElementById('productModal')?.classList.add('show');document.getElementById('backdrop')?.classList.add('show');document.body.style.overflow='hidden';}


/* ===== PATCH V8 - controles de series ===== */
function initSeriesCarouselControls(){
  const reel = document.getElementById('seriesReel');
  const prev = document.getElementById('seriesPrev');
  const next = document.getElementById('seriesNext');
  if(!reel) return;
  const move = (direction) => {
    const amount = Math.max(180, Math.round(reel.clientWidth * 0.72));
    reel.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };
  if(prev && !prev.dataset.bound){ prev.dataset.bound = 'true'; prev.addEventListener('click', () => move(-1)); }
  if(next && !next.dataset.bound){ next.dataset.bound = 'true'; next.addEventListener('click', () => move(1)); }
}
initSeriesCarouselControls();
const __blackcatRenderCategoryBackgroundsV8 = renderCategoryBackgrounds;
renderCategoryBackgrounds = function(){
  __blackcatRenderCategoryBackgroundsV8();
  initSeriesCarouselControls();
};

/* ===== PATCH V10 - iconos correctos, promo, hoodies y extras funcionales ===== */
function normalizeLineText(value){ return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function isHoodieProduct(p){ const blob = normalizeLineText([p.title,p.character,p.anime,p.badge,p.category,p.type,p.description,Array.isArray(p.tags)?p.tags.join(' '):p.tags].filter(Boolean).join(' ')); return /hoodie|hoodies|sudadera|sudaderas|sueter|sweater/.test(blob); }
function isExtraProduct(p){ const blob = normalizeLineText([p.title,p.character,p.anime,p.badge,p.category,p.type,p.description,Array.isArray(p.tags)?p.tags.join(' '):p.tags].filter(Boolean).join(' ')); return /termo|termos|tumbler|vaso|accesorio|extra|extras|sticker|llavero/.test(blob); }
function lineCardTemplate(item, lineType){
  const isReal = !!item;
  const title = isReal ? cleanText(item.title, lineType === 'hoodie' ? 'Hoodie BlackCat' : 'Termo BlackCat') : (lineType === 'hoodie' ? 'Hoodies BlackCat' : 'Termos y extras');
  const subtitle = isReal ? cleanText(item.description || item.anime || item.category, lineType === 'hoodie' ? 'Sudadera por drop' : 'Producto extra') : (lineType === 'hoodie' ? 'Sección lista para cargar hoodies desde Supabase.' : 'Sección lista para cargar termos y accesorios desde Supabase.');
  const icon = lineType === 'hoodie' ? '🧥' : '🥤';
  const waText = encodeURIComponent(`Hola, quiero consultar ${title}.`);
  const openBtn = isReal ? `<button class="btn-card primary" type="button" data-id="${item.id}">Ver opciones</button>` : '';
  return `<article class="panel line-card ${lineType}-line-card"><div><div class="line-card-top"><span class="line-icon">${icon}</span><span class="mini-badge">${isReal ? 'DISPONIBLE' : 'PRÓXIMAMENTE'}</span></div><h3>${title}</h3><p>${subtitle}</p></div><div class="line-actions">${openBtn}<a class="btn-card ghost" href="https://wa.me/${state.data.contacts.whatsapp}?text=${waText}" target="_blank" rel="noopener">Consultar</a></div></article>`;
}
function renderProductLines(){
  const hoodieGrid = document.getElementById('hoodieGrid');
  const extrasGrid = document.getElementById('extrasGrid');
  const products = state.data.products || [];
  const hoodies = products.filter(isHoodieProduct);
  const extras = products.filter(isExtraProduct);
  if (hoodieGrid) {
    hoodieGrid.innerHTML = hoodies.length ? hoodies.map(p => lineCardTemplate(p,'hoodie')).join('') : lineCardTemplate(null,'hoodie');
    hoodieGrid.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openProduct(Number(btn.dataset.id))));
  }
  if (extrasGrid) {
    extrasGrid.innerHTML = extras.length ? extras.map(p => lineCardTemplate(p,'extra')).join('') : lineCardTemplate(null,'extra');
    extrasGrid.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openProduct(Number(btn.dataset.id))));
  }
}
const __blackcatRenderProductsV10 = renderProducts;
renderProducts = function(){
  __blackcatRenderProductsV10();
  renderProductLines();
};
const __blackcatApplyHeroV10 = applyHero;
applyHero = function(){
  __blackcatApplyHeroV10();
  document.querySelectorAll('.btn-promo').forEach(btn => {
    btn.href = `https://wa.me/${state.data.contacts.whatsapp}?text=${encodeURIComponent('Hola, quiero consultar la promo por segunda camiseta BlackCat.')}`;
  });
};
function bindSpecialLineCards(){
  document.querySelectorAll('.special-card').forEach(card => {
    if (card.dataset.boundV10) return;
    card.dataset.boundV10 = 'true';
    card.addEventListener('click', () => setTimeout(renderProductLines, 60));
  });
}
bindSpecialLineCards();
renderProductLines();
renderProducts();

/* ===== PATCH V11 - hero promo clic, líneas internas y compatibilidad Supabase ===== */
state.lineFilter = 'all';

function productPriceFromData(p){
  const candidates = [p.price, p.base_price, p.price_basic, p.precio, p.priceFrom, p.price_from];
  const found = candidates.find(v => v !== undefined && v !== null && String(v).trim() !== '');
  const n = Number(String(found ?? '').replace(/[^0-9.]/g,''));
  return Number.isFinite(n) && n > 0 ? n : 16.99;
}
function matchesLineFilter(p){
  if(!state.lineFilter || state.lineFilter === 'all') return true;
  if(state.lineFilter === 'hoodie') return isHoodieProduct(p);
  if(state.lineFilter === 'extra') return isExtraProduct(p);
  return true;
}
const __blackcatFilteredProductsV11 = filteredProducts;
filteredProducts = function(){ return __blackcatFilteredProductsV11().filter(matchesLineFilter); };
function resetLineFilter(){
  state.lineFilter = 'all';
  document.querySelectorAll('.special-card').forEach(c => c.classList.remove('active-line'));
  const title = document.querySelector('.catalog-head .title');
  if(title) title.textContent = 'Elige tu diseño';
  const note = document.getElementById('catalogLineNote');
  if(note) note.remove();
}
function activateLineSection(line){
  state.lineFilter = line;
  state.filter = 'all';
  state.badgeFilter = 'all';
  document.querySelectorAll('.special-card').forEach(c => c.classList.toggle('active-line', c.dataset.line === line));
  const title = document.querySelector('.catalog-head .title');
  const label = line === 'hoodie' ? 'Hoodies BlackCat' : 'Termos y accesorios';
  if(title) title.textContent = label;
  const head = document.querySelector('.catalog-head');
  let note = document.getElementById('catalogLineNote');
  if(!note && head){ note = document.createElement('p'); note.id = 'catalogLineNote'; note.className = 'catalog-line-note'; head.insertAdjacentElement('afterend', note); }
  if(note) note.textContent = line === 'hoodie' ? 'Mostrando solo hoodies/sudaderas cargadas en Supabase.' : 'Mostrando solo termos, vasos y productos extra cargados en Supabase.';
  renderFilters(); renderCategoryBackgrounds(); renderProducts();
  document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth', block:'start'});
}
const __blackcatRenderFiltersV11 = renderFilters;
renderFilters = function(){
  __blackcatRenderFiltersV11();
  const wrap = document.getElementById('filterChips');
  if(!wrap) return;
  wrap.querySelectorAll('[data-filter]').forEach(btn => {
    if(btn.dataset.lineResetBound) return;
    btn.dataset.lineResetBound = 'true';
    btn.addEventListener('click', () => { if(state.lineFilter !== 'all') setTimeout(resetLineFilter, 0); });
  });
};
const __blackcatRenderProductsV11 = renderProducts;
renderProducts = function(){
  const grid = document.getElementById('shirtGrid');
  if(!grid) return;
  const products = filteredProducts();
  if(!products.length){
    if(state.lineFilter !== 'all'){
      const label = state.lineFilter === 'hoodie' ? 'hoodies BlackCat' : 'termos o productos extra BlackCat';
      const text = encodeURIComponent(`Hola, quiero consultar ${label}.`);
      grid.innerHTML = `<div class="panel empty-state">Todavía no hay ${label} cargados. Agrega productos en Supabase usando la categoría correspondiente.<br><a class="btn-card ghost" href="https://wa.me/${state.data.contacts.whatsapp}?text=${text}" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>`;
      return;
    }
    grid.innerHTML = '<div class="panel empty-state">No hay productos en esta selección. Usa “Todo” o busca otra serie.</div>';
    return;
  }
  grid.innerHTML = products.map(p=>{
    const badge=cleanText(p.badge,'DROP').toUpperCase()==='NUEVO'?'NEW':cleanText(p.badge,'DROP').toUpperCase();
    const anime=productAnime(p);
    const title=cleanText(p.title,'Diseño BlackCat');
    const img=cleanText(p.image,'./mockups/hero.jpg');
    const price=productPriceFromData(p);
    return `<article class="panel shirt-card improved-card" tabindex="0"><button class="shirt-media" data-id="${p.id}" type="button" aria-label="Ver opciones de ${title}"><img src="${img}" alt="${title}" loading="lazy"><span class="shirt-badge">${badge}</span></button><div class="shirt-body"><div class="card-title-block"><h3>${title}</h3><p>${anime}</p></div><div class="card-commerce"><strong>Desde ${formatPrice(price)}</strong></div><div class="card-actions"><button class="btn-card primary" type="button" data-id="${p.id}">Opciones</button><button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button></div></div></article>`;
  }).join('');
  grid.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',()=>openProduct(Number(btn.dataset.id))));
  grid.querySelectorAll('[data-wa-id]').forEach(btn=>btn.addEventListener('click',event=>{event.stopPropagation();const product=(state.data.products||[]).find(p=>Number(p.id)===Number(btn.dataset.waId));if(!product)return;const msg=encodeURIComponent(`Hola, quiero información de ${cleanText(product.title)} (${productAnime(product)}).`);window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`,'_blank');}));
};
function initLineCardsV11(){
  document.querySelectorAll('.special-card[data-line]').forEach(card => {
    if(card.dataset.boundV11) return;
    card.dataset.boundV11 = 'true';
    card.addEventListener('click', () => activateLineSection(card.dataset.line));
  });
}
function initHeroPromoClickV11(){
  const hero = document.getElementById('heroSlider');
  if(!hero || hero.dataset.boundPromoV11) return;
  hero.dataset.boundPromoV11 = 'true';
  hero.setAttribute('role','button');
  hero.setAttribute('tabindex','0');
  hero.setAttribute('aria-label','Ver promoción del drop');
  const go = (event) => {
    if(event.target.closest('.hero-nav,.hero-dot')) return;
    document.getElementById('promo-drop')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  hero.addEventListener('click', go);
  hero.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(e); } });
}
function updatePromoLinksV11(){
  document.querySelectorAll('.promo-pack-wa').forEach(btn => {
    btn.href = `https://wa.me/${state.data.contacts.whatsapp}?text=${encodeURIComponent('Hola, quiero consultar la promo 3 camisetas por $55.99 con envío incluido.')}`;
  });
}
initLineCardsV11();
initHeroPromoClickV11();
updatePromoLinksV11();
renderFilters();
renderProducts();

/* ===== PATCH V11B - reset de líneas al usar filtros/series normales ===== */
const __blackcatRenderFiltersV11B = renderFilters;
renderFilters = function(){
  __blackcatRenderFiltersV11B();
  const wrap = document.getElementById('filterChips');
  if(!wrap) return;
  wrap.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(state.lineFilter !== 'all'){
        setTimeout(() => { resetLineFilter(); renderProducts(); renderCategoryBackgrounds(); }, 0);
      }
    }, { once:false });
  });
};
const __blackcatRenderCategoryBackgroundsV11B = renderCategoryBackgrounds;
renderCategoryBackgrounds = function(){
  __blackcatRenderCategoryBackgroundsV11B();
  document.querySelectorAll('.category-filter-card').forEach(card => {
    if(card.dataset.lineResetV11B) return;
    card.dataset.lineResetV11B = 'true';
    card.addEventListener('click', () => {
      if(state.lineFilter !== 'all'){
        setTimeout(() => { resetLineFilter(); renderProducts(); }, 0);
      }
    });
  });
};
renderFilters();
renderCategoryBackgrounds();

/* ===== PATCH V12 - repaso general, cards nuevas, enlaces seguros, Supabase completo ===== */
function bcText(value, fallback = '') { return String(value ?? fallback ?? '').trim(); }
function bcNumber(value) {
  if (value === undefined || value === null || value === '') return NaN;
  const n = Number(String(value).replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
function bcTagsToText(tags) {
  if (Array.isArray(tags)) return tags.join(' ');
  if (tags && typeof tags === 'object') return Object.values(tags).join(' ');
  return bcText(tags);
}
function getProductImage(p) {
  return bcText(p?.image || p?.image_url || p?.mockup_url || p?.mockup || p?.photo || p?.foto || './mockups/hero.jpg', './mockups/hero.jpg');
}
function getProductTitle(p) {
  return bcText(p?.title || p?.name || p?.nombre || p?.product_name, 'Diseño BlackCat');
}
function getProductAnime(p) {
  return bcText(p?.anime || p?.series || p?.serie || p?.category || p?.categoria || 'BlackCat', 'BlackCat');
}
function getProductBadge(p) {
  const badge = bcText(p?.badge || p?.label || p?.etiqueta || (p?.is_new ? 'NEW' : '') || 'DROP', 'DROP').toUpperCase();
  return badge === 'NUEVO' ? 'NEW' : badge;
}
function getProductTypeText(p) {
  return bcText(p?.product_type || p?.type || p?.tipo || p?.category || p?.categoria || 'camiseta', 'camiseta');
}
function getProductBasePrice(p, type = 'basic') {
  const candidates = type === 'oversize'
    ? [p?.price_oversize, p?.oversize_price, p?.precio_oversize, p?.base_price_oversize, p?.price, p?.base_price, p?.price_from, p?.precio]
    : [p?.price_basic, p?.basic_price, p?.precio_basic, p?.precio_basica, p?.price, p?.base_price, p?.price_from, p?.precio];
  for (const value of candidates) {
    const n = bcNumber(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return type === 'oversize' ? 19.99 : 16.99;
}
function getProductDisplayPrice(p) {
  const candidates = [p?.price_from, p?.desde, p?.base_price, p?.price, p?.precio, p?.price_basic, p?.basic_price];
  for (const value of candidates) {
    const n = bcNumber(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 16.99;
}
function getUnitPrice(type, size) {
  const p = state.currentProduct || {};
  const specific2XL = bcNumber(p.price_2xl || p.precio_2xl);
  const specific3XL = bcNumber(p.price_3xl || p.precio_3xl);
  if (size === '2XL' && Number.isFinite(specific2XL) && specific2XL > 0) return specific2XL;
  if (size === '3XL' && Number.isFinite(specific3XL) && specific3XL > 0) return specific3XL;
  if (size === '2XL') return 23.99;
  if (size === '3XL') return 28.99;
  return getProductBasePrice(p, type);
}
function normalizeAllowedList(value, fallback) {
  if (Array.isArray(value)) return value.map(v => bcText(v)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(/[|,;\/]/).map(v => bcText(v)).filter(Boolean);
  return fallback;
}
function getAvailableColors(p) {
  const labels = normalizeAllowedList(p?.colors || p?.available_colors || p?.color_options || p?.colores, colorOptions.map(c => c.id));
  const unique = [...new Set(labels)];
  return unique.map(label => ({ id: label, hex: colorToHex(label) }));
}
function getAvailableSizes(p) {
  return normalizeAllowedList(p?.sizes || p?.available_sizes || p?.tallas, sizeOptions);
}
function isSizeAvailable(type, size) {
  const allowed = getAvailableSizes(state.currentProduct || {});
  if (!allowed.includes(size)) return false;
  return !(type === 'oversize' && size === 'XS');
}
function productSearchBlob(p) {
  return [getProductTitle(p), p?.character, p?.personaje, getProductAnime(p), getProductBadge(p), p?.description, p?.descripcion, getProductTypeText(p), p?.category, p?.categoria, bcTagsToText(p?.tags)]
    .filter(Boolean).join(' ').toLowerCase();
}
function productAnime(p) { return getProductAnime(p); }
function displaySeriesName(name) {
  const n = bcText(name, 'BlackCat');
  const map = {'Jujutsu Kaisen':'Jujutsu','Kaiju No. 8':'Kaiju 8','Hell Paradise':"Hell's",'Chainsaw Man':'Chainsaw','One Piece':'One Piece'};
  return map[n] || n;
}
function applyHero() {
  const hero = state.data.hero || {};
  const contacts = state.data.contacts || {};
  const whatsapp = bcText(contacts.whatsapp || '50361900185').replace(/[^0-9]/g, '') || '50361900185';
  const instagram = bcText(contacts.instagram || 'blackcat.sivar').replace(/^@/, '');
  const tiktok = bcText(contacts.tiktok || 'blackcat.sivar').replace(/^@/, '');
  const email = bcText(contacts.email || 'blackcat2811@hotmail.com');

  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) heroTitle.innerHTML = `${bcText(hero.titlePrefix, 'BLACK')}<span class="gradient">${bcText(hero.titleAccent, 'CAT')}</span>`;

  document.querySelectorAll('.wa-pill, .catalog-wa, .drawer-socials a[aria-label="WhatsApp"], .bottom-app-nav a[href*="wa.me"], .hero-actions .btn-green').forEach(a => {
    a.href = `https://wa.me/${whatsapp}`;
  });
  document.querySelectorAll('.promo-pack-wa').forEach(a => {
    a.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero consultar la promo 3 camisetas por $55.99 con envío incluido.')}`;
  });
  document.querySelectorAll('.hero-contact-instagram, a[href*="instagram.com"]').forEach(a => a.href = `https://instagram.com/${instagram}`);
  document.querySelectorAll('.hero-contact-tiktok, a[href*="tiktok.com"]').forEach(a => a.href = `https://tiktok.com/@${tiktok}`);
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.href = `mailto:${email}`);

  const badgeEls = document.querySelectorAll('.hero-badges span');
  const defaultBadges = ['S - XL', 'PROMO ACTIVA', 'COBERTURA NACIONAL'];
  (hero.badges || defaultBadges).forEach((t, i) => { if (badgeEls[i]) badgeEls[i].textContent = bcText(t, defaultBadges[i]); });
}
function filteredProducts() {
  let list = [...(state.data.products || [])];
  if (state.filter !== 'all') list = list.filter(p => getProductAnime(p).toLowerCase() === String(state.filter).toLowerCase());
  if (state.badgeFilter !== 'all') list = list.filter(p => {
    const badge = getProductBadge(p);
    if (state.badgeFilter === 'NEW') return badge === 'NEW' || badge === 'NUEVO';
    return badge === state.badgeFilter;
  });
  if (state.lineFilter && state.lineFilter !== 'all') list = list.filter(matchesLineFilter);
  const query = bcText(state.searchQuery).toLowerCase();
  if (query) list = list.filter(p => productSearchBlob(p).includes(query));
  return list;
}
function renderProducts() {
  const grid = document.getElementById('shirtGrid');
  if (!grid) return;
  const products = filteredProducts();
  if (!products.length) {
    if (state.lineFilter && state.lineFilter !== 'all') {
      const label = state.lineFilter === 'hoodie' ? 'hoodies BlackCat' : 'termos o productos extra BlackCat';
      const text = encodeURIComponent(`Hola, quiero consultar ${label}.`);
      grid.innerHTML = `<div class="panel empty-state">Todavía no hay ${label} cargados en Supabase.<br><a class="btn-card ghost" href="https://wa.me/${state.data.contacts.whatsapp}?text=${text}" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>`;
      return;
    }
    grid.innerHTML = '<div class="panel empty-state">No hay productos en esta selección. Usa “Todo” o prueba otra búsqueda.</div>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const badge = getProductBadge(p);
    const anime = getProductAnime(p);
    const title = getProductTitle(p);
    const img = getProductImage(p);
    const price = getProductDisplayPrice(p);
    const productType = getProductTypeText(p);
    return `<article class="panel shirt-card product-card-v12" tabindex="0" data-card-id="${p.id}" aria-label="${title}">
      <button class="shirt-media product-card-media-v12" data-id="${p.id}" type="button" aria-label="Ver opciones de ${title}">
        <img src="${img}" alt="${title}" loading="lazy">
        <span class="shirt-badge">${badge}</span>
      </button>
      <div class="shirt-body product-card-body-v12">
        <div class="product-card-topline"><span>${anime}</span><small>${productType}</small></div>
        <h3>${title}</h3>
        <div class="card-commerce product-price-row"><strong>Desde ${formatPrice(price)}</strong><span>XS–3XL</span></div>
        <div class="card-actions product-card-actions-v12">
          <button class="btn-card primary" type="button" data-id="${p.id}">Opciones</button>
          <button class="btn-card ghost" type="button" data-wa-id="${p.id}">WhatsApp</button>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.product-card-v12').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('button,a')) return;
      openProduct(Number(card.dataset.cardId));
    });
    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button,a')) {
        event.preventDefault();
        openProduct(Number(card.dataset.cardId));
      }
    });
  });
  grid.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openProduct(Number(btn.dataset.id))));
  grid.querySelectorAll('[data-wa-id]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const product = (state.data.products || []).find(p => Number(p.id) === Number(btn.dataset.waId));
    if (!product) return;
    const msg = encodeURIComponent(`Hola, quiero información de ${getProductTitle(product)} (${getProductAnime(product)}).`);
    window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`, '_blank');
  }));
  if (typeof renderProductLines === 'function') renderProductLines();
}
function renderFilters() {
  const wrap = document.getElementById('filterChips');
  if (!wrap) return;
  const series = [...new Set((state.data.products || []).filter(matchesLineFilter).map(getProductAnime).filter(Boolean))];
  const filters = ['Todos', ...series];
  wrap.innerHTML = filters.map(name => {
    const value = name === 'Todos' ? 'all' : name;
    const active = String(state.filter).toLowerCase() === String(value).toLowerCase() ? 'active' : '';
    return `<button class="filter ${active}" data-filter="${value}">${name === 'Todos' ? 'Todo' : displaySeriesName(name)}</button>`;
  }).join('');
  wrap.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    if (state.lineFilter && state.lineFilter !== 'all') resetLineFilter();
    state.filter = btn.dataset.filter;
    state.badgeFilter = 'all';
    state.searchQuery = '';
    const search = document.getElementById('catalogSearch');
    if (search) search.value = '';
    renderFilters();
    renderCategoryBackgrounds();
    renderProducts();
  }));
}
function renderCategoryBackgrounds() {
  const reel = document.getElementById('seriesReel') || document.querySelector('.series-reel');
  if (!reel) return;
  const products = state.data.products || [];
  const groups = new Map();
  products.forEach(p => {
    const anime = getProductAnime(p);
    if (!groups.has(anime)) groups.set(anime, []);
    groups.get(anime).push(p);
  });
  const entries = [...groups.entries()].filter(([, items]) => items.length > 0);
  if (!entries.length) {
    reel.innerHTML = '<div class="panel empty-state">Aún no hay series disponibles.</div>';
    return;
  }
  reel.innerHTML = entries.map(([anime, items]) => {
    const item = items.find(p => getProductImage(p)) || items[0];
    const active = String(state.filter).toLowerCase() === anime.toLowerCase() ? 'active' : '';
    return `<button class="panel category-card category-filter-card ${active}" type="button" data-anime="${anime}">
      <div class="category-bg"><img src="${getProductImage(item)}" alt="${displaySeriesName(anime)}" loading="lazy"></div>
      <span class="category-card-overlay"></span>
      <div class="category-card-content"><h3>${displaySeriesName(anime)}</h3><span class="category-count">${items.length} diseños</span></div>
    </button>`;
  }).join('');
  bindCategoryCards();
  initSeriesCarouselControls();
}
function renderColorChoices() {
  const wrap = document.getElementById('colorChoices');
  if (!wrap) return;
  const colors = getAvailableColors(state.currentProduct || {});
  if (!colors.some(c => c.id === state.color)) state.color = colors[0]?.id || 'Negro';
  wrap.innerHTML = colors.map(color => {
    const active = state.color === color.id ? 'active' : '';
    return `<button title="${color.id}" class="choice ${active}" data-color="${color.id}" style="--swatch:${color.hex}"><span class="color-dot"></span><span class="color-name">${color.id}</span></button>`;
  }).join('');
  wrap.querySelectorAll('[data-color]').forEach(btn => btn.addEventListener('click', () => {
    state.color = btn.dataset.color;
    renderColorChoices();
    updateModalPrice();
  }));
}
function renderSizeChoices() {
  const wrap = document.getElementById('sizeChoices');
  if (!wrap) return;
  const allowed = getAvailableSizes(state.currentProduct || {});
  wrap.innerHTML = sizeOptions.map(size => {
    const available = allowed.includes(size) && isSizeAvailable(state.type, size);
    return `<button class="choice ${state.size === size ? 'active' : ''} ${available ? '' : 'disabled'}" data-size="${size}" ${available ? '' : 'disabled'}>${size}</button>`;
  }).join('');
  wrap.querySelectorAll('[data-size]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.disabled) return;
    state.size = btn.dataset.size;
    renderSizeChoices();
    updateModalPrice();
  }));
}
function openProduct(id) {
  const p = (state.data.products || []).find(item => Number(item.id) === Number(id));
  if (!p) return;
  state.currentProduct = p;
  state.type = 'basic';
  const sizes = getAvailableSizes(p).filter(size => isSizeAvailable(state.type, size));
  state.size = sizes.includes('M') ? 'M' : (sizes[0] || 'S');
  const colors = getAvailableColors(p);
  state.color = colors.some(c => c.id === 'Negro') ? 'Negro' : (colors[0]?.id || 'Negro');
  state.qty = 1;

  const image = document.getElementById('modalImage');
  if (image) { image.src = getProductImage(p); image.alt = getProductTitle(p); }
  const title = document.getElementById('modalTitle');
  if (title) title.textContent = getProductTitle(p);
  const sub = document.getElementById('modalSubtitle');
  if (sub) sub.textContent = getProductAnime(p);

  renderTypeChoices();
  renderSizeChoices();
  renderColorChoices();
  updateModalPrice();
  document.getElementById('productModal')?.classList.add('show');
  document.getElementById('backdrop')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function updateModalPrice() {
  if (!state.currentProduct) return;
  const unit = getUnitPrice(state.type, state.size);
  const total = unit * state.qty;
  const qtyValue = document.getElementById('qtyValue');
  const modalPrice = document.getElementById('modalPrice');
  if (qtyValue) qtyValue.textContent = state.qty;
  if (modalPrice) modalPrice.textContent = `${formatPrice(total)}`;
  const addBtn = document.getElementById('addToCartBtn');
  const buyBtn = document.getElementById('buyNowBtn');
  if (addBtn) addBtn.disabled = false;
  if (buyBtn) buyBtn.disabled = false;
  const p = state.currentProduct;
  const msg = encodeURIComponent(`Hola, quiero pedir esta camisa:\nProducto: ${getProductTitle(p)}\nAnime: ${getProductAnime(p)}\nTipo: ${state.type === 'basic' ? 'Básica' : 'Oversize'}\nTalla: ${state.size}\nColor: ${state.color}\nCantidad: ${state.qty}\nTotal: ${formatPrice(total)}`);
  if (buyBtn) buyBtn.onclick = () => window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=${msg}`, '_blank');
}
function addCurrentToCart() {
  const p = state.currentProduct;
  if (!p) return;
  const unitPrice = getUnitPrice(state.type, state.size);
  const key = [p.id, state.type, state.size, state.color].join('|');
  const existing = state.cart.find(item => item.key === key);
  if (existing) existing.qty += state.qty;
  else state.cart.push({ key, title: getProductTitle(p), character: bcText(p.character || p.personaje), anime: getProductAnime(p), image: getProductImage(p), type: state.type, typeLabel: state.type === 'basic' ? 'Básica' : 'Oversize', size: state.size, color: state.color, qty: state.qty, unitPrice });
  renderCart(); closeProduct(); openCart();
}
function checkoutWhatsApp() {
  if (!state.cart.length) return;
  const total = state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const lines = state.cart.map(item => `• ${item.title} | ${item.typeLabel} | ${item.size} | ${item.color} | Cantidad: ${item.qty} | Total: ${formatPrice(item.unitPrice * item.qty)}`).join('%0A');
  window.open(`https://wa.me/${state.data.contacts.whatsapp}?text=Hola, quiero confirmar este pedido:%0A${lines}%0A%0ASubtotal: ${encodeURIComponent(formatPrice(total))}`, '_blank');
}
async function loadSupabaseData() {
  if (!supabaseClient) {
    console.warn('Supabase no disponible. La página funciona con respaldo local.');
    applyHero(); renderFilters(); renderCategoryBackgrounds(); renderProducts(); renderCart();
    return;
  }
  try {
    const { data: settings, error: settingsError } = await supabaseClient.from('site_settings').select('*').limit(1).maybeSingle();
    const { data: products, error: productsError } = await supabaseClient.from('products').select('*').eq('active', true).order('order_index', { ascending: true });
    if (settingsError) console.warn(settingsError);
    if (productsError) console.warn(productsError);
    if (settings) {
      state.data.hero = {
        titlePrefix: settings.hero_title_prefix || 'BLACK',
        titleAccent: settings.hero_title_accent || 'CAT',
        subtitle: settings.hero_subtitle || '',
        badges: [settings.hero_badge_1 || 'S - XL', settings.hero_badge_2 || 'PROMO ACTIVA', settings.hero_badge_3 || 'COBERTURA NACIONAL'],
        image: settings.hero_image_url || ''
      };
      state.data.contacts = { whatsapp: settings.whatsapp || '50361900185', instagram: settings.instagram || 'blackcat.sivar', tiktok: settings.tiktok || '@blackcat.sivar', email: settings.email || 'blackcat2811@hotmail.com' };
    }
    if (Array.isArray(products) && products.length) {
      state.data.products = products.map((p, index) => ({
        ...p,
        id: p.id ?? index + 1,
        title: p.title || p.name || p.nombre || '',
        character: p.character || p.personaje || '',
        anime: p.anime || p.series || p.serie || p.category || p.categoria || '',
        badge: p.badge || p.label || p.etiqueta || (p.is_new ? 'NEW' : 'DROP'),
        image: p.image_url || p.image || p.mockup_url || p.mockup || p.photo || p.foto || '',
        category: p.category || p.categoria || p.product_category || p.product_type || '',
        type: p.type || p.tipo || p.product_type || '',
        description: p.description || p.descripcion || '',
        tags: p.tags || '',
        price: p.price ?? p.precio ?? p.base_price ?? p.price_from,
        price_from: p.price_from ?? p.desde ?? p.price ?? p.precio ?? p.base_price,
        price_basic: p.price_basic ?? p.basic_price ?? p.precio_basic ?? p.precio_basica,
        price_oversize: p.price_oversize ?? p.oversize_price ?? p.precio_oversize,
        price_2xl: p.price_2xl ?? p.precio_2xl,
        price_3xl: p.price_3xl ?? p.precio_3xl,
        colors: p.colors || p.available_colors || p.colores,
        sizes: p.sizes || p.available_sizes || p.tallas
      }));
    }
    applyHero(); renderFilters(); renderCategoryBackgrounds(); renderProducts(); renderCart(); updatePromoLinksV11?.();
  } catch (error) {
    console.error('Error cargando Supabase:', error);
  }
}
function bindV12SearchAndLinks() {
  const search = document.getElementById('catalogSearch');
  if (search && !search.dataset.boundV12) {
    search.dataset.boundV12 = 'true';
    search.addEventListener('input', event => {
      state.searchQuery = event.target.value;
      state.filter = 'all';
      state.badgeFilter = 'all';
      if (state.lineFilter && state.lineFilter !== 'all') resetLineFilter();
      renderFilters(); renderCategoryBackgrounds(); renderProducts();
    });
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.dataset.boundSmoothV12) return;
    link.dataset.boundSmoothV12 = 'true';
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { event.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  });
}
bindV12SearchAndLinks();
applyHero();
renderFilters();
renderCategoryBackgrounds();
renderProducts();
renderCart();
