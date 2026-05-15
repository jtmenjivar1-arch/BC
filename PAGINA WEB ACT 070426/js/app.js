/* =========================================================
   BLACKCAT FIX - VARIACIONES, PRECIOS Y OPCIONES ADMIN
   Pegar al final de app.js
   ========================================================= */

/**
 * Convierte textos como:
 * "Oversize + Boxy Fit"
 * "oversize_boxyfit"
 * "boxy fit"
 * "crop top"
 * en keys válidas para el sistema.
 */
function normalizeVariantKey(value) {
  const text = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '';

  if (text.includes('basic') || text.includes('basica') || text.includes('básica')) {
    return 'basic';
  }

  if (text.includes('oversize')) {
    return 'oversize';
  }

  if (text.includes('boxy')) {
    return 'boxyfit';
  }

  if (text.includes('crop')) {
    return 'croptop';
  }

  if (text.includes('hoodie') || text.includes('sudadera') || text.includes('sueter') || text.includes('suéter')) {
    return 'hoodie';
  }

  if (text.includes('termo') || text.includes('vaso') || text.includes('taza')) {
    return 'termo';
  }

  return text.replace(/\s+/g, '_');
}

/**
 * Lee arrays aunque vengan desde Supabase como:
 * ["Negro","Gris"]
 * Negro, Gris
 * Oversize + Boxy Fit
 * oversize_boxyfit
 */
function normalizeList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch (_) {}

    return trimmed
      .split(/,|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Detecta tipos seleccionados desde el admin.
 * Punto importante:
 * NO agrega basic automáticamente.
 */
function getAdminTypesFromProduct(product) {
  if (!product) return [];

  if (product.category === 'hoodies') return ['hoodie'];
  if (product.category === 'extras') return ['termo'];

  const rawValues = [
    product.type_options,
    product.types,
    product.available_types,
    product.product_types,
    product.tipo_camisa,
    product.shirtMode,
    product.shirt_mode,
    product.productType,
    product.product_type,
    product.type,
  ].filter((value) => value !== undefined && value !== null && value !== '');

  let foundTypes = [];

  rawValues.forEach((raw) => {
    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        const key = normalizeVariantKey(item);
        if (key) foundTypes.push(key);
      });

      return;
    }

    const text = String(raw || '').trim();

    if (!text) return;

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const key = normalizeVariantKey(item);
          if (key) foundTypes.push(key);
        });

        return;
      }
    } catch (_) {}

    const normalizedText = normalize(text)
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\+/g, ' ');

    if (normalizedText.includes('basic')) foundTypes.push('basic');
    if (normalizedText.includes('oversize')) foundTypes.push('oversize');
    if (normalizedText.includes('boxy')) foundTypes.push('boxyfit');
    if (normalizedText.includes('crop')) foundTypes.push('croptop');

    const mode = normalizeMode(text);

    if (SHIRT_MODE_TYPES[mode]) {
      foundTypes.push(...SHIRT_MODE_TYPES[mode]);
    } else if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(mode)) {
      foundTypes.push(mode);
    }
  });

  foundTypes = foundTypes.filter((type) =>
    ['basic', 'oversize', 'croptop', 'boxyfit', 'hoodie', 'termo', 'personalizado'].includes(type)
  );

  return [...new Set(foundTypes)];
}

/**
 * Reemplazo completo de normalizeProducts.
 * Respeta precio general del admin y variaciones seleccionadas.
 */
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

      const rawTypeSource =
        p.type_options ||
        p.types ||
        p.available_types ||
        p.product_types ||
        p.tipo_camisa ||
        p.shirt_mode ||
        p.shirtMode ||
        p.product_type ||
        p.productType ||
        p.type ||
        '';

      let shirtMode = normalizeMode(rawTypeSource || '');

      const temporaryProductForTypes = {
        ...p,
        category,
        shirtMode,
        shirt_mode: p.shirt_mode,
        productType: p.productType,
        product_type: p.product_type,
        type_options: p.type_options,
        types: p.types,
        available_types: p.available_types,
        product_types: p.product_types,
        tipo_camisa: p.tipo_camisa,
        type: p.type,
      };

      let adminTypes = getAdminTypesFromProduct(temporaryProductForTypes);

      if (!adminTypes.length && category === 'catalog') {
        adminTypes = ['basic'];
      }

      if (adminTypes.length) {
        if (adminTypes.includes('basic') && adminTypes.includes('oversize') && adminTypes.includes('boxyfit')) {
          shirtMode = 'basic_oversize_boxyfit';
        } else if (adminTypes.includes('basic') && adminTypes.includes('boxyfit')) {
          shirtMode = 'basic_boxyfit';
        } else if (adminTypes.includes('oversize') && adminTypes.includes('boxyfit')) {
          shirtMode = 'oversize_boxyfit';
        } else if (adminTypes.includes('basic') && adminTypes.includes('oversize')) {
          shirtMode = 'both';
        } else {
          shirtMode = adminTypes[0];
        }
      }

      const productType = normalizeMode(p.product_type || p.productType || '');

      const adminGeneralPrice = Number(
        p.price_general ||
          p.precio_general ||
          p.base_price ||
          p.precio ||
          p.price ||
          0
      );

      const priceBasic = Number(
        p.price_basic ||
          p.priceBasic ||
          adminGeneralPrice ||
          (shirtMode === 'croptop' ? 12.99 : shirtMode === 'boxyfit' ? 22.0 : 16.99)
      );

      const priceOversize = Number(
        p.price_oversize ||
          p.priceOversize ||
          adminGeneralPrice ||
          (shirtMode.includes('boxyfit') ? 25.0 : 19.99)
      );

      const capacity = p.capacity || p.capacidad || '';

      const colors = normalizeList(
        p.colors || p.colores || p.available_colors || p.color_options || p.color || p.availableColors
      );

      let sizes = normalizeList(
        p.sizes || p.tallas || p.available_sizes || p.size_options || p.availableSizes
      );

      if (!sizes.length && category === 'catalog') {
        sizes = getDefaultSizesByShirtMode(shirtMode);
      }

      if (!sizes.length && category === 'hoodies') {
        sizes = HOODIE_SIZES;
      }

      if (!sizes.length && category === 'extras') {
        sizes = capacity ? [capacity] : TERMO_SIZES;
      }

      let price = Number(adminGeneralPrice || 0);

      if (!price && category === 'catalog') {
        price = getBasePriceByShirtMode(shirtMode, priceBasic, priceOversize);
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
        anime: category === 'extras' ? 'Termos' : anime,
        badge,
        image,
        category,
        productType,
        shirtMode,
        adminTypes,
        price,
        priceBasic,
        priceOversize,
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

/**
 * Reemplazo de getTypesFromShirtMode.
 */
function getTypesFromShirtMode(mode) {
  const normalizedMode = normalizeMode(mode || '');

  if (SHIRT_MODE_TYPES[normalizedMode]) {
    return SHIRT_MODE_TYPES[normalizedMode];
  }

  if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(normalizedMode)) {
    return [normalizedMode];
  }

  return [];
}

/**
 * Reemplazo de getTypesForProduct.
 * Ya no devuelve basic si no está seleccionado.
 */
function getTypesForProduct(product) {
  if (!product) return [];

  if (product.category === 'hoodies') return ['hoodie'];
  if (product.category === 'extras') return ['termo'];

  if (Array.isArray(product.adminTypes) && product.adminTypes.length) {
    return product.adminTypes.filter((type) =>
      ['basic', 'oversize', 'croptop', 'boxyfit'].includes(type)
    );
  }

  const fromAdmin = getAdminTypesFromProduct(product);

  if (fromAdmin.length) {
    return fromAdmin.filter((type) =>
      ['basic', 'oversize', 'croptop', 'boxyfit'].includes(type)
    );
  }

  const mode = normalizeMode(product.shirtMode || product.productType || '');

  if (SHIRT_MODE_TYPES[mode]) return SHIRT_MODE_TYPES[mode];

  if (['basic', 'oversize', 'croptop', 'boxyfit'].includes(mode)) {
    return [mode];
  }

  return [];
}

/**
 * Reemplazo de getTypeLabel.
 */
function getTypeLabel(type) {
  const key = normalizeVariantKey(type);

  if (key === 'basic') return 'Basic';
  if (key === 'oversize') return 'Oversize';
  if (key === 'croptop') return 'Crop Top';
  if (key === 'boxyfit') return 'Boxy Fit';
  if (key === 'hoodie') return 'Hoodie';
  if (key === 'termo') return 'Termo';
  if (key === 'personalizado') return 'Personalizado';

  return type || 'Producto';
}

/**
 * Reemplazo de getDefaultSizesByShirtMode.
 */
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

/**
 * Reemplazo de getBasePriceByShirtMode.
 */
function getBasePriceByShirtMode(mode, priceBasic = 16.99, priceOversize = 19.99) {
  const normalizedMode = normalizeMode(mode);

  if (normalizedMode === 'croptop') return Number(priceBasic || 12.99);
  if (normalizedMode === 'boxyfit') return Number(priceBasic || 22.0);
  if (normalizedMode === 'oversize') return Number(priceOversize || 19.99);

  if (normalizedMode === 'oversize_boxyfit') {
    return Math.min(Number(priceOversize || 19.99), Number(priceBasic || 22.0));
  }

  if (normalizedMode === 'basic_boxyfit') {
    return Math.min(Number(priceBasic || 16.99), Number(priceOversize || 22.0));
  }

  if (normalizedMode === 'basic_oversize_boxyfit') {
    return Math.min(Number(priceBasic || 16.99), Number(priceOversize || 19.99));
  }

  if (normalizedMode === 'both') {
    return Math.min(Number(priceBasic || 16.99), Number(priceOversize || 19.99));
  }

  return Number(priceBasic || 16.99);
}

/**
 * Reemplazo de getSizesForType.
 * Respeta las tallas cargadas en el admin.
 */
function getSizesForType(product, type) {
  if (!product) return [];

  if (product.category === 'hoodies') {
    return product.sizes?.length ? product.sizes : HOODIE_SIZES;
  }

  if (product.category === 'extras') {
    return product.sizes?.length ? product.sizes : product.capacity ? [product.capacity] : TERMO_SIZES;
  }

  const key = normalizeVariantKey(type);
  const base = SHIRT_TYPE_SIZES[key] || SHIRT_SIZES;
  const productSizes = Array.isArray(product.sizes) ? product.sizes : [];

  if (!productSizes.length) return base;

  const filtered = base.filter((size) => productSizes.includes(size));

  return filtered.length ? filtered : productSizes;
}

/**
 * Reemplazo de getLowestShirtPrice.
 * Corrige el "desde $16.99".
 */
function getLowestShirtPrice(product) {
  const types = getTypesForProduct(product);
  const prices = [];

  if (!types.length) {
    return Number(product.price || 0);
  }

  types.forEach((type) => {
    const sizes = getSizesForType(product, type);

    sizes.forEach((size) => {
      prices.push(getUnitPriceForVariant(product, type, size));
    });
  });

  const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0);

  if (!validPrices.length) return Number(product.price || 0);

  return Math.min(...validPrices);
}

/**
 * Reemplazo de getUnitPriceForVariant.
 * Prioridad:
 * 1. Precio general del admin/producto.
 * 2. Reglas por talla solo cuando NO hay precio admin.
 * 3. Precios por defecto.
 */
function getUnitPriceForVariant(product, type, size) {
  if (!product) return 0;

  const key = normalizeVariantKey(type);
  const selectedSize = String(size || '').toUpperCase();

  if (product.category === 'hoodies' || key === 'hoodie') {
    return HOODIE_SIZE_PRICES[selectedSize] || Number(product.price || 28.99);
  }

  if (product.category === 'extras' || key === 'termo' || key === 'personalizado') {
    return Number(product.price || product.priceCustom || 14.99);
  }

  const hasAdminPrice = Number(product.price || 0) > 0;

  if (hasAdminPrice) {
    return Number(product.price);
  }

  if (key === 'basic') {
    if (selectedSize === 'XL') return 22.99;
    if (selectedSize === '2XL') return 23.99;
    if (selectedSize === '3XL') return 28.99;

    return Number(product.priceBasic || 16.99);
  }

  if (key === 'oversize') {
    if (selectedSize === 'XL') return 22.99;
    if (selectedSize === '2XL') return 23.99;
    if (selectedSize === '3XL') return 28.99;

    return Number(product.priceOversize || 19.99);
  }

  if (key === 'croptop') {
    return Number(product.priceBasic || 12.99);
  }

  if (key === 'boxyfit') {
    if (selectedSize === 'XL' || selectedSize === '2XL') {
      return Number(product.priceOversize || 25.0);
    }

    return Number(product.priceBasic || 22.0);
  }

  return Number(product.price || 0);
}

/**
 * Reemplazo de renderProductCard.
 * Muestra "desde" con el precio real calculado.
 */
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
    product.category === 'hoodies' ? 'HOODIE' : product.category === 'extras' ? 'TERMO' : product.anime;

  const typesForProduct = getTypesForProduct(product);

  const commerceLabel =
    product.category === 'hoodies'
      ? 'Hoodie'
      : product.category === 'extras'
        ? product.capacity || 'Termo'
        : typesForProduct.length
          ? typesForProduct.map(getTypeLabel).join(' / ')
          : 'Camisa';

  const priceLabel =
    product.category === 'hoodies'
      ? `desde ${MONEY.format(Number(product.price || 28.99))}`
      : product.category === 'extras'
        ? MONEY.format(Number(product.price || 0))
        : `desde ${MONEY.format(getLowestShirtPrice(product))}`;

  return `
    <article class="${cardClasses}" data-id="${escapeAttr(product.id)}">
      <button class="shirt-media" type="button" aria-label="Ver ${escapeAttr(product.title)}">
        <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)} ${escapeAttr(product.anime)}" loading="lazy">
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

/**
 * Reemplazo de openProduct.
 * Selecciona la primera variación válida, no basic por defecto.
 */
function openProduct(product) {
  BC.selectedProduct = product;

  const productTypes = getTypesForProduct(product);

  const firstType =
    product.category === 'hoodies'
      ? 'hoodie'
      : product.category === 'extras'
        ? product.customDesign
          ? 'personalizado'
          : 'termo'
        : productTypes[0] || '';

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

/**
 * Reemplazo de renderTypeChoices.
 * Solo muestra tipos activos desde admin.
 */
function renderTypeChoices(product) {
  if (!el.typeChoices) return;

  if (product.category === 'hoodies') {
    el.typeChoices.innerHTML = `<button class="choice active" type="button" data-type="hoodie">Hoodie</button>`;
    BC.selectedVariant.type = 'hoodie';
    return;
  }

  if (product.category === 'extras') {
    const label = product.customDesign ? 'Personalizado' : 'Termo';

    el.typeChoices.innerHTML = `<button class="choice active" type="button" data-type="${product.customDesign ? 'personalizado' : 'termo'}">${escapeHTML(
      label
    )}</button>`;

    BC.selectedVariant.type = product.customDesign ? 'personalizado' : 'termo';
    return;
  }

  const availableTypeKeys = getTypesForProduct(product);

  if (!availableTypeKeys.length) {
    el.typeChoices.innerHTML = '';
    BC.selectedVariant.type = '';
    return;
  }

  if (!availableTypeKeys.includes(BC.selectedVariant.type)) {
    BC.selectedVariant.type = availableTypeKeys[0];
  }

  el.typeChoices.innerHTML = availableTypeKeys
    .map(
      (type) => `
        <button class="choice ${BC.selectedVariant.type === type ? 'active' : ''}" type="button" data-type="${type}">
          ${escapeHTML(getTypeLabel(type))}
        </button>
      `
    )
    .join('');

  $$('[data-type]', el.typeChoices).forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedType = btn.dataset.type;

      if (!availableTypeKeys.includes(selectedType)) return;

      BC.selectedVariant.type = selectedType;

      const sizes = getSizesForType(product, BC.selectedVariant.type);

      if (!sizes.includes(BC.selectedVariant.size)) {
        BC.selectedVariant.size = sizes[0] || '';
      }

      renderModal();
    });
  });
}

/**
 * Reemplazo de sendProductQuickWhatsApp.
 * Usa primera variación válida y precio correcto.
 */
function sendProductQuickWhatsApp(product) {
  const productTypes = getTypesForProduct(product);

  const type =
    product.category === 'hoodies'
      ? 'hoodie'
      : product.category === 'extras'
        ? product.customDesign
          ? 'personalizado'
          : 'termo'
        : productTypes[0] || '';

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

/**
 * Re-render automático por si el catálogo ya estaba cargado
 * antes de pegar este bloque.
 */
try {
  if (Array.isArray(BC.products) && BC.products.length) {
    BC.products = normalizeProducts(BC.products);
    renderSeries();
    renderCatalog();
  }
} catch (error) {
  console.warn('BlackCat fix aplicado, pero no se pudo re-renderizar automáticamente:', error);
}
