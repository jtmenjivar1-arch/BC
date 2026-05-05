function requireAdminAccess() {
  const lock = document.getElementById('adminLock');
  const input = document.getElementById('adminPasswordInput');
  const btn = document.getElementById('adminLoginBtn');
  const error = document.getElementById('adminLoginError');

  if (!lock || !input || !btn) return;

  lock.style.display = 'flex';

  btn.onclick = () => {
    const pass = input.value.trim();

    if (pass === getAdminPassword()) {
      lock.style.display = 'none';
      setAdminAuthenticated(true);
      if (error) error.style.display = 'none';
    } else {
      if (error) error.style.display = 'block';
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btn.click();
    }
  });
}

function bindPasswordActions() {
  const changeBtn = document.getElementById('changePasswordBtn');
  const logoutBtn = document.getElementById('logoutAdminBtn');

  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      const nextInput = document.getElementById('newAdminPassword');
      const confirmInput = document.getElementById('confirmAdminPassword');

      const next = nextInput ? nextInput.value.trim() : '';
      const confirm = confirmInput ? confirmInput.value.trim() : '';

      if (!next || next.length < 4) {
        alert('Usa una contraseña de al menos 4 caracteres.');
        return;
      }

      if (next !== confirm) {
        alert('Las contraseñas no coinciden.');
        return;
      }

      setAdminPassword(next);

      if (nextInput) nextInput.value = '';
      if (confirmInput) confirmInput.value = '';

      alert('Contraseña actualizada.');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setAdminAuthenticated(false);
      window.location.reload();
    });
  }
}

const adminState = {
  data: {
    hero: {
      titlePrefix: '',
      titleAccent: '',
      subtitle: '',
      badges: ['', '', ''],
      image: ''
    },
    contacts: {
      whatsapp: '',
      instagram: '',
      tiktok: '',
      email: ''
    },
    products: []
  },
  selectedId: null
};

function normalizeAdminList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (_) {}

    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  return [];
}

function listToInput(value) {
  return normalizeAdminList(value).join(',');
}

function normalizeCategory(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (raw === 'hoodie' || raw === 'hoodies' || raw === 'sudadera' || raw === 'sudaderas') return 'hoodies';
  if (raw === 'extra' || raw === 'extras' || raw === 'termo' || raw === 'termos' || raw === 'accesorio' || raw === 'accesorios') return 'extras';

  return 'catalog';
}

function categoryLabel(category) {
  const value = normalizeCategory(category);

  if (value === 'hoodies') return 'Hoodie';
  if (value === 'extras') return 'Extra';

  return 'Camisa';
}

function defaultProductByCategory(category) {
  const type = normalizeCategory(category);

  if (type === 'hoodies') {
    return {
      price: 29.99,
      colors: ['Negro'],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      anime: 'BlackCat Collection'
    };
  }

  if (type === 'extras') {
    return {
      price: 14.99,
      colors: ['Negro', 'Blanco'],
      sizes: ['20oz'],
      anime: 'Termos'
    };
  }

  return {
    price: 16.99,
    colors: ['Negro', 'Blanco', 'Beige', 'Gris'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    anime: ''
  };
}

function ensureSelection() {
  if (!adminState.data.products.length) adminState.selectedId = null;

  if (!adminState.selectedId && adminState.data.products.length) {
    adminState.selectedId = adminState.data.products[0].id;
  }
}

function selectedProduct() {
  return adminState.data.products.find(p => String(p.id) === String(adminState.selectedId)) || null;
}

function setValue(id, value) {
  const input = document.getElementById(id);
  if (input) input.value = value ?? '';
}

function getValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function nextOrderIndex() {
  return Math.max(0, ...adminState.data.products.map(p => Number(p.orderIndex || 0) || 0)) + 1;
}

function escapeAdminHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSelectedPillValues(containerId, attrName) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return Array.from(container.querySelectorAll(`button[${attrName}].active`))
    .map(btn => btn.getAttribute(attrName))
    .filter(Boolean);
}

function setActivePillsFromInput(containerId, attrName, inputId) {
  const container = document.getElementById(containerId);
  const inputValue = getValue(inputId);

  if (!container) return;

  const selected = normalizeAdminList(inputValue).map(item => item.toLowerCase());

  container.querySelectorAll(`button[${attrName}]`).forEach(btn => {
    const value = String(btn.getAttribute(attrName) || '').toLowerCase();
    btn.classList.toggle('active', selected.includes(value));
  });
}

function syncColorsFromPills() {
  const selected = getSelectedPillValues('colorPills', 'data-color-option');
  setValue('productColors', selected.join(','));
  readFormsToState();
}

function syncSizesFromPills() {
  const selected = getSelectedPillValues('sizePills', 'data-size-option');
  setValue('productSizes', selected.join(','));
  readFormsToState();
}

function bindOptionPills() {
  document.querySelectorAll('#colorPills [data-color-option]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      syncColorsFromPills();
    });
  });

  document.querySelectorAll('#sizePills [data-size-option]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      syncSizesFromPills();
    });
  });

  document.getElementById('productColors')?.addEventListener('input', () => {
    setActivePillsFromInput('colorPills', 'data-color-option', 'productColors');
  });

  document.getElementById('productSizes')?.addEventListener('input', () => {
    setActivePillsFromInput('sizePills', 'data-size-option', 'productSizes');
  });
}

function renderProductList() {
  ensureSelection();

  const wrap = document.getElementById('productList');
  if (!wrap) return;

  const list = [...adminState.data.products].sort((a, b) => {
    const orderA = Number(a.orderIndex || 0);
    const orderB = Number(b.orderIndex || 0);

    if (orderA !== orderB) return orderA - orderB;

    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  wrap.innerHTML = list.map(p => `
    <button class="admin-item ${String(p.id) === String(adminState.selectedId) ? 'active' : ''}" data-id="${p.id}">
      <strong>${escapeAdminHTML(p.title || 'Sin título')}</strong><br>
      <span class="helper">
        ${escapeAdminHTML(categoryLabel(p.category))}
        ${p.character ? ' · ' + escapeAdminHTML(p.character) : ''}
        ${p.anime ? ' · ' + escapeAdminHTML(p.anime) : ''}
      </span>
    </button>
  `).join('');

  wrap.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      adminState.selectedId = btn.dataset.id;
      renderAll();
    });
  });
}

function bindHero() {
  const h = adminState.data.hero;

  setValue('heroPrefix', h.titlePrefix);
  setValue('heroAccent', h.titleAccent);
  setValue('heroSubtitle', h.subtitle);
  setValue('heroBadge1', h.badges[0] || '');
  setValue('heroBadge2', h.badges[1] || '');
  setValue('heroBadge3', h.badges[2] || '');
}

function bindContacts() {
  const c = adminState.data.contacts;

  setValue('contactWhatsApp', c.whatsapp);
  setValue('contactInstagram', c.instagram);
  setValue('contactTikTok', c.tiktok);
  setValue('contactEmail', c.email);
}

function bindProductEditor() {
  const p = selectedProduct();
  const disabled = !p;

  [
    'productTitle',
    'productCharacter',
    'productAnime',
    'productCategory',
    'productBadge',
    'productPrice',
    'productOrder',
    'productColors',
    'productSizes',
    'productActive',
    'duplicateProduct',
    'deleteProduct',
    'productImageInput'
  ].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.disabled = disabled;
  });

  document.querySelectorAll('#colorPills button, #sizePills button').forEach(btn => {
    btn.disabled = disabled;
  });

  const preview = document.getElementById('productPreview');

  if (!p) {
    if (preview) preview.src = '';
    setActivePillsFromInput('colorPills', 'data-color-option', 'productColors');
    setActivePillsFromInput('sizePills', 'data-size-option', 'productSizes');
    return;
  }

  if (preview) preview.src = p.image || '';

  setValue('productTitle', p.title || '');
  setValue('productCharacter', p.character || '');
  setValue('productAnime', p.anime || '');
  setValue('productCategory', normalizeCategory(p.category || 'catalog'));
  setValue('productBadge', p.badge || 'NEW');
  setValue('productPrice', Number(p.price || 0) || '');
  setValue('productOrder', Number(p.orderIndex || 0) || '');
  setValue('productColors', listToInput(p.colors));
  setValue('productSizes', listToInput(p.sizes));
  setValue('productActive', p.active === false ? 'false' : 'true');

  setActivePillsFromInput('colorPills', 'data-color-option', 'productColors');
  setActivePillsFromInput('sizePills', 'data-size-option', 'productSizes');
}

function renderAll() {
  renderProductList();
  bindHero();
  bindContacts();
  bindProductEditor();
}

function readFormsToState() {
  const hero = adminState.data.hero;

  hero.titlePrefix = getValue('heroPrefix') || 'BLACK';
  hero.titleAccent = getValue('heroAccent') || 'CAT';
  hero.subtitle = getValue('heroSubtitle');
  hero.badges = [
    getValue('heroBadge1'),
    getValue('heroBadge2'),
    getValue('heroBadge3')
  ];

  const c = adminState.data.contacts;

  c.whatsapp = getValue('contactWhatsApp');
  c.instagram = getValue('contactInstagram');
  c.tiktok = getValue('contactTikTok');
  c.email = getValue('contactEmail');

  const p = selectedProduct();

  if (p) {
    p.title = getValue('productTitle');
    p.character = getValue('productCharacter');
    p.anime = getValue('productAnime');
    p.category = normalizeCategory(getValue('productCategory') || 'catalog');
    p.badge = getValue('productBadge') || 'NEW';
    p.price = Number(getValue('productPrice') || 0);
    p.orderIndex = Number(getValue('productOrder') || p.orderIndex || 1);
    p.colors = normalizeAdminList(getValue('productColors'));
    p.sizes = normalizeAdminList(getValue('productSizes'));
    p.active = getValue('productActive') !== 'false';
  }
}

document.getElementById('addProduct')?.addEventListener('click', async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData?.session) {
    alert('Primero inicia sesión en Supabase.');
    return;
  }

  const category = 'catalog';
  const defaults = defaultProductByCategory(category);
  const nextOrder = nextOrderIndex();

  const payload = {
    title: 'Nuevo producto',
    character: '',
    anime: defaults.anime,
    category,
    badge: 'NEW',
    image_url: '',
    price: defaults.price,
    colors: defaults.colors,
    sizes: defaults.sizes,
    active: true,
    order_index: nextOrder
  };

  const { data, error } = await supabaseClient
    .from('products')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creando producto:', error);
    alert('No se pudo crear el producto: ' + error.message);
    return;
  }

  await loadAdminFromSupabase();
  adminState.selectedId = data.id;
  renderAll();
});

document.getElementById('duplicateProduct')?.addEventListener('click', async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData?.session) {
    alert('Primero inicia sesión en Supabase.');
    return;
  }

  readFormsToState();

  const p = selectedProduct();
  if (!p) return;

  const nextOrder = nextOrderIndex();

  const payload = {
    title: `${p.title || 'Producto'} copia`,
    character: p.character || '',
    anime: p.anime || '',
    category: normalizeCategory(p.category || 'catalog'),
    badge: p.badge || 'NEW',
    image_url: p.image || '',
    price: Number(p.price || 0),
    colors: normalizeAdminList(p.colors),
    sizes: normalizeAdminList(p.sizes),
    active: p.active !== false,
    order_index: nextOrder
  };

  const { data, error } = await supabaseClient
    .from('products')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error duplicando producto:', error);
    alert('No se pudo duplicar: ' + error.message);
    return;
  }

  await loadAdminFromSupabase();
  adminState.selectedId = data.id;
  renderAll();
});

document.getElementById('deleteProduct')?.addEventListener('click', async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData?.session) {
    alert('Primero inicia sesión en Supabase.');
    return;
  }

  const p = selectedProduct();
  if (!p) return;

  const ok = confirm(`¿Eliminar "${p.title}"?`);
  if (!ok) return;

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', p.id);

  if (error) {
    console.error('Error eliminando producto:', error);
    alert('No se pudo eliminar: ' + error.message);
    return;
  }

  await loadAdminFromSupabase();
  adminState.selectedId = adminState.data.products[0]?.id || null;
  renderAll();
});

document.getElementById('heroImageInput')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = await uploadImageToSupabase(file, 'hero');
  if (!url) return;

  adminState.data.hero.image = url;
  renderAll();
});

document.getElementById('productImageInput')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;

  const p = selectedProduct();
  const category = p?.category || 'catalog';
  const folder = category === 'hoodies' ? 'productos/hoodies' : category === 'extras' ? 'productos/extras' : 'productos/camisas';

  const url = await uploadImageToSupabase(file, folder);
  if (!url) return;

  if (!p) return;

  p.image = url;
  renderAll();
});

document.getElementById('saveAll')?.addEventListener('click', async () => {
  await saveAdminToSupabase();
});

document.getElementById('resetAll')?.addEventListener('click', () => {
  if (typeof resetSiteData !== 'function') {
    alert('No se encontró la base local para restaurar.');
    return;
  }

  adminState.data = resetSiteData();
  adminState.selectedId = adminState.data.products[0]?.id || null;
  renderAll();
  alert('Se restauró la base original.');
});

document.getElementById('exportJson')?.addEventListener('click', () => {
  readFormsToState();

  const blob = new Blob([JSON.stringify(adminState.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'blackcat-admin-backup.json';
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById('importJson')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const parsed = JSON.parse(text);

  if (typeof normalizeSiteData === 'function') {
    adminState.data = normalizeSiteData(parsed);
  } else {
    adminState.data = parsed;
  }

  adminState.selectedId = adminState.data.products[0]?.id || null;
  renderAll();
});

[
  'heroPrefix',
  'heroAccent',
  'heroSubtitle',
  'heroBadge1',
  'heroBadge2',
  'heroBadge3',
  'contactWhatsApp',
  'contactInstagram',
  'contactTikTok',
  'contactEmail',
  'productTitle',
  'productCharacter',
  'productAnime',
  'productCategory',
  'productBadge',
  'productPrice',
  'productOrder',
  'productColors',
  'productSizes',
  'productActive'
].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    readFormsToState();

    if (id === 'productColors') {
      setActivePillsFromInput('colorPills', 'data-color-option', 'productColors');
    }

    if (id === 'productSizes') {
      setActivePillsFromInput('sizePills', 'data-size-option', 'productSizes');
    }
  });

  document.getElementById(id)?.addEventListener('change', () => {
    readFormsToState();

    if (id === 'productColors') {
      setActivePillsFromInput('colorPills', 'data-color-option', 'productColors');
    }

    if (id === 'productSizes') {
      setActivePillsFromInput('sizePills', 'data-size-option', 'productSizes');
    }
  });
});

document.getElementById('productCategory')?.addEventListener('change', () => {
  const p = selectedProduct();
  if (!p) return;

  const nextCategory = normalizeCategory(getValue('productCategory'));
  const defaults = defaultProductByCategory(nextCategory);

  p.category = nextCategory;

  if (!getValue('productPrice') || Number(getValue('productPrice')) === 0) {
    p.price = defaults.price;
  }

  if (!getValue('productColors')) {
    p.colors = defaults.colors;
  }

  if (!getValue('productSizes')) {
    p.sizes = defaults.sizes;
  }

  if (!getValue('productAnime')) {
    p.anime = defaults.anime;
  }

  bindProductEditor();
});

async function loadAdminFromSupabase() {
  try {
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .order('order_index', { ascending: true });

    console.log('ADMIN SETTINGS:', settings);
    console.log('ADMIN PRODUCTS:', products);
    console.log('ADMIN SETTINGS ERROR:', settingsError);
    console.log('ADMIN PRODUCTS ERROR:', productsError);

    if (settingsError) console.error(settingsError);
    if (productsError) console.error(productsError);

    if (settings) {
      adminState.data.hero = {
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

      adminState.data.contacts = {
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        email: settings.email || ''
      };
    }

    if (products && Array.isArray(products)) {
      adminState.data.products = products.map(p => ({
        id: p.id,
        title: p.title || '',
        character: p.character || '',
        anime: p.anime || '',
        category: normalizeCategory(p.category || 'catalog'),
        badge: p.badge || 'NEW',
        image: p.image_url || '',
        price: Number(p.price || 0),
        colors: normalizeAdminList(p.colors),
        sizes: normalizeAdminList(p.sizes),
        active: p.active === false ? false : true,
        orderIndex: Number(p.order_index || 0)
      }));
    }

    adminState.selectedId = adminState.data.products[0]?.id || null;
    renderAll();
  } catch (error) {
    console.error('Error cargando admin desde Supabase:', error);
  }
}

async function saveAdminToSupabase() {
  try {
    readFormsToState();

    const { data: sessionData } = await supabaseClient.auth.getSession();
    console.log('SESSION INFO:', sessionData);

    if (!sessionData?.session) {
      alert('Primero debes iniciar sesión en Supabase.');
      return;
    }

    const hero = adminState.data.hero;
    const contacts = adminState.data.contacts;

    const { error: settingsError } = await supabaseClient
      .from('site_settings')
      .update({
        hero_title_prefix: hero.titlePrefix || '',
        hero_title_accent: hero.titleAccent || '',
        hero_subtitle: hero.subtitle || '',
        hero_badge_1: hero.badges?.[0] || '',
        hero_badge_2: hero.badges?.[1] || '',
        hero_badge_3: hero.badges?.[2] || '',
        hero_image_url: hero.image || '',
        whatsapp: contacts.whatsapp || '',
        instagram: contacts.instagram || '',
        tiktok: contacts.tiktok || '',
        email: contacts.email || ''
      })
      .eq('id', 1)
      .select();

    if (settingsError) {
      console.error('Error guardando settings:', settingsError);
      alert('No se pudo guardar la configuración: ' + settingsError.message);
      return;
    }

    for (const [index, product] of adminState.data.products.entries()) {
      const orderIndex = Number(product.orderIndex || index + 1);

      const payload = {
        title: product.title || '',
        character: product.character || '',
        anime: product.anime || '',
        category: normalizeCategory(product.category || 'catalog'),
        badge: product.badge || 'NEW',
        image_url: product.image || '',
        price: Number(product.price || 0),
        colors: normalizeAdminList(product.colors),
        sizes: normalizeAdminList(product.sizes),
        active: product.active === false ? false : true,
        order_index: orderIndex || index + 1
      };

      if (product.id && Number.isInteger(Number(product.id))) {
        const { data, error } = await supabaseClient
          .from('products')
          .update(payload)
          .eq('id', product.id)
          .select();

        console.log('UPDATE PRODUCT:', product.id, data, error);

        if (error) {
          console.error('Error actualizando producto:', product.id, error);
          alert('Error actualizando producto ' + product.title + ': ' + error.message);
          return;
        }
      } else {
        const { data, error } = await supabaseClient
          .from('products')
          .insert(payload)
          .select();

        console.log('INSERT PRODUCT:', data, error);

        if (error) {
          console.error('Error insertando producto nuevo:', error);
          alert('Error insertando producto nuevo: ' + error.message);
          return;
        }
      }
    }

    alert('Cambios guardados en Supabase.');
    await loadAdminFromSupabase();
  } catch (error) {
    console.error('Error general guardando en Supabase:', error);
    alert('Ocurrió un error al guardar.');
  }
}

async function loginSupabaseAdmin() {
  const email = getValue('sbEmail');
  const password = getValue('sbPassword');

  if (!email || !password) {
    alert('Ingresa correo y contraseña.');
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  console.log('LOGIN DATA:', data);
  console.log('LOGIN ERROR:', error);

  if (error) {
    alert('No se pudo iniciar sesión: ' + error.message);
    return;
  }

  setValue('sbEmail', '');
  setValue('sbPassword', '');

  await syncSupabaseLoginVisibility();

  alert('Sesión iniciada correctamente.');
}

async function logoutSupabaseAdmin() {
  await supabaseClient.auth.signOut();
  await syncSupabaseLoginVisibility();
  alert('Sesión cerrada.');
}

async function syncSupabaseLoginVisibility() {
  const loginPanel = document.getElementById('supabaseLoginPanel');
  if (!loginPanel) return;

  const { data } = await supabaseClient.auth.getSession();

  if (data?.session) {
    loginPanel.style.display = 'none';
  } else {
    loginPanel.style.display = 'block';
  }
}

document.getElementById('sbLoginBtn')?.addEventListener('click', async () => {
  await loginSupabaseAdmin();
});

document.getElementById('sbLogoutBtn')?.addEventListener('click', async () => {
  await logoutSupabaseAdmin();
});

async function uploadImageToSupabase(file, folder = 'productos') {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
  const cleanFolder = String(folder || 'productos').replace(/^\/+|\/+$/g, '');
  const fileName = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('catalogo')
    .upload(fileName, file, {
      upsert: true
    });

  if (uploadError) {
    console.error('Error subiendo imagen:', uploadError);
    alert('No se pudo subir la imagen: ' + uploadError.message);
    return null;
  }

  const { data } = supabaseClient.storage
    .from('catalogo')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

requireAdminAccess();
bindPasswordActions();
bindOptionPills();
syncSupabaseLoginVisibility();
loadAdminFromSupabase();
