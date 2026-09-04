/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- member-app/scripts/config.js
 * [PARTISI -- 4 Sep, Tahap 2] Konstanta & utilitas generik dipakai lintas-fitur
 * Member Android: koneksi backend, fetch dgn auth token, baca/tulis field row
 * (tolerant terhadap variasi spasi/underscore nama kolom), format angka.
 * Diekstrak dari index.html tunggal -- 0 restrukturisasi logika, murni pindah
 * teks + 1 penyesuaian (isStrictNumeric diangkat dari lokal buildMapData()
 * jadi fungsi umum di sini, supaya reusable utk fitur Peta lain nanti).
 * ============================================================ */

const GOOGLE_SCRIPT_READ_URL = 'https://script.google.com/macros/s/AKfycbwVeP2inU_-Cm4aazxiaTfulb_ta3OalMdKk9icwqRUNVF-Rz8n9cnhylQuWOspYh2Ztw/exec';
const APP_VERSION = 'v90.2.119';

// sessionInfo dibaca sbg variabel global (didefinisikan di file lain -- auth-related state,
// belum dipartisi terpisah di Tahap 2 ini) -- withReadAuthToken aman dipanggil sebelum
// sessionInfo ada isinya (return url apa adanya kalau belum login).
function withReadAuthToken(url) {
  if (!sessionInfo) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'sessionToken=' + encodeURIComponent(sessionInfo.token);
}
async function fetchWithTimeout(url, options, timeoutMs) {
  options = options || {};
  timeoutMs = timeoutMs || 20000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const method = String(options.method || 'GET').toUpperCase();
    const requestUrl = method === 'GET' ? withReadAuthToken(url) : url;
    return await fetch(requestUrl, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}
function buildAuthenticatedPayload(fields) {
  const payload = new URLSearchParams(fields);
  if (sessionInfo) payload.set('sessionToken', sessionInfo.token);
  return payload;
}

function icon(name, cls) { return '<i data-lucide="' + name + '" class="' + (cls||'w-4 h-4') + '"></i>'; }

function getField(row, name) {
  if (!row) return '';
  const target = name.toLowerCase().replace(/[\s_]/g, '');
  for (const key in row) {
    if (key.toLowerCase().replace(/[\s_]/g, '') === target) return row[key];
  }
  return '';
}
function setField(row, name, value) {
  const target = name.toLowerCase().replace(/[\s_]/g, '');
  for (const key in row) {
    if (key.toLowerCase().replace(/[\s_]/g, '') === target) { row[key] = value; return; }
  }
  row[name] = value;
}
function sumField(rows, key) { return rows.reduce((s,r) => s + (parseFloat(r[key]) || 0), 0); }
function avgField(rows, key) { const vals = rows.map(r=>parseFloat(r[key])).filter(v=>!isNaN(v) && v>0); return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0; }

function fmt2(v) { return v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2); }

// [PARTISI -- 4 Sep] Diangkat dari konstanta lokal di dalam buildMapData() (peta.js) --
// murni validasi angka generik, cocok jadi utilitas bersama. v90.2.115 FIX (temuan audit
// #5): SEBELUMNYA !isNaN(parseFloat(x)) -- parseFloat("428200ABC")=428200 (BUKAN NaN), jadi
// string rusak/setengah-angka lolos sbg koordinat valid. Sekarang regex ketat: SELURUH
// string (setelah trim) harus persis format angka (boleh minus/desimal), bukan cuma AWALANNYA.
function isStrictNumeric(v) { return /^-?\d+(\.\d+)?$/.test(String(v||'').trim()); }
