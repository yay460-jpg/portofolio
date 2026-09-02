// ============================================================
// VALIDATION.JS -- Validasi Test Pit (Assay per kedalaman)
// (Bagian dari produksi.js yang dipecah)
// ============================================================

// ============================================================
// GLOBAL VARIABLES
// ============================================================

if (typeof window.globalValidasiData === 'undefined') window.globalValidasiData = [];
if (typeof window.globalValidasiConfig === 'undefined') window.globalValidasiConfig = {};

// ============================================================
// FETCH VALIDASI DATA
// ============================================================

async function fetchValidasiData() {
  try {
    const response = await fetchWithTimeout(
      window.GOOGLE_SCRIPT_READ_URL + '?sheet=validasi&t=' + new Date().getTime()
    );
    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to load validation data.' : 'Gagal memuat data validasi'));
    }

    window.globalValidasiData = groupValidasiRows(result.data || []);
    window.globalValidasiConfig = result.config || {};
    renderValidasiTable();
    // Render ulang Block Model Table karena kolom Validasi-nya butuh data ini
    if (typeof renderBlockModelTable === 'function') renderBlockModelTable();
    if (typeof markDataFresh_ === 'function') markDataFresh_('Validasi');
  } catch (err) {
    console.error('Gagal memuat data validasi:', err);
    if (typeof markDataStale_ === 'function') markDataStale_('Validasi');
    const isTimeout = err.name === 'AbortError';
    const tbody = document.getElementById('validasi-table-body');
    if (tbody) {
      const msg = isTimeout ?
        (window.currentLang === 'en' ? 'Server did not respond within 20s (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') :
        (window.currentLang === 'en' ? 'Failed to load validation data from Google Sheets.' : 'Gagal memuat data validasi dari Google Sheets.');
      tbody.innerHTML = '<tr><td colspan="15" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium">' +
        '<p>' + msg + '</p>' +
        '<button onclick="fetchValidasiData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">' +
        (window.currentLang === 'en' ? 'Retry' : 'Coba Lagi (Retry)') +
        '</button></td></tr>';
    }
  }
}

// ============================================================
// GROUP VALIDASI ROWS (Per Test Pit ID)
// ============================================================

function groupValidasiRows(rawRows) {
  const groups = [];
  const groupMap = {};
  let current = null;

  function fillIfBlank(obj, key, val) {
    if (val && (!obj[key] || obj[key] === '-')) obj[key] = val;
  }

  rawRows.forEach(function(row) {
    const cleanRow = {};
    Object.keys(row).forEach(function(k) {
      cleanRow[k.trim().toLowerCase()] = row[k];
    });
    const idTp = (cleanRow['id tp'] || cleanRow['id_tp'] || '').toString().trim();

    if (idTp) {
      if (groupMap[idTp]) {
        current = groupMap[idTp];
      } else {
        current = {
          idTp: idTp,
          tanggal: '-',
          blok: '-',
          area: '-',
          user: '-',
          bench: '-',
          timur: '-',
          utara: '-',
          warna: '-',
          struktur: '-',
          pelapor: '-',
          depths: []
        };
        groupMap[idTp] = current;
        groups.push(current);
      }
      fillIfBlank(current, 'tanggal', cleanRow['tanggal'] || cleanRow['date']);
      fillIfBlank(current, 'blok', cleanRow['blok'] || cleanRow['id blok'] || cleanRow['id_blok']);
      fillIfBlank(current, 'area', cleanRow['area']);
      fillIfBlank(current, 'user', cleanRow['user']);
      fillIfBlank(current, 'bench', cleanRow['bench']);
      fillIfBlank(current, 'timur', cleanRow['timur']);
      fillIfBlank(current, 'utara', cleanRow['utara']);
      fillIfBlank(current, 'warna', cleanRow['warna']);
      fillIfBlank(current, 'struktur', cleanRow['struktur']);
      fillIfBlank(current, 'pelapor', cleanRow['pelapor']);
    }

    if (!current) return;

    const meter = cleanNumber(cleanRow['meter']);
    const laterit = cleanRow['laterit'] || cleanRow['tipe laterit'] || cleanRow['tipe_laterit'] || '';
    const hasAssay = cleanRow['ni %'] || cleanRow['fe %'] || cleanRow['co %'] || cleanRow['mgo %'] ||
                     cleanRow['sio2 %'] || cleanRow['sm %'] || cleanRow['catatan'] || laterit;
    if (!meter && !hasAssay) return;

    current.depths.push({
      meter: meter || (current.depths.length + 1),
      laterit: laterit || '-',
      ni: cleanRow['ni %'] || '',
      fe: cleanRow['fe %'] || '',
      co: cleanRow['co %'] || '',
      mgo: cleanRow['mgo %'] || '',
      sio2: cleanRow['sio2 %'] || '',
      sm: cleanRow['sm %'] || '',
      catatan: cleanRow['catatan'] || '-'
    });
  });

  groups.forEach(function(g) {
    g.depths.sort(function(a, b) { return a.meter - b.meter; });
    g.avg = {};
    ['ni', 'fe', 'co', 'mgo', 'sio2', 'sm'].forEach(function(param) {
      const vals = g.depths.map(function(d) { return cleanNumber(d[param]); }).filter(function(v) { return v > 0; });
      g.avg[param] = vals.length ? (vals.reduce(function(a, b) { return a + b; }, 0) / vals.length) : null;
    });
  });

  return groups;
}

// ============================================================
// RENDER VALIDASI TABLE
// ============================================================

function renderValidasiTable() {
  const tbody = document.getElementById('validasi-table-body');
  const countLabel = document.getElementById('validasi-count');
  const search = (document.getElementById('validasi-search').value || '').toLowerCase();

  const filtered = window.globalValidasiData.filter(function(g) {
    if (!search) return true;
    return g.idTp.toLowerCase().includes(search) ||
           g.blok.toLowerCase().includes(search) ||
           g.bench.toLowerCase().includes(search) ||
           g.depths.some(function(d) { return d.laterit.toLowerCase().includes(search); });
  });

  countLabel.innerText = filtered.length + (window.currentLang === 'en' ? ' test pits' : ' titik TP');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="15" class="text-center p-6 text-slate-500 font-medium">' +
      (window.currentLang === 'en' ? 'No data found.' : 'Tidak ada data yang ditemukan.') +
      '</td></tr>';
  } else {
    const fmt = function(v) { return v === null || v === undefined ? '-' : v.toFixed(2); };
    tbody.innerHTML = filtered.map(function(g) {
      const idx = window.globalValidasiData.indexOf(g);
      const niStatus = getValidasiNiStatus(g.avg.ni);
      const classifyValidasi = classifyMaterial(g.avg.ni, 'Auto', g.avg.sm);
      const niColorClassValidasi = getGradeTextClass(classifyValidasi.classGrade);
      return '<tr class="hover:bg-slate-800/30 transition-colors cursor-pointer" onclick="openValidasiDetailModal(' + idx + ')">' +
        '<td class="p-3 text-slate-300">' + (g.tanggal || '-') + '</td>' +
        '<td class="p-3 font-semibold text-title">' + g.idTp + '</td>' +
        '<td class="p-3 font-medium text-title">' + (g.blok || '-') + '</td>' +
        '<td class="p-3 text-slate-300">' + (g.bench || '-') + '</td>' +
        '<td class="p-3 text-slate-300">' + (g.area || '-') + '</td>' +
        '<td class="p-3 text-slate-300">' + (g.pelapor || '-') + '</td>' +
        '<td class="p-3 text-center text-slate-400">' + g.depths.length + '/5 m</td>' +
        '<td class="p-3 text-center ' + niColorClassValidasi + ' font-bold">' + fmt(g.avg.ni) + '</td>' +
        '<td class="p-3 text-center text-slate-300">' + fmt(g.avg.fe) + '</td>' +
        '<td class="p-3 text-center text-slate-300">' + fmt(g.avg.co) + '</td>' +
        '<td class="p-3 text-center text-slate-300">' + fmt(g.avg.mgo) + '</td>' +
        '<td class="p-3 text-center text-slate-300">' + fmt(g.avg.sio2) + '</td>' +
        '<td class="p-3 text-center text-slate-300">' + fmt(g.avg.sm) + '</td>' +
        '<td class="p-3 text-center">' + renderClassGradeBadge(classifyValidasi.classGrade) + '</td>' +
        '<td class="p-3 text-center">' +
          '<span class="px-2 py-0.5 rounded-md text-[11px] border font-semibold ' + niStatus.cls + '">' + niStatus.label + '</span>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  // Update Chart
  if (typeof validasiChart !== 'undefined' && validasiChart) {
    const byArea = {};
    filtered.forEach(function(g) {
      const area = g.area || '-';
      if (!byArea[area]) byArea[area] = [];
      if (g.avg.ni !== null && g.avg.ni !== undefined) byArea[area].push(g.avg.ni);
    });
    const areaNames = Object.keys(byArea).sort();
    validasiChart.data.labels = areaNames;
    validasiChart.data.datasets[0].data = areaNames.map(function(a) {
      const vals = byArea[a];
      return vals.length ? (vals.reduce(function(x, y) { return x + y; }, 0) / vals.length) : 0;
    });
    validasiChart.update();
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================
// GET VALIDASI NI STATUS
// ============================================================

function getValidasiNiStatus(avgNi) {
  if (avgNi === null || avgNi === undefined) {
    return { label: '-', cls: 'bg-slate-700/40 text-slate-400 border-slate-600/40' };
  }
  const targetNi = parseFloat(window.globalValidasiConfig['Target Ni']);
  const batasMin = parseFloat(window.globalValidasiConfig['Batas Ni Min']);
  if (isNaN(targetNi) || isNaN(batasMin)) {
    return { label: '-', cls: 'bg-slate-700/40 text-slate-400 border-slate-600/40' };
  }
  const waspadaMargin = 0.05;

  if (avgNi < batasMin) {
    return { label: window.currentLang === 'en' ? 'Poor' : 'Jelek', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  } else if (avgNi < batasMin + waspadaMargin) {
    return { label: window.currentLang === 'en' ? 'Caution' : 'Waspada', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  } else if (avgNi < targetNi) {
    return { label: window.currentLang === 'en' ? 'Safe' : 'Aman', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  } else {
    return { label: window.currentLang === 'en' ? 'Good' : 'Bagus', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
}

// ============================================================
// VALIDASI DETAIL MODAL (Per Kedalaman)
// ============================================================

function openValidasiDetailModal(idx) {
  const g = window.globalValidasiData[idx];
  if (!g) return;

  document.getElementById('validasi-detail-idtp').innerText = g.idTp;
  const uniqueLaterit = [...new Set(g.depths.map(function(d) { return d.laterit; }).filter(function(v) { return v && v !== '-'; }))].join(', ') || '-';
  document.getElementById('validasi-detail-subtitle').innerText = uniqueLaterit + ' -- ' + g.pelapor;
  document.getElementById('validasi-detail-tanggal').innerText = g.tanggal;
  document.getElementById('validasi-detail-bench').innerText = g.bench;
  document.getElementById('validasi-detail-area').innerText = g.area;
  document.getElementById('validasi-detail-koordinat').innerText = g.timur + ' / ' + g.utara;
  document.getElementById('validasi-detail-warna').innerText = g.warna;
  document.getElementById('validasi-detail-struktur').innerText = g.struktur;

  const fmt = function(v) { return v === null || v === undefined ? '-' : v.toFixed(2); };
  document.getElementById('validasi-detail-average').innerText =
    'Ni ' + fmt(g.avg.ni) + '% | Fe ' + fmt(g.avg.fe) + '% | Co ' + fmt(g.avg.co) + '% | ' +
    'MgO ' + fmt(g.avg.mgo) + '% | SiO2 ' + fmt(g.avg.sio2) + '% | SM ' + fmt(g.avg.sm);

  const body = document.getElementById('validasi-detail-body');
  body.innerHTML = g.depths.map(function(d) {
    return '<tr>' +
      '<td class="p-2.5 font-semibold text-title">' + d.meter + ' m</td>' +
      '<td class="p-2.5 text-center text-emerald-400 font-bold">' + (d.ni || '-') + '</td>' +
      '<td class="p-2.5 text-center">' + (d.fe || '-') + '</td>' +
      '<td class="p-2.5 text-center">' + (d.co || '-') + '</td>' +
      '<td class="p-2.5 text-center">' + (d.mgo || '-') + '</td>' +
      '<td class="p-2.5 text-center">' + (d.sio2 || '-') + '</td>' +
      '<td class="p-2.5 text-center">' + (d.sm || '-') + '</td>' +
      '<td class="p-2.5 text-slate-300">' + d.laterit + '</td>' +
      '<td class="p-2.5 text-slate-400">' + d.catatan + '</td>' +
    '</tr>';
  }).join('');

  const modal = document.getElementById('validasi-detail-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeValidasiDetailModal() {
  const modal = document.getElementById('validasi-detail-modal');
  hideModalAnimated(modal);
}

// ============================================================
// VALIDASI FORM INPUT
// ============================================================

function checkExistingTP() {
  const idTp = document.getElementById('validasi-idtp-input').value.trim();
  const hint = document.getElementById('validasi-idtp-hint');
  const headerFields = document.getElementById('validasi-header-fields');
  const meterInput = document.getElementById('validasi-meter-input');

  const existing = window.globalValidasiData.find(function(g) {
    return g.idTp.toLowerCase() === idTp.toLowerCase();
  });

  if (existing) {
    const canEditCoords = canEditValidasiCoordinates();
    headerFields.classList.remove('hidden');
    const form = document.getElementById('validasiManagerForm');
    if (form) {
      form.elements.bench.value = existing.bench !== '-' ? existing.bench : '';
      form.elements.area.value = existing.area !== '-' ? existing.area : '';
      form.elements.timur.value = existing.timur !== '-' ? existing.timur : '';
      form.elements.utara.value = existing.utara !== '-' ? existing.utara : '';
      form.elements.warna.value = existing.warna !== '-' ? existing.warna : '';
      form.elements.struktur.value = existing.struktur !== '-' ? existing.struktur : '';
    }
    setValidasiHeaderFieldState(true, canEditCoords);
    const nextMeter = Math.min(5, existing.depths.length + 1);
    meterInput.value = nextMeter;
    const areaInfo = existing.area && existing.area !== '-' ? existing.area : (window.currentLang === 'en' ? 'unknown' : 'tidak diketahui');
    const tglInfo = existing.tanggal && existing.tanggal !== '-' ? existing.tanggal : (window.currentLang === 'en' ? 'unknown date' : 'tanggal tidak diketahui');
    hint.className = 'text-[10px] mt-1 text-emerald-400';
    hint.innerText = window.currentLang === 'en' ?
      'Existing TP -- Area: ' + areaInfo + ', first recorded ' + tglInfo + '. Adding depth ' + nextMeter + '/5. Bench/coordinates already recorded, no need to re-enter.' :
      'TP sudah ada -- Area: ' + areaInfo + ', pertama tercatat ' + tglInfo + '. Menambah kedalaman ke-' + nextMeter + '/5. Bench/koordinat sudah tercatat, tidak perlu diisi ulang.';
    hint.classList.remove('hidden');
    if (existing.depths.length >= 5) {
      hint.className = 'text-[10px] mt-1 text-amber-400';
      hint.innerText = window.currentLang === 'en' ?
        'This TP already has 5/5 depths recorded (maximum) -- Area: ' + areaInfo + ', first recorded ' + tglInfo + '.' :
        'TP ini sudah punya 5/5 kedalaman (maksimal) -- Area: ' + areaInfo + ', pertama tercatat ' + tglInfo + '.';
    }
  } else {
    headerFields.classList.remove('hidden');
    setValidasiHeaderFieldState(false, canEditValidasiCoordinates());
    if (idTp) {
      hint.className = 'text-[10px] mt-1 text-blue-400';
      hint.innerText = window.currentLang === 'en' ? 'New TP -- fill in the location details below.' : 'TP baru -- lengkapi detail lokasi di bawah.';
      hint.classList.remove('hidden');
      if (!meterInput.value) meterInput.value = 1;
    } else {
      hint.classList.add('hidden');
    }
  }
}

function canEditValidasiCoordinates() {
  const identity = typeof getLoggedInChatIdentity === 'function' ? getLoggedInChatIdentity() : { role: '' };
  const role = String(identity && identity.role ? identity.role : '').trim().toUpperCase();
  return role === 'DEVELOPER' || role.indexOf('HEAD') >= 0;
}

function setValidasiHeaderFieldState(isExisting, canEditCoords) {
  const form = document.getElementById('validasiManagerForm');
  if (!form) return;
  const coordFields = [form.elements.timur, form.elements.utara];
  const protectedFields = [form.elements.bench, form.elements.area, form.elements.warna, form.elements.struktur];
  const note = document.getElementById('validasi-coordinate-lock-note');

  coordFields.forEach(function(el) {
    if (!el) return;
    el.readOnly = !canEditCoords;
    el.classList.toggle('cursor-not-allowed', !canEditCoords);
    el.classList.toggle('opacity-80', !canEditCoords);
    el.classList.toggle('border-amber-500/40', !canEditCoords);
  });

  protectedFields.forEach(function(el) {
    if (!el) return;
    el.readOnly = !!isExisting;
    el.classList.toggle('cursor-not-allowed', !!isExisting);
    el.classList.toggle('opacity-80', !!isExisting);
  });

  if (note) {
    note.classList.remove('hidden');
    note.innerText = canEditCoords ?
      'Head/Developer: koordinat berasal/ditetapkan melalui Plan dan dapat dikoreksi bila diperlukan.' :
      'Member: koordinat Timur/Utara tidak boleh diisi atau diubah. Gunakan koordinat yang sudah ditetapkan Head/Developer melalui Plan.';
  }
}

function openFormValidasiPopup() {
  const form = document.getElementById('validasiManagerForm');
  form.reset();
  document.getElementById('validasi-tanggal-input').value = typeof getLocalDateYyyyMmDd === 'function' ? getLocalDateYyyyMmDd() : '';
  document.getElementById('validasi-header-fields').classList.remove('hidden');
  document.getElementById('validasi-idtp-hint').classList.add('hidden');
  document.getElementById('validasi-sm-input').value = '';
  setValidasiHeaderFieldState(false, canEditValidasiCoordinates());
  if (typeof populateReporterDropdown === 'function') populateReporterDropdown();

  const modal = document.getElementById('form-validasi-popup-modal');
  showModalAnimated(modal);
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeFormValidasiPopup() {
  const modal = document.getElementById('form-validasi-popup-modal');
  hideModalAnimated(modal);
}

function updateValidasiSM() {
  const mgo = parseFloat(document.querySelector('#validasiManagerForm input[name="mgo"]').value);
  const sio2 = parseFloat(document.querySelector('#validasiManagerForm input[name="sio2"]').value);
  const smInput = document.getElementById('validasi-sm-input');
  if (!isNaN(mgo) && mgo > 0 && !isNaN(sio2)) {
    smInput.value = (sio2 / mgo).toFixed(2);
  } else {
    smInput.value = '';
  }
}

async function submitValidasiForm(event) {
  event.preventDefault();
  const form = document.getElementById('validasiManagerForm');
  const submitBtn = document.getElementById('btn-submit-validasi');
  const statusMsg = document.getElementById('validasi-form-status-msg');
  const originalBtnHtml = submitBtn.innerHTML;

  // BLOKIR KERAS: cegah kombinasi ID TP + Meter yang PERSIS sudah pernah tercatat
  const idTpVal = form.id_tp.value.trim();
  const meterVal = parseInt(document.getElementById('validasi-meter-input').value, 10);
  const existingTp = window.globalValidasiData.find(function(g) {
    return g.idTp.toLowerCase() === idTpVal.toLowerCase();
  });
  if (existingTp && existingTp.depths.some(function(d) { return d.meter === meterVal; })) {
    const areaInfo = existingTp.area && existingTp.area !== '-' ? existingTp.area : (window.currentLang === 'en' ? 'unknown' : 'tidak diketahui');
    const tglInfo = existingTp.tanggal && existingTp.tanggal !== '-' ? existingTp.tanggal : (window.currentLang === 'en' ? 'unknown date' : 'tanggal tidak diketahui');
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = window.currentLang === 'en' ?
      'Blocked: depth ' + meterVal + 'm for TP "' + idTpVal + '" was already recorded (Area: ' + areaInfo + ', ' + tglInfo + '). Check the TP number or existing data before continuing.' :
      'Ditolak: kedalaman ' + meterVal + 'm untuk TP "' + idTpVal + '" sudah pernah tercatat (Area: ' + areaInfo + ', ' + tglInfo + '). Cek lagi nomor TP atau data yang sudah ada sebelum lanjut.';
    statusMsg.classList.remove('hidden');
    return;
  }

  const payload = buildAuthenticatedPayload(form);

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' +
    (window.currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
  statusMsg.classList.add('hidden');

  try {
    const response = await fetch(window.GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
    const result = await response.json();

    if (result.status === 'success') {
      statusMsg.className = 'text-xs text-emerald-400';
      statusMsg.innerText = window.currentLang === 'en' ? 'Validation data successfully saved!' : 'Data validasi berhasil disimpan!';
      statusMsg.classList.remove('hidden');
      form.reset();
      if (typeof populateReporterDropdown === 'function') populateReporterDropdown();

      setTimeout(function() {
        closeFormValidasiPopup();
        statusMsg.classList.add('hidden');
        if (typeof fetchValidasiData === 'function') fetchValidasiData();
      }, 900);
    } else {
      throw new Error(result.message || (window.currentLang === 'en' ? 'Failed to save validation data.' : 'Gagal menyimpan data validasi.'));
    }
  } catch (error) {
    console.error('Error submitting validasi form:', error);
    statusMsg.className = 'text-xs text-rose-400';
    statusMsg.innerText = error && error.message ? error.message :
      (window.currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
    statusMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

// ============================================================
// VALIDASI VIEW SWITCHER (Chart / TP)
// ============================================================

function switchValidasiView(view) {
  const chartCard = document.getElementById('validasi-chart-card');
  const tableCard = document.getElementById('validasi-table-card');
  const btnChart = document.getElementById('btn-validasi-view-chart');
  const btnTp = document.getElementById('btn-validasi-view-tp');
  const activeCls = ['bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold'];
  const inactiveCls = ['text-slate-300', 'font-medium'];

  if (view === 'tp') {
    chartCard.classList.add('hidden');
    tableCard.classList.remove('hidden');
    btnTp.classList.add.apply(btnTp, activeCls);
    btnTp.classList.remove.apply(btnTp, inactiveCls);
    btnChart.classList.remove.apply(btnChart, activeCls);
    btnChart.classList.add.apply(btnChart, inactiveCls);
  } else {
    tableCard.classList.add('hidden');
    chartCard.classList.remove('hidden');
    btnChart.classList.add.apply(btnChart, activeCls);
    btnChart.classList.remove.apply(btnChart, inactiveCls);
    btnTp.classList.remove.apply(btnTp, activeCls);
    btnTp.classList.add.apply(btnTp, inactiveCls);
  }
}

// ============================================================
// EXPOSE FUNCTIONS KE GLOBAL WINDOW
// ============================================================
window.fetchValidasiData = fetchValidasiData;
window.groupValidasiRows = groupValidasiRows;
window.renderValidasiTable = renderValidasiTable;
window.getValidasiNiStatus = getValidasiNiStatus;
window.openValidasiDetailModal = openValidasiDetailModal;
window.closeValidasiDetailModal = closeValidasiDetailModal;
window.checkExistingTP = checkExistingTP;
window.canEditValidasiCoordinates = canEditValidasiCoordinates;
window.setValidasiHeaderFieldState = setValidasiHeaderFieldState;
window.openFormValidasiPopup = openFormValidasiPopup;
window.closeFormValidasiPopup = closeFormValidasiPopup;
window.updateValidasiSM = updateValidasiSM;
window.submitValidasiForm = submitValidasiForm;
window.switchValidasiView = switchValidasiView;