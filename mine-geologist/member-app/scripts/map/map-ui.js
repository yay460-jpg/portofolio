/* STEP 9.12-C — Map UI Boundary. UI render functions only; behavior unchanged. */


// PETA VIEW MODE — Peta Lokasi / 3D Topografi.
// Switch dilakukan tanpa global render() agar surface lama tidak dibongkar pada saat transisi.
let mg1PetaViewMode_ = 'location';
let mg1TopoPrepared_ = false;
let mg1TopoPreparing_ = false;
let mg1TopoAdvancedOpen_ = false;

function toggleTopographyAdvanced_() {
  const panel = document.getElementById('mg1-topo-advanced-panel');
  const button = document.getElementById('mg1-topo-advanced-toggle');
  if (!panel || !button) return;
  const willOpen = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = willOpen ? 'block' : 'none';
  mg1TopoAdvancedOpen_ = willOpen;
  button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  button.classList.toggle('bg-blue-500/15', willOpen);
  button.classList.toggle('border-blue-400/40', willOpen);
}

function closeTopographyAdvanced_() {
  const panel = document.getElementById('mg1-topo-advanced-panel');
  const button = document.getElementById('mg1-topo-advanced-toggle');
  mg1TopoAdvancedOpen_ = false;
  if (panel) panel.style.display = 'none';
  if (button) {
    button.setAttribute('aria-expanded', 'false');
    button.classList.remove('bg-blue-500/15', 'border-blue-400/40');
  }
}

function renderPetaModeSwitcher_() {
  return '<div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0b1329] border border-white/[0.08]">' +
    '<button type="button" id="mg1-peta-location-tab" onclick="switchPetaViewMode_(\'location\')" ' +
      'class="py-2 rounded-lg text-[10px] font-bold tracking-wide ' +
      (mg1PetaViewMode_ === 'location' ? 'bg-blue-500/15 text-white border border-blue-400/25' : 'text-white/40') +
      '">PETA LOKASI</button>' +
    '<button type="button" id="mg1-peta-topo-tab" onclick="switchPetaViewMode_(\'topo\')" ' +
      'class="py-2 rounded-lg text-[10px] font-bold tracking-wide ' +
      (mg1PetaViewMode_ === 'topo' ? 'bg-blue-500/15 text-white border border-blue-400/25' : 'text-white/40') +
      '">3D TOPOGRAFI</button>' +
    '</div>';
}

function renderTopographyView_() {
  return '<div id="mg1-topography-root" class="relative flex-1 min-h-0 rounded-[12px] overflow-hidden bg-[#050b18] border border-white/[0.08]">' +
    '<canvas id="mg1-topo-gl" class="absolute inset-0 w-full h-full" style="touch-action:none"></canvas>' +
    '<div class="absolute left-3 right-3 top-2 z-10 flex items-start justify-between pointer-events-none">' +
      '<div><div class="text-[11px] font-extrabold text-white">3D TOPOGRAFI</div>' +
      '<div id="mg1-topo-name" class="text-[8px] text-white/35 mt-0.5">Offline STR / DTM</div></div>' +
      '<label class="pointer-events-auto px-2.5 py-2 rounded-lg bg-[#0e192d]/90 border border-white/10 text-[9px] font-bold text-white cursor-pointer">IMPORT DTM/STR<input id="mg1-topo-pick" type="file" accept=".ltdtm,.dtm,.str" multiple class="hidden"></label>' +
    '</div>' +
    '<div id="mg1-topo-status" class="absolute left-3 top-[43px] z-10 text-[8px] text-blue-200 max-w-[72%]"></div>' +
    '<div id="mg1-topo-hint" class="absolute inset-0 flex items-center justify-center text-center text-[10px] text-white/35 pointer-events-none">3D TOPOGRAFI<br>Import <b>.ltdtm</b> atau pasangan <b>.dtm + .str</b>.</div>' +
    '<div class="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-[58px] p-1 rounded-xl bg-[#0a1428]/90 border border-white/10 backdrop-blur">' +
      '<button id="mg1-topo-view3d" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold bg-blue-500/15 text-white">3D</button>' +
      '<button id="mg1-topo-topView" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold text-white/80">TOP</button>' +
      '<button id="mg1-topo-fit" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold text-white/80">FIT</button>' +
      '<div class="h-px bg-white/10 my-1"></div>' +
      '<button id="mg1-topo-shaded" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold bg-blue-500/15 text-white">SHADE</button>' +
      '<button id="mg1-topo-elev" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold text-white/70">ELEV</button>' +
      '<button id="mg1-topo-wire" class="w-full h-7 my-0.5 rounded-lg text-[8px] font-bold text-white/70">WIRE</button>' +
    '</div>' +
    '<div id="mg1-topo-advanced-panel" class="absolute right-3 bottom-[52px] z-20 w-[250px] max-w-[calc(100%-24px)] p-3 rounded-2xl bg-[#0a1428]/95 border border-white/10 backdrop-blur-xl shadow-2xl" style="display:none">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<div class="text-[9px] font-extrabold tracking-wide text-white">PENGATURAN 3D</div>' +
        '<button type="button" onclick="closeTopographyAdvanced_()" aria-label="Tutup pengaturan 3D" class="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px]">×</button>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<div class="col-span-2">' +
          '<div class="flex items-center justify-between text-[7px] text-white/40 mb-1"><span>Z EXAG.</span><span id="mg1-topo-zFactorText">1.10×</span></div>' +
          '<input id="mg1-topo-zFactor" type="range" min="0.25" max="2.5" step="0.05" value="1.10" class="w-full">' +
        '</div>' +
        '<button id="mg1-topo-gap" class="h-8 rounded-lg text-[8px] font-bold bg-blue-500/15 text-white border border-blue-400/10">GAP</button>' +
        '<button id="mg1-topo-mesh" class="h-8 rounded-lg text-[8px] font-bold text-white/70 bg-white/[0.03] border border-white/10">MESH</button>' +
        '<button id="mg1-topo-relief" class="h-8 rounded-lg text-[8px] font-bold bg-blue-500/15 text-white border border-blue-400/10">RELIEF ON</button>' +
        '<button id="mg1-topo-tint" class="h-8 rounded-lg text-[8px] font-bold text-white/70 bg-white/[0.03] border border-white/10">TINT OFF</button>' +
      '</div>' +
      '<div class="mt-2 text-[7px] leading-relaxed text-white/25">Kontrol lanjutan disembunyikan agar viewport 3D tetap bersih.</div>' +
    '</div>' +
    '<button id="mg1-topo-advanced-toggle" type="button" onclick="toggleTopographyAdvanced_()" aria-label="Buka pengaturan 3D" aria-expanded="false" class="absolute right-3 bottom-3 z-20 w-9 h-9 rounded-full bg-[#0a1428]/95 border border-white/10 flex items-center justify-center text-white/80 text-[15px] leading-none active:scale-95 transition-transform" title="Pengaturan 3D">•••</button>' +
    '<div class="absolute left-2 right-14 bottom-2 z-10 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0a1428]/90 border border-white/10">' +
      '<div class="min-w-0 flex-1"><div class="text-[6px] uppercase text-white/30">Elevation</div><div id="mg1-topo-z" class="text-[8px] font-bold truncate">—</div></div>' +
      '<div class="min-w-0 flex-1"><div class="text-[6px] uppercase text-white/30">Triangles</div><div id="mg1-topo-tri" class="text-[8px] font-bold truncate">—</div></div>' +
      '<div class="min-w-0 flex-1"><div class="text-[6px] uppercase text-white/30">Bounds</div><div id="mg1-topo-bounds" class="text-[8px] font-bold truncate">—</div></div>' +
      '<button id="mg1-topo-save" disabled class="h-7 px-2 rounded-lg bg-[#101d36] border border-white/10 text-[8px] font-bold text-white/70">SIMPAN</button>' +
      '<button id="mg1-topo-reset" class="h-7 px-2 rounded-lg bg-[#101d36] border border-white/10 text-[8px] font-bold text-white/70">RESET</button>' +
    '</div>' +
    '<div id="mg1-topo-loading" class="absolute inset-0 z-30 flex items-center justify-center bg-[#050b18]/95 backdrop-blur-sm">' +
      '<div class="w-[230px] p-5 rounded-2xl bg-[#0b1329] border border-white/10 text-center shadow-2xl">' +
        '<div class="mx-auto mb-3 w-7 h-7 rounded-full border-[3px] border-white/15 border-t-blue-400 animate-spin"></div>' +
        '<div id="mg1-topo-loading-title" class="text-[11px] font-bold text-white">Menyiapkan 3D Topografi…</div>' +
        '<div id="mg1-topo-loading-sub" class="text-[8px] text-white/35 mt-1">Prepare data dan WebGL. Mohon tunggu.</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function switchPetaViewMode_(mode) {
  mode = mode === 'topo' ? 'topo' : 'location';
  if (mg1PetaViewMode_ === mode && document.getElementById('mg1-peta-location-surface')) return;
  mg1PetaViewMode_ = mode;

  const locationSurface = document.getElementById('mg1-peta-location-surface');
  const topoSurface = document.getElementById('mg1-topography-root');
  const locTab = document.getElementById('mg1-peta-location-tab');
  const topoTab = document.getElementById('mg1-peta-topo-tab');

  if (!locationSurface || !topoSurface) {
    render();
    return;
  }

  if (locTab) {
    locTab.className = 'py-2 rounded-lg text-[10px] font-bold tracking-wide ' +
      (mode === 'location' ? 'bg-blue-500/15 text-white border border-blue-400/25' : 'text-white/40');
  }
  if (topoTab) {
    topoTab.className = 'py-2 rounded-lg text-[10px] font-bold tracking-wide ' +
      (mode === 'topo' ? 'bg-blue-500/15 text-white border border-blue-400/25' : 'text-white/40');
  }

  const loading = document.getElementById('mg1-topo-loading');
  if (mode === 'topo') {
    locationSurface.style.display = 'none';
    topoSurface.style.display = 'block';
    if (loading) {
      loading.style.display = 'flex';
      loading.style.opacity = '1';
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (typeof window.initTopographyViewer_ === 'function') {
        const ok = window.initTopographyViewer_();
        if (ok && typeof window.mg1TopoResize_ === 'function') window.mg1TopoResize_();
      }
      mg1TopoPrepared_ = true;
      mg1TopoPreparing_ = false;
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => { if (loading) loading.style.display = 'none'; }, 140);
      }
    }));
  } else {
    closeTopographyAdvanced_();
    topoSurface.style.display = 'none';
    locationSurface.style.display = '';
    // The WebGL canvas remains allocated; it is not rebuilt or destroyed on switch.
    requestAnimationFrame(() => {
      if (typeof window.mg1TopoResize_ === 'function') window.mg1TopoResize_();
    });
  }
}

function renderPeta() {
  let html = renderHeader();
  html += '<main class="app-main flex-1 min-h-0 flex flex-col gap-[10px] px-4 pt-3 pb-3">';
  // Member Peta owns the mode switcher. Do not render a second copy here.
  // The outer Peta member provides renderPetaModeSwitcher_() once.

  if (mg1PetaViewMode_ === 'topo') {
    html += renderTopographyView_();
    html += '</main>' + renderBottomNav();
    return html;
  }

  // [BARU] State loading -- muncul singkat saat tab Peta pertama kali dibuka & fetch
  // mandirinya (loadValidasiDataForMapStandalone_) masih berjalan.
  if (mapDataBusy) {
    html += renderSectionTitle('2D MAP LOKASI', 'memuat...');
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
    html += renderSectionTitle('2D MAP LOKASI', 'gagal memuat');
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

  // Title + mode switcher already rendered above.
  html += '<div id="mg1-peta-location-surface" class="flex-1 min-h-0 flex flex-col">';

  // v90.2.113: state EMPTY (poin desain #7) -- 0 TP sama sekali (bukan krn error, genuinely
  // belum ada data Validasi).
  if (mapData.length === 0) {
    html += '<div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-[#0b1329] border border-white/[0.08] p-8 text-center">' +
      icon('map','w-10 h-10 text-white/20') +
      '<div class="text-white font-bold text-sm">Belum Ada Titik TP</div>' +
      '<div class="text-[11px] text-white/40 max-w-[260px]">Data Validasi/Test Pit belum ada utk periode ini.</div>' +
    '</div>';
    html += '</div></main>' + renderBottomNav();
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
    html += '</div></main>' + renderBottomNav();
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
      '<button onclick="openKmlManagePanel_()" aria-label="Kelola KML" class="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform ' + (activeKmlOverlayIds.length > 0 ? 'bg-purple-500 border border-purple-400' : 'bg-[#0b1329]/90 border border-white/10') + '">' + icon('shapes','w-4 h-4 ' + (activeKmlOverlayIds.length > 0 ? 'text-white' : 'text-white')) + '</button>' +
    '</div>' +
    (invalidCount > 0 ? '<div class="absolute left-3 bottom-11 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">' + invalidCount + ' TP tanpa koordinat</div>' : '') +
    (mapTapState_.active ? renderMapTapInfo_() : '') +
    renderMapScaleBar(computeResponsiveDisplayBounds_(validPoints)) +
  '</div>';
  if (gpsState_.active) {
    const gpsText = gpsState_.status === 'ok'
      ? ('GPS: ' + gpsState_.lat.toFixed(6) + ', ' + gpsState_.lon.toFixed(6) + (gpsState_.accuracyM != null ? ' ±' + gpsState_.accuracyM.toFixed(0) + 'm' : ''))
      : (gpsState_.status === 'gps-only'
        ? ('GPS: ' + gpsState_.lat.toFixed(6) + ', ' + gpsState_.lon.toFixed(6) + (gpsState_.accuracyM != null ? ' ±' + gpsState_.accuracyM.toFixed(0) + 'm' : '') + ' · belum ada GeoReference')
        : (gpsState_.status === 'searching' ? 'GPS: mencari posisi...' : 'GPS: ' + (gpsState_.error || 'belum tersedia')));
    const gpsTone = (gpsState_.status === 'ok' || gpsState_.status === 'gps-only') ? 'text-cyan-300' : 'text-amber-300';
    html += '<div class="text-[10px] ' + gpsTone + ' text-center shrink-0">' + gpsText + '</div>';
  }
  html += '<div class="text-[10px] text-white/30 text-center shrink-0">Koordinat grid tambang (Timur/Utara) -- bukan GPS. Tap titik utk detail.</div>';
  html += '</div>'; // mg1-peta-location-surface
  html += '</main>';
  html += renderBottomNav();
  html += renderMapDetailModal(mapData);
  html += renderMapManagePanel_();
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

