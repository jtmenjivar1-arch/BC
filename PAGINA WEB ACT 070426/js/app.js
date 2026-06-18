    'use strict';

    const BC = {
      storageKey: 'blackcat_cart_v16',
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

    const MONEY = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const SERIES_IMAGES = {
      BlackCat: 'assets/logo-gato.png',
    };

    const FALLBACK_PRODUCT_IMAGE = 'assets/logo-gato.png';

    const HOODIE_WORDS = [
      'hoodie',
      'hoodies',
      'sudadera',
      'sudaderas',
      'sueter',
      'suéter',
      'hoddie',
    ];

    const EXTRAS_WORDS = [
      'termo',
      'termos',
      'accesorio',
      'accesorios',
      'extra',
      'extras',
      'vaso',
      'taza',
      'exclusivo',
      'exclusivos',
      'nuevo',
      'nuevos',
      'especial',
      'especiales',
    ];

    const PRODUCT_TYPES = [
      { key: 'basic', label: 'Basic' },
      { key: 'oversize', label: 'Oversize' },
      { key: 'croptop', label: 'Crop Top' },
      { key: 'boxyfit', label: 'Boxy Fit' },
    ];

    const SHIRT_MODE_TYPES = {
      basic: ['basic'],
      oversize: ['oversize'],
      both: ['basic', 'oversize'],

      croptop: ['croptop'],

      boxyfit: ['boxyfit'],
      boxy_fit: ['boxyfit'],
      basic_boxyfit: ['basic', 'boxyfit'],
      basic_boxy_fit: ['basic', 'boxyfit'],
      oversize_boxyfit: ['oversize', 'boxyfit'],
      oversize_boxy_fit: ['oversize', 'boxyfit'],
      basic_oversize_boxyfit: ['basic', 'oversize', 'boxyfit'],
      basic_oversize_boxy_fit: ['basic', 'oversize', 'boxyfit'],
    };

    const SHIRT_TYPE_SIZES = {
      basic: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      oversize: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      croptop: ['S', 'M', 'L'],
      boxyfit: ['S', 'M', 'L', 'XL', '2XL'],
    };

    const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

    const HOODIE_SIZES = ['L', 'XL', '2XL'];

    const HOODIE_SIZE_PRICES = {
      L: 28.99,
      XL: 34.00,
      '2XL': 35.99,
    };

    const TERMO_SIZES = ['12oz', '20oz', '40oz'];

    const COLORS = [
      { name: 'Negro', value: '#111111' },
      { name: 'Blanco', value: '#f4f4f4' },
      { name: 'Beige', value: '#d7c7aa' },
      { name: 'Gris', value: '#8e96a3' },
      { name: 'Rosado', value: '#e83e8c' },
      { name: 'Metal', value: '#b8bcc2' },
    ];

    const LOCAL_SEED_PRODUCTS = [];

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
      bindSeriesDragScroll();
      bindHeroImageFallbacks();
      initHeroSlider();
      await loadData();
      applySettings();
      initNewsletterPopup();
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
      const fallback = window.DEFAULT_SITE_DATA || {
        hero: {},
        contacts: {},
        products: [],
      };

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

          if (settingsData) {
            BC.settings = normalizeSettings(settingsData);
          }

          if (Array.isArray(productsData)) {
            BC.products = normalizeProducts(productsData);
          }
        } catch (error) {
          console.warn('BlackCat: Supabase no cargó, usando datos locales.', error);
        }
      }

      BC.products = mergeSeedProducts(BC.products, normalizeProducts(LOCAL_SEED_PRODUCTS));
      console.log('BlackCat productos cargados:', BC.products);
    }

    function mergeSeedProducts(baseProducts, seedProducts) {
      const base = Array.isArray(baseProducts) ? [...baseProducts] : [];
      const exists = new Set(
        base.map((p) => normalize(`${p.title} ${p.category}`).replace(/[^a-z0-9]/g, ''))
      );

      seedProducts.forEach((product) => {
        const key = normalize(`${product.title} ${product.category}`).replace(/[^a-z0-9]/g, '');

        if (!exists.has(key)) {
          base.push(product);
        }
      });

      return base;
    }

    function normalizeSettings(source) {
      const hero = source.hero || source || {};
      const contacts = source.contacts || source || {};

      return {
        heroTitlePrefix: hero.titlePrefix || source.hero_title_prefix || 'BLACK',
        heroTitleAccent: hero.titleAccent || source.hero_title_accent || 'CAT',
        heroSubtitle:
          hero.subtitle ||
          source.hero_subtitle ||
          'Drop activo · XS a 3XL · pedido directo por WhatsApp',
        heroBadges:
          hero.badges ||
          [source.hero_badge_1, source.hero_badge_2, source.hero_badge_3].filter(Boolean),
        heroImage: hero.image || source.hero_image_url || '',
        whatsapp: cleanPhone(contacts.whatsapp || source.whatsapp || BC.defaultWhatsApp),
        instagram: contacts.instagram || source.instagram || BC.defaultInstagram,
        tiktok: contacts.tiktok || source.tiktok || BC.defaultTikTok,
        email: contacts.email || source.email || BC.defaultEmail,
        leadPopupEnabled: source.lead_popup_enabled === true || source.leadPopupEnabled === true,
      };
    }

    function normalizeProducts(items) {
      return (items || [])
        .map((p, index) => {
          const title = p.title || p.name || p.nombre || `Producto ${index + 1}`;
          const character = p.character || p.personaje || '';
          const anime = p.anime || p.serie || p.series || p.category_anime || 'BlackCat';
          const badge = p.badge || p.etiqueta || 'NEW';
          const image = p.image_url || p.image || p.imagen || p.mockup || FALLBACK_PRODUCT_IMAGE;

          const rawCategory = [
            p.category,
            p.categoria,
            p.product_category,
            p.tipo_categoria,
            p.line,
            p.linea,
            p.product_type,
            p.type,
          ]
            .filter(Boolean)
            .join(' ');

          const category = detectProductCategory({
            title,
            anime,
            badge,
            rawCategory,
          });

          const adminTypes = getAdminTypesFromRawProduct(p);
          const rawShirtMode =
            p.shirt_mode ||
            p.shirtMode ||
            p.type_options ||
            p.types ||
            p.available_types ||
            p.product_types ||
            p.tipo_camisa ||
            p.product_type ||
            p.productType ||
            p.type ||
            'basic';

          const shirtMode = adminTypes.length
            ? getShirtModeFromTypes(adminTypes)
            : normalizeMode(rawShirtMode || 'basic');

          const productType = normalizeMode(p.product_type || p.productType || '');

          const priceBasic = Number(
            p.price_basic ||
              p.priceBasic ||
              (shirtMode === 'croptop' ? 12.99 : shirtMode === 'boxyfit' ? 22.0 : 17.0)
          );

          const priceOversize = Number(
            p.price_oversize ||
              p.priceOversize ||
              (shirtMode.includes('boxyfit') ? 25.0 : 19.99)
          );

          const priceCropTop = Number(p.price_croptop || p.priceCropTop || 12.99);
          const priceBoxyFit = Number(p.price_boxyfit || p.priceBoxyFit || 22.0);
          const priceBoxyFitPlus = Number(p.price_boxyfit_plus || p.priceBoxyFitPlus || 25.0);
          const priceHoodieXL = Number(p.price_hoodie_xl || p.priceHoodieXL || 0);
          const priceHoodie2XL = Number(p.price_hoodie_2xl || p.priceHoodie2XL || 0);

          const capacity = p.capacity || p.capacidad || '';

          const colors = normalizeList(
            p.colors || p.colores || p.available_colors || p.color_options || p.color || p.availableColors
          );

          let sizes = normalizeList(p.sizes || p.tallas || p.available_sizes || p.size_options || p.availableSizes);

          if (!sizes.length && category === 'catalog') {
            sizes = getDefaultSizesByShirtMode(shirtMode);
          }

          if (!sizes.length && category === 'hoodies') {
            sizes = HOODIE_SIZES;
          }

          if (!sizes.length && category === 'extras') {
            sizes = capacity ? [capacity] : TERMO_SIZES;
          }

          let price = Number(p.price || p.precio || 0);

          if (!price && category === 'catalog') {
            price = getBasePriceByShirtMode(shirtMode, priceBasic, priceOversize, priceCropTop, priceBoxyFit);
          }

          if (!price && category === 'hoodies') {
            price = 28.99;
          }

          if (!price && category === 'extras') {
            price = 14.99;
          }

          return {
            id: String(p.id || p.uuid || p.slug || `local-${index + 1}`),
            title,
            character,
            anime: category === 'extras' ? 'Exclusivos' : anime,
            badge,
            image,
            category,
            productType,
            shirtMode,
            adminTypes,
            price,
            priceBasic,
            priceOversize,
            priceCropTop,
            priceBoxyFit,
            priceBoxyFitPlus,
            priceHoodieXL,
            priceHoodie2XL,
            priceCustom: Number(p.price_custom || p.priceCustom || 0),
            capacity,
            customDesign: p.custom_design === true || p.customDesign === true,
            designTitle: p.design_title || p.designTitle || '',
            active: p.active === false || p.activo === false ? false : true,
            orderIndex: Number(p.order_index || p.orden || index + 1),
            colors,
            sizes,
          };
        })
        .filter((p) => p.active)
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

        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    }

    function normalizeMode(value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[+|,/]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/-/g, '_')
        .replace(/boxy_fit/g, 'boxyfit')
        .replace(/crop_top/g, 'croptop')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    function getAdminTypesFromRawProduct(product = {}) {
      const sources = [
        product.type_options,
        product.types,
        product.available_types,
        product.product_types,
        product.tipo_camisa,
        product.shirt_mode,
        product.shirtMode,
        product.product_type,
        product.productType,
        product.type,
      ];

      const found = [];

      const addFromValue = (value) => {
        if (!value) return;

        if (Array.isArray(value)) {
          value.forEach(addFromValue);
          return;
        }

        const raw = String(value || '').trim();

        if (!raw) return;

        try {
          const parsed = JSON.parse(raw);

          if (Array.isArray(parsed)) {
            parsed.forEach(addFromValue);
            return;
          }
        } catch (_) {}

        const text = normalize(raw).replace(/[-_+|,/]/g, ' ');
        const mode = normalizeMode(raw);

        if (text.includes('basic') || text.includes('basica')) found.push('basic');
        if (text.includes('oversize')) found.push('oversize');
        if (text.includes('boxy')) found.push('boxyfit');
        if (text.includes('crop')) found.push('croptop');

        if (SHIRT_MODE_TYPES[mode]) found.push(...SHIRT_MODE_TYPES[mode]);
        if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(mode)) found.push(mode);
      };

      sources.forEach(addFromValue);

      return [...new Set(found.filter((type) => ['basic', 'oversize', 'croptop', 'boxyfit'].includes(type)))];
    }

    function getShirtModeFromTypes(types) {
      const list = Array.isArray(types) ? [...new Set(types)] : [];

      if (list.includes('basic') && list.includes('oversize') && list.includes('boxyfit')) {
        return 'basic_oversize_boxyfit';
      }

      if (list.includes('basic') && list.includes('boxyfit')) return 'basic_boxyfit';
      if (list.includes('oversize') && list.includes('boxyfit')) return 'oversize_boxyfit';
      if (list.includes('basic') && list.includes('oversize')) return 'both';

      return list[0] || 'basic';
    }

    function getTypesFromShirtMode(mode) {
      const normalizedMode = normalizeMode(mode || 'basic');

      if (SHIRT_MODE_TYPES[normalizedMode]) {
        return SHIRT_MODE_TYPES[normalizedMode];
      }

      if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(normalizedMode)) {
        return [normalizedMode];
      }

      return ['basic'];
    }

    function getDefaultSizesByShirtMode(mode) {
      const types = getTypesFromShirtMode(mode);
      const merged = [];

      types.forEach((type) => {
        const sizes = SHIRT_TYPE_SIZES[type] || SHIRT_SIZES;

        sizes.forEach((size) => {
          if (!merged.includes(size)) {
            merged.push(size);
          }
        });
      });

      return merged.length ? merged : SHIRT_SIZES;
    }

    function getBasePriceByShirtMode(
      mode,
      priceBasic = 17.0,
      priceOversize = 19.99,
      priceCropTop = 12.99,
      priceBoxyFit = 22.0
    ) {
      const normalizedMode = normalizeMode(mode);

      if (normalizedMode === 'croptop') return priceCropTop || 12.99;
      if (normalizedMode === 'boxyfit') return priceBoxyFit || 22.0;
      if (normalizedMode === 'oversize') return priceOversize || 19.99;

      return priceBasic || 17.0;
    }

    function detectProductCategory(product) {
      const raw = normalize(product.rawCategory);
      const text = normalize(`${product.rawCategory} ${product.title} ${product.anime} ${product.badge}`);

      if (
        raw === 'hoodie' ||
        raw === 'hoodies' ||
        raw.includes('hoodie') ||
        raw.includes('sudadera') ||
        HOODIE_WORDS.some((word) => text.includes(normalize(word)))
      ) {
        return 'hoodies';
      }

      if (
        raw === 'termo' ||
        raw === 'termos' ||
        raw === 'extra' ||
        raw === 'extras' ||
        raw.includes('termo') ||
        EXTRAS_WORDS.some((word) => text.includes(normalize(word)))
      ) {
        return 'extras';
      }

      if (
        raw === 'camisa' ||
        raw === 'camiseta' ||
        raw === 'basic' ||
        raw === 'oversize' ||
        raw === 'croptop' ||
        raw === 'crop_top' ||
        raw === 'crop top' ||
        raw === 'boxyfit' ||
        raw === 'boxy_fit' ||
        raw === 'boxy fit' ||
        raw === 'catalog' ||
        raw === 'catalogo' ||
        raw.includes('camisa') ||
        raw.includes('camiseta') ||
        raw.includes('croptop') ||
        raw.includes('crop top') ||
        raw.includes('boxyfit') ||
        raw.includes('boxy fit')
      ) {
        return 'catalog';
      }

      return 'catalog';
    }

    function resolveAssetUrl(url) {
      if (!url) return '';
      const value = String(url).trim();
      if (!value) return '';
      if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
      if (value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) return value;
      return `./${value}`;
    }

    function bindHeroImageFallbacks() {
      $$('.hero-main-image').forEach((img, index) => {
        const defaultFallback = `./assets/assetshero-${index + 1}.png`;
        if (!img.dataset.fallback) img.dataset.fallback = defaultFallback;
        if (img.dataset.fallbackBound === 'true') return;
        img.dataset.fallbackBound = 'true';
        img.addEventListener('error', () => {
          if (img.dataset.triedFallback === 'true') return;
          img.dataset.triedFallback = 'true';
          img.src = img.dataset.fallback || defaultFallback;
        });
      });
    }

    function setHeroImageSafely(img, url) {
      if (!img || !url) return;
      const nextUrl = resolveAssetUrl(url);
      if (!nextUrl) return;
      const fallback = img.dataset.fallback || './assets/assetshero-1.png';
      const probe = new Image();
      probe.onload = () => {
        img.dataset.triedFallback = 'false';
        img.src = nextUrl;
      };
      probe.onerror = () => {
        img.dataset.triedFallback = 'true';
        img.src = fallback;
      };
      probe.src = nextUrl;
    }

    function applySettings() {
      const title = $('.hero h1');

      if (title) {
        title.innerHTML = `${escapeHTML(BC.settings.heroTitlePrefix)}<span class="gradient">${escapeHTML(
          BC.settings.heroTitleAccent
        )}</span>`;
      }

      const subline = $('.hero-subline');

      if (subline && BC.settings.heroSubtitle) {
        subline.textContent = BC.settings.heroSubtitle;
      }

      const badges = $$('.hero-badges span');

      badges.forEach((badge, index) => {
        if (BC.settings.heroBadges?.[index]) {
          badge.textContent = BC.settings.heroBadges[index];
        }
      });

      bindHeroImageFallbacks();

      if (BC.settings.heroImage) {
        const firstHero = $('.hero-slide.active img') || $('.hero-main-image');
        setHeroImageSafely(firstHero, BC.settings.heroImage);
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

    function bindSeriesDragScroll() {
      const reel = document.getElementById('seriesReel');

      if (!reel) return;

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasDragged = false;

      reel.addEventListener('mousedown', (event) => {
        isDown = true;
        hasDragged = false;
        reel.classList.add('dragging');
        startX = event.pageX - reel.offsetLeft;
        scrollLeft = reel.scrollLeft;
      });

      reel.addEventListener('mouseleave', () => {
        isDown = false;
        reel.classList.remove('dragging');
      });

      reel.addEventListener('mouseup', () => {
        isDown = false;

        setTimeout(() => {
          hasDragged = false;
        }, 0);

        reel.classList.remove('dragging');
      });

      reel.addEventListener('mousemove', (event) => {
        if (!isDown) return;

        event.preventDefault();

        const x = event.pageX - reel.offsetLeft;
        const walk = (x - startX) * 1.35;

        if (Math.abs(walk) > 5) {
          hasDragged = true;
        }

        reel.scrollLeft = scrollLeft - walk;
      });

      reel.addEventListener(
        'click',
        (event) => {
          if (!hasDragged) return;

          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
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

      $$('.drawer-links a, .bottom-app-nav a, .nav-links a, .hero-actions a, .promo-pack-actions a').forEach(
        (link) => {
          link.addEventListener('click', (event) => {
            const href = link.getAttribute('href') || '';

            if (href === '#catalogo') {
              event.preventDefault();
              showCatalog(true);

              if (link.closest('#mobileDrawer')) {
                closeDrawer(true);
              }

              return;
            }

            if (link.closest('#mobileDrawer')) {
              closeDrawer(true);
            }
          });
        }
      );

      $$('[data-line]').forEach((button) => {
        button.addEventListener('click', (event) => {
          const line = button.dataset.line;

          if (line === 'hoodie') {
            showHoodies(true);
          }

          if (line === 'extra') {
            showExtras(true);
          }

          if (line === 'croptop') {
            showCatalogSearch('croptop', true);
          }

          if (line === 'boxyfit') {
            showCatalogSearch('boxyfit', true);
          }

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
        el.seriesReel?.scrollBy({
          left: -320,
          behavior: 'smooth',
        });
      });

      $('#seriesNext')?.addEventListener('click', () => {
        el.seriesReel?.scrollBy({
          left: 320,
          behavior: 'smooth',
        });
      });

      el.search?.addEventListener('input', () => {
        BC.search = el.search.value.trim();
        renderCatalog();
      });

      $('#cartToggle')?.addEventListener('click', openCart);
      $('#bottomCartBtn')?.addEventListener('click', openCart);
      $('#cartClose')?.addEventListener('click', closePanels);
      $('#checkoutBtn')?.addEventListener('click', sendCartToWhatsApp);
      $('#clubTrigger')?.addEventListener('click', () => {
        if (BC.settings?.leadPopupEnabled !== true) return;
        localStorage.removeItem(BC_NEWSLETTER.leadKey);
        localStorage.removeItem(BC_NEWSLETTER.dismissedKey);
        document.getElementById('bcClubPopup')?.remove();
        initNewsletterPopup();
        setTimeout(() => document.getElementById('bcClubPopup')?.classList.add('show'), 30);
      });

      el.backdrop?.addEventListener('click', closePanels);

      $('#modalClose')?.addEventListener('click', closeModal);
      $('#qtyMinus')?.addEventListener('click', () => changeQty(-1));
      $('#qtyPlus')?.addEventListener('click', () => changeQty(1));

      el.addToCartBtn?.addEventListener('click', addSelectedToCart);
      el.buyNowBtn?.addEventListener('click', buySelectedNow);

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closePanels();
        }
      });
    }

    function showCatalog(scroll = true) {
      BC.view = 'catalog';
      BC.activeAnime = 'all';

      if (el.search) {
        el.search.value = '';
      }

      BC.search = '';

      setLineActive('catalog');
      updateCatalogHeader();
      renderSeries();
      renderCatalog();

      if (scroll) {
        scrollToCatalog();
      }
    }

    function showCatalogSearch(term, scroll = true) {
      BC.view = 'catalog';
      BC.activeAnime = 'all';
      BC.search = term || '';

      if (el.search) {
        el.search.value = term || '';
      }

      setLineActive(term);
      updateCatalogHeader();
      renderSeries();
      renderCatalog();

      if (scroll) {
        scrollToCatalog();
      }
    }

    function showHoodies(scroll = true) {
      BC.view = 'hoodies';
      BC.activeAnime = 'all';

      if (el.search) {
        el.search.value = '';
      }

      BC.search = '';

      setLineActive('hoodies');
      updateCatalogHeader();
      renderSeries();
      renderCatalog();

      if (scroll) {
        scrollToCatalog();
      }
    }

    function showExtras(scroll = true) {
      BC.view = 'extras';
      BC.activeAnime = 'all';

      if (el.search) {
        el.search.value = '';
      }

      BC.search = '';

      setLineActive('extras');
      updateCatalogHeader();
      renderSeries();
      renderCatalog();

      if (scroll) {
        scrollToCatalog();
      }
    }

    function setLineActive(view) {
      $$('.special-card').forEach((card) => {
        card.classList.remove('active-line');
      });

      if (view === 'hoodies') {
        $('.hoodie-card')?.classList.add('active-line');
      }

      if (view === 'extras') {
        $('.extras-card')?.classList.add('active-line');
      }

      if (view === 'croptop') {
        $('.croptop-card')?.classList.add('active-line');
      }

      if (view === 'boxyfit') {
        $('.boxyfit-card')?.classList.add('active-line');
      }
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
        backRow.innerHTML =
          '<button class="catalog-back-btn" type="button" aria-label="Regresar al catálogo total">← Atrás</button>';

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

      if (BC.search && normalize(BC.search).includes('croptop')) {
        if (eyebrow) eyebrow.textContent = 'Nueva línea BlackCat';
        if (title) title.textContent = 'Crop Tops';
        backRow.style.display = 'flex';
        return;
      }

      if (BC.search && normalize(BC.search).includes('boxyfit')) {
        if (eyebrow) eyebrow.textContent = 'Nueva línea BlackCat';
        if (title) title.textContent = 'Boxy Fit';
        backRow.style.display = 'flex';
        return;
      }

      if (eyebrow) eyebrow.textContent = 'Catálogo BlackCat';
      if (title) title.textContent = 'Elige tu diseño';

      backRow.style.display = BC.activeAnime !== 'all' || BC.search ? 'flex' : 'none';
    }

    function updateSeriesSectionVisibility() {
      const section = $('#categorias');

      if (!section) return;

      const hideForSpecialLine = BC.view !== 'catalog';

      section.style.display = hideForSpecialLine ? 'none' : '';

      if (hideForSpecialLine) {
        if (el.seriesReel) el.seriesReel.innerHTML = '';
        if (el.filterChips) el.filterChips.innerHTML = '';
      }
    }

    function renderSeries() {
      updateSeriesSectionVisibility();

      if (BC.view !== 'catalog') return;

      const series = getAvailableSeries();

      if (el.filterChips) {
        el.filterChips.innerHTML = [
          `<button class="filter ${BC.activeAnime === 'all' ? 'active' : ''}" type="button" data-anime="all">Todos</button>`,
          ...series.map(
            (s) => `
              <button class="filter ${sameFilter(s.name, BC.activeAnime) ? 'active' : ''}" type="button" data-anime="${escapeAttr(
              s.name
            )}">
                ${escapeHTML(s.name)}
              </button>
            `
          ),
        ].join('');

        $$('[data-anime]', el.filterChips).forEach((btn) => {
          btn.addEventListener('click', () => setAnime(btn.dataset.anime));
        });
      }

      if (!el.seriesReel) return;

      el.seriesReel.innerHTML = series
        .map(
          (s) => `
            <button class="category-card category-filter-card ${sameFilter(s.name, BC.activeAnime) ? 'active' : ''}" type="button" data-anime="${escapeAttr(
            s.name
          )}" data-badge="${escapeAttr(s.badge)}">
              <div class="category-bg">
                <img src="${escapeAttr(s.image)}" alt="${escapeAttr(s.name)}" loading="lazy" decoding="async">
              </div>

              <div class="category-card-content">
                <small>Serie</small>
                <h3>${escapeHTML(s.name)}</h3>
                <span class="category-count">${s.count} diseño${s.count === 1 ? '' : 's'}</span>
              </div>
            </button>
          `
        )
        .join('');

      $$('[data-anime]', el.seriesReel).forEach((btn) => {
        btn.addEventListener('click', () => setAnime(btn.dataset.anime));
      });

      const clear = $('.series-clear');

      if (clear) {
        clear.classList.toggle('active', BC.activeAnime === 'all');
      }
    }

    function setAnime(anime) {
      BC.activeAnime = anime === 'all' ? 'all' : anime;

      renderSeries();
      renderCatalog();
      updateCatalogHeader();
      scrollToCatalog();
    }

    function getAvailableSeries() {
      const source = BC.products.filter((product) => product.category === 'catalog');
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
      if (BC.view === 'hoodies') {
        return BC.products.filter((p) => p.category === 'hoodies');
      }

      if (BC.view === 'extras') {
        return BC.products.filter((p) => p.category === 'extras');
      }

      return BC.products.filter((p) => p.category === 'catalog');
    }

    function getVisibleProducts() {
      const search = normalize(BC.search);

      return getProductsByView().filter((p) => {
        const matchesAnime = BC.activeAnime === 'all' || sameFilter(p.anime, BC.activeAnime);

        const typeLabels = getTypesForProduct(p)
          .map((type) => getTypeLabel(type))
          .join(' ');

        const haystack = normalize(
          `${p.title} ${p.character} ${p.anime} ${p.badge} ${p.productType} ${p.shirtMode} ${typeLabels}`
        );

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
      ]
        .filter(Boolean)
        .join(' ');

      const categoryLabel =
        product.category === 'hoodies' ? 'HOODIE' : product.category === 'extras' ? 'EXCLUSIVO' : product.anime;

      const commerceLabel =
        product.category === 'hoodies'
          ? 'Hoodie'
          : product.category === 'extras'
            ? product.capacity || 'Producto'
            : getTypesForProduct(product).map(getTypeLabel).join(' / ');

      const priceLabel =
        product.category === 'hoodies'
          ? `desde ${MONEY.format(Number(product.price || 28.99))}`
          : product.category === 'extras'
            ? MONEY.format(Number(product.price || 0))
            : `desde ${MONEY.format(getLowestShirtPrice(product))}`;

      return `
        <article class="${cardClasses}" data-id="${escapeAttr(product.id)}">
          <button class="shirt-media" type="button" aria-label="Ver ${escapeAttr(product.title)}">
            <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)} ${escapeAttr(product.anime)}" loading="lazy" decoding="async">
            <span class="shirt-badge">${escapeHTML(product.badge || 'NEW')}</span>
          </button>

          <div class="shirt-body">
            <div class="card-title-block">
              <span class="mini-badge">${escapeHTML(categoryLabel)}</span>
              <h3>${escapeHTML(product.title)}</h3>
              <p>${escapeHTML(product.designTitle || product.character || product.anime || 'BlackCat')}</p>
            </div>

            <div class="card-commerce">
              <strong>${priceLabel}</strong>
              <span>${escapeHTML(commerceLabel)}</span>
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
      const message =
        BC.view === 'hoodies'
          ? 'Aún no hay hoodies cargadas en esta categoría. Cuando agregues productos tipo hoodie aparecerán aquí automáticamente.'
          : BC.view === 'extras'
            ? 'Aún no hay productos nuevos o exclusivos cargados. Cuando los agregues desde el admin aparecerán aquí automáticamente.'
            : 'No hay diseños disponibles con este filtro.';

      return `
        <div class="panel empty-state">
          <strong>${message}</strong>
          ${
            BC.view !== 'catalog' || BC.activeAnime !== 'all' || BC.search
              ? '<button class="btn-card primary empty-back-btn" type="button">Regresar al catálogo</button>'
              : ''
          }
        </div>
      `;
    }

    function getTypesForProduct(product) {
      if (!product) return ['basic'];

      if (product.category === 'hoodies') return ['hoodie'];
      if (product.category === 'extras') return ['producto'];

      if (Array.isArray(product.adminTypes) && product.adminTypes.length) {
        return product.adminTypes;
      }

      const fromRaw = getAdminTypesFromRawProduct(product);

      if (fromRaw.length) {
        return fromRaw;
      }

      const mode = normalizeMode(product.shirtMode || product.productType || 'basic');

      if (SHIRT_MODE_TYPES[mode]) return SHIRT_MODE_TYPES[mode];

      if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(mode)) {
        return [mode];
      }

      return ['basic'];
    }

    function getTypeLabel(type) {
      const found = PRODUCT_TYPES.find((item) => item.key === type);

      if (found) return found.label;

      if (type === 'hoodie') return 'Hoodie';
      if (type === 'termo' || type === 'producto') return 'Producto';
      if (type === 'personalizado') return 'Personalizado';

      return type || 'Producto';
    }

    function getSizesForType(product, type) {
      if (!product) return [];

      if (product.category === 'hoodies') {
        return product.sizes?.length ? product.sizes : HOODIE_SIZES;
      }

      if (product.category === 'extras') {
        return product.sizes?.length ? product.sizes : product.capacity ? [product.capacity] : TERMO_SIZES;
      }

      const base = SHIRT_TYPE_SIZES[type] || SHIRT_SIZES;
      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];

      if (!productSizes.length) return base;

      const filtered = base.filter((size) => productSizes.includes(size));

      return filtered.length ? filtered : base;
    }

    function getLowestShirtPrice(product) {
      const types = getTypesForProduct(product);
      const prices = [];

      types.forEach((type) => {
        const sizes = getSizesForType(product, type);

        sizes.forEach((size) => {
          prices.push(getUnitPriceForVariant(product, type, size));
        });
      });

      const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0);

      if (!validPrices.length) return Number(product.price || 17.0);

      return Math.min(...validPrices);
    }

    function getMoneyValue(value, fallback = 0) {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : fallback;
    }

    function roundMoney(value) {
      return Math.round((Number(value) || 0) * 100) / 100;
    }

    function getUnitPriceForVariant(product, type, size) {
      if (!product) return 0;

      const selectedType = String(type || '').toLowerCase();
      const selectedSize = String(size || '').toUpperCase();

      // Hoodies: precio por talla. Si el admin cambia el precio base, se mantiene la diferencia por talla.
      if (product.category === 'hoodies' || selectedType === 'hoodie') {
        const base = getMoneyValue(product.price, HOODIE_SIZE_PRICES.L || 28.99);

        if (selectedSize === 'XL') {
          return getMoneyValue(product.priceHoodieXL, roundMoney(base + ((HOODIE_SIZE_PRICES.XL || 34) - (HOODIE_SIZE_PRICES.L || 28.99))));
        }

        if (selectedSize === '2XL') {
          return getMoneyValue(product.priceHoodie2XL, roundMoney(base + ((HOODIE_SIZE_PRICES['2XL'] || 35.99) - (HOODIE_SIZE_PRICES.L || 28.99))));
        }

        return base;
      }

      // Productos nuevos/exclusivos: precio fijo por producto. Color/presentación no altera el costo.
      if (product.category === 'extras' || selectedType === 'termo' || selectedType === 'producto' || selectedType === 'personalizado') {
        return getMoneyValue(product.price, getMoneyValue(product.priceCustom, 14.99));
      }

      // Basic BlackCat: respeta precio Basic del admin y aplica diferencia por talla plus.
      if (selectedType === 'basic') {
        const base = getMoneyValue(product.priceBasic, getMoneyValue(product.price, 17.0));
        if (selectedSize === '2XL') return roundMoney(base + 2.99);
        if (selectedSize === '3XL') return roundMoney(base + 8.99);
        return base;
      }

      // Oversize BlackCat: respeta precio Oversize del admin y aplica diferencia por talla plus.
      if (selectedType === 'oversize') {
        const base = getMoneyValue(product.priceOversize, getMoneyValue(product.price, 19.99));
        if (selectedSize === 'XL') return roundMoney(base + 3.0);
        if (selectedSize === '2XL') return roundMoney(base + 6.0);
        if (selectedSize === '3XL') return roundMoney(base + 9.0);
        return base;
      }

      // Boxy Fit BlackCat: respeta precio S-L y precio XL-2XL del admin.
      if (selectedType === 'boxyfit') {
        const base = getMoneyValue(product.priceBoxyFit, getMoneyValue(product.priceBasic, getMoneyValue(product.price, 22.0)));
        const plus = getMoneyValue(product.priceBoxyFitPlus, 25.0);
        if (selectedSize === 'XL' || selectedSize === '2XL') return plus;
        return base;
      }

      // Crop Top: respeta precio Crop Top del admin.
      if (selectedType === 'croptop') {
        return getMoneyValue(product.priceCropTop, getMoneyValue(product.price, getMoneyValue(product.priceBasic, 12.99)));
      }

      return getMoneyValue(product.price, 0);
    }

    function openProduct(product) {
      BC.selectedProduct = product;

      const firstType =
        product.category === 'hoodies'
          ? 'hoodie'
          : product.category === 'extras'
            ? product.customDesign
              ? 'personalizado'
              : 'producto'
            : getTypesForProduct(product)[0] || 'basic';

      const sizes = getSizesForType(product, firstType);

      BC.selectedVariant = {
        type: firstType,
        size: sizes[0] || '',
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

      if (el.modalSubtitle) {
        el.modalSubtitle.textContent = `${product.anime}${product.character ? ' · ' + product.character : ''}`;
      }

      updateModalOptionLabels(product);
      renderTypeChoices(product);
      renderSizeChoices(product);
      renderColorChoices(product);

      if (el.qtyValue) {
        el.qtyValue.textContent = BC.selectedVariant.qty;
      }

      if (el.modalPrice) {
        const unitPrice = getSelectedUnitPrice();
        const total = unitPrice * BC.selectedVariant.qty;

        el.modalPrice.textContent = `${MONEY.format(unitPrice)} c/u · Total ${MONEY.format(total)}`;
      }

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
        if (sizeLabel) sizeLabel.textContent = 'Presentación';
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
        const label = product.customDesign ? 'Personalizado' : 'Producto';

        el.typeChoices.innerHTML = `<button class="choice active" type="button" data-type="${product.customDesign ? 'personalizado' : 'producto'}">${escapeHTML(
          label
        )}</button>`;

        BC.selectedVariant.type = product.customDesign ? 'personalizado' : 'producto';
        return;
      }

      const availableTypeKeys = getTypesForProduct(product);
      const availableTypes = PRODUCT_TYPES.filter((type) => availableTypeKeys.includes(type.key));

      if (!availableTypeKeys.includes(BC.selectedVariant.type)) {
        BC.selectedVariant.type = availableTypeKeys[0] || 'basic';
      }

      el.typeChoices.innerHTML = availableTypes
        .map(
          (type) => `
            <button class="choice ${BC.selectedVariant.type === type.key ? 'active' : ''}" type="button" data-type="${type.key}">
              ${escapeHTML(type.label)}
            </button>
          `
        )
        .join('');

      $$('[data-type]', el.typeChoices).forEach((btn) => {
        btn.addEventListener('click', () => {
          BC.selectedVariant.type = btn.dataset.type;

          const sizes = getSizesForType(product, BC.selectedVariant.type);

          if (!sizes.includes(BC.selectedVariant.size)) {
            BC.selectedVariant.size = sizes[0] || '';
          }

          renderModal();
        });
      });
    }

    function renderSizeChoices(product) {
      if (!el.sizeChoices) return;

      const sizes = getSizesForType(product, BC.selectedVariant.type);

      if (!sizes.includes(BC.selectedVariant.size)) {
        BC.selectedVariant.size = sizes[0] || '';
      }

      el.sizeChoices.innerHTML = sizes
        .map(
          (size) => `
            <button class="choice ${BC.selectedVariant.size === size ? 'active' : ''}" type="button" data-size="${escapeAttr(size)}">
              ${escapeHTML(size)}
            </button>
          `
        )
        .join('');

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

      el.colorChoices.innerHTML = availableColors
        .map(
          (color) => `
            <button class="choice ${sameFilter(BC.selectedVariant.color, color.name) ? 'active' : ''}" type="button" data-color="${escapeAttr(
            color.name
          )}" style="--swatch:${color.value}">
              <span class="color-dot" aria-hidden="true"></span>
              <span class="color-name">${escapeHTML(color.name)}</span>
            </button>
          `
        )
        .join('');

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

      if (sourceColors.length) {
        return sourceColors.map(colorToOption).filter(Boolean);
      }

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

      return {
        name,
        value,
      };
    }

    function changeQty(delta) {
      BC.selectedVariant.qty = Math.max(1, Math.min(20, BC.selectedVariant.qty + delta));
      renderModal();
    }

    function getSelectedUnitPrice() {
      return getUnitPriceForVariant(BC.selectedProduct, BC.selectedVariant.type, BC.selectedVariant.size);
    }

    function addSelectedToCart() {
      const product = BC.selectedProduct;

      if (!product) return;

      const item = buildCartItem(product);
      const existing = BC.cart.find((entry) => entry.key === item.key);

      if (existing) {
        existing.qty += item.qty;
      } else {
        BC.cart.push(item);
      }

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
        typeLabel: getTypeLabel(BC.selectedVariant.type),
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

      el.cartItems.innerHTML = BC.cart
        .map(
          (item) => `
            <article class="cart-item" data-key="${escapeAttr(item.key)}">
              <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" decoding="async">

              <div class="cart-info">
                <strong>${escapeHTML(item.title)}</strong>
                <span class="cart-meta">${escapeHTML(getCartCategoryLabel(item))} · ${escapeHTML(
            item.typeLabel || item.type
          )} · ${escapeHTML(item.size)} · ${escapeHTML(item.color)}</span>
                <b class="cart-line-price">${MONEY.format(item.unitPrice * item.qty)}</b>
              </div>

              <div class="qty-mini">
                <button type="button" data-cart="minus">−</button>
                <span>${item.qty}</span>
                <button type="button" data-cart="plus">+</button>
              </div>

              <button class="cart-remove" type="button" data-cart="remove">×</button>
            </article>
          `
        )
        .join('');

      $$('[data-cart]', el.cartItems).forEach((btn) => {
        btn.addEventListener('click', () => updateCart(btn.closest('.cart-item')?.dataset.key, btn.dataset.cart));
      });
    }

    function getCartCategoryLabel(item) {
      if (item.category === 'hoodies') return 'Hoodie';
      if (item.category === 'extras') return 'Producto';

      return 'Camiseta';
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
      const type =
        product.category === 'hoodies'
          ? 'hoodie'
          : product.category === 'extras'
            ? product.customDesign
              ? 'personalizado'
              : 'producto'
            : getTypesForProduct(product)[0] || 'basic';

      const size =
        product.category === 'extras'
          ? product.capacity || product.sizes?.[0] || '20oz'
          : product.category === 'hoodies'
            ? product.sizes?.[0] || 'L'
            : getSizesForType(product, type)[0] || 'Por confirmar';

      const item = {
        title: product.title,
        anime: product.anime,
        category: product.category,
        type,
        typeLabel: getTypeLabel(type),
        size,
        color: product.category === 'extras' ? getAvailableColors(product)[0]?.name || 'Por confirmar' : 'Por confirmar',
        qty: 1,
        unitPrice: getUnitPriceForVariant(product, type, size),
      };

      openWhatsApp(buildWhatsAppMessage([item]));
    }

    function sendCartToWhatsApp() {
      if (!BC.cart.length) return;

      openWhatsApp(buildWhatsAppMessage(BC.cart));
    }

    function buildWhatsAppMessage(items) {
      const lines = items.map((item, index) => {
        const category = item.category === 'hoodies' ? 'Hoodie' : item.category === 'extras' ? 'Producto exclusivo' : 'Camiseta';
        const typeText = item.typeLabel || getTypeLabel(item.type);

        return `${index + 1}. ${item.title} | ${category} | ${typeText} | Talla: ${item.size} | Color: ${item.color} | Cant: ${item.qty} | ${MONEY.format(
          item.unitPrice * item.qty
        )}`;
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

        slides.forEach((slide, i) => {
          slide.classList.toggle('active', i === BC.heroIndex);
        });

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === BC.heroIndex);
        });
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
      $('#catalogo')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
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



        /* Visual polish BlackCat */
        html, body{
          max-width:100%;
          overflow-x:hidden!important;
        }

        .shirt-card{
          transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease!important;
        }

        @media(hover:hover){
          .shirt-card:hover{
            transform:translateY(-5px)!important;
            box-shadow:0 22px 55px rgba(0,0,0,.38)!important;
            border-color:rgba(255,255,255,.18)!important;
          }
        }

        .shirt-badge,
        .mini-badge{
          letter-spacing:.02em!important;
        }

        .choice{
          transition:transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease!important;
        }

        .choice:hover{
          transform:translateY(-1px)!important;
        }

        .choice.active{
          border-color:rgba(255,255,255,.9)!important;
          box-shadow:0 0 0 3px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.18)!important;
        }

        #colorChoices .choice.active{
          box-shadow:0 0 0 3px rgba(34,197,94,.22), inset 0 1px 0 rgba(255,255,255,.18)!important;
        }

        .color-dot{
          box-shadow:0 0 0 1px rgba(255,255,255,.32), inset 0 0 0 1px rgba(0,0,0,.16)!important;
        }

        .modal-media img,
        #modalImage{
          object-fit:cover!important;
          object-position:center!important;
          background:#111217!important;
        }

        .cart-panel{
          max-width:min(440px, calc(100vw - 18px))!important;
        }

        @media(max-width:720px){
          .shirt-grid,
          #shirtGrid{
            grid-template-columns:repeat(2, minmax(0, 1fr))!important;
            gap:12px!important;
          }

          .shirt-body{
            padding:12px!important;
          }

          .shirt-body h3{
            font-size:13px!important;
            line-height:1.05!important;
          }

          .card-title-block p,
          .card-commerce span{
            font-size:10px!important;
          }

          .card-commerce strong{
            font-size:12px!important;
          }

          .product-card-actions-v12{
            gap:7px!important;
          }

          .btn-card{
            min-height:34px!important;
            font-size:10px!important;
            padding-inline:8px!important;
          }

          .modal{
            width:calc(100vw - 18px)!important;
            max-height:92vh!important;
            overflow:auto!important;
          }

          .modal-media{
            max-height:48vh!important;
          }
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


    /* =====================================================
      BLACKCAT CLUB - POPUP DE FIDELIZACIÓN
      Guarda leads localmente y envía el correo automáticamente
      usando Supabase Edge Function + Resend.
    ===================================================== */

    const BC_NEWSLETTER = {
      coupon: 'BLACKCAT10',
      discountText: '10% OFF en tu primera compra',
      leadKey: 'blackcat_club_lead_v1',
      leadsKey: 'blackcat_club_leads_v1',
      dismissedKey: 'blackcat_club_dismissed_at_v1',
      dismissHours: 48,
    };

    function initNewsletterPopup() {
      if (BC.settings?.leadPopupEnabled !== true) return;
      if (document.getElementById('bcClubPopup')) return;

      const savedLead = localStorage.getItem(BC_NEWSLETTER.leadKey);
      if (savedLead) return;

      const dismissedAt = Number(localStorage.getItem(BC_NEWSLETTER.dismissedKey) || 0);
      const hoursSinceDismiss = dismissedAt ? (Date.now() - dismissedAt) / 36e5 : Infinity;

      if (hoursSinceDismiss < BC_NEWSLETTER.dismissHours) return;

      const popup = document.createElement('section');
      popup.id = 'bcClubPopup';
      popup.className = 'bc-club-popup';
      popup.setAttribute('aria-hidden', 'true');

      popup.innerHTML = `
        <div class="bc-club-backdrop" data-club-close></div>
        <form class="bc-club-card" id="bcClubForm" novalidate>
          <button class="bc-club-close" type="button" aria-label="Cerrar" data-club-close>×</button>
          <div class="bc-club-mark"><img src="./assets/logo-gato.png" alt="BlackCat" width="224" height="182" loading="lazy" decoding="async"></div>
          <p class="bc-club-kicker">Club BlackCat</p>
          <h2>Únete al drop antes que todos</h2>
          <p class="bc-club-copy">Regístrate y recibe <strong>${BC_NEWSLETTER.discountText}</strong>, acceso anticipado a nuevos diseños y promos por WhatsApp.</p>

          <div class="bc-club-grid">
            <label>
              <span>Nombre</span>
              <input name="firstName" type="text" autocomplete="given-name" placeholder="Tu nombre" required>
            </label>
            <label>
              <span>Apellido</span>
              <input name="lastName" type="text" autocomplete="family-name" placeholder="Tu apellido">
            </label>
          </div>

          <label>
            <span>Correo electrónico</span>
            <input name="email" type="email" autocomplete="email" placeholder="tunombre@email.com" required>
          </label>

          <button class="bc-club-submit" type="submit">Recibir mi código</button>

          <div class="bc-club-success" id="bcClubSuccess" hidden>
      <span>Código activado</span>
      <strong>${BC_NEWSLETTER.coupon}</strong>
      <div class="bc-club-actions">
        <button type="button" id="bcCopyCoupon">Copiar</button>
        <a id="bcClubWhatsApp" href="#" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>

          <p class="bc-club-note">Sin spam. Solo drops, promociones y novedades BlackCat. Puedes pedir baja por WhatsApp cuando quieras.</p>
        </form>
      `;

      document.body.appendChild(popup);

      const open = () => {
        popup.classList.add('show');
        popup.setAttribute('aria-hidden', 'false');
      };

      const close = () => {
        popup.classList.remove('show');
        popup.setAttribute('aria-hidden', 'true');
        localStorage.setItem(BC_NEWSLETTER.dismissedKey, String(Date.now()));
      };

      popup.querySelectorAll('[data-club-close]').forEach((node) => {
        node.addEventListener('click', close);
      });

      popup.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close();
      });

      const form = popup.querySelector('#bcClubForm');
      const success = popup.querySelector('#bcClubSuccess');
      const copyButton = popup.querySelector('#bcCopyCoupon');
      const waButton = popup.querySelector('#bcClubWhatsApp');

      form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const firstName = String(formData.get('firstName') || '').trim();
        const lastName = String(formData.get('lastName') || '').trim();
        const email = String(formData.get('email') || '').trim().toLowerCase();

        if (!firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          form.classList.add('has-error');
          return;
        }

        form.classList.remove('has-error');

        const lead = {
          firstName,
          lastName,
          email,
          coupon: BC_NEWSLETTER.coupon,
          source: 'blackcat_web_popup',
          createdAt: new Date().toISOString(),
        };

        saveNewsletterLeadLocal(lead);

        const emailWasSent = await syncNewsletterLead(lead);

        if (!emailWasSent) {
          console.warn('BlackCat Club: el lead quedó guardado localmente, pero el correo no pudo enviarse.');
        }

        const message = `Hola BlackCat, me registré al Club BlackCat. Mi código es ${BC_NEWSLETTER.coupon}. Quiero consultar diseños disponibles.`;
        if (waButton) waButton.href = `${whatsappBaseUrl()}?text=${encodeURIComponent(message)}`;

        success.hidden = false;
        form.classList.add('is-success');
      });

      copyButton?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(BC_NEWSLETTER.coupon);
          copyButton.textContent = 'Copiado';
          setTimeout(() => (copyButton.textContent = 'Copiar código'), 1400);
        } catch (_) {
          copyButton.textContent = BC_NEWSLETTER.coupon;
        }
      });

      setTimeout(open, 1800);
    }

    function saveNewsletterLeadLocal(lead) {
      localStorage.setItem(BC_NEWSLETTER.leadKey, JSON.stringify(lead));

      let leads = [];
      try {
        leads = JSON.parse(localStorage.getItem(BC_NEWSLETTER.leadsKey) || '[]');
      } catch (_) {
        leads = [];
      }

      leads.unshift(lead);
      localStorage.setItem(BC_NEWSLETTER.leadsKey, JSON.stringify(leads.slice(0, 100)));
    }

    async function syncNewsletterLead(lead) {
      if (!window.supabaseClient) {
        console.warn('BlackCat Club: Supabase no está conectado.');
        return false;
      }

      const firstName = String(lead?.firstName || '').trim();
      const lastName = String(lead?.lastName || '').trim();
      const email = String(lead?.email || '').trim().toLowerCase();

      if (!firstName || !email) {
        console.warn('BlackCat Club: faltan nombre o correo.');
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.warn('BlackCat Club: correo inválido.');
        return false;
      }

      try {
        const { data, error } = await window.supabaseClient.functions.invoke(
          'club-blackcat-email',
          {
            body: {
              first_name: firstName,
              last_name: lastName,
              email,
            },
          }
        );

        if (error) {
          console.warn('BlackCat Club: error al invocar la Edge Function.', error);
          return false;
        }

        if (!data || data.ok !== true) {
          console.warn('BlackCat Club: la función respondió, pero no confirmó envío.', data);
          return false;
        }

        console.log('BlackCat Club: correo enviado correctamente.', data);
        return true;
      } catch (error) {
        console.warn('BlackCat Club: no se pudo enviar el correo automático.', error);
        return false;
      }
    }
  function injectNewsletterStyles() {
    if (document.getElementById('blackcatClubStyles')) return;

    const style = document.createElement('style');
    style.id = 'blackcatClubStyles';

    style.textContent = `
      .bc-club-popup{
        position:fixed!important;
        inset:0!important;
        z-index:9999!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        opacity:0;
        visibility:hidden;
        pointer-events:none;
        transition:opacity .22s ease, visibility .22s ease!important;
      }

      .bc-club-popup.show{
        opacity:1!important;
        visibility:visible!important;
        pointer-events:auto!important;
      }

      .bc-club-backdrop{
        position:absolute!important;
        inset:0!important;
        background:rgba(0,0,0,.68)!important;
        backdrop-filter:blur(6px)!important;
      }

      .bc-club-card{
        position:relative!important;
        width:min(410px, 94vw)!important;
        max-height:88vh!important;
        overflow-y:auto!important;
        border:1px solid rgba(255,255,255,.14)!important;
        border-radius:24px!important;
        padding:22px!important;
        background:
          radial-gradient(circle at top left, rgba(192,132,252,.20), transparent 34%),
          linear-gradient(180deg, #17101f 0%, #08060d 100%)!important;
        box-shadow:0 24px 80px rgba(0,0,0,.55)!important;
        transform:translateY(10px) scale(.98)!important;
        transition:transform .22s ease!important;
      }

      .bc-club-popup.show .bc-club-card{
        transform:translateY(0) scale(1)!important;
      }

      .bc-club-close{
        position:absolute!important;
        top:12px!important;
        right:12px!important;
        width:32px!important;
        height:32px!important;
        border-radius:999px!important;
        border:1px solid rgba(255,255,255,.12)!important;
        background:rgba(255,255,255,.08)!important;
        color:#fff!important;
        font-size:20px!important;
        line-height:1!important;
        cursor:pointer!important;
      }

      .bc-club-mark{
        width:42px!important;
        height:42px!important;
        border-radius:14px!important;
        display:grid!important;
        place-items:center!important;
        margin:0 auto 8px!important;
        background:#fff!important;
      }

      .bc-club-mark img{
        max-width:30px!important;
        max-height:30px!important;
        object-fit:contain!important;
      }

      .bc-club-kicker{
        margin:0 0 5px!important;
        text-align:center!important;
        color:#c084fc!important;
        font-size:10px!important;
        font-weight:900!important;
        text-transform:uppercase!important;
        letter-spacing:.16em!important;
      }

      .bc-club-card h2{
        margin:0!important;
        text-align:center!important;
        font-size:23px!important;
        line-height:1.05!important;
        letter-spacing:-.04em!important;
      }

      .bc-club-copy{
        margin:8px 0 13px!important;
        text-align:center!important;
        color:rgba(255,255,255,.78)!important;
        font-size:12px!important;
        line-height:1.35!important;
      }

      .bc-club-grid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:9px!important;
      }

      .bc-club-card label{
        display:flex!important;
        flex-direction:column!important;
        gap:5px!important;
        margin-bottom:9px!important;
      }

      .bc-club-card label span{
        font-size:10px!important;
        font-weight:900!important;
        text-transform:uppercase!important;
        letter-spacing:.08em!important;
        color:rgba(255,255,255,.64)!important;
      }

      .bc-club-card input{
        width:100%!important;
        min-height:42px!important;
        border-radius:13px!important;
        border:1px solid rgba(255,255,255,.14)!important;
        background:rgba(255,255,255,.07)!important;
        color:#fff!important;
        padding:0 13px!important;
        outline:0!important;
        font-size:13px!important;
        box-sizing:border-box!important;
      }

      .bc-club-submit{
        width:100%!important;
        min-height:44px!important;
        border:0!important;
        border-radius:15px!important;
        color:#fff!important;
        background:linear-gradient(135deg,#d946ef 0%,#38bdf8 100%)!important;
        font-weight:950!important;
        cursor:pointer!important;
      }

      .bc-club-success{
        margin-top:12px!important;
        border:1px solid rgba(255,255,255,.18)!important;
        border-radius:18px!important;
        padding:12px!important;
        background:rgba(255,255,255,.08)!important;
        display:flex!important;
        flex-direction:column!important;
        gap:9px!important;
        text-align:center!important;
      }

      .bc-club-success[hidden]{
        display:none!important;
      }

      .bc-club-success span{
        color:rgba(255,255,255,.70)!important;
        font-size:10px!important;
        font-weight:900!important;
        text-transform:uppercase!important;
        letter-spacing:.14em!important;
      }

      .bc-club-success strong{
        display:block!important;
        font-size:23px!important;
        line-height:1!important;
        letter-spacing:.08em!important;
        color:#fff!important;
      }

      .bc-club-actions{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        width:100%!important;
      }

      .bc-club-success button,
      .bc-club-success a{
        min-height:36px!important;
        border-radius:999px!important;
        padding:0 12px!important;
        border:1px solid rgba(255,255,255,.16)!important;
        background:rgba(255,255,255,.10)!important;
        color:#fff!important;
        text-decoration:none!important;
        font-size:12px!important;
        font-weight:900!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        cursor:pointer!important;
        box-sizing:border-box!important;
      }

      .bc-club-success a{
        background:#16a34a!important;
        border-color:#22c55e!important;
      }

      .bc-club-note{
        margin:10px 0 0!important;
        text-align:center!important;
        color:rgba(255,255,255,.48)!important;
        font-size:9px!important;
        line-height:1.3!important;
      }

      @media(max-width:560px){
        .bc-club-popup{
          align-items:flex-end!important;
          padding:8px!important;
        }

        .bc-club-card{
          width:100%!important;
          max-height:86vh!important;
          padding:16px 15px 14px!important;
          border-radius:22px 22px 18px 18px!important;
        }

        .bc-club-card h2{
          font-size:20px!important;
        }

        .bc-club-copy{
          font-size:11px!important;
          margin-bottom:11px!important;
        }

        .bc-club-grid{
          grid-template-columns:1fr!important;
          gap:0!important;
        }

        .bc-club-card input{
          min-height:40px!important;
        }

        .bc-club-submit{
          min-height:42px!important;
        }

        .bc-club-success strong{
          font-size:21px!important;
        }

        .bc-club-note{
          font-size:8.5px!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  injectNewsletterStyles();


    window.showCatalog = showCatalog;
    window.showHoodies = showHoodies;
    window.showExtras = showExtras;

    window.showCategory = (category) => {
      const text = normalize(category);

      if (HOODIE_WORDS.some((word) => text.includes(normalize(word)))) {
        showHoodies(true);
      } else if (EXTRAS_WORDS.some((word) => text.includes(normalize(word)))) {
        showExtras(true);
      } else if (text.includes('croptop') || text.includes('crop top')) {
        showCatalogSearch('croptop', true);
      } else if (text.includes('boxyfit') || text.includes('boxy fit')) {
        showCatalogSearch('boxyfit', true);
      } else {
        showCatalog(true);
      }
    };

    window.setAnimeFilter = setAnime;
