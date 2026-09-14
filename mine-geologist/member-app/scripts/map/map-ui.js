/* STEP 9.12-C — Map UI Boundary. UI render functions only; behavior unchanged. */

/* V25 UI — Layer/Feature semantic management boundary. No renderer/tile ownership. */
let mg1LayerPanelOpen_ = false;
let mg1LayerBusy_ = false;
let mg1LayerList_ = [];
let mg1LayerError_ = '';
let mg1LayerDraftName_ = '';
let mg1LayerDraftType_ = 'custom';
let mg1LayerDraftTypeManual_ = false;
let mg1LayerFeatureState_ = {};
let mg1LayerFeatureMapId_ = null;
let mg1FeatureDraft_ = {};
let mg1FeatureBusy_ = false;
let mg1FeatureError_ = '';

function getSemanticActiveMapId_() {
  try { return (typeof activeBackgroundMapId !== 'undefined' && activeBackgroundMapId) ? activeBackgroundMapId : null; } catch (_) { return null; }
}
window.getSemanticActiveMapId_ = getSemanticActiveMapId_;

function mg1FeatureStateForLayer_(layerId) {
  if (!mg1LayerFeatureState_[layerId]) mg1LayerFeatureState_[layerId] = { open: false, list: [], loaded: false };
  return mg1LayerFeatureState_[layerId];
}
async function toggleSemanticFeaturePanel_(layerId) {
  const state = mg1FeatureStateForLayer_(layerId);
  state.open = !state.open;
  mg1FeatureError_ = '';
  render();
  if (state.open && !state.loaded) await refreshSemanticFeatures_(layerId);
}
async function refreshSemanticFeatures_(layerId) {
  const state = mg1FeatureStateForLayer_(layerId);
  if (typeof MG1MapFeatureManagement === 'undefined') return;
  mg1FeatureBusy_ = true;
  mg1FeatureError_ = '';
  render();
  try {
    state.list = await MG1MapFeatureManagement.list(layerId, { sortBy: 'id', direction: 'asc' });
    state.loaded = true;
  } catch (err) {
    state.list = [];
    state.loaded = false;
    mg1FeatureError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1FeatureBusy_ = false;
    render();
  }
}
function mg1LayerPreset_(layer) {
  const key = String((layer && (layer.type || layer.name)) || 'custom').toLowerCase();
  if (/(drill|bor|sample)/.test(key)) return { key:'drilling', label:'Pemboran', geometry:'point', fields:[['hole_id','ID Lubang','DH-001'],['elevation','Elevasi',''],['depth','Kedalaman',''],['lithology','Litologi',''],['grade','Kadar','']] };
  if (/(geolog|ore|lith|mineral)/.test(key)) return { key:'geology', label:'Geologi', geometry:'polygon', fields:[['lithology','Litologi',''],['zone','Zona',''],['description','Keterangan','']] };
  if (/(road|jalan|haul|conveyor)/.test(key)) return { key:'road', label:'Jalan / Jalur', geometry:'line', fields:[['road_type','Jenis Jalur','Hauling Road'],['status','Status','Aktif'],['description','Keterangan','']] };
  if (/(fault|struktur)/.test(key)) return { key:'structure', label:'Struktur Geologi', geometry:'line', fields:[['structure_type','Jenis Struktur','Fault'],['strike','Strike',''],['dip','Dip',''],['description','Keterangan','']] };
  if (/(pit|dump|mining|tambang)/.test(key)) return { key:'mining', label:'Tambang', geometry:'polygon', fields:[['area_type','Jenis Area','Pit'],['status','Status','Aktif'],['description','Keterangan','']] };
  if (/(crusher|camp|workshop|infrastructure|fasilitas)/.test(key)) return { key:'infrastructure', label:'Infrastruktur', geometry:'point', fields:[['facility_type','Jenis Fasilitas',''],['status','Status','Aktif'],['description','Keterangan','']] };
  if (/(environment|lingkungan|rehab|reklamasi)/.test(key)) return { key:'environment', label:'Lingkungan', geometry:'polygon', fields:[['area_type','Jenis Area',''],['status','Status','Aktif'],['description','Keterangan','']] };
  return { key:'custom', label:'Data Umum', geometry:'point', fields:[['category','Kategori',''],['description','Keterangan','']] };
}
function mg1FriendlyGeometry_(type) {
  return type === 'point' ? 'Titik' : type === 'line' ? 'Garis' : type === 'polygon' ? 'Area' : 'Objek';
}
function mg1FeaturePropertiesFromForm_(layerId) {
  const root = document.querySelector('.mg1-feature-create-form[data-layer-id="' + CSS.escape(String(layerId)) + '"]');
  if (!root) throw new Error('Form Feature tidak ditemukan');
  const properties = {};
  root.querySelectorAll('[data-feature-field]').forEach(function(el){
    const key = el.getAttribute('data-feature-field');
    const value = String(el.value || '').trim();
    if (value) properties[key] = value;
  });
  return properties;
}
function updateSemanticFeatureDraft_(layerId, field, value) {
  if (!mg1FeatureDraft_[layerId]) mg1FeatureDraft_[layerId] = { type:'point', properties:'{}', geometry:'', name:'', fields:{} };
  if (field.indexOf('field:') === 0) {
    if (!mg1FeatureDraft_[layerId].fields) mg1FeatureDraft_[layerId].fields = {};
    mg1FeatureDraft_[layerId].fields[field.slice(6)] = value;
  } else {
    mg1FeatureDraft_[layerId][field] = value;
  }
}
function setSemanticFeatureGeometryFromMap_(layerId, geometry) {
  if (!mg1FeatureDraft_[layerId]) mg1FeatureDraft_[layerId] = { type:'point', properties:'{}', geometry:'', name:'', fields:{} };
  mg1FeatureDraft_[layerId].geometry = JSON.stringify(geometry);
  mg1FeatureDraft_[layerId].type = 'point';
  mg1FeatureError_ = '';
}
function setSemanticFeatureDrawingError_(message) {
  mg1FeatureError_ = String(message || 'Pemilihan objek di peta belum tersedia.');
  render();
}
async function createSemanticFeatureFromForm_(layerId) {
  const draft = mg1FeatureDraft_[layerId] || { type:'point', properties:'{}', geometry:'' };
  try {
    const properties = mg1FeaturePropertiesFromForm_(layerId);
    if (!properties.name) {
      const nameInput = document.querySelector('.mg1-feature-create-form[data-layer-id="' + CSS.escape(String(layerId)) + '"] [data-feature-name]');
      if (nameInput && String(nameInput.value || '').trim()) properties.name = String(nameInput.value).trim();
    }
    if (!properties.name && draft.name) properties.name = String(draft.name).trim();
    if (!properties.name) throw new Error('Nama data wajib diisi');
    var geometry = null;
    if (draft.geometry) { try { geometry = JSON.parse(draft.geometry); } catch (_) { throw new Error('Lokasi objek belum valid. Silakan pilih di peta lagi.'); } }
    if (!geometry) throw new Error('Pilih lokasi di peta terlebih dahulu.');
    mg1FeatureBusy_ = true;
    mg1FeatureError_ = '';
    render();
    await MG1MapFeatureManagement.create(layerId, { type:draft.type || 'point', geometry:geometry, properties:properties, schemaVersion:1 });
    mg1FeatureDraft_[layerId] = { type:draft.type || 'point', properties:'{}', geometry:'' };
    await refreshSemanticFeatures_(layerId);
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1FeatureError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1FeatureBusy_ = false;
    render();
  }
}
async function createSemanticFeature_(layerId) {
  // Compatibility path for existing callers/tests that still provide the draft state.
  const form = (typeof document !== 'undefined' && document.querySelector) ? document.querySelector('.mg1-feature-create-form[data-layer-id=\"' + CSS.escape(String(layerId)) + '\"]') : null;
  if (form) return createSemanticFeatureFromForm_(layerId);
  const draft = mg1FeatureDraft_[layerId] || { type:'point', properties:'{}', geometry:'' };
  let properties = {}, geometry = null;
  try {
    properties = draft.properties && draft.properties.trim() ? JSON.parse(draft.properties) : {};
    geometry = draft.geometry && draft.geometry.trim() ? JSON.parse(draft.geometry) : null;
    if (!properties || Array.isArray(properties) || typeof properties !== 'object') throw new Error('Data atribut tidak valid');
    if (geometry != null && (!geometry || Array.isArray(geometry) || typeof geometry !== 'object')) throw new Error('Geometry tidak valid');
  } catch (err) {
    mg1FeatureError_ = err.message || String(err); render(); return;
  }
  mg1FeatureBusy_ = true; mg1FeatureError_ = ''; render();
  try {
    await MG1MapFeatureManagement.create(layerId, { type:draft.type || 'point', geometry:geometry, properties:properties, schemaVersion:1 });
    mg1FeatureDraft_[layerId] = { type:draft.type || 'point', properties:'{}', geometry:'' };
    await refreshSemanticFeatures_(layerId);
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1FeatureError_ = (err && err.message) ? err.message : String(err);
  } finally { mg1FeatureBusy_ = false; render(); }
}
async function updateSemanticFeature_(featureId, layerId, propertiesText, geometryText) {
  let properties = {}, geometry = null;
  try {
    properties = propertiesText.trim() ? JSON.parse(propertiesText) : {};
    geometry = geometryText.trim() ? JSON.parse(geometryText) : null;
    if (!properties || Array.isArray(properties) || typeof properties !== 'object') throw new Error('Data atribut tidak valid');
    if (geometry != null && (!geometry || Array.isArray(geometry) || typeof geometry !== 'object')) throw new Error('Geometry tidak valid');
  } catch (err) {
    mg1FeatureError_ = err.message || String(err);
    render();
    return;
  }
  mg1FeatureBusy_ = true;
  mg1FeatureError_ = '';
  render();
  try {
    await MG1MapFeatureManagement.update(featureId, { properties: properties, geometry: geometry });
    await refreshSemanticFeatures_(layerId);
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1FeatureError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1FeatureBusy_ = false;
    render();
  }
}
async function removeSemanticFeature_(featureId, layerId) {
  mg1FeatureBusy_ = true;
  mg1FeatureError_ = '';
  render();
  try {
    await MG1MapFeatureManagement.remove(featureId);
    const state = mg1FeatureStateForLayer_(layerId);
    state.list = state.list.filter(f => f.id !== featureId);
  } catch (err) {
    mg1FeatureError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1FeatureBusy_ = false;
    render();
  }
}
function mg1EscapeHtml_(value) {
  return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function renderSemanticFeaturePanel_(layer) {
  const state = mg1FeatureStateForLayer_(layer.id);
  const preset = mg1LayerPreset_(layer);
  const draft = mg1FeatureDraft_[layer.id] || { type:preset.geometry, properties:'{}', geometry:'' };
  if (!state.open) return '';
  let html = '<div class="mt-2 ml-10 rounded-lg bg-black/15 border border-white/[0.05] p-2.5">';
  if (mg1FeatureBusy_ && !state.list.length) html += '<div class="flex items-center gap-2 text-[10px] text-white/40 py-2"><span class="w-3 h-3 border border-white/20 border-t-blue-400 rounded-full spin"></span>Memuat data...</div>';
  else if (!state.list.length) html += '<div class="text-[10px] text-white/30 py-2">Belum ada data. Tambahkan data pertama untuk ' + mg1EscapeHtml_(layer.name) + '.</div>';
  state.list.forEach(function(feature) {
    const props = feature.properties || {};
    const displayName = props.name || props.hole_id || props.category || feature.id;
    html += '<div class="rounded-lg bg-white/[0.025] border border-white/[0.04] p-2 mb-2">' +
      '<div class="flex items-center gap-2"><div class="flex-1 min-w-0"><div class="text-[10px] text-white font-semibold truncate">' + mg1EscapeHtml_(displayName) + '</div><div class="text-[9px] text-white/30">' + mg1EscapeHtml_(mg1FriendlyGeometry_(feature.type)) + ' · ' + mg1EscapeHtml_(feature.id) + '</div></div>' +
      '<button onclick="removeSemanticFeature_(\'' + mg1EscapeHtml_(feature.id) + '\',\'' + mg1EscapeHtml_(layer.id) + '\')" class="w-6 h-6 rounded bg-rose-500/10 flex items-center justify-center">' + icon('trash-2','w-3 h-3 text-rose-400') + '</button></div>' +
      '<div class="mt-2 text-[9px] text-white/30">Data tersimpan · edit detail dapat ditambahkan setelah pemilihan objek di peta aktif.</div></div>';
  });
  html += '<div class="border-t border-white/[0.05] pt-2 mt-1 mg1-feature-create-form" data-layer-id="' + mg1EscapeHtml_(layer.id) + '">' +
    '<div class="flex items-center justify-between mb-2"><div><div class="text-[10px] text-white/60 font-semibold">Tambah Data</div><div class="text-[9px] text-white/25">' + mg1EscapeHtml_(preset.label) + '</div></div><button onclick="refreshSemanticFeatures_(\'' + mg1EscapeHtml_(layer.id) + '\')" ' + (mg1FeatureBusy_ ? 'disabled' : '') + ' class="text-[9px] text-blue-300 disabled:opacity-30">Refresh</button></div>' +
    '<div class="grid gap-1.5">' +
    '<input data-feature-name type="text" value="' + mg1EscapeHtml_(draft.name || '') + '" oninput="updateSemanticFeatureDraft_(\'' + mg1EscapeHtml_(layer.id) + '\',\'name\',this.value)" placeholder="Nama data, contoh: DH-001" class="w-full bg-[#0b1329] border border-white/10 rounded px-2 py-2 text-[10px] text-white focus:outline-none focus:border-blue-400/60" />' +
    '<div class="flex gap-1.5"><div class="flex-1 rounded-lg bg-[#0b1329] border border-white/10 px-2 py-1.5"><div class="text-[8px] text-white/25 mb-0.5">Bentuk objek</div><select onchange="updateSemanticFeatureDraft_(\'' + mg1EscapeHtml_(layer.id) + '\',\'type\',this.value)" class="w-full bg-transparent text-[10px] text-white outline-none"><option value="point" ' + (draft.type==='point'?'selected':'') + '>Titik</option><option value="line" ' + (draft.type==='line'?'selected':'') + '>Garis</option><option value="polygon" ' + (draft.type==='polygon'?'selected':'') + '>Area</option></select></div><button type="button" onclick="MG1MapFeatureDrawing.start(\'' + mg1EscapeHtml_(layer.id) + '\',\'' + mg1EscapeHtml_(draft.type || 'point') + '\')" class="px-3 rounded-lg bg-blue-500/10 border border-blue-400/20 text-[9px] text-blue-200 hover:bg-blue-500/20">📍 Pilih di Peta</button></div>' +
    '<div class="rounded-lg bg-blue-500/5 border border-blue-500/10 px-2.5 py-2 text-[9px] ' + (draft.geometry ? 'text-emerald-300/80' : 'text-blue-200/60') + '">' + (draft.geometry ? '✓ Lokasi sudah dipilih di peta. Siap disimpan.' : 'Pilih lokasi di peta. Untuk saat ini tersedia untuk Titik.') + '</div>';
  preset.fields.forEach(function(field){
    html += '<input data-feature-field="' + mg1EscapeHtml_(field[0]) + '" type="text" value="' + mg1EscapeHtml_((draft.fields && draft.fields[field[0]]) || '') + '" oninput="updateSemanticFeatureDraft_(\'' + mg1EscapeHtml_(layer.id) + '\',\'field:' + mg1EscapeHtml_(field[0]) + '\',this.value)" placeholder="' + mg1EscapeHtml_(field[1] + (field[2] ? ' · contoh: ' + field[2] : '')) + '" class="w-full bg-[#0b1329] border border-white/10 rounded px-2 py-2 text-[10px] text-white focus:outline-none focus:border-blue-400/60" />';
  });
  html += '<button onclick="createSemanticFeatureFromForm_(\'' + mg1EscapeHtml_(layer.id) + '\')" ' + (mg1FeatureBusy_ ? 'disabled' : '') + ' class="w-full py-2 rounded-lg bg-blue-500 text-white text-[10px] font-bold disabled:opacity-40">Simpan Data</button></div></div>';
  return html;
}

async function openLayerManagementPanel_() {
  mg1LayerPanelOpen_ = true;
  mg1LayerError_ = '';
  render();
  await refreshLayerManagementPanel_();
}
function closeLayerManagementPanel_() {
  mg1LayerPanelOpen_ = false;
  mg1LayerBusy_ = false;
  mg1LayerError_ = '';
  mg1LayerDraftName_ = '';
  mg1LayerDraftType_ = 'custom';
  mg1LayerDraftTypeManual_ = false;
  render();
}
async function refreshLayerManagementPanel_() {
  const mapId = activeBackgroundMapId;
  if (mg1LayerFeatureMapId_ !== mapId) { mg1LayerFeatureState_ = {}; mg1FeatureDraft_ = {}; mg1LayerFeatureMapId_ = mapId || null; }
  if (!mapId || typeof MG1MapLayerManagement === 'undefined') {
    mg1LayerList_ = [];
    render();
    return;
  }
  mg1LayerBusy_ = true;
  mg1LayerError_ = '';
  render();
  try {
    mg1LayerList_ = await MG1MapLayerManagement.list(mapId, { sortBy: 'order', direction: 'asc' });
  } catch (err) {
    mg1LayerList_ = [];
    mg1LayerError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1LayerBusy_ = false;
    render();
  }
}
async function createSemanticLayer_() {
  const mapId = activeBackgroundMapId;
  const name = String(mg1LayerDraftName_ || '').trim();
  if (!mapId || !name) return;
  mg1LayerBusy_ = true;
  mg1LayerError_ = '';
  render();
  try {
    await MG1MapLayerManagement.create(mapId, { name: name, type: mg1LayerDraftType_ || 'custom', order: mg1LayerList_.length, visible: true });
    mg1LayerDraftName_ = '';
    mg1LayerList_ = await MG1MapLayerManagement.list(mapId, { sortBy: 'order', direction: 'asc' });
  } catch (err) {
    mg1LayerError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1LayerBusy_ = false;
    render();
  }
}
async function toggleSemanticLayerVisibility_(layerId, visible) {
  mg1LayerBusy_ = true;
  mg1LayerError_ = '';
  render();
  try {
    await MG1MapLayerManagement.setVisibility(layerId, !!visible);
    mg1LayerList_ = await MG1MapLayerManagement.list(activeBackgroundMapId, { sortBy: 'order', direction: 'asc' });
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1LayerError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1LayerBusy_ = false;
    render();
  }
}
async function activateSemanticLayer_(layerId) {
  mg1LayerBusy_ = true;
  mg1LayerError_ = '';
  render();
  try {
    await MG1MapLayerManagement.activate(activeBackgroundMapId, layerId);
    mg1LayerList_ = await MG1MapLayerManagement.list(activeBackgroundMapId, { sortBy: 'order', direction: 'asc' });
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1LayerError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1LayerBusy_ = false;
    render();
  }
}
async function removeSemanticLayer_(layerId) {
  mg1LayerBusy_ = true;
  mg1LayerError_ = '';
  render();
  try {
    await MG1MapLayerManagement.remove(layerId);
    delete mg1LayerFeatureState_[layerId];
    delete mg1FeatureDraft_[layerId];
    mg1LayerList_ = await MG1MapLayerManagement.list(activeBackgroundMapId, { sortBy: 'order', direction: 'asc' });
    if (window.MG1MapFeatureDrawing && typeof window.MG1MapFeatureDrawing.sync === 'function') window.MG1MapFeatureDrawing.sync();
  } catch (err) {
    mg1LayerError_ = (err && err.message) ? err.message : String(err);
  } finally {
    mg1LayerBusy_ = false;
    render();
  }
}
function mg1SmartLayerType_(name) {
  const key = String(name || '').toLowerCase().trim();
  if (!key) return 'custom';
  if (/(drill|drilling|bor|bore|sample|sampling|lubang|core)/.test(key)) return 'drilling';
  if (/(geolog|litholog|lithology|ore|mineral|alterasi|litologi)/.test(key)) return 'geology';
  if (/(road|jalan|haul|hauling|conveyor|akses)/.test(key)) return 'road';
  if (/(fault|sesar|struktur|structure|joint|fracture)/.test(key)) return 'structure';
  if (/(pit|dump|tambang|mining|stockpile|disposal|bench)/.test(key)) return 'mining';
  if (/(crusher|camp|workshop|office|kantor|infrastruktur|fasilitas|fuel|warehouse)/.test(key)) return 'infrastructure';
  if (/(environment|lingkungan|rehab|reklamasi|sediment|drainage|drainase)/.test(key)) return 'environment';
  return 'custom';
}
function mg1LayerTypeLabel_(type) {
  const labels = {custom:'Data Umum', geology:'Geologi', drilling:'Pemboran', road:'Jalan / Jalur', structure:'Struktur Geologi', mining:'Tambang', infrastructure:'Infrastruktur', environment:'Lingkungan'};
  return labels[type] || labels.custom;
}
function updateSemanticLayerDraft_(value) {
  mg1LayerDraftName_ = value;
  // Smart suggestion: infer the group from the user's natural layer name.
  // A manual selection remains authoritative once the user changes it.
  if (!mg1LayerDraftTypeManual_) {
    mg1LayerDraftType_ = mg1SmartLayerType_(mg1LayerDraftName_);
  }
}
function updateSemanticLayerDraftType_(value) {
  mg1LayerDraftType_ = String(value || 'custom');
  mg1LayerDraftTypeManual_ = true;
}
function mg1GroupLayers_(layers) {
  const order = ['geology','drilling','structure','mining','road','infrastructure','environment','custom'];
  const groups = {};
  (layers || []).forEach(function(layer){
    const type = String(layer && layer.type || 'custom').toLowerCase();
    const key = order.indexOf(type) >= 0 ? type : 'custom';
    if (!groups[key]) groups[key] = [];
    groups[key].push(layer);
  });
  return order.filter(function(key){ return groups[key] && groups[key].length; }).map(function(key){
    return {key:key,label:mg1LayerTypeLabel_(key),layers:groups[key]};
  });
}

function renderSemanticLayerPanel_() {
  if (!mg1LayerPanelOpen_) return '';
  const mapId = activeBackgroundMapId;
  const activeId = mg1LayerList_.find(l => l && l.active) ? mg1LayerList_.find(l => l && l.active).id : null;
  let body = '';
  if (!mapId) {
    body += '<div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300">Pilih/aktifkan Peta Background terlebih dahulu. Layer adalah milik satu Map tertentu.</div>';
  } else if (mg1LayerBusy_ && mg1LayerList_.length === 0) {
    body += '<div class="py-8 flex justify-center"><span class="w-7 h-7 border-2 border-white/20 border-t-blue-400 rounded-full spin"></span></div>';
  } else if (!mg1LayerList_.length) {
    body += '<div class="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center text-[11px] text-white/35">Belum ada Layer pada Peta ini.</div>';
  } else {
    const groups = mg1GroupLayers_(mg1LayerList_);
    body += '<div class="mb-3 rounded-xl bg-blue-500/5 border border-blue-500/10 px-3 py-2 text-[9px] text-blue-200/60">Smart grouping aktif · Layer dikelompokkan otomatis berdasarkan jenis data, tanpa mengubah urutan data di penyimpanan.</div>';
    body += groups.map(function(group) {
      return '<div class="mb-3"><div class="flex items-center justify-between px-1 mb-1.5"><div class="text-[10px] font-bold text-white/65">' + mg1EscapeHtml_(group.label) + '</div><div class="text-[9px] text-white/25">' + group.layers.length + ' Layer</div></div>' + group.layers.map(function(layer) {
        const active = layer.id === activeId;
        const visible = layer.visible !== false;
        return '<div class="rounded-xl p-3 mb-2 ' + (active ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/[0.035] border border-white/[0.05]') + '" >' +
          '<div class="flex items-center gap-2.5">' +
            '<button onclick="toggleSemanticLayerVisibility_(\'' + layer.id + '\',' + (!visible) + ')" class="w-8 h-8 rounded-lg flex items-center justify-center ' + (visible ? 'bg-emerald-500/10' : 'bg-white/5') + '">' + icon(visible ? 'eye' : 'eye-off','w-4 h-4 ' + (visible ? 'text-emerald-400' : 'text-white/30')) + '</button>' +
            '<div class="flex-1 min-w-0"><div class="text-[12px] font-semibold text-white truncate">' + mg1EscapeHtml_(layer.name) + '</div><div class="text-[9px] text-white/30">' + (active ? 'AKTIF' : 'tidak aktif') + ' · ' + (visible ? 'terlihat' : 'tersembunyi') + '</div></div>' +
            '<button onclick="activateSemanticLayer_(\'' + layer.id + '\')" ' + (!visible ? 'disabled' : '') + ' class="text-[9px] font-bold px-2 py-1 rounded-full ' + (active ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50 disabled:opacity-30') + '">' + (active ? 'AKTIF' : 'AKTIFKAN') + '</button>' +
            '<button onclick="removeSemanticLayer_(\'' + layer.id + '\')" class="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center">' + icon('trash-2','w-3.5 h-3.5 text-rose-400') + '</button>' +
          '</div>' +
          '<div class="mt-2 pl-10 flex items-center justify-between"><button onclick="toggleSemanticFeaturePanel_(\'' + layer.id + '\')" class="text-[9px] text-blue-300">' + (mg1LayerFeatureState_[layer.id] && mg1LayerFeatureState_[layer.id].open ? 'Sembunyikan Feature' : 'Lihat Feature') + '</button><span class="text-[9px] text-white/20">Kelompok data · objek di dalam layer</span></div>' +
          renderSemanticFeaturePanel_(layer) +
        '</div>';
      }).join('') + '</div>';
    }).join('');
  }
  if (mg1FeatureError_) body += '<div class="mt-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[10px] text-rose-300"><div>' + mg1EscapeHtml_(mg1FeatureError_) + '</div><button onclick="refreshLayerManagementPanel_()" class="mt-1 text-[9px] text-rose-200 underline">Coba lagi</button></div>';
  if (mg1LayerError_) body += '<div class="mt-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[10px] text-rose-300"><div>' + mg1EscapeHtml_(mg1LayerError_) + '</div><button onclick="refreshLayerManagementPanel_()" class="mt-1 text-[9px] text-rose-200 underline">Coba lagi</button></div>';
  if (mapId) {
    body += '<div class="mt-3 rounded-xl bg-white/[0.025] border border-white/[0.05] p-3"><div class="text-[10px] text-white/50 mb-2 font-semibold">Semantic Layer · Kelompok Data Baru</div><div class="grid gap-2"><input type="text" value="' + mg1EscapeHtml_(mg1LayerDraftName_) + '" oninput="updateSemanticLayerDraft_(this.value)" placeholder="Contoh: Geologi, Pemboran, Hauling Road, Drillhole" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-blue-400/60"><select onchange="updateSemanticLayerDraftType_(this.value)" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white"><option value="custom" ' + (mg1LayerDraftType_==='custom'?'selected':'') + '>Data Umum</option><option value="geology" ' + (mg1LayerDraftType_==='geology'?'selected':'') + '>Geologi</option><option value="drilling" ' + (mg1LayerDraftType_==='drilling'?'selected':'') + '>Pemboran</option><option value="road" ' + (mg1LayerDraftType_==='road'?'selected':'') + '>Jalan / Jalur</option><option value="structure" ' + (mg1LayerDraftType_==='structure'?'selected':'') + '>Struktur Geologi</option><option value="mining" ' + (mg1LayerDraftType_==='mining'?'selected':'') + '>Tambang</option><option value="infrastructure" ' + (mg1LayerDraftType_==='infrastructure'?'selected':'') + '>Infrastruktur</option><option value="environment" ' + (mg1LayerDraftType_==='environment'?'selected':'') + '>Lingkungan</option></select><button onclick="createSemanticLayer_()" ' + (!String(mg1LayerDraftName_ || '').trim() || mg1LayerBusy_ ? 'disabled' : '') + ' class="w-full py-2 rounded-lg bg-blue-500 text-white text-[10px] font-bold disabled:opacity-40">Tambah Kelompok Data</button></div></div>';
  }
  return renderSimpleModal('Layer Peta', mapId ? (mg1LayerList_.length + ' Layer') : 'Pilih Peta', body, 'closeLayerManagementPanel_()');
}

function renderPeta() {
  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';

  // [BARU] State loading -- muncul singkat saat tab Peta pertama kali dibuka & fetch
  // mandirinya (loadValidasiDataForMapStandalone_) masih berjalan.
  if (mapDataBusy) {
    html += renderSectionTitle('PETA LOKASI', 'memuat...');
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-8 text-center">' +
      '<span class="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full spin"></span>' +
      '<div class="text-white/50 text-xs">Memuat data Peta...</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // v90.2.115 FIX (temuan audit #2): SEKARANG pakai mapDataErrorMsg yg KHUSUS terisi dari
  // fetch Validasi -- SEBELUMNYA salah pakai dataLoadErrorMsg (punya Produksi), bikin Peta
  // ikut "error" saat Produksi gagal padahal Validasi sukses, ATAU sebaliknya Validasi
  // gagal tapi Peta tidak masuk state error sama sekali (malah pakai dataset lama).
  if (mapDataErrorMsg) {
    html += renderSectionTitle('PETA LOKASI', 'gagal memuat');
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-rose-500/20 p-8 text-center">' +
      icon('alert-triangle','w-10 h-10 text-rose-400') +
      '<div class="text-white font-bold text-sm">Gagal Memuat Data Peta</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">' + mapDataErrorMsg + '</div>' +
      '<button onclick="mapDataFetchAttempted=false; loadValidasiDataForMapStandalone_()" class="mt-1 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold active:scale-95 transition-transform">Coba Lagi</button>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  const mapData = buildMapData();
  const validPoints = mapData.filter(p => p.hasValidCoord);
  const invalidCount = mapData.length - validPoints.length;

  // v90.2.116: konsumsi permintaan fokus dari kartu Validasi -- kalau TP-nya BENAR ADA
  // di mapData (mis. belum kehapus/berubah), buka detailnya otomatis. "Konsumsi 1x" --
  // flag langsung direset supaya tidak terus2an buka modal tiap render() lain dipicu.
  if (mapFocusIdTp) {
    if (mapData.some(p => p.idTp === mapFocusIdTp)) mapDetailIdTp = mapFocusIdTp;
    mapFocusIdTp = null;
  }

  html += renderSectionTitle('PETA LOKASI', mapData.length + ' titik TP');

  // v90.2.113: state EMPTY (poin desain #7) -- 0 TP sama sekali (bukan krn error, genuinely
  // belum ada data Validasi).
  if (mapData.length === 0) {
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-8 text-center">' +
      icon('map','w-10 h-10 text-white/20') +
      '<div class="text-white font-bold text-sm">Belum Ada Titik TP</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">Data Validasi/Test Pit belum ada utk periode ini.</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // Semua TP ADA tapi TIDAK SATUPUN punya koordinat valid -- beda dari "benar2 kosong",
  // jadi pesan & state-nya juga dibedakan (poin desain #9, "TP tanpa koordinat").
  if (validPoints.length === 0) {
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-amber-500/20 p-8 text-center">' +
      icon('map-pin-off','w-10 h-10 text-amber-400/60') +
      '<div class="text-white font-bold text-sm">Koordinat Belum Tersedia</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">' + mapData.length + ' titik TP ada, tapi belum satupun punya Timur/Utara terisi dari Plan/Head.</div>' +
    '</div>';
    html += '</main>' + renderBottomNav();
    return html;
  }

  // ==== SUCCESS: render Mine Grid ====
  html += '<div id="mg1-map-viewport" class="relative flex-1 min-h-0 rounded-[12px] bg-[#0b1329] border border-white/[0.08] overflow-hidden select-none" style="touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;" oncontextmenu="return false" onselectstart="return false" ondragstart="return false">' +
    renderMineGridSvg(validPoints) +
    renderNorthArrow_(computeResponsiveDisplayBounds_(validPoints)) +
    renderMeasureBanner_(mapData) +
    // Kontrol zoom + crosshair (reset view) -- poin desain #2 (MAP-02): sekarang BENAR2
    // py handler, bukan sekadar elemen visual. [BONUS -- 4 Sep] Tombol Mode Ukur ditambah
    // di grup yg sama (kanan-atas), ikon berubah & warna nyala kuning saat aktif.
    '<div class="absolute right-3 top-3 flex flex-col gap-2">' +
      '<button onclick="zoomMapIn()" aria-label="Perbesar" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('plus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="zoomMapOut()" aria-label="Perkecil" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('minus','w-4 h-4 text-white') + '</button>' +
      '<button onclick="resetMapView()" aria-label="Reset tampilan" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('crosshair','w-4 h-4 text-white') + '</button>' +
      '<button onclick="toggleMeasureMode_()" aria-label="Mode Ukur" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (measureModeActive ? 'bg-amber-500 border border-amber-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('ruler','w-4 h-4 ' + (measureModeActive ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="' + (gpsState_.active ? 'stopGpsTracking_()' : 'startGpsTracking_()') + '" aria-label="' + (gpsState_.active ? 'Matikan GPS' : 'Aktifkan GPS') + '" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (gpsState_.active ? 'bg-cyan-400 border border-cyan-300' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('navigation','w-4 h-4 ' + (gpsState_.active ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="openMapManagePanel_()" aria-label="Kelola Peta Background" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeBackgroundMapId ? 'bg-emerald-500 border border-emerald-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('layers','w-4 h-4 ' + (activeBackgroundMapId ? 'text-[#0b1329]' : 'text-white')) + '</button>' +
      '<button onclick="openLayerManagementPanel_()" aria-label="Kelola Layer" class="w-9 h-9 rounded-full bg-[#0b1329]/90 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">' + icon('layers-3','w-4 h-4 text-blue-300') + '</button>' +
      '<button onclick="openKmlManagePanel_()" aria-label="Kelola KML" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeKmlOverlayIds.length > 0 ? 'bg-purple-500 border border-purple-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('shapes','w-4 h-4 ' + (activeKmlOverlayIds.length > 0 ? 'text-white' : 'text-white')) + '</button>' +
    '</div>' +
    (invalidCount > 0 ? '<div class="absolute left-3 bottom-11 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">' + invalidCount + ' TP tanpa koordinat</div>' : '') +
    (mapTapState_.active ? renderMapTapInfo_() : '') +
    renderMapScaleBar(computeResponsiveDisplayBounds_(validPoints)) +
  '</div>';
  if (gpsState_.active) {
    const gpsText = gpsState_.status === 'ok'
      ? ('GPS: ' + gpsState_.lat.toFixed(6) + ', ' + gpsState_.lon.toFixed(6) + (gpsState_.accuracyM != null ? ' ±' + gpsState_.accuracyM.toFixed(0) + 'm' : ''))
      : (gpsState_.status === 'searching' ? 'GPS: mencari posisi...' : 'GPS: ' + (gpsState_.error || 'belum tersedia'));
    html += '<div class="text-[10px] ' + (gpsState_.status === 'ok' ? 'text-cyan-300' : 'text-amber-300') + ' text-center shrink-0">' + gpsText + '</div>';
  }
  html += '<div class="text-[10px] text-white/30 text-center shrink-0">Koordinat grid tambang (Timur/Utara) -- bukan GPS. Tap titik utk detail.</div>';
  html += '</main>';
  html += renderBottomNav();
  html += renderMapDetailModal(mapData);
  html += renderMapManagePanel_();
  html += renderSemanticLayerPanel_();
  html += renderMapUploadForm_();
  html += renderKmlManagePanel_();
  html += renderKmlUploadForm_();
  // STEP 04: setelah DOM dipasang oleh render(), ukur container aktual agar FIT
  // mengikuti portrait/landscape tanpa mengubah GeoReference.
  scheduleMapViewportFit_();
  return html;
}

function renderMapManagePanel_() {
  if (!mapManagePanelOpen) return '';
  const listHtml = backgroundMapsList.length === 0
    ? '<p class="text-[11px] text-white/30 text-center py-4">Belum ada peta background tersimpan.</p>'
    : backgroundMapsList.map(function(m) {
        const active = m.id === activeBackgroundMapId;
        return '<div class="flex items-center gap-2.5 rounded-xl p-2.5 mb-1.5 ' + (active ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.04]') + '">' +
          '<img src="' + m.imageDataUrl + '" class="w-11 h-11 rounded-lg object-cover shrink-0">' +
          '<div class="flex-1 min-w-0" onclick="activateBackgroundMap_(\'' + m.id + '\')">' +
            '<div class="text-[12px] font-semibold text-white truncate">' + m.name + (active ? ' <span class="text-emerald-400 text-[9px] font-bold">&bull; AKTIF</span>' : '') + '</div>' +
            '<div class="text-[9px] text-white/30">oleh ' + (m.uploadedBy || '-') + '</div>' +
          '</div>' +
          '<button onclick="event.stopPropagation(); window._v23DeleteMap(\'' + m.id + '\')" class="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">' + icon('trash-2','w-3.5 h-3.5 text-rose-400') + '</button>' +
        '</div>';
      }).join('');
  const body = listHtml +
    (activeBackgroundMapId ? '<button onclick="deactivateBackgroundMap_()" class="w-full mt-1 mb-2 py-2 rounded-xl bg-white/[0.04] text-white/50 text-[11px] font-semibold">Nonaktifkan Background</button>' : '') +
    '<button onclick="openMapUploadForm_()" class="w-full mt-2 flex items-center justify-center gap-2 bg-[#2563eb]/15 border border-[#2563eb]/30 text-blue-300 font-bold text-xs py-2.5 rounded-xl">' + icon('plus','w-4 h-4') + '<span>Tambah Peta Baru</span></button>' +
    '<p class="text-[9px] text-white/25 mt-2 leading-relaxed">Peta background cuma tersimpan di HP ini (lokal) -- HP lain tidak otomatis ikut lihat peta yang sama.</p>';
  return renderSimpleModal('Kelola Peta Background', backgroundMapsList.length + ' peta tersimpan', body, 'closeMapManagePanel_()');
}

function renderMapUploadForm_() {
  if (!mapUploadFormOpen) return '';
  const f = mapUploadFormState;
  function inputRow(label, field, placeholder) {
    // [BARU] Kunci 4 kolom ini kalau koordinat berasal dari GeoPDF auto-detect (jaga-jaga
    // human error -- angka GeoPDF sudah tervalidasi otomatis, tidak perlu/boleh diubah
    // manual). GeoTIFF & upload manual TETAP bisa diedit seperti biasa (0 geoReference).
    const locked = !!f.geoReference;
    const domFieldId = {
      tlTimur: 'tl-timur', tlUtara: 'tl-utara',
      brTimur: 'br-timur', brUtara: 'br-utara'
    }[field] || field;
    return '<div><label class="block text-[10px] text-white/40 mb-1 font-medium">' + label + '</label>' +
      '<input id="map-upload-' + domFieldId + '" type="text" inputmode="decimal" value="' + (f[field]||'') + '" oninput="updateMapUploadField_(\'' + field + '\', this.value)" placeholder="' + placeholder + '" ' + (locked ? 'disabled readonly' : '') + ' class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60' + (locked ? ' opacity-50 cursor-not-allowed' : '') + '"></div>';
  }
  const body =
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Nama Peta</label>' +
      '<input type="text" value="' + f.name + '" oninput="updateMapUploadField_(\'name\', this.value)" placeholder="cth. Foto Udara Avanza Sep 2026" class="w-full bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-white focus:outline-none focus:border-blue-400/60">' +
    '</div>' +
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">Gambar Peta (PNG/JPG, GeoTIFF, atau GeoPDF -- koordinat auto-terisi kalau ada)</label>' +
      '<input type="file" accept="image/*,.tif,.tiff,.pdf" onchange="handleMapImageFileSelected_(this)" class="w-full text-[11px] text-white/60">' +
      '<img id="map-upload-preview" src="' + (f.fileDataUrl || '') + '" class="w-full h-24 object-cover rounded-lg mt-2' + (f.fileDataUrl ? '' : ' hidden') + '">' +
    '</div>' +
    '<p class="text-[10px] text-white/40 mb-2 leading-relaxed">Masukkan Timur/Utara pojok KIRI-ATAS dan KANAN-BAWAH gambar (dari ArcGIS/data survey) -- ini yang dipakai app utk menempel gambar ke posisi yang benar.</p>' +
    '<p id="map-upload-geo-lock-note" class="text-[10px] text-emerald-400/80 mb-2 leading-relaxed' + (f.geoReference ? '' : ' hidden') + '>🔒 Terkunci -- koordinat ini hasil auto-detect GeoPDF, tidak bisa diedit manual (jaga-jaga salah ketik). Ganti file kalau perlu koordinat berbeda.</p>' +
    '<div class="grid grid-cols-2 gap-2 mb-2">' +
      inputRow('Kiri-Atas: Timur', 'tlTimur', '397000') +
      inputRow('Kiri-Atas: Utara', 'tlUtara', '53500') +
      inputRow('Kanan-Bawah: Timur', 'brTimur', '397300') +
      inputRow('Kanan-Bawah: Utara', 'brUtara', '53100') +
    '</div>' +
    '<div class="mt-2">' +
      '<p id="map-upload-status" class="text-[10px] mt-1 mb-1 font-medium ' + (mapUploadStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + (mapUploadStatusMsg || 'Siap memproses file...') + '</p>' +
      '<div id="map-upload-progress-text" class="sr-only"></div>' +
      '<div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-label="Proses tile GeoPDF">' +
        '<div id="map-upload-progress-fill" class="h-full rounded-full bg-blue-500" style="width: 0%; transition: width 120ms ease-out;"></div>' +
      '</div>' +
    '</div>' +
    '<button id="map-upload-save-btn" onclick="submitMapUpload_()" ' + ((mapUploadBusy || mapUploadProcessing) ? 'disabled' : '') + ' class="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs py-2.5 rounded-xl disabled:opacity-60">' +
      ((mapUploadBusy || mapUploadProcessing) ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>' : icon('upload','w-4 h-4')) + '<span>' + (mapUploadBusy ? 'Menyimpan...' : (mapUploadProcessing ? 'Memproses GeoPDF...' : 'Simpan Peta')) + '</span>' +
    '</button>';
  return renderSimpleModal('Tambah Peta Baru', 'Upload gambar + 2 titik referensi', body, 'closeMapUploadForm_()');
}

function renderKmlManagePanel_() {
  if (!kmlManagePanelOpen) return '';
  const listHtml = kmlOverlaysList.length === 0
    ? '<p class="text-[11px] text-white/30 text-center py-4">Belum ada KML tersimpan.</p>'
    : kmlOverlaysList.map(function(k) {
        const active = activeKmlOverlayIds.indexOf(k.id) >= 0;
        return '<div class="flex items-center gap-2.5 rounded-xl p-2.5 mb-1.5 ' + (active ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/[0.04]') + '">' +
          '<div class="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">' + icon('shapes','w-4 h-4 text-purple-400') + '</div>' +
          '<div class="flex-1 min-w-0" onclick="toggleKmlOverlayActive_(\'' + k.id + '\')">' +
            '<div class="text-[12px] font-semibold text-white truncate">' + k.name + '</div>' +
            '<div class="text-[9px] text-white/30">' + k.points.length + ' titik &bull; ' + k.lines.length + ' garis</div>' +
          '</div>' +
          '<button onclick="toggleKmlOverlayActive_(\'' + k.id + '\')" class="text-[9px] font-bold px-2 py-1 rounded-full ' + (active ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40') + '">' + (active ? 'TAMPIL' : 'SEMBUNYI') + '</button>' +
          '<button onclick="event.stopPropagation(); deleteKmlOverlayEntry_(\'' + k.id + '\')" class="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">' + icon('trash-2','w-3.5 h-3.5 text-rose-400') + '</button>' +
        '</div>';
      }).join('');
  const body = listHtml +
    '<button onclick="openKmlUploadForm_()" class="w-full mt-2 flex items-center justify-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs py-2.5 rounded-xl">' + icon('plus','w-4 h-4') + '<span>Import KML Baru</span></button>' +
    '<p class="text-[9px] text-white/25 mt-2 leading-relaxed">Bisa aktifkan beberapa KML sekaligus. Titik &amp; garis dikonversi otomatis dari Lat/Lon ke grid Timur/Utara pakai CRS situs aktif (' + (MG1_CRS_CONFIG.presetLabel||'-') + ').</p>';
  return renderSimpleModal('Kelola KML', kmlOverlaysList.length + ' file tersimpan', body, 'closeKmlManagePanel_()');
}

function renderKmlUploadForm_() {
  if (!kmlUploadFormOpen) return '';
  const body =
    '<div class="mb-3">' +
      '<label class="block text-[10px] text-white/40 mb-1 font-medium">File KML</label>' +
      '<input type="file" accept=".kml" onchange="handleKmlFileSelected_(this)" class="w-full text-[11px] text-white/60">' +
    '</div>' +
    (kmlUploadStatusMsg ? '<p class="text-[11px] mb-2 font-medium ' + (kmlUploadStatusOk ? 'text-emerald-400' : 'text-rose-400') + '">' + kmlUploadStatusMsg + '</p>' : '') +
    (kmlUploadParsedPoints.length > 0 || kmlUploadParsedLines.length > 0
      ? '<p class="text-[9px] text-white/30 mb-2">Koordinat KML (Lat/Lon) otomatis dikonversi ke Timur/Utara pakai CRS situs aktif sekarang: <span class="text-white/50 font-semibold">' + (MG1_CRS_CONFIG.presetLabel||'-') + '</span>.</p>'
      : '') +
    '<button onclick="submitKmlUpload_()" ' + (kmlUploadBusy ? 'disabled' : '') + ' class="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-xs py-2.5 rounded-xl disabled:opacity-60">' +
      (kmlUploadBusy ? '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"></span>' : icon('upload','w-4 h-4')) + '<span>' + (kmlUploadBusy ? 'Menyimpan...' : 'Simpan KML') + '</span>' +
    '</button>';
  return renderSimpleModal('Import KML', 'Titik &amp; garis batas', body, 'closeKmlUploadForm_()');
}

function renderMapScaleBar(bounds) {
  if (!bounds) return '';
  const viewW = 320;
  // Total meter yg terlihat di LEBAR PENUH viewBox saat ini (viewBox menyempit saat zoom,
  // jadi meter yg terlihat pun ikut menyempit -- inilah yg bikin skala "hidup").
  const totalMetersVisible = (bounds.maxT - bounds.minT) / mapZoom;
  const target = totalMetersVisible * 0.25;
  let niceMeters = NICE_SCALE_METERS[0];
  for (const m of NICE_SCALE_METERS) { if (m <= target) niceMeters = m; else break; }
  const barWidthPercent = Math.min(60, (niceMeters / totalMetersVisible) * 100);
  return '<div class="absolute left-3 bottom-3 flex flex-col items-start gap-1">' +
    '<div class="h-[3px] rounded-full bg-white/70" style="width:' + barWidthPercent.toFixed(1) + '%; min-width:20px;"></div>' +
    '<div class="text-[9px] text-white/60 font-semibold">' + niceMeters + ' m</div>' +
  '</div>';
}

