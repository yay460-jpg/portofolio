/*
 * LITHOSITE MAP MODULE — COORDINATE / GEOREFERENCE
 * STEP 9.8 extraction from locked MG1 baseline.
 * LOGIC PRESERVED; this module owns coordinate transforms, projection/datum helpers,
 * TerraGo georeference parsing, and GeoReference validation.
 */

function solveAffineTransform2D_(src, dst) {
  if (!src || !dst || src.length !== dst.length || src.length < 3) return null;
  // Pilih tiga titik non-kolinear untuk menyelesaikan enam parameter affine.
  for (let i = 0; i < src.length - 2; i++) {
    for (let j = i + 1; j < src.length - 1; j++) {
      for (let k = j + 1; k < src.length; k++) {
        const x1=src[i].x,y1=src[i].y,x2=src[j].x,y2=src[j].y,x3=src[k].x,y3=src[k].y;
        const det = x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2);
        if (Math.abs(det) < 1e-9) continue;
        const d1=dst[i],d2=dst[j],d3=dst[k];
        const solve=(v1,v2,v3)=>({
          a:(v1*(y2-y3)+v2*(y3-y1)+v3*(y1-y2))/det,
          b:(x1*(v2-v3)+x2*(v3-v1)+x3*(v1-v2))/det,
          c:(x1*(y2*v3-y3*v2)+x2*(y3*v1-y1*v3)+x3*(y1*v2-y2*v1))/det
        });
        const tx=solve(d1.x,d2.x,d3.x), ty=solve(d1.y,d2.y,d3.y);
        return { ax:tx.a,bx:tx.b,cx:tx.c, ay:ty.a,by:ty.b,cy:ty.c };
      }
    }
  }
  return null;
}

function applyAffineTransform2D_(t, p) {
  return { x:t.ax*p.x+t.bx*p.y+t.cx, y:t.ay*p.x+t.by*p.y+t.cy };
}
// STEP 8B: Inverse affine transform -- native CRS -> PDF page coordinate.
// Dipakai untuk membalik arah page-to-native saat koordinat GPS/native akan
// diproyeksikan kembali ke posisi pada GeoPDF.

function applyInverseAffineTransform2D_(t, p) {
  if (!t || !p) return null;
  const det = t.ax * t.by - t.bx * t.ay;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const dx = p.x - t.cx;
  const dy = p.y - t.cy;
  return {
    x: (t.by * dx - t.bx * dy) / det,
    y: (-t.ay * dx + t.ax * dy) / det
  };
}
// STEP 8C + STEP 11D: Composite bidirectional GeoPDF coordinate engine.
// Supports the projection families explicitly supported by projectionParamsFromCrs11C_():
// GEOGRAPHIC, WEB_MERCATOR, and TRANSVERSE_MERCATOR/UTM. Zone/hemisphere are required
// only for the TM/UTM family; geographic and Web Mercator CRS do not require them.

function wgs84ToGeoPdfPage_(geoReference, lat, lon) {
  if (!geoReference || !geoReference.crs || !geoReference.transform) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const crs=geoReference.crs, datum=String(crs.datum||'WGS84');
  const projection=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(crs.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(crs.epsg)===3857 || Number(crs.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return null;
  if (isTm && (!Number.isInteger(Number(crs.zone)) || Number(crs.zone)<1 || Number(crs.zone)>60 || !['N','S'].includes(String(crs.hemisphere||'').toUpperCase()))) return null;
  let nativeGeo={lat,lon,height:0};
  if (datum.toUpperCase()!=='WGS84') {
    const dt=geoReference.datumTransform;
    if (!dt || !dt.parameters) return null;
    nativeGeo=transformDatumWgs84To11B_(lat,lon,datum,dt.parameters);
    if (!nativeGeo) return null;
  }
  const ell=getDatumEllipsoid11B_(datum);
  if (!ell) return null;
  const native=forwardProjection11D_(nativeGeo.lat,nativeGeo.lon,crs,ell);
  if (!native || !Number.isFinite(native.easting) || !Number.isFinite(native.northing)) return null;
  const page=applyInverseAffineTransform2D_(geoReference.transform.coefficients||geoReference.transform,{x:native.easting,y:native.northing});
  if (!page) return null;
  return {lat,lon,native:{x:native.easting,y:native.northing},page};
}


function geoPdfPageToWgs84_(geoReference,pageX,pageY) {
  if (!geoReference || !geoReference.crs || !geoReference.transform) return null;
  if (!Number.isFinite(pageX) || !Number.isFinite(pageY)) return null;
  const crs=geoReference.crs, datum=String(crs.datum||'WGS84');
  const projection=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(crs.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(crs.epsg)===3857 || Number(crs.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return null;
  if (isTm && (!Number.isInteger(Number(crs.zone)) || Number(crs.zone)<1 || Number(crs.zone)>60 || !['N','S'].includes(String(crs.hemisphere||'').toUpperCase()))) return null;
  const native=applyAffineTransform2D_(geoReference.transform.coefficients||geoReference.transform,{x:pageX,y:pageY});
  if (!native || !Number.isFinite(native.x) || !Number.isFinite(native.y)) return null;
  const ell=getDatumEllipsoid11B_(datum);
  if (!ell) return null;
  const geoNative=inverseProjection11D_(native.x,native.y,crs,ell);
  if (!geoNative || !Number.isFinite(geoNative.lat) || !Number.isFinite(geoNative.lon)) return null;
  let wgs84=geoNative;
  if (datum.toUpperCase()!=='WGS84') {
    const dt=geoReference.datumTransform;
    if (!dt || !dt.parameters) return null;
    wgs84=transformDatum11BToWgs84_(geoNative.lat,geoNative.lon,datum,dt.parameters);
    if (!wgs84) return null;
  }
  return {page:{x:pageX,y:pageY},native,wgs84:{lat:wgs84.lat,lon:wgs84.lon}};
}


function validateBidirectionalGeoPdfTransform_(geoReference, points, toleranceMeters) {
  if (!geoReference || !Array.isArray(points) || !points.length) return { ok: false, reason: 'Input tidak lengkap.' };
  const tol = Number.isFinite(toleranceMeters) ? toleranceMeters : 0.1;
  let maxPageError = 0;
  let maxLatLonErrorMeters = 0;
  for (const p of points) {
    const a = wgs84ToGeoPdfPage_(geoReference, p.lat, p.lon);
    if (!a) return { ok: false, reason: 'Forward transform gagal.' };
    const b = geoPdfPageToWgs84_(geoReference, a.page.x, a.page.y);
    if (!b) return { ok: false, reason: 'Inverse transform gagal.' };
    const pageError = Math.hypot(b.native.x - a.native.x, b.native.y - a.native.y);
    const latErrorMeters = Math.abs(b.wgs84.lat - p.lat) * 111320;
    const lonScale = Math.max(Math.cos(p.lat * Math.PI / 180), 1e-6);
    const lonErrorMeters = Math.abs(b.wgs84.lon - p.lon) * 111320 * lonScale;
    const geoError = Math.hypot(latErrorMeters, lonErrorMeters);
    if (pageError > maxPageError) maxPageError = pageError;
    if (geoError > maxLatLonErrorMeters) maxLatLonErrorMeters = geoError;
  }
  return { ok: maxPageError <= tol && maxLatLonErrorMeters <= tol, maxPageError, maxLatLonErrorMeters };
}


function validateAffineTransform2D_(t, src, dst) {
  let maxError = 0;
  for (let i=0;i<src.length;i++) {
    const p=applyAffineTransform2D_(t,src[i]);
    const e=Math.hypot(p.x-dst[i].x,p.y-dst[i].y);
    if (e>maxError) maxError=e;
  }
  // GeoPDF tie points dari export raster normal harus konsisten sangat dekat; ambang 2 m
  // menjaga file dengan pembulatan metadata tetap diterima tanpa menerima transformasi rusak.
  return { ok:maxError <= 2, maxError };
}

// STEP 8D: PDF page <-> rendered VP-crop pixel coordinates.
// tryParseGeoPdf_() renders the VP area at the selected render scale, with PDF Y inverted by pdf.js.
const GEOPDF_RENDER_SCALE_ = 3.5; // STEP 7.4: dinaikkan dari 2 -- kurangi downsampling dini raster GeoPDF sblm di-crop PNG, kualitas lebih tajam saat deep-zoom. Guard memori (9C) & batas piksel/dimensi tetap menyesuaikan otomatis.
// STEP 9B: adaptive render guard for very large GeoPDF/VP areas.
const GEOPDF_MAX_RENDER_PIXELS_ = 12000000;
const GEOPDF_MAX_RENDER_DIMENSION_ = 4096;
// STEP 9C: Android memory guard. Canvas RGBA uses roughly 4 bytes/pixel, while
// PNG encoding/Data-URL and pdf.js internals temporarily need additional memory.
const GEOPDF_CANVAS_BYTES_PER_PIXEL_ = 4;
const GEOPDF_MEMORY_HEADROOM_ = 2.5;
// STEP M2: source-file preflight before ArrayBuffer/text duplication.

function getGeoPdfRenderScale_(geoReference) {
  const s = geoReference && Number(geoReference.renderScale);
  return Number.isFinite(s) && s > 0 ? s : GEOPDF_RENDER_SCALE_;
}

function geoPdfPageToPixel_(geoReference, pageX, pageY) {
  if (!geoReference || !geoReference.metadata || !Array.isArray(geoReference.metadata.vpBBox)) return null;
  if (!Number.isFinite(pageX) || !Number.isFinite(pageY)) return null;
  const b = geoReference.metadata.vpBBox;
  if (b.length !== 4 || !b.every(Number.isFinite)) return null;
  // [DIPERBAIKI -- 5 Sep, bug nyata ditemukan] SEBELUMNYA pakai b[0]/b[3] mentah, asumsikan
  // urutan vpBBox SELALU x0<x1 dan y-maksimum ada di indeks 3 -- TIDAK TERJAMIN (temuan lama:
  // beberapa GeoPDF nyata simpan y0>y1, urutan "non-standar"). Step 4 (render asli, TERBUKTI
  // benar via tes 4 file nyata) SELALU pakai Math.min/Math.max eksplisit -- disamakan di sini
  // supaya posisi GPS di layar taat pada logika crop yg SAMA dgn yg benar2 dipakai render.
  const xMin = Math.min(b[0], b[2]);
  const yMax = Math.max(b[1], b[3]);
  return { x: (pageX - xMin) * getGeoPdfRenderScale_(geoReference), y: (yMax - pageY) * getGeoPdfRenderScale_(geoReference) };
}

function geoPdfPixelToPage_(geoReference, pixelX, pixelY) {
  if (!geoReference || !geoReference.metadata || !Array.isArray(geoReference.metadata.vpBBox)) return null;
  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) return null;
  const b = geoReference.metadata.vpBBox;
  if (b.length !== 4 || !b.every(Number.isFinite)) return null;
  const xMin = Math.min(b[0], b[2]);
  const yMax = Math.max(b[1], b[3]);
  return { x: xMin + pixelX / getGeoPdfRenderScale_(geoReference), y: yMax - pixelY / getGeoPdfRenderScale_(geoReference) };
}

function validateGeoPdfPagePixelRoundTrip_(geoReference, points, tolerancePx) {
  if (!geoReference || !Array.isArray(points) || !points.length) return { ok: false, reason: 'Input tidak lengkap.' };
  const tol = Number.isFinite(tolerancePx) ? tolerancePx : 0.01;
  let maxErrorPx = 0;
  for (const p of points) {
    const px = geoPdfPageToPixel_(geoReference, p.x, p.y);
    const page = px && geoPdfPixelToPage_(geoReference, px.x, px.y);
    if (!page) return { ok: false, reason: 'Round-trip page/pixel gagal.' };
    const e = Math.hypot(page.x - p.x, page.y - p.y) * getGeoPdfRenderScale_(geoReference);
    if (e > maxErrorPx) maxErrorPx = e;
  }
  return { ok: maxErrorPx <= tol, maxErrorPx };
}

// STEP 8F: Accuracy & boundary validation for the complete coordinate chain.
// Tidak mengubah schema GeoReference; fungsi-fungsi ini hanya memvalidasi object/koordinat
// sebelum dipakai oleh GPS atau hasil tap. Tolerance default sengaja ketat untuk transform,
// tetapi tidak mengklaim akurasi GPS hardware.

function isValidGeoReferenceForCoordinate_(geoReference) {
  if (!geoReference || geoReference.schema !== 'MG1-GeoReference') return false;
  const c = geoReference.crs, t = geoReference.transform;
  const b = geoReference.metadata && geoReference.metadata.vpBBox;
  const e = geoReference.extent;
  if (!c || !t || !b || !e) return false;
  const projection=String(c.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  const isGeographic=['GEOGRAPHIC','LATLON','GEOGRAPHIC_2D'].includes(projection) || Number(c.epsg)===4326;
  const isWebMercator=['WEB_MERCATOR','MERCATOR_SPHERICAL'].includes(projection) || Number(c.epsg)===3857 || Number(c.epsg)===900913;
  const isTm=projection==='TRANSVERSE_MERCATOR' || projection==='TRANSVERSE_MERCATOR_UTM_COMPATIBLE' || projection==='UTM';
  if (!isGeographic && !isWebMercator && !isTm) return false;
  if (isTm) {
    if (!Number.isInteger(c.zone) || c.zone < 1 || c.zone > 60) return false;
    if (!['N','S'].includes(String(c.hemisphere).toUpperCase())) return false;
  }
  const k = t.coefficients || t;
  if (![k.ax,k.bx,k.cx,k.ay,k.by,k.cy].every(Number.isFinite)) return false;
  if (Math.abs(k.ax * k.by - k.bx * k.ay) < 1e-12) return false;
  if (!Array.isArray(b) || b.length !== 4 || !b.every(Number.isFinite)) return false;
  if (!e.cornerTL || !e.cornerBR) return false;
  if (![e.cornerTL.timur,e.cornerTL.utara,e.cornerBR.timur,e.cornerBR.utara].every(Number.isFinite)) return false;
  if (!(e.cornerTL.timur < e.cornerBR.timur && e.cornerTL.utara > e.cornerBR.utara)) return false;
  return true;
}


function isNativeCoordinateWithinGeoReferenceExtent_(geoReference, x, y, epsilonMeters) {
  if (!isValidGeoReferenceForCoordinate_(geoReference) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const rawEps = Number.isFinite(epsilonMeters) ? Math.max(0, epsilonMeters) : 0;
  const proj=geoReference.crs ? String(geoReference.crs.projection||'').toUpperCase() : '';
  const eps = (proj==='GEOGRAPHIC' || proj==='LATLON' || proj==='GEOGRAPHIC_2D' || Number(geoReference.crs && geoReference.crs.epsg)===4326) ? rawEps/111320 : rawEps;
  const tl = geoReference.extent.cornerTL, br = geoReference.extent.cornerBR;
  return x >= tl.timur - eps && x <= br.timur + eps && y <= tl.utara + eps && y >= br.utara - eps;
}


function validateGeoReferenceAccuracy_(geoReference, toleranceMeters, tolerancePx) {
  if (!isValidGeoReferenceForCoordinate_(geoReference)) return { ok:false, reason:'GeoReference tidak valid untuk coordinate engine.' };
  const tolM = Number.isFinite(toleranceMeters) ? toleranceMeters : 0.1;
  const tolPx = Number.isFinite(tolerancePx) ? tolerancePx : 0.01;
  const b = geoReference.metadata.vpBBox;
  const pagePoints = [
    {x:b[0],y:b[1]}, {x:b[2],y:b[1]}, {x:b[2],y:b[3]}, {x:b[0],y:b[3]},
    {x:(b[0]+b[2])/2,y:(b[1]+b[3])/2}
  ];
  let maxPageErrorUnits = 0, maxWgs84ErrorM = 0, maxPixelErrorPx = 0, outsideCount = 0;
  for (const pagePoint of pagePoints) {
    const native = applyAffineTransform2D_(geoReference.transform.coefficients || geoReference.transform, pagePoint);
    if (!native || !isNativeCoordinateWithinGeoReferenceExtent_(geoReference, native.x, native.y, 2)) outsideCount++;
    const w = geoPdfPageToWgs84_(geoReference, pagePoint.x, pagePoint.y);
    if (!w || !w.wgs84) return {ok:false, reason:'Page → WGS84 gagal.'};
    const back = wgs84ToGeoPdfPage_(geoReference, w.wgs84.lat, w.wgs84.lon);
    if (!back || !back.page) return {ok:false, reason:'WGS84 → Page gagal.'};
    const pageErrUnits = Math.hypot(back.page.x-pagePoint.x, back.page.y-pagePoint.y);
    const latErrM = (back.lat-w.wgs84.lat) * 111320;
    const lonScale = Math.max(Math.cos(w.wgs84.lat*Math.PI/180), 1e-6);
    const lonErrM = (back.lon-w.wgs84.lon) * 111320 * lonScale;
    const geoErrM = Math.hypot(latErrM, lonErrM);
    const px = geoPdfPageToPixel_(geoReference, pagePoint.x, pagePoint.y);
    const backPage = px && geoPdfPixelToPage_(geoReference, px.x, px.y);
    if (!backPage) return {ok:false, reason:'Page ↔ Pixel gagal.'};
    const pxErr = Math.hypot(backPage.x-pagePoint.x, backPage.y-pagePoint.y) * getGeoPdfRenderScale_(geoReference);
    if (pageErrUnits > maxPageErrorUnits) maxPageErrorUnits = pageErrUnits;
    if (geoErrM > maxWgs84ErrorM) maxWgs84ErrorM = geoErrM;
    if (pxErr > maxPixelErrorPx) maxPixelErrorPx = pxErr;
  }
  return {
    ok: outsideCount === 0 && maxPageErrorUnits <= 0.01 && maxWgs84ErrorM <= tolM && maxPixelErrorPx <= tolPx,
    maxPageErrorUnits, maxWgs84ErrorM, maxPixelErrorPx, outsideCount,
    toleranceMeters: tolM, tolerancePx: tolPx
  };
}

// GPS WGS84 -> native -> PDF page -> rendered pixel.

function gpsWgs84ToGeoPdfPixel_(geoReference, lat, lon) {
  if (!geoReference || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const pageResult = wgs84ToGeoPdfPage_(geoReference, lat, lon);
  if (!pageResult || !pageResult.page) return null;
  const pixel = geoPdfPageToPixel_(geoReference, pageResult.page.x, pageResult.page.y);
  if (!pixel) return null;
  return { lat, lon, native: pageResult.native, page: pageResult.page, pixel };
}


// STEP 11A: Datum detection only. This step NEVER transforms coordinates.
// Priority: explicit EPSG authority -> explicit datum/name -> TerraGo/LGI datum token.
// Unknown stays UNKNOWN; MG1 must not guess a datum.

function detectDatum11A_(input) {
  const src = input || {};
  const text = String(src.text || src.gcsText || '');
  const epsgCandidate = src.epsg;
  const epsg = (epsgCandidate !== null && epsgCandidate !== undefined && epsgCandidate !== '' && Number.isInteger(Number(epsgCandidate))) ? Number(epsgCandidate) : null;
  const projectionDatum = String(src.projectionDatum || '').trim();
  const hay = text + ' | ' + projectionDatum;
  const epsgMap = [
    { min: 32601, max: 32660, datum: 'WGS84' },
    { min: 32701, max: 32760, datum: 'WGS84' },
    { min: 26901, max: 26923, datum: 'NAD83' },
    { min: 26701, max: 26722, datum: 'NAD27' },
    { min: 25828, max: 25838, datum: 'ETRS89' },
    { min: 28348, max: 28358, datum: 'GDA94' },
    { min: 7850, max: 7859, datum: 'GDA2020' },
    { min: 31965, max: 31985, datum: 'SIRGAS2000' }
  ];
  if (epsg !== null) {
    const hit = epsgMap.find(r => epsg >= r.min && epsg <= r.max);
    if (hit) return { datum: hit.datum, status: 'recognized', confidence: 'epsg-derived', source: 'EPSG', epsg };
  }
  const patterns = [
    { datum: 'WGS84', re: /WGS[_\s-]*(?:84|1984)|D[_\s-]*WGS[_\s-]*1984|GCS[_\s-]*WGS[_\s-]*1984/i },
    { datum: 'GDA2020', re: /GDA[_\s-]*2020/i },
    { datum: 'GDA94', re: /GDA[_\s-]*94/i },
    { datum: 'NZGD2000', re: /NZGD[_\s-]*2000/i },
    { datum: 'ETRS89', re: /ETRS[_\s-]*89/i },
    { datum: 'NAD83', re: /NAD[_\s-]*83/i },
    { datum: 'NAD27', re: /NAD[_\s-]*27/i },
    { datum: 'SIRGAS2000', re: /SIRGAS[_\s-]*2000/i },
    { datum: 'DGN95', re: /DGN[_\s-]*95|Datum[_\s-]*Geodesi[_\s-]*Nasional[_\s-]*1995/i },
    { datum: 'ID74', re: /(?:\bID[_\s-]*74\b|Indonesian[_\s-]*Datum[_\s-]*1974)/i },
    { datum: 'ED50', re: /\bED[_\s-]*50\b|European[_\s-]*Datum[_\s-]*1950/i },
    { datum: 'Arc1960', re: /Arc[_\s-]*1960/i },
    { datum: 'OSGB36', re: /OSGB[_\s-]*36/i },
    { datum: 'Tokyo', re: /Tokyo[_\s-]*Datum/i },
    { datum: 'CH1903', re: /CH1903/i }
  ];
  const hit = patterns.find(item => item.re.test(hay));
  if (hit) return { datum: hit.datum, status: 'recognized', confidence: 'explicit-name', source: 'GCS_WKT_OR_LGI', epsg };
  return { datum: 'UNKNOWN', status: 'unknown', confidence: 'none', source: 'NO_EXPLICIT_DATUM', epsg };
}

// STEP 11B: Generic datum transformation engine.
// Prinsip: WGS84 <-> datum target dilakukan di geocentric XYZ memakai Helmert
// 3/7-parameter bila parameter transformasi dinyatakan eksplisit oleh metadata.
// Tidak ada datum shift yang ditebak dari nama datum saja.

function getDatumEllipsoid11B_(datum) {
  const d = String(datum || '').toUpperCase();
  const map = {
    WGS84: { a: 6378137.0, invF: 298.257223563 },
    NAD83: { a: 6378137.0, invF: 298.257222101 },
    GRS80: { a: 6378137.0, invF: 298.257222101 },
    ETRS89: { a: 6378137.0, invF: 298.257222101 },
    GDA94: { a: 6378137.0, invF: 298.257222101 },
    GDA2020: { a: 6378137.0, invF: 298.257222101 },
    SIRGAS2000: { a: 6378137.0, invF: 298.257222101 },
    NZGD2000: { a: 6378137.0, invF: 298.257222101 },
    NAD27: { a: 6378206.4, invF: 294.9786982 },
    ED50: { a: 6378388.0, invF: 297.0 },
    OSGB36: { a: 6377563.396, invF: 299.3249646 },
    TOKYO: { a: 6377397.155, invF: 299.1528128 },
    CH1903: { a: 6377397.155, invF: 299.1528128 }
  };
  return map[d] || null;
}


function parseTowgs84Parameters11B_(text) {
  const m = String(text || '').match(/TOWGS84\s*\[([^\]]+)\]/i);
  if (!m) return null;
  const v = (m[1].match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || []).map(Number);
  if (v.length < 3 || v.length > 7 || v.some(x => !Number.isFinite(x))) return null;
  return { dx:v[0], dy:v[1], dz:v[2], rxArcSec:v[3] || 0, ryArcSec:v[4] || 0, rzArcSec:v[5] || 0, dsPpm:v[6] || 0, source:'TOWGS84' };
}


function geodeticToEcef11B_(lat, lon, h, ellipsoid) {
  if (!ellipsoid || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f);
  const p=lat*Math.PI/180, l=lon*Math.PI/180, sinP=Math.sin(p), cosP=Math.cos(p);
  const N=a/Math.sqrt(1-e2*sinP*sinP);
  const H=Number.isFinite(h)?h:0;
  return { x:(N+H)*cosP*Math.cos(l), y:(N+H)*cosP*Math.sin(l), z:(N*(1-e2)+H)*sinP };
}


function ecefToGeodetic11B_(xyz, ellipsoid) {
  if (!xyz || !ellipsoid) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f), x=xyz.x,y=xyz.y,z=xyz.z;
  const p=Math.hypot(x,y);
  if (!Number.isFinite(p) || !Number.isFinite(z)) return null;
  let lat=Math.atan2(z,p*(1-e2));
  for (let i=0;i<12;i++) {
    const sin=Math.sin(lat), N=a/Math.sqrt(1-e2*sin*sin);
    const next=Math.atan2(z+e2*N*sin,p);
    if (Math.abs(next-lat)<1e-13) { lat=next; break; }
    lat=next;
  }
  const sin=Math.sin(lat), N=a/Math.sqrt(1-e2*sin*sin);
  const h=p/Math.max(Math.cos(lat),1e-15)-N;
  const lon=Math.atan2(y,x);
  return { lat:lat*180/Math.PI, lon:lon*180/Math.PI, height:h };
}


function helmert11B_(xyz, params, inverse) {
  if (!xyz || !params) return null;
  const secToRad=Math.PI/(180*3600), s=1+(Number(params.dsPpm)||0)*1e-6;
  const rx=(Number(params.rxArcSec)||0)*secToRad, ry=(Number(params.ryArcSec)||0)*secToRad, rz=(Number(params.rzArcSec)||0)*secToRad;
  let X=xyz.x,Y=xyz.y,Z=xyz.z;
  let dx=Number(params.dx)||0,dy=Number(params.dy)||0,dz=Number(params.dz)||0;
  if (inverse) {
    X=(X-dx)/s; Y=(Y-dy)/s; Z=(Z-dz)/s;
    return { x:X+rz*Y-ry*Z, y:Y-rz*X+rx*Z, z:Z+ry*X-rx*Y };
  }
  return { x:dx+s*(X-rz*Y+ry*Z), y:dy+s*(rz*X+Y-rx*Z), z:dz+s*(-ry*X+rx*Y+Z) };
}

// STEP 11C: Generalized Transverse Mercator projection engine.
// UTM adalah konfigurasi khusus TM; wrapper 11B di bawah tetap mempertahankan
// kontrak lama, tetapi sekarang parameter central meridian/scale/false origins
// dapat dipakai eksplisit tanpa mengubah datum engine.

function forwardTransverseMercator11C_(lat, lon, ellipsoid, params) {
  if (!ellipsoid || !params || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const a=ellipsoid.a, f=1/ellipsoid.invF, e2=f*(2-f), ep2=e2/(1-e2);
  const k0=Number.isFinite(params.scaleFactor) ? params.scaleFactor : 0.9996;
  const fe=Number.isFinite(params.falseEasting) ? params.falseEasting : 500000;
  const fn=Number.isFinite(params.falseNorthing) ? params.falseNorthing : 0;
  const cm=Number(params.centralMeridian);
  if (!Number.isFinite(cm) || !Number.isFinite(k0) || k0<=0) return null;
  const p=lat*Math.PI/180,l=lon*Math.PI/180,l0=cm*Math.PI/180;
  const sin=Math.sin(p),cos=Math.cos(p),tan=Math.tan(p),N=a/Math.sqrt(1-e2*sin*sin),T=tan*tan,C=ep2*cos*cos,A=cos*(l-l0);
  const M=a*((1-e2/4-3*e2*e2/64-5*e2*e2*e2/256)*p-(3*e2/8+3*e2*e2/32+45*e2*e2*e2/1024)*Math.sin(2*p)+(15*e2*e2/256+45*e2*e2*e2/1024)*Math.sin(4*p)-(35*e2*e2*e2/3072)*Math.sin(6*p));
  return {easting:fe+k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep2)*A**5/120),northing:fn+k0*(M+N*tan*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep2)*A**6/720))};
}

function inverseTransverseMercator11C_(easting,northing,ellipsoid,params) {
  if (!ellipsoid || !params || !Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const a=ellipsoid.a,f=1/ellipsoid.invF,e2=f*(2-f),ep2=e2/(1-e2);
  const k0=Number.isFinite(params.scaleFactor) ? params.scaleFactor : 0.9996;
  const fe=Number.isFinite(params.falseEasting) ? params.falseEasting : 500000;
  const fn=Number.isFinite(params.falseNorthing) ? params.falseNorthing : 0;
  const cm=Number(params.centralMeridian);
  if (!Number.isFinite(cm) || !Number.isFinite(k0) || k0<=0) return null;
  const x=easting-fe,y=northing-fn,M=y/k0,e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2)),mu=M/(a*(1-e2/4-3*e2*e2/64-5*e2*e2*e2/256));
  const p1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)+(1097*e1**4/512)*Math.sin(8*mu);
  const sp=Math.sin(p1),cp=Math.cos(p1),tp=Math.tan(p1),C=ep2*cp*cp,T=tp*tp,N=a/Math.sqrt(1-e2*sp*sp),R=a*(1-e2)/Math.pow(1-e2*sp*sp,1.5),D=x/(N*k0);
  const lat=p1-(N*tp/R)*(D*D/2-(5+3*T+10*C-4*C*C-9*ep2)*D**4/24+(61+90*T+298*C+45*T*T-252*ep2-3*C*C)*D**6/720);
  const lon=cm*Math.PI/180+(D-(1+2*T+C)*D**3/6+(5-2*C+28*T-3*C*C+8*ep2+24*T*T)*D**5/120)/cp;
  return {lat:lat*180/Math.PI,lon:lon*180/Math.PI};
}

function projectionParamsFromCrs11C_(crs) {
  if (!crs) return null;
  const type=String(crs.projection||'TRANSVERSE_MERCATOR').toUpperCase();
  if (type==='GEOGRAPHIC' || type==='LATLON' || type==='GEOGRAPHIC_2D' || Number(crs.epsg)===4326) return { type:'GEOGRAPHIC' };
  if (type==='WEB_MERCATOR' || type==='MERCATOR_SPHERICAL' || Number(crs.epsg)===3857 || Number(crs.epsg)===900913) return { type:'WEB_MERCATOR' };
  const zone=Number(crs.zone);
  const cm=Number.isFinite(Number(crs.centralMeridian)) ? Number(crs.centralMeridian) : (zone>=1&&zone<=60 ? -183+zone*6 : null);
  const hemisphere=String(crs.hemisphere||'N').toUpperCase();
  if (!Number.isFinite(cm) || !['N','S'].includes(hemisphere)) return null;
  return { type:'TRANSVERSE_MERCATOR', centralMeridian:cm, scaleFactor:Number.isFinite(Number(crs.scaleFactor))&&Number(crs.scaleFactor)>0?Number(crs.scaleFactor):0.9996, falseEasting:Number.isFinite(Number(crs.falseEasting))?Number(crs.falseEasting):500000, falseNorthing:Number.isFinite(Number(crs.falseNorthing))?Number(crs.falseNorthing):(hemisphere==='S'?10000000:0) };
}

function forwardWebMercator11D_(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>=90) return null;
  const R=6378137, maxLat=85.0511287798066, clamped=Math.max(-maxLat,Math.min(maxLat,lat));
  const p=clamped*Math.PI/180;
  return {easting:R*lon*Math.PI/180,northing:R*Math.log(Math.tan(Math.PI/4+p/2))};
}

function inverseWebMercator11D_(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const R=6378137;
  const lat=(2*Math.atan(Math.exp(northing/R))-Math.PI/2)*180/Math.PI;
  const lon=easting/R*180/Math.PI;
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null;
}

function forwardProjection11D_(lat,lon,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  if (!p) return null;
  if (p.type==='GEOGRAPHIC') return {easting:lon,northing:lat};
  if (p.type==='WEB_MERCATOR') return forwardWebMercator11D_(lat,lon);
  return forwardTransverseMercator11C_(lat,lon,ellipsoid,p);
}

function inverseProjection11D_(easting,northing,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  if (!p) return null;
  if (p.type==='GEOGRAPHIC') return {lat:northing,lon:easting};
  if (p.type==='WEB_MERCATOR') return inverseWebMercator11D_(easting,northing);
  return inverseTransverseMercator11C_(easting,northing,ellipsoid,p);
}

function forwardUtmEllipsoid11B_(lat, lon, zone, hemisphere, ellipsoid) {
  const params=projectionParamsFromCrs11C_({zone,hemisphere,centralMeridian:-183+zone*6,scaleFactor:0.9996,falseEasting:500000,falseNorthing:hemisphere==='S'?10000000:0});
  return forwardTransverseMercator11C_(lat,lon,ellipsoid,params);
}

function inverseUtmEllipsoid11B_(easting,northing,zone,hemisphere,ellipsoid) {
  const params=projectionParamsFromCrs11C_({zone,hemisphere,centralMeridian:-183+zone*6,scaleFactor:0.9996,falseEasting:500000,falseNorthing:hemisphere==='S'?10000000:0});
  return inverseTransverseMercator11C_(easting,northing,ellipsoid,params);
}

function forwardProjection11C_(lat,lon,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  return p ? forwardTransverseMercator11C_(lat,lon,ellipsoid,p) : null;
}

function inverseProjection11C_(easting,northing,crs,ellipsoid) {
  const p=projectionParamsFromCrs11C_(crs);
  return p ? inverseTransverseMercator11C_(easting,northing,ellipsoid,p) : null;
}


function transformDatumWgs84To11B_(lat, lon, targetDatum, params) {
  const target=getDatumEllipsoid11B_(targetDatum), wgs=getDatumEllipsoid11B_('WGS84');
  if (!target || !wgs || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (String(targetDatum).toUpperCase()==='WGS84') return {lat,lon,height:0,method:'IDENTITY'};
  if (!params) return null;
  const wgsXyz=geodeticToEcef11B_(lat,lon,0,wgs);
  const targetXyz=helmert11B_(wgsXyz,params,true);
  return ecefToGeodetic11B_(targetXyz,target);
}


function transformDatum11BToWgs84_(lat, lon, sourceDatum, params) {
  const source=getDatumEllipsoid11B_(sourceDatum), wgs=getDatumEllipsoid11B_('WGS84');
  if (!source || !wgs || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (String(sourceDatum).toUpperCase()==='WGS84') return {lat,lon,height:0,method:'IDENTITY'};
  if (!params) return null;
  const srcXyz=geodeticToEcef11B_(lat,lon,0,source);
  const wgsXyz=helmert11B_(srcXyz,params,false);
  return ecefToGeodetic11B_(wgsXyz,wgs);
}


function datumDetectionIsWgs84_11A_(detection) {
  return !!detection && String(detection.datum || '').toUpperCase() === 'WGS84';
}


// STEP 9A: GeoPDF Neatline / map-frame boundary.
// Neatline adalah batas valid georegistration pada PDF page. Implementasi ini
// sengaja memakai data publik GeoPDF/OGC dan tidak meniru kode proprietary Avenza.















// STEP 10E: Multi-Viewport / Multi-Map-Frame handling.
// Satu PDF dapat memiliki beberapa Viewport/Measure pair (mis. main map + inset map).
// MG1 tetap menyimpan satu GeoReference aktif untuk satu background map, tetapi sebelum
// memilih frame kita enumerasi semua kandidat valid agar tidak lagi bergantung pada [0].
// Primary frame dipilih deterministik: kandidat dengan area viewport terbesar.

function parseTerraGoProjection10A_(body, fullText) {
  const b = pdfValue10A_(body, 'Projection');
  if (!b) return null;
  const p = b.raw.startsWith('<<') ? b.raw : (pdfRefObject10A_(fullText, b.raw) || '');
  if (!p) return null;
  return {
    type: pdfString10A_(p, 'ProjectionType') || 'NONE',
    datum: pdfString10A_(p, 'Datum') || '',
    hemisphere: (pdfString10A_(p, 'Hemisphere') || '').toUpperCase() || null,
    zone: pdfScalar10A_(p, 'Zone'),
    centralMeridian: pdfScalar10A_(p, 'CentralMeridian'),
    falseEasting: pdfScalar10A_(p, 'FalseEasting'),
    falseNorthing: pdfScalar10A_(p, 'FalseNorthing'),
    scaleFactor: pdfScalar10A_(p, 'ScaleFactor')
  };
}

function parseTerraGoRegistration10A_(raw) {
  if (!raw) return [];
  const groups = [];
  const re = /\[([^\[\]]+)\]/g;
  let m;
  while ((m = re.exec(raw))) {
    const n = pdfNums10A_(m[1]);
    if (n.length >= 4) groups.push({ pdf: { x:n[0], y:n[1] }, map:{ x:n[2], y:n[3] } });
  }
  return groups;
}

function parseTerraGoNeatline10A_(raw) {
  const n = pdfNums10A_(raw);
  if (n.length < 4 || n.length % 2) return null;
  const pts = [];
  for (let i=0;i<n.length;i+=2) pts.push({x:n[i],y:n[i+1]});
  if (pts.length === 2) {
    const a=pts[0], b=pts[1];
    return [{x:a.x,y:a.y},{x:a.x,y:b.y},{x:b.x,y:b.y},{x:b.x,y:a.y}];
  }
  return pts;
}

function terraGoCtmToAffine10A_(ctm) {
  if (!Array.isArray(ctm) || ctm.length !== 6 || ctm.some(v => !Number.isFinite(v))) return null;
  return { ax:ctm[0], bx:ctm[2], cx:ctm[4], ay:ctm[1], by:ctm[3], cy:ctm[5] };
}

function parseTerraGoLgi10A_(text) {
  const frames=[];
  const objectRe=/(?:^|\n|\r)\s*(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj\b/g;
  let m;
  while ((m=objectRe.exec(text||''))) {
    if (/\/Type\s+\/LGIDict\b/i.test(m[2])) frames.push({objectNumber:Number(m[1]),text:m[2]});
  }
  if (!frames.length) return {ok:false,reason:'Tidak ditemukan /LGIDict TerraGo/LGI.'};
  const parsed=[];
  for (const frame of frames) {
    const body=frame.text;
    const ctmBlock=pdfValue10A_(body,'CTM');
    const ctm=ctmBlock ? pdfNums10A_(ctmBlock.raw) : [];
    const registration=parseTerraGoRegistration10A_((pdfValue10A_(body,'Registration')||{}).raw);
    const neatline=parseTerraGoNeatline10A_((pdfValue10A_(body,'Neatline')||{}).raw);
    const projection=parseTerraGoProjection10A_(body,text);
    let affine=terraGoCtmToAffine10A_(ctm);
    if (!affine && registration.length >= 3) affine=solveAffineTransform2D_(registration.map(p=>p.pdf),registration.map(p=>p.map));
    if (!affine || !projection) continue;
    const ptype=String(projection.type||'').toUpperCase();
    if (ptype !== 'UT' || !Number.isInteger(projection.zone) || projection.zone<1 || projection.zone>60 || !['N','S'].includes(projection.hemisphere)) continue;
    const vp=neatline && neatline.length ? [Math.min(...neatline.map(p=>p.x)),Math.min(...neatline.map(p=>p.y)),Math.max(...neatline.map(p=>p.x)),Math.max(...neatline.map(p=>p.y))] : (registration.length ? [Math.min(...registration.map(p=>p.pdf.x)),Math.min(...registration.map(p=>p.pdf.y)),Math.max(...registration.map(p=>p.pdf.x)),Math.max(...registration.map(p=>p.pdf.y))] : null);
    if (!vp) continue;
    const native=neatline ? neatline.map(p=>applyAffineTransform2D_(affine,p)) : [];
    const boundary=native.length>=3 ? {type:'neatline',source:'TERRAGO_LGI_NEATLINE',pagePoints:neatline,nativePoints:native,extent:{cornerTL:{timur:Math.min(...native.map(p=>p.x)),utara:Math.max(...native.map(p=>p.y))},cornerBR:{timur:Math.max(...native.map(p=>p.x)),utara:Math.min(...native.map(p=>p.y))}}} : null;
    const datum=projection.datum==='WE'?'WGS84':(projection.datum||'UNKNOWN');
    parsed.push({objectNumber:frame.objectNumber,description:pdfString10A_(body,'Description')||'',version:pdfString10A_(body,'Version'),projection,affine,registration,neatline,boundary,vpBBox:vp,crs:{datum,zone:projection.zone,hemisphere:projection.hemisphere,epsg:datum==='WGS84'?(projection.hemisphere==='N'?32600+projection.zone:32700+projection.zone):null,name:'TerraGo/LGI UTM Zone '+projection.zone+projection.hemisphere,centralMeridian:projection.centralMeridian,falseEasting:projection.falseEasting,falseNorthing:projection.falseNorthing,scaleFactor:projection.scaleFactor}});
  }
  if (!parsed.length) return {ok:false,reason:'LGIDict ditemukan, tetapi belum ada map frame TerraGo/LGI UTM yang dapat dipakai aman oleh engine MG1.'};
  return {ok:true,frames:parsed,frame:parsed[0]};
}

// STEP 9A: GeoPDF Neatline / map-frame boundary.
// Neatline adalah batas valid georegistration pada PDF page. Implementasi ini
// sengaja memakai data publik GeoPDF/OGC dan tidak meniru kode proprietary Avenza.

function parseNeatlineCandidates_(text) {
  const out = [];
  if (!text) return out;
  const re = /\/Neatline\s*\[\s*([^\]]+?)\s*\]/gi;
  let m;
  while ((m = re.exec(text))) {
    const nums = m[1].trim().split(/\s+/).map(Number);
    if (nums.length < 8 || nums.length % 2 !== 0 || nums.some(v => !Number.isFinite(v))) continue;
    const points = [];
    for (let i = 0; i < nums.length; i += 2) points.push({ x: nums[i], y: nums[i + 1] });
    out.push(points);
  }
  return out;
}


function selectGeoPdfNeatline_(candidates, vpBBox) {
  if (!Array.isArray(candidates) || !candidates.length || !Array.isArray(vpBBox) || vpBBox.length < 4) return null;
  const vx0 = Math.min(vpBBox[0], vpBBox[2]), vx1 = Math.max(vpBBox[0], vpBBox[2]);
  const vy0 = Math.min(vpBBox[1], vpBBox[3]), vy1 = Math.max(vpBBox[1], vpBBox[3]);
  let best = null, bestScore = -Infinity;
  for (const points of candidates) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const px0 = Math.min(...xs), px1 = Math.max(...xs), py0 = Math.min(...ys), py1 = Math.max(...ys);
    const iw = Math.max(0, Math.min(vx1, px1) - Math.max(vx0, px0));
    const ih = Math.max(0, Math.min(vy1, py1) - Math.max(vy0, py0));
    const interArea = iw * ih;
    const pArea = Math.max(1e-9, (px1 - px0) * (py1 - py0));
    const vArea = Math.max(1e-9, (vx1 - vx0) * (vy1 - vy0));
    const centerInside = ((px0 + px1) / 2 >= vx0 && (px0 + px1) / 2 <= vx1 &&
      (py0 + py1) / 2 >= vy0 && (py0 + py1) / 2 <= vy1) ? 1 : 0;
    const score = (interArea / Math.max(pArea, vArea)) + centerInside * 0.25;
    if (score > bestScore) { bestScore = score; best = points; }
  }
  return best ? best.map(p => ({ x: p.x, y: p.y })) : null;
}


function buildGeoPdfBoundary_(neatlinePagePoints, affine) {
  if (!Array.isArray(neatlinePagePoints) || neatlinePagePoints.length < 4 || !affine) return null;
  const nativePoints = neatlinePagePoints.map(p => applyAffineTransform2D_(affine, p)).filter(Boolean);
  if (nativePoints.length !== neatlinePagePoints.length) return null;
  const xs = nativePoints.map(p => p.x), ys = nativePoints.map(p => p.y);
  return {
    type: 'neatline',
    source: 'GEOPDF_NEATLINE',
    pagePoints: neatlinePagePoints.map(p => ({ x: p.x, y: p.y })),
    nativePoints: nativePoints.map(p => ({ x: p.x, y: p.y })),
    extent: {
      cornerTL: { timur: Math.min(...xs), utara: Math.max(...ys) },
      cornerBR: { timur: Math.max(...xs), utara: Math.min(...ys) }
    }
  };
}


function isPointInsidePolygon_(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}


function isNativeCoordinateInsideGeoPdfBoundary_(geoReference, x, y, epsilonMeters) {
  const b = geoReference && geoReference.boundary;
  if (!b || b.type !== 'neatline' || !Array.isArray(b.nativePoints) || b.nativePoints.length < 3) return true;
  const eps = Number.isFinite(epsilonMeters) ? Math.max(0, epsilonMeters) : 0;
  if (isPointInsidePolygon_({ x, y }, b.nativePoints)) return true;
  // Boundary vertex/edge tolerance: accept a small distance to the polygon bbox first.
  const ex = b.extent;
  if (ex && x >= ex.cornerTL.timur - eps && x <= ex.cornerBR.timur + eps &&
      y <= ex.cornerTL.utara + eps && y >= ex.cornerBR.utara - eps) {
    return isPointInsidePolygon_({ x: x + eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x: x - eps, y }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y + eps }, b.nativePoints) ||
           isPointInsidePolygon_({ x, y: y - eps }, b.nativePoints);
  }
  return false;
}



function buildGeoReferenceObject_(args) {
  const {
    sourceFileName, measureSubtype, gcsObjectNumber, vpBBox, gpts, lpts,
    coordinateType, crs, crsSource, transform, residualM, extent, mapFrame, boundary, datumTransform, datumDetection
  } = args;

  return {
    schema: 'MG1-GeoReference',
    version: 1,
    source: {
      type: 'GeoPDF',
      fileName: sourceFileName || '',
      measureSubtype: measureSubtype || 'GEO',
      gcsObjectNumber: gcsObjectNumber || null
    },
    metadata: {
      gpts: gpts.slice(),
      lpts: lpts.slice(),
      vpBBox: vpBBox.slice(),
      coordinateType: coordinateType || 'projected'
    },
    transform: {
      type: 'affine-2d',
      direction: 'page-to-native',
      coefficients: {
        ax: transform.ax, bx: transform.bx, cx: transform.cx,
        ay: transform.ay, by: transform.by, cy: transform.cy
      },
      validation: {
        maxResidualMeters: residualM
      }
    },
    crs: {
      datum: crs.datum || 'UNKNOWN',
      zone: crs.zone ?? null,
      hemisphere: crs.hemisphere || null,
      epsg: crs.epsg ?? null,
      name: crs.name || '',
      centralMeridian: crs.centralMeridian ?? null,
      falseEasting: crs.falseEasting ?? null,
      falseNorthing: crs.falseNorthing ?? null,
      scaleFactor: crs.scaleFactor ?? null,
      projection: crs.projection || 'TRANSVERSE_MERCATOR_UTM_COMPATIBLE',
      nativeUnits: crs.nativeUnits || ((String(crs.projection||'').toUpperCase()==='GEOGRAPHIC') ? 'degrees' : 'meters'),
      source: crsSource
    },
    datumTransform: datumTransform ? {
      method: datumTransform.method || 'HELMERT',
      sourceDatum: datumTransform.sourceDatum || null,
      targetDatum: datumTransform.targetDatum || null,
      parameters: datumTransform.parameters || null,
      status: datumTransform.status || 'available',
      source: datumTransform.source || 'EXPLICIT_METADATA'
    } : null,
    datumDetection: datumDetection ? {
      datum: datumDetection.datum || 'UNKNOWN',
      status: datumDetection.status || 'unknown',
      confidence: datumDetection.confidence || 'none',
      source: datumDetection.source || 'NO_EXPLICIT_DATUM',
      epsg: datumDetection.epsg ?? null
    } : null,
    extent: {
      cornerTL: { timur: extent.cornerTL.timur, utara: extent.cornerTL.utara },
      cornerBR: { timur: extent.cornerBR.timur, utara: extent.cornerBR.utara }
    },
    mapFrame: mapFrame ? {
      candidateCount: Number(mapFrame.candidateCount) || 1,
      selectedIndex: Number(mapFrame.selectedIndex) || 0,
      selection: mapFrame.selection || 'largest-viewport'
    } : null,
    boundary: boundary ? {
      type: boundary.type || 'neatline',
      source: boundary.source || 'GEOPDF_NEATLINE',
      pagePoints: (boundary.pagePoints || []).map(p => ({ x: p.x, y: p.y })),
      nativePoints: (boundary.nativePoints || []).map(p => ({ x: p.x, y: p.y })),
      extent: boundary.extent ? {
        cornerTL: { timur: boundary.extent.cornerTL.timur, utara: boundary.extent.cornerTL.utara },
        cornerBR: { timur: boundary.extent.cornerBR.timur, utara: boundary.extent.cornerBR.utara }
      } : null
    } : null
  };
}

function projectToSvg(timur, utara, bounds, viewW, viewH) {
  const rangeT = bounds.maxT - bounds.minT, rangeU = bounds.maxU - bounds.minU;
  const x = ((timur - bounds.minT) / rangeT) * viewW;
  const y = viewH - (((utara - bounds.minU) / rangeU) * viewH);
  return { x, y };
}

