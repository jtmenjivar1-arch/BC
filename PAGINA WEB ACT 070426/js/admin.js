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

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ensureSelection() {
  if (!adminState.data.products.length) adminState.selectedId = null;
  if (!adminState.selectedId && adminState.data.products.length) adminState.selectedId = adminState.data.products[0].id;
}

function selectedProduct() {
  return adminState.data.products.find(p => p.id === adminState.selectedId) || null;
}

function renderProductList() {
  ensureSelection();
  const wrap = document.getElementById('productList');
  const list = [...adminState.data.products].sort((a, b) => a.title.localeCompare(b.title));

  wrap.innerHTML = list.map(p => `
    <button class="admin-item ${p.id === adminState.selectedId ? 'active' : ''}" data-id="${p.id}">
      <strong>${p.title}</strong><br>
      <span class="helper">${p.character} · ${p.anime}</span>
    </button>
  `).join('');

  wrap.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => {
    adminState.selectedId = Number(btn.dataset.id);
    renderAll();
  }));
}

function bindHero() {
  const h = adminState.data.hero;
  document.getElementById('heroPrefix').value = h.titlePrefix;
  document.getElementById('heroAccent').value = h.titleAccent;
  document.getElementById('heroSubtitle').value = h.subtitle;
  document.getElementById('heroBadge1').value = h.badges[0] || '';
  document.getElementById('heroBadge2').value = h.badges[1] || '';
  document.getElementById('heroBadge3').value = h.badges[2] || '';
}

function bindContacts() {
  const c = adminState.data.contacts;
  document.getElementById('contactWhatsApp').value = c.whatsapp;
  document.getElementById('contactInstagram').value = c.instagram;
  document.getElementById('contactTikTok').value = c.tiktok;
  document.getElementById('contactEmail').value = c.email;
}

function bindProductEditor() {
  const p = selectedProduct();
  const disabled = !p;

  ['productTitle', 'productCharacter', 'productAnime', 'productBadge', 'duplicateProduct', 'deleteProduct', 'productImageInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });

  const preview = document.getElementById('productPreview');
  if (!p) {
    if (preview) preview.src = '';
    return;
  }

  if (preview) preview.src = p.image || '';
  document.getElementById('productTitle').value = p.title;
  document.getElementById('productCharacter').value = p.character;
  document.getElementById('productAnime').value = p.anime;
  document.getElementById('productBadge').value = p.badge;
}

function renderAll() {
  renderProductList();
  bindHero();
  bindContacts();
  bindProductEditor();
}

function readFormsToState() {
  const hero = adminState.data.hero;
  hero.titlePrefix = document.getElementById('heroPrefix').value.trim() || 'BLACK';
  hero.titleAccent = document.getElementById('heroAccent').value.trim() || 'CAT';
  hero.subtitle = document.getElementById('heroSubtitle').value.trim();
  hero.badges = [
    document.getElementById('heroBadge1').value.trim(),
    document.getElementById('heroBadge2').value.trim(),
    document.getElementById('heroBadge3').value.trim()
  ];

  const c = adminState.data.contacts;
  c.whatsapp = document.getElementById('contactWhatsApp').value.trim();
  c.instagram = document.getElementById('contactInstagram').value.trim();
  c.tiktok = document.getElementById('contactTikTok').value.trim();
  c.email = document.getElementById('contactEmail').value.trim();

  const p = selectedProduct();
  if (p) {
    p.title = document.getElementById('productTitle').value.trim();
    p.character = document.getElementById('productCharacter').value.trim();
    p.anime = document.getElementById('productAnime').value.trim();
    p.badge = document.getElementById('productBadge').value.trim();
  }
}

function nextId() {
  return Math.max(0, ...adminState.data.products.map(p => Number(p.id) || 0)) + 1;
}

document.getElementById('addProduct')?.addEventListener('click', async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData?.session) {
    alert('Primero inicia sesión en Supabase.');
    return;
  }

  const nextOrder = (adminState.data.products?.length || 0) + 1;

  const payload = {
    title: 'Nuevo producto',
    character: '',
    anime: '',
    badge: 'TOP',
    image_url: '',
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

  const p = selectedProduct();
  if (!p) return;

  const nextOrder = (adminState.data.products?.length || 0) + 1;

  const payload = {
    title: `${p.title || 'Producto'} copia`,
    character: p.character || '',
    anime: p.anime || '',
    badge: p.badge || 'TOP',
    image_url: p.image || '',
    active: true,
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

  const url = await uploadImageToSupabase(file, 'productos');
  if (!url) return;

  const p = selectedProduct();
  if (!p) return;

  p.image = url;
  renderAll();
});

document.getElementById('saveAll')?.addEventListener('click', async () => {
  await saveAdminToSupabase();
});

document.getElementById('resetAll')?.addEventListener('click', () => {
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
  adminState.data = normalizeSiteData(JSON.parse(text));
  adminState.selectedId = adminState.data.products[0]?.id || null;
  renderAll();
});

[
  'heroPrefix', 'heroAccent', 'heroSubtitle', 'heroBadge1', 'heroBadge2', 'heroBadge3',
  'contactWhatsApp', 'contactInstagram', 'contactTikTok', 'contactEmail',
  'productTitle', 'productCharacter', 'productAnime', 'productBadge'
].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    readFormsToState();
  });
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
        badge: p.badge || 'TOP',
        image: p.image_url || ''
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
      const payload = {
        title: product.title || '',
        character: product.character || '',
        anime: product.anime || '',
        badge: product.badge || 'TOP',
        image_url: product.image || '',
        active: true,
        order_index: index + 1
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
  const email = document.getElementById('sbEmail')?.value.trim();
  const password = document.getElementById('sbPassword')?.value.trim();

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

  const emailInput = document.getElementById('sbEmail');
  const passwordInput = document.getElementById('sbPassword');

  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';

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
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
syncSupabaseLoginVisibility();
loadAdminFromSupabase();
