/* ============================================================
 * MINE GEOLOGIST / LITHOSITE -- shared/geo-engine.js
 * Engine geospasial (Inverse UTM + Grid Convergence + Bearing/Distance) --
 * SATU-SATUNYA salinan, dipakai BERSAMA oleh Master (index.html root) DAN
 * Member Android (member-app/). Kalau ada bug/perbaikan rumus, dibenerin
 * DI SINI SAJA, otomatis kepakai di kedua sisi -- TIDAK ada salinan lain
 * di mana pun.
 *
 * [PARTISI -- 4 Sep, Tahap 1] Diekstrak dari Member Android (tempat pertama
 * fitur North Arrow diimplementasi & divalidasi). 0 restrukturisasi logika --
 * murni pindah teks + 1 penyesuaian desain (lihat catatan computeConvergen-
 * ceForPoint_ di bawah), fungsi lain byte-identik dgn versi asal.
 *
 * Rumus: Snyder, "Map Projections: A Working Manual" (USGS Professional
 * Paper 1395, 1987) -- domain publik, standar dipakai hampir semua konverter
 * UTM di dunia. BUKAN disalin dari Avenza/library berhak cipta manapun (APK
 * Avenza sempat dibongkar 4 Sep sbg REFERENSI ARSITEKTUR saja).
 *
 * TERVALIDASI terhadap titik nyata dari project ArcGIS "Maps_TP"/PKTD
 * (Easting 397088.5/Northing 53311.5, WGS84 UTM Zone 52N -> Convergence
 * -28.03 arcsec, cocok dgn 2 perhitungan manual independen + validasi
 * Python terpisah, selisih <1 arcsec di semua metode). CRS MG1 dikonfirmasi
 * via 3 sumber independen (screenshot ArcMap "Maps_TP", "Kordinat Plan.csv",
 * file Avenza "Yaya_Zhong_Hai_1_rev_1" -- semua WGS 1984 UTM Zone 52N).
 * ============================================================ */

function inverseUtm_(easting, northing, zone, hemisphere) {
  const a = 6378137.0;                    // WGS84 semi-major axis
  const f = 1 / 298.257223563;            // WGS84 flattening
  const k0 = 0.9996;                      // UTM scale factor standar
  const e2 = f * (2 - f);
  const e2Prime = e2 / (1 - e2);

  const falseEasting = 500000.0;
  const falseNorthing = (hemisphere === 'S') ? 10000000.0 : 0.0;
  const centralMeridian = -183.0 + zone * 6.0;

  const x = easting - falseEasting;
  const y = northing - falseNorthing;
  const M = y / k0;

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));

  const phi1 = mu
    + (3*e1/2 - 27*Math.pow(e1,3)/32) * Math.sin(2*mu)
    + (21*e1*e1/16 - 55*Math.pow(e1,4)/32) * Math.sin(4*mu)
    + (151*Math.pow(e1,3)/96) * Math.sin(6*mu)
    + (1097*Math.pow(e1,4)/512) * Math.sin(8*mu);

  const sinPhi1 = Math.sin(phi1), cosPhi1 = Math.cos(phi1), tanPhi1 = Math.tan(phi1);
  const C1 = e2Prime * cosPhi1 * cosPhi1;
  const T1 = tanPhi1 * tanPhi1;
  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * k0);

  const latRad = phi1 - (N1 * tanPhi1 / R1) * (
    D*D/2
    - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2Prime) * Math.pow(D,4)/24
    + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2Prime - 3*C1*C1) * Math.pow(D,6)/720
  );

  const lonRad = (centralMeridian * Math.PI/180) + (
    D
    - (1 + 2*T1 + C1) * Math.pow(D,3)/6
    + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2Prime + 24*T1*T1) * Math.pow(D,5)/120
  ) / cosPhi1;

  return { lat: latRad * 180/Math.PI, lon: lonRad * 180/Math.PI, centralMeridian: centralMeridian };
}

function gridConvergence_(lat, lon, centralMeridian) {
  const deltaLambda = (lon - centralMeridian) * Math.PI/180;
  const latRad = lat * Math.PI/180;
  const gammaRad = Math.atan(Math.tan(deltaLambda) * Math.sin(latRad));
  return gammaRad * 180/Math.PI;
}

// [PARTISI -- 4 Sep] Signature diubah dari (easting, northing) jadi (easting, northing,
// zone, hemisphere) -- versi asal (Member Android) baca MG1_CRS_CONFIG.zone/.hemisphere
// langsung dari variabel global, itu SPESIFIK-ANDROID, tidak cocok utk file bersama
// (Master tidak wajib punya variabel bernama sama). Sekarang murni fungsi eksplisit,
// 0 dependency ke variabel global apa pun -- pemanggil (Master ATAU Member Android)
// yang menyediakan zone/hemisphere dari config masing-masing. Perilaku/hasil angka SAMA
// PERSIS, cuma cara terima input yg berubah.
// Dipanggil LIVE tiap render, TIDAK di-cache sbg konstanta global (keputusan LOCKED
// 4 Sep: titik lain di area yg sama BISA punya convergence sedikit beda, walau utk
// 1 situs tambang bedanya biasanya <0.01 arcsec).
function computeConvergenceForPoint_(easting, northing, zone, hemisphere) {
  try {
    const geo = inverseUtm_(easting, northing, zone, hemisphere);
    const gamma = gridConvergence_(geo.lat, geo.lon, geo.centralMeridian);
    return { convergenceDeg: gamma, lat: geo.lat, lon: geo.lon, ok: true };
  } catch (e) {
    return { convergenceDeg: 0, ok: false };
  }
}

// ==== BONUS: Bearing + Distance antar 2 titik Timur/Utara (TP -> TP) ====
// Pendekatan bidang datar (planar), SAH krn jarak antar TP dlm 1 situs tambang (order
// puluhan-ratusan meter) jauh lebih kecil drpd radius bumi -- kelengkungan diabaikan tanpa
// kehilangan presisi berarti. Bearing relatif GRID NORTH (0=Utara grid, searah jarum jam).
function bearingDistanceGrid_(eastingFrom, northingFrom, eastingTo, northingTo) {
  const dE = eastingTo - eastingFrom;
  const dN = northingTo - northingFrom;
  const distance = Math.sqrt(dE*dE + dN*dN);
  let bearingDeg = Math.atan2(dE, dN) * 180/Math.PI; // atan2(Timur,Utara) -> 0=Utara, 90=Timur
  if (bearingDeg < 0) bearingDeg += 360;
  return { bearingGridDeg: bearingDeg, distanceMeters: distance };
}
