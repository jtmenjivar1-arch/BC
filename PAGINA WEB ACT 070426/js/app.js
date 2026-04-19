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

  return list.sort((a, b) => a.title.localeCompare(b.title));
}

function renderProducts() {
  const grid = document.getElementById('shirtGrid');
  if (!grid) return;

  grid.innerHTML = filteredProducts().map(p => `
    <article class="panel shirt-card">
      <button class="shirt-media" data-id="${p.id}">
        <img src="${p.image}" alt="${p.title}">
        <span class="shirt-badge">${(p.badge || '').toUpperCase() === 'NUEVO' ? 'NEW' : p.badge}</span>
      </button>
      <div class="shirt-body">
        <div>
          <h3>${p.title}</h3>
          <p>${p.anime}</p>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', () => openProduct(Number(btn.dataset.id)));
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
  const cards = document.querySelectorAll('.category-filter-card');

  cards.forEach(card => {
    const isActive = card.dataset.badge === state.badgeFilter;
    card.classList.toggle('active', isActive);

    card.onclick = () => {
      const selected = card.dataset.badge;

      state.badgeFilter = state.badgeFilter === selected ? 'all' : selected;
      state.filter = 'all';

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
    TOP: document.getElementById('bg-top'),
    NEW: document.getElementById('bg-new'),
    DROP: document.getElementById('bg-drop')
  };

  const products = state.data.products || [];

  const picks = {
    TOP: products.find(p => (p.badge || '').toUpperCase() === 'TOP'),
    NEW: products.find(p => {
      const badge = (p.badge || '').toUpperCase();
      return badge === 'NEW' || badge === 'NUEVO';
    }),
    DROP: products.find(p => (p.badge || '').toUpperCase() === 'DROP')
  };

  Object.entries(map).forEach(([key, img]) => {
    if (!img) return;

    const item = picks[key];

    if (item && item.image) {
      img.src = item.image;
      img.alt = item.title || key;
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
  document.getElementById('cartCount').textContent = totalCount;

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

async function loadSupabaseData() {
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

    if (products && Array.isArray(products)) {
      state.data.products = products.map(p => ({
        id: p.id,
        title: p.title || '',
        character: p.character || '',
        anime: p.anime || '',
        badge: p.badge || 'TOP',
        image: p.image_url || ''
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