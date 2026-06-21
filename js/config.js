
const STORAGE_KEY = 'blackcat_admin_data_v1';

const DEFAULT_SITE_DATA ={
  "hero": {
    "titlePrefix": "BLACK",
    "titleAccent": "CAT",
    "subtitle": "",
    "badges": [
      "",
      "",
      ""
    ],
    "image": "assets/assetshero-1.webp"
  },
  "contacts": {
    "whatsapp": "",
    "instagram": "",
    "tiktok": "",
    "email": ""
  },
  "products": [
    {
      "id": 1,
      "title": "Reze Boom",
      "character": "Reze",
      "anime": "Chainsaw Man",
      "badge": "TOP",
      "image": "mockups/chainsaw2.jpg"
    },
    {
      "id": 2,
      "title": "Denji Chainsaw",
      "character": "Denji",
      "anime": "Chainsaw Man",
      "badge": "DROP",
      "image": "mockups/chainsaw1.jpg"
    },
    {
      "id": 3,
      "title": "Deku Rise",
      "character": "Izuku Midoriya",
      "anime": "Boku no Hero",
      "badge": "DROP",
      "image": "mockups/mha1.jpg"
    },
    {
      "id": 4,
      "title": "Shinra Adolla",
      "character": "Shinra",
      "anime": "Fire Force",
      "badge": "NUEVO",
      "image": "mockups/generated/04-shinra-adolla.webp"
    },
    {
      "id": 5,
      "title": "Frieren Arcane",
      "character": "Frieren",
      "anime": "Frieren",
      "badge": "DROP",
      "image": "mockups/frieren2.jpg"
    },
    {
      "id": 6,
      "title": "Frieren",
      "character": "Frieren",
      "anime": "Frieren",
      "badge": "DROP",
      "image": "mockups/frieren1.jpg"
    },
    {
      "id": 7,
      "title": "Gabimaru del Vacio",
      "character": "Gabimaru",
      "anime": "Hell Paradise",
      "badge": "TOP",
      "image": "mockups/hell1.jpg"
    },
    {
      "id": 8,
      "title": "Gabimaru Shinobi",
      "character": "Gabimaru",
      "anime": "Hell Paradise",
      "badge": "TOP",
      "image": "mockups/hell2.jpg"
    },
    {
      "id": 9,
      "title": "Saitama x Charanko",
      "character": "Saitama",
      "anime": "One Punch Man",
      "badge": "DROP",
      "image": "mockups/onepunch1.jpg"
    },
    {
      "id": 10,
      "title": "Yuta x Rika",
      "character": "Yuta Okkotsu",
      "anime": "Jujutsu Kaisen",
      "badge": "NUEVO",
      "image": "mockups/jujutsu1.jpg"
    },
    {
      "id": 11,
      "title": "Nah Id Win!",
      "character": "Gojo Satoru",
      "anime": "Jujutsu Kaisen",
      "badge": "NUEVO",
      "image": "mockups/generated/11-nah-id-win.webp"
    },
    {
      "id": 12,
      "title": "Kaiju",
      "character": "Kaiju No. 8",
      "anime": "Kaiju No. 8",
      "badge": "DROP",
      "image": "mockups/kaiju1.jpg"
    },
    {
      "id": 13,
      "title": "No. 8 Beast",
      "character": "Hibino Kafka",
      "anime": "Kaiju No. 8",
      "badge": "DROP",
      "image": "mockups/kaiju2.jpg"
    },
    {
      "id": 14,
      "title": "Genos",
      "character": "Genos",
      "anime": "One Punch Man",
      "badge": "DROP",
      "image": "mockups/onepunch2.jpg"
    },
    {
      "id": 15,
      "title": "Choso",
      "character": "Choso BloodStrike",
      "anime": "Jujutsu Kaisen",
      "badge": "NUEVO",
      "image": "mockups/jujutsu2.jpg"
    },
    {
      "id": 16,
      "title": "Megumi x Quimeras",
      "character": "Megumi Fushiguro",
      "anime": "Jujutsu Kaisen",
      "badge": "NUEVO",
      "image": "mockups/generated/16-megumi-x-quimeras.webp"
    },
    {
      "id": 17,
      "title": "Juji x Jujutsu Kaisen",
      "character": "Juji Itadori",
      "anime": "Jujutsu Kaisen",
      "badge": "NUEVO",
      "image": "mockups/generated/17-juji-x-jujutsu-kaisen.webp"
    },
    {
      "id": 18,
      "title": "Ace x One Piece",
      "character": "Portgas D. Ace",
      "anime": "One Piece",
      "badge": "TOP",
      "image": "mockups/generated/18-ace-x-one-piece.webp"
    },
    {
      "id": 19,
      "title": "Blue-Eyes Ultimate Dragon",
      "character": "Ultimate Dragon",
      "anime": "Yu Gi Oh",
      "badge": "TOP",
      "image": "mockups/generated/19-blue-eyes-ultimate-dragon.webp"
    },
    {
      "id": 20,
      "title": "Zoro",
      "character": "Roronoa Zoro",
      "anime": "One Piece",
      "badge": "TOP",
      "image": "mockups/generated/20-zoro.webp"
    },
    {
      "id": 21,
      "title": "Himiko",
      "character": "Himiko Toga",
      "anime": "Boku No Hero",
      "badge": "TOP",
      "image": "mockups/generated/21-himiko.webp"
    },
    {
      "id": "hoodie-born-shadows-white-local",
      "title": "Born Of Shadows White Hoodie",
      "character": "Born Of Shadows",
      "anime": "Hoodie",
      "badge": "NEW",
      "category": "hoodies",
      "image": "mockups/hoodies/born-of-shadows-hoodie.jpg",
      "price": 29.99,
      "colors": [
        "Blanco"
      ],
      "sizes": [
        "S",
        "M",
        "L",
        "XL",
        "2XL"
      ],
      "forceLocal": true
    },
    {
      "id": "termo-blackcat-negro-local",
      "title": "Termo BlackCat Negro",
      "character": "20oz",
      "anime": "Termos",
      "badge": "NEW",
      "category": "extras",
      "image": "mockups/extras/taza-viaje-40oz.webp",
      "price": 14.99,
      "colors": [
        "Negro"
      ],
      "sizes": [
        "20oz"
      ],
      "forceLocal": true
    },
    {
      "id": "termo-blackcat-blanco-local",
      "title": "Termo BlackCat Blanco",
      "character": "20oz",
      "anime": "Termos",
      "badge": "NEW",
      "category": "extras",
      "image": "mockups/extras/taza-viaje-40oz.webp",
      "price": 14.99,
      "colors": [
        "Blanco"
      ],
      "sizes": [
        "20oz"
      ],
      "forceLocal": true
    },
    {
      "id": "termo-blackcat-metal-local",
      "title": "Termo BlackCat Metal",
      "character": "20oz",
      "anime": "Termos",
      "badge": "NEW",
      "category": "extras",
      "image": "mockups/extras/taza-viaje-40oz.webp",
      "price": 16.99,
      "colors": [
        "Gris"
      ],
      "sizes": [
        "20oz"
      ],
      "forceLocal": true
    }
  ]
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeSiteData(data) {
  const safe = deepClone(DEFAULT_SITE_DATA);
  if (!data || typeof data !== 'object') return safe;
  if (data.hero) Object.assign(safe.hero, data.hero);
  if (data.contacts) Object.assign(safe.contacts, data.contacts);
  if (Array.isArray(data.products)) {
    safe.products = data.products.map((p, i) => ({
      id: Number(p.id || i + 1),
      title: p.title || `Producto ${i + 1}`,
      character: p.character || '',
      anime: p.anime || '',
      badge: p.badge || 'TOP',
      image: p.image || DEFAULT_SITE_DATA.products[Math.min(i, DEFAULT_SITE_DATA.products.length - 1)].image
    }));
  }
  return safe;
}

function getSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_SITE_DATA);
    return normalizeSiteData(JSON.parse(raw));
  } catch (e) {
    console.error('No se pudo leer storage', e);
    return deepClone(DEFAULT_SITE_DATA);
  }
}

function saveSiteData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSiteData(data)));
}

function resetSiteData() {
  localStorage.removeItem(STORAGE_KEY);
  return getSiteData();
}


const ADMIN_PASSWORD_KEY = 'blackcat_admin_password_v1';
const ADMIN_SESSION_KEY = 'blackcat_admin_session_v1';
const DEFAULT_ADMIN_PASSWORD = 'blackcat2026';

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}
function setAdminPassword(password) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}
function isAdminAuthenticated() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'ok';
}
function setAdminAuthenticated(value) {
  if (value) localStorage.setItem(ADMIN_SESSION_KEY, 'ok');
  else localStorage.removeItem(ADMIN_SESSION_KEY);
}

