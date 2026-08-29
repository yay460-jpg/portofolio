// ==== PRODUKSI.js -- v90.2.120 ====

 function canManagePitActual() {
 return isDeveloperUnlocked();
 }

async function provisionExistingCredential(index, userId) {
 const loginEl = document.getElementById('cred-login-' + index);
 const pinEl = document.getElementById('cred-pin-' + index);
 const loginId = (loginEl?.value || '').trim();
 const pin = String(pinEl?.value || '').replace(/\D/g, '').slice(0, 6);
 if (!/^[A-Za-z0-9._-]{3,40}$/.test(loginId)) {
  setCredentialManagerStatus(currentLang === 'en' ? 'Login_ID must be 3-40 characters and use only letters, numbers, dot, underscore, or hyphen.' : 'Login_ID harus 3-40 karakter dan hanya huruf, angka, titik, garis bawah, atau tanda minus.', false);
  loginEl?.focus();
  return;
 }
 if (!/^\d{6}$/.test(pin)) {
  setCredentialManagerStatus(currentLang === 'en' ? 'PIN must be exactly 6 digits.' : 'PIN harus tepat 6 digit angka.', false);
  pinEl?.focus();
  return;
 }
 try {
  const result = await postCentralAuthenticated({
   action: 'provisionExistingCredential',
   user_id: userId,
   login_id: loginId,
   pin: pin
  }, { developerOnly: true });
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'));
  setCredentialManagerStatus((currentLang === 'en' ? 'Credential created for ' : 'Credential berhasil dibuat untuk ') + userId + ' (' + result.credential_id + ').', true);
  await loadCredentialProvisionCandidates();
 } catch (err) {
  console.error('Provision credential:', err);
  setCredentialManagerStatus(err.message || (currentLang === 'en' ? 'Credential creation failed.' : 'Credential gagal dibuat.'), false);
 } finally {
  if (pinEl) pinEl.value = '';
 }
}

// SECURITY 90V: Toggle visibility PIN Member / Konfirmasi PIN.
 // Listener dipasang di script dashboard utama, BUKAN di dalam template export/Word.
 document.addEventListener('click', function (event) {
  const btn = event.target.closest('[data-toggle-pin]');
  if (!btn) return;
  const form = btn.closest('form');
  const fieldName = btn.getAttribute('data-toggle-pin');
  let input = form ? form.querySelector('input[name="' + fieldName + '"]') : null;
  if (!input) input = document.getElementById(fieldName);
  if (!input) return;

  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.setAttribute('aria-label', show ? (currentLang === 'en' ? 'Hide PIN' : 'Sembunyikan PIN') : (currentLang === 'en' ? 'Show PIN' : 'Tampilkan PIN'));
  btn.setAttribute('title', show ? (currentLang === 'en' ? 'Hide PIN' : 'Sembunyikan PIN') : (currentLang === 'en' ? 'Show PIN' : 'Tampilkan PIN'));
  btn.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" class="w-4 h-4 pointer-events-none"></i>';
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  input.focus();
 });

 // JSA (Job Safety Analysis) - Mine Geologist, disimpan sebagai string HTML mandiri
 // supaya bisa dirender lewat iframe (srcdoc) tanpa mengubah struktur aslinya sedikit pun.
 // Sumber: file JSA.html terpisah, ditempel di sini persis apa adanya.
 // CATATAN: tag penutup script di dalam string DIESCAPE dengan backslash sebelum garis miring -- WAJIB,
 // kalau tidak browser akan salah baca itu sebagai penutup blok <script> dashboard ini.
 const JSA_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Safety Analysis - Mine Geologist</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    @media print {
      body { padding: 0; background-color: white; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body class="bg-gray-50 text-neutral-900 font-sans p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">

  <!-- HALAMAN 1: HEADER & OVERVIEW PEKERJAAN -->
  <div class="bg-white border-2 border-black p-4 shadow-sm">
    <!-- Header Utama -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b-2 border-black">
      <div class="md:col-span-8 flex items-start gap-4">
        <div class="bg-[#0f1a3d] text-white font-black text-2xl p-3 rounded shrink-0">GB</div>
        <div>
          <div class="flex flex-wrap items-center gap-2 text-xs font-bold mb-1">
            <span class="bg-[#0f1a3d] text-white px-2.5 py-1 rounded">NO: JSA-MINEGEO-2026-REV02</span>
            <span class="bg-[#0f1a3d] text-white px-2.5 py-1 rounded tracking-widest uppercase">No Ore is Worth Your Life • GEO NICKEL LATERITE</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black leading-tight uppercase mt-0.5">JOB SAFETY ANALYSIS <span class="text-lg font-bold text-red-700 align-middle">DIVISION MINE GEOLOGIST</span></h1>
          
          <div class="flex flex-wrap gap-2 mt-3 text-xs font-bold">
            <span class="border border-black px-2.5 py-1 rounded">📍 PIT. STOCKPILE & JETTY</span>
            <span class="border border-black px-2.5 py-1 rounded" id="dateBadge">📅 <span id="jsa-tgl">..</span>/<span id="jsa-bln">..</span>/<span id="jsa-thn">....</span> (<span id="jsa-hari">.....</span>) 🕐 <span id="jsa-jam">..:..</span></span>
          </div>
        </div>
      </div>

      <div class="md:col-span-4 border-t md:border-t-0 md:border-l border-black pt-3 md:pt-0 md:pl-4 text-xs space-y-1.5">
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DEPARTEMEN:</span> <span class="font-semibold">Geology & Mine Planning</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DISUSUN OLEH:</span> <span class="font-semibold">Superintendent Mine Geologist</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DIPERIKSA OLEH:</span> <span class="font-semibold">Superintendent K3 & Geotech</span></div>
        <div class="flex justify-between"><span class="font-bold text-neutral-600">DISETUJUI OLEH:</span> <span class="font-semibold">Mine Manager / KTT</span></div>
        <div class="mt-2 bg-red-100 border border-red-700 text-red-800 font-bold p-1.5 text-center text-[11px] rounded uppercase">
          ⚠️ DOKUMEN WAJIB DI TOOLBOX MEETING
        </div>
      </div>
    </div>

    <!-- Ringkasan Pekerjaan, Alat & APD -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 text-xs">
      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">📋 DESKRIPSI PEKERJAAN</h3>
        <p class="text-justify leading-relaxed text-neutral-800">
          Pekerjaan Mine Geologist mencakup validasi block model, pengambilan sampel grade control (saprolit/limonit), supervisi penggalian excavator & dump truck, pengelolaan material, pengawasan barging shipment, pelabelan ID sampel & chain of custody, entry data di dashboard MINE GEOLOGIST, serta handling preparasi sampel untuk analisa kimia Ni, Fe, SiO2, MgO, Co di area pit aktif & jetty dengan risiko tinggi heavy equipment, geotechnical, dan marine operations.
        </p>
      </div>

      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">📦 ALAT & MATERIAL</h3>
        <ul class="list-disc list-inside space-y-1 text-neutral-800 leading-tight">
          <li>Light Vehicle 4x4, Radio HT, GPS Handheld</li>
          <li>Cangkul, Linggis, Sekop, Kantong Sampel, Spidol Permanen</li>
          <li>Peta Grade Control, Patok Batas, Roll Meter, Kompas</li>
          <li>Tablet Dashboard MINE GEOLOGIST, Form CoC, Kamera</li>
          <li>Peralatan Lab: Crusher, Splitter, Oven, Timbangan</li>
          <li>Rambu, Cone, Bendera Buggy Whip, APAR 3kg di LV</li>
        </ul>
      </div>

      <div class="md:col-span-4">
        <h3 class="font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">🛡️ APD WAJIB (MINIMUM)</h3>
        <div class="grid grid-cols-2 gap-1.5 font-semibold text-[11px]">
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Helm Safety (SNI)</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Kacamata Safety</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Masker P2 / N95</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Sarung Tangan</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Safety Boots Steel</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Rompi Reflektif</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Life Jacket (Jetty)</div>
          <div class="border border-black p-1.5 rounded flex items-center gap-1.5 bg-gray-50"><span class="inline-block w-3 h-3 rounded-full border-2 border-black shrink-0"></span>Earplug (Area Bising)</div>
        </div>
        <p class="text-[10px] text-neutral-500 italic mt-2">*APD harus SNI, dalam kondisi layak, dipakai area kerja tambang.</p>
      </div>
    </div>
  </div>

  <!-- HALAMAN 2: TABEL TAHAPAN KERJA 1-10 -->
  <div class="bg-white border-2 border-black p-4 shadow-sm">
    <div class="bg-[#0f1a3d] text-white p-2 mb-4 flex justify-between items-center">
      <h2 class="font-bold text-sm tracking-wider uppercase">TABEL TAHAPAN KERJA - <span class="italic normal-case">"No Ore is Worth Your Life - Lihat, Pikir, Aman"</span></h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left border-collapse border border-black">
        <thead>
          <tr class="bg-[#0f1a3d] text-white uppercase text-[11px]">
            <th class="border border-black p-2 w-[40px] text-center">No</th>
            <th class="border border-black p-2 w-[180px]">Tahapan Kerja</th>
            <th class="border border-black p-2 w-[180px]">Bahaya Utama</th>
            <th class="border border-black p-2 w-[80px] text-center">Risiko</th>
            <th class="border border-black p-2">Tindakan Pengendalian</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black">
          <tr>
            <td class="border border-black p-2 text-center font-bold">1</td>
            <td class="border border-black p-2 font-semibold">Perjalanan ke Front Tambang / Area Kerja</td>
            <td class="border border-black p-2">Tabrakan DT/alat berat, jalan licin limonit, debu tebal</td>
            <td class="border border-black p-2 text-center bg-yellow-200 font-bold">HIGH</td>
            <td class="border border-black p-2">Pemeriksaan P2H LV 4x4, lampu rotari ON, kecepatan maks 30km/h, radio, masker P2, jaga jarak aman 50m dari DT.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">2</td>
            <td class="border border-black p-2 font-semibold">Inspeksi Bench & Safety Talk (P5M)</td>
            <td class="border border-black p-2">Highwall longsor, batu jatuh (rockfall)</td>
            <td class="border border-black p-2 text-center bg-yellow-200 font-bold">HIGH</td>
            <td class="border border-black p-2">Cek Kondisi Fisik Batuan (IBH), dilarang di bawah highwall >3m, safety talk 5 menit, helm + kacamata safety.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">3</td>
            <td class="border border-black p-2 font-semibold">Validasi Test Pit & Pemetaan Geologi</td>
            <td class="border border-black p-2">Lubang terbuka, tertimbun dinding test pit</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Pasang rambu/barikade, tutup lubang setelah selesai, angkut beban &lt;20kg, terapkan buddy system.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">4</td>
            <td class="border border-black p-2 font-semibold">Grade Control Sampling (Saprolit/Limonit)</td>
            <td class="border border-black p-2">Debu silika, tanah licin, mis-grade Ni%</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Basahi permukaan berdabu, masker P2 + gloves, patuhi SOP sampling, label ID double check.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">5</td>
            <td class="border border-black p-2 font-semibold">Chain of Custody & Pelabelan Sampel</td>
            <td class="border border-black p-2">Tertukar sampel, kontaminasi mineral</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Tulis ID spidol permanen, foto lokasi, masukan data ke dashboard MINE GEOLOGIST real-time.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">6</td>
            <td class="border border-black p-2 font-semibold">Supervisi Excavator Digging & Loading</td>
            <td class="border border-black p-2">Tertabrak bucket/counterweight, blind spot operator</td>
            <td class="border border-black p-2 text-center bg-red-200 text-red-900 font-bold">EXTREME</td>
            <td class="border border-black p-2 font-medium"><span class="font-bold underline">Jaga jarak aman 15-20m (1.5x radius boom)</span>, kontak visual/radio sebelum mendekat, vest high-vis. <strong>JANGAN DI BAWAH BUCKET.</strong></td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">7</td>
            <td class="border border-black p-2 font-semibold">Pengelolaan Material</td>
            <td class="border border-black p-2">Longsoran tumpukan ore</td>
            <td class="border border-black p-2 text-center bg-yellow-100 font-bold">MEDIUM</td>
            <td class="border border-black p-2">Jaga jarak dari lereng tumpukan ore (>5m), koordinasi via radio Channel sudah diseusaikan, pastikan area sekitar pijakan stabil.</td>
          </tr>
          <tr>
            <td class="border border-black p-2 text-center font-bold">8</td>
            <td class="border border-black p-2 font-semibold">Entry Data & Pelaporan Final</td>
            <td class="border border-black p-2">Kesalahan input data kimia/lokasi</td>
            <td class="border border-black p-2 text-center bg-green-100 font-bold">LOW</td>
            <td class="border border-black p-2">Verifikasi ulang data lab vs titik lokasi pit sebelum approval pengiriman.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- HALAMAN 3: PROSEDUR DARURAT & LEMBAR PENGESAHAN -->
  <div class="bg-white border-2 border-black p-4 shadow-sm space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs items-start">
      
      <!-- Hirarki Pengendalian -->
      <div class="md:col-span-4 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">🛡️ HIRARKI PENGENDALIAN RISIKO</h3>
        <div class="space-y-1.5">
          <div class="bg-[#0f1a3d] text-white p-1.5 text-[11px]"><strong>1. Eliminasi:</strong> Tunda kerja saat hujan deras / petir / highwall retak</div>
          <div class="bg-[#0f1a3d] text-white p-1.5 text-[11px]"><strong>2. Substitusi:</strong> Wet sampling untuk tekan debu, foto drone kestabilan</div>
          <div class="bg-neutral-600 text-white p-1.5 text-[11px]"><strong>3. Rekayasa:</strong> Berm, tanggul test pit, dust collector, gangway jetty</div>
          <div class="bg-yellow-400 text-black p-1.5 text-[11px] font-semibold"><strong>4. Administratif:</strong> SOP Pit Access, Radio, P5M, rambu, spotter</div>
          <div class="border border-black p-1.5 text-[11px]"><strong>5. APD:</strong> Helm, masker P2, kacamata, vest, boots, life jacket, earplug</div>
        </div>
      </div>

      <!-- Prosedur Darurat & Kontak -->
      <div class="md:col-span-5 border-b md:border-b-0 md:border-r border-black pb-4 md:pb-0 md:pr-4">
        <h3 class="font-bold uppercase tracking-wider text-red-700 border-b border-black pb-1 mb-2">🚨 PROSEDUR DARURAT</h3>
        <ol class="list-decimal list-inside space-y-1 text-neutral-800 leading-tight mb-3">
          <li><strong>LONGSOR:</strong> Menjauh 90° dari arah longsor, lari ke high ground, tekan emergency channel.</li>
          <li><strong>TABRAKAN ALAT BERAT:</strong> Matikan mesin LV, amankan area 50m, jangan pindahkan korban spinal, panggil ERT.</li>
          <li><strong>PAPARAN KIMIA:</strong> Siram 15 menit di eye wash, lepas baju terkontaminasi, bawa MSDS ke klinik.</li>
        </ol>

        <div class="grid grid-cols-2 gap-2 text-center text-[11px]">
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">CH ERT PIT</span>
          </div>
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">CH KLINIK SITE</span>
          </div>
          <div class="border border-black p-1.5 rounded">
            <span class="block font-bold">MUSTER POINT PIT</span>
            <span class="font-semibold">Gate 1 & Office</span>
          </div>
          <div class="bg-red-700 text-white p-1.5 rounded font-bold">
            ATURAN 30-30 PETIR<br>Stop kerja jika kilat &lt;30s
          </div>
        </div>
      </div>

      <!-- Komunikasi & Rambu -->
      <div class="md:col-span-3">
        <h3 class="font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">📡 KOMUNIKASI & RAMBU</h3>
        <div class="space-y-1 text-[11px] mb-3">
          <div class="flex justify-between border border-black p-1"><span>Ch Emergency</span> <span class="bg-red-700 text-white px-1 font-bold">STANDBY</span></div>
          <div class="flex justify-between border border-black p-1"><span>Ch Pit Office</span> <span class="bg-[#0f1a3d] text-white px-1 font-bold">MONITOR</span></div>
        </div>

        <h4 class="font-bold text-[11px] mb-1">RAMBU VISUAL DI PIT:</h4>
        <div class="grid grid-cols-3 gap-1 text-[9px] text-center font-bold mb-3">
          <div class="border border-red-700 text-red-700 p-1 flex items-center justify-center">DILARANG MASUK ALAT BERAT BEKERJA</div>
          <div class="border border-yellow-500 text-yellow-700 p-1 flex items-center justify-center">AWAS LONGSOR HIGHWALL TIDAK STABIL</div>
          <div class="border border-green-700 text-green-700 p-1 flex items-center justify-center">SAFE ZONE PARDIR GEOLOGIST</div>
        </div>

        <div class="border border-black p-2 text-[10px] text-neutral-700 rounded">
          <strong>Catatan:</strong> Selalu ikuti rambu, instruksi radio dari pengawas selama berada di area site.
        </div>
      </div>
    </div>

    <!-- Catatan Khusus Geologist - full width -->
    <div class="p-2 bg-yellow-50 border border-yellow-400 text-[11px] rounded">
      <strong>CATATAN KHUSUS GEOLOGIST:</strong> Ore Ni laterite bersifat licin saat basah (limonit). Selalu cek kestabilan pijakan. Pastikan Chain of Custody tidak putus.
    </div>

    <!-- Lembar Pengesahan -->
    <div class="border-t-2 border-black pt-4">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="font-bold text-xs uppercase whitespace-nowrap">PENGESAHAN DOKUMEN JSA</h3>
        <span class="flex-1 border-t border-black"></span>
        <span class="border border-black px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">ISO 45001:2018 · SMKP MINERBA · ESDM</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] text-center">
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DISUSUN OLEH</span>
          <span class="font-bold mb-4">Superintendent Mine Geologist</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">GEO-01 / MINE GEOLOGIST</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DIPERIKSA OLEH</span>
          <span class="font-bold mb-4">K3 & Geotech Engineer</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">K3 & GEOTECH</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">DISETUJUI OLEH</span>
          <span class="font-bold mb-4">Mine Manager / KTT</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">MINE MANAGER - KTT</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">GEOLOGIST ON DUTY</span>
          <span class="font-bold mb-4">Pelaksana Lapangan</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">GEOLOGIST ON DUTY</div>
        </div>
        <div class="border border-black p-2 flex flex-col">
          <span class="bg-[#0f1a3d] text-white text-[9px] font-bold px-1.5 py-0.5 -mx-2 -mt-2 mb-2">FOREMAN PIT</span>
          <span class="font-bold mb-4">Pengawas Lapangan</span>
          <span class="text-neutral-400 text-[10px] mb-2">Tanda Tangan & Cap</span>
          <div class="border border-black py-1 text-[10px] font-bold tracking-wide">FOREMAN PIT / STOCKPILE</div>
        </div>
      </div>
    </div>

    <!-- Footer Bar -->
    <div class="bg-[#0f1a3d] text-white p-2 text-[10px] flex flex-wrap justify-between items-center gap-2 font-mono">
      <div class="flex flex-wrap items-center gap-2">
        <span class="bg-yellow-400 text-black px-1.5 py-0.5 font-bold">DOKUMEN K3 RAHASIA</span>
        <span>INDUKSI WAJIB SEBELUM MASUK PIT</span>
        <span>•</span>
        <span>REV 02</span>
        <span>•</span>
        <span>ISO45001:2018</span>
        <span>•</span>
        <span>SMKP MINERBA No. 1827 K/30/MEM/2018</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-neutral-300">HAL 3/3 - JSA MINE GEOLOGIST</span>
        <span class="border border-white px-1.5 py-0.5 font-bold">JSA-MINEGEO-2026-REV02 · PT GEOBANK MINERALS</span>
      </div>
    </div>

    <!-- Slogan Bar -->
    <div class="bg-yellow-400 text-black p-1.5 text-center text-[10px] font-bold tracking-wide">
      NO ORE IS WORTH YOUR LIFE • SAFETY FIRST • PRODUCTION SECOND • QUALITY THIRD • GEO NICKEL LATERITE • ZERO LTI
    </div>

    <p class="text-[9.5px] text-neutral-500 text-center italic mt-1">
      Dokumen ini dibuat sesuai regulasi Kepmen ESDM No. 1827 K/30/MEM/2018 tentang Pedoman Pelaksanaan Kaidah Teknik Pertambangan Yang Baik. JSA harus direview ulang jika terjadi perubahan metode kerja, kecelakaan, atau minimal 1 tahun sekali.
    </p>
  </div>

  <script>
    (function () {
      try {
        var hariNama = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        var now = new Date();
        var tglEl = document.getElementById("jsa-tgl");
        var hariEl = document.getElementById("jsa-hari");
        var blnEl = document.getElementById("jsa-bln");
        var thnEl = document.getElementById("jsa-thn");
        var jamEl = document.getElementById("jsa-jam");
        if (tglEl) tglEl.textContent = String(now.getDate()).padStart(2, "0");
        if (hariEl) hariEl.textContent = hariNama[now.getDay()];
        if (blnEl) blnEl.textContent = String(now.getMonth() + 1).padStart(2, "0");
        if (thnEl) thnEl.textContent = now.getFullYear();
        if (jamEl) jamEl.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      } catch (e) {
        // Biarkan kosong / titik-titik untuk diisi manual jika JS gagal berjalan
      }
    })();
  <\/script>
</body>
</html>`;

 const JSA_I18N_EN = {
  'Job Safety Analysis - Mine Geologist':'Job Safety Analysis - Mine Geologist',
  'JOB SAFETY ANALYSIS':'JOB SAFETY ANALYSIS',
  'DIVISION MINE GEOLOGIST':'MINE GEOLOGIST DIVISION',
  'PIT. STOCKPILE & JETTY':'PIT, STOCKPILE & JETTY',
  'DEPARTEMEN:':'DEPARTMENT:', 'DISUSUN OLEH:':'PREPARED BY:', 'DIPERIKSA OLEH:':'CHECKED BY:', 'DISETUJUI OLEH:':'APPROVED BY:',
  'DOKUMEN WAJIB DI TOOLBOX MEETING':'DOCUMENT REQUIRED AT TOOLBOX MEETING',
  'DESKRIPSI PEKERJAAN':'JOB DESCRIPTION', 'ALAT & MATERIAL':'TOOLS & MATERIALS', 'APD WAJIB (MINIMUM)':'MANDATORY PPE (MINIMUM)',
  'Helm Safety (SNI)':'Safety Helmet (SNI)', 'Kacamata Safety':'Safety Glasses', 'Masker P2 / N95':'P2 / N95 Mask', 'Sarung Tangan':'Gloves', 'Safety Boots Steel':'Steel Safety Boots', 'Rompi Reflektif':'Reflective Vest', 'Life Jacket (Jetty)':'Life Jacket (Jetty)', 'Earplug (Area Bising)':'Earplugs (Noisy Area)',
  'TABEL TAHAPAN KERJA':'WORK STEP TABLE', 'Lihat, Pikir, Aman':'Look, Think, Stay Safe', 'Tahapan Kerja':'Work Step', 'Bahaya Utama':'Main Hazard', 'Risiko':'Risk', 'Tindakan Pengendalian':'Control Measures',
  'Perjalanan ke Front Tambang / Area Kerja':'Travel to Mining Front / Work Area', 'Inspeksi Bench & Safety Talk (P5M)':'Bench Inspection & Safety Talk (P5M)', 'Validasi Test Pit & Pemetaan Geologi':'Test Pit Validation & Geological Mapping', 'Grade Control Sampling (Saprolit/Limonit)':'Grade Control Sampling (Saprolite/Limonite)', 'Chain of Custody & Pelabelan Sampel':'Chain of Custody & Sample Labelling', 'Supervisi Excavator Digging & Loading':'Excavator Digging & Loading Supervision', 'Pengelolaan Material':'Material Handling', 'Entry Data & Pelaporan Final':'Data Entry & Final Reporting',
  'HIGH':'HIGH', 'MEDIUM':'MEDIUM', 'EXTREME':'EXTREME', 'LOW':'LOW',
  'HIRARKI PENGENDALIAN RISIKO':'HIERARCHY OF RISK CONTROLS', 'Eliminasi':'Elimination', 'Substitusi':'Substitution', 'Rekayasa':'Engineering Controls', 'Administratif':'Administrative Controls',
  'PROSEDUR DARURAT':'EMERGENCY PROCEDURES', 'LONGSOR':'LANDSLIDE', 'TABRAKAN ALAT BERAT':'HEAVY EQUIPMENT COLLISION', 'PAPARAN KIMIA':'CHEMICAL EXPOSURE',
  'KOMUNIKASI & RAMBU':'COMMUNICATION & SIGNAGE', 'RAMBU VISUAL DI PIT:':'VISUAL PIT SIGNAGE:', 'Catatan:':'Note:', 'CATATAN KHUSUS GEOLOGIST:':'GEOLOGIST SPECIAL NOTE:',
  'PENGESAHAN DOKUMEN JSA':'JSA DOCUMENT APPROVAL', 'Tanda Tangan & Cap':'Signature & Stamp', 'Pelaksana Lapangan':'Field Operator', 'Pengawas Lapangan':'Field Supervisor', 'FOREMAN PIT':'PIT FOREMAN', 'GEOLOGIST ON DUTY':'GEOLOGIST ON DUTY',
  'Stop kerja jika kilat <30s':'Stop work if lightning is <30s', 'STANDBY':'STANDBY', 'MONITOR':'MONITOR',
  'No Ore is Worth Your Life':'No Ore is Worth Your Life',
  'Lihat, Pikir, Aman':'Look, Think, Stay Safe',
  'Pekerjaan Mine Geologist mencakup validasi block model, pengambilan sampel grade control (saprolit/limonit), supervisi penggalian excavator & dump truck, pengelolaan material, pengawasan barging shipment, pelabelan ID sampel & chain of custody, entry data di dashboard MINE GEOLOGIST, serta handling preparasi sampel untuk analisa kimia Ni, Fe, SiO2, MgO, Co di area pit aktif & jetty dengan risiko tinggi heavy equipment, geotechnical, dan marine operations.':'Mine Geologist work includes block model validation, grade control sampling (saprolite/limonite), excavator & dump truck excavation supervision, material handling, barging shipment supervision, sample ID labelling & chain of custody, data entry in the MINE GEOLOGIST dashboard, and sample preparation for Ni, Fe, SiO2, MgO, Co chemical analysis in active pit & jetty areas with high heavy-equipment, geotechnical, and marine-operation risks.',
  'Light Vehicle 4x4, Radio HT, GPS Handheld':'Light Vehicle 4x4, HT Radio, Handheld GPS',
  'Cangkul, Linggis, Sekop, Kantong Sampel, Spidol Permanen':'Hoe, Crowbar, Shovel, Sample Bags, Permanent Marker',
  'Peta Grade Control, Patok Batas, Roll Meter, Kompas':'Grade Control Map, Boundary Stakes, Measuring Tape, Compass',
  'Tablet Dashboard MINE GEOLOGIST, Form CoC, Kamera':'MINE GEOLOGIST Dashboard Tablet, CoC Form, Camera',
  'Peralatan Lab: Crusher, Splitter, Oven, Timbangan':'Lab Equipment: Crusher, Splitter, Oven, Scale',
  'Rambu, Cone, Bendera Buggy Whip, APAR 3kg di LV':'Signs, Cone, Buggy Whip Flag, 3kg Fire Extinguisher in LV',
  '*APD harus SNI, dalam kondisi layak, dipakai area kerja tambang.':'*PPE must comply with SNI, be in good condition, and be worn in mining work areas.',
  'Tabrakan DT/alat berat, jalan licin limonit, debu tebal':'Collision with DT/heavy equipment, slippery limonite road, heavy dust',
  'Pemeriksaan P2H LV 4x4, lampu rotari ON, kecepatan maks 30km/h, radio, masker P2, jaga jarak aman 50m dari DT.':'Perform P2H inspection of LV 4x4, rotary beacon ON, max speed 30 km/h, radio, P2 mask, maintain 50 m safe distance from DT.',
  'Highwall longsor, batu jatuh (rockfall)':'Highwall landslide, falling rocks (rockfall)',
  'Cek Kondisi Fisik Batuan (IBH), dilarang di bawah highwall >3m, safety talk 5 menit, helm + kacamata safety.':'Check Rock Physical Condition (IBH), do not stand below highwall >3 m, 5-minute safety talk, safety helmet + safety glasses.',
  'Lubang terbuka, tertimbun dinding test pit':'Open hole, buried by test pit wall',
  'Pasang rambu/barikade, tutup lubang setelah selesai, angkut beban <20kg, terapkan buddy system.':'Install signs/barricades, close the hole after completion, carry loads <20 kg, apply the buddy system.',
  'Debu silika, tanah licin, mis-grade Ni%':'Silica dust, slippery ground, Ni% mis-grade',
  'Basahi permukaan berdabu, masker P2 + gloves, patuhi SOP sampling, label ID double check.':'Wet dusty surfaces, P2 mask + gloves, follow the sampling SOP, double-check sample ID labels.',
  'Tertukar sampel, kontaminasi mineral':'Mixed-up samples, mineral contamination',
  'Tulis ID spidol permanen, foto lokasi, masukan data ke dashboard MINE GEOLOGIST real-time.':'Write the ID with permanent marker, photograph the location, enter data into the MINE GEOLOGIST dashboard in real time.',
  'Tertabrak bucket/counterweight, blind spot operator':'Struck by bucket/counterweight, operator blind spot',
  'Jaga jarak aman 15-20m (1.5x radius boom)':'Maintain a 15-20 m safe distance (1.5x boom radius)',
  'kontak visual/radio sebelum mendekat, vest high-vis.':'visual/radio contact before approaching, high-visibility vest.',
  'JANGAN DI BAWAH BUCKET.':'DO NOT STAND UNDER THE BUCKET.',
  'Longsoran tumpukan ore':'Ore stockpile collapse',
  'Jaga jarak dari lereng tumpukan ore (>5m), koordinasi via radio Channel sudah diseusaikan, pastikan area sekitar pijakan stabil.':'Keep distance from the ore stockpile slope (>5 m), coordinate by radio on the designated channel, ensure the footing area is stable.',
  'Kesalahan input data kimia/lokasi':'Chemical/location data entry error',
  'Verifikasi ulang data lab vs titik lokasi pit sebelum approval pengiriman.':'Re-verify lab data against the pit location point before shipment approval.',
  'Tunda kerja saat hujan deras / petir / highwall retak':'Stop work during heavy rain / lightning / cracked highwall',
  'Wet sampling untuk tekan debu, foto drone kestabilan':'Wet sampling to reduce dust, drone stability photos',
  'Berm, tanggul test pit, dust collector, gangway jetty':'Berm, test pit bund, dust collector, jetty gangway',
  'SOP Pit Access, Radio, P5M, rambu, spotter':'Pit Access SOP, Radio, P5M, signs, spotter',
  'Helm, masker P2, kacamata, vest, boots, life jacket, earplug':'Helmet, P2 mask, safety glasses, vest, boots, life jacket, earplugs',
  'Menjauh 90° dari arah longsor, lari ke high ground, tekan emergency channel.':'Move 90° away from the landslide direction, run to high ground, activate the emergency channel.',
  'Matikan mesin LV, amankan area 50m, jangan pindahkan korban spinal, panggil ERT.':'Shut down the LV engine, secure a 50 m area, do not move a suspected spinal-injury victim, call ERT.',
  'Siram 15 menit di eye wash, lepas baju terkontaminasi, bawa MSDS ke klinik.':'Flush at the eyewash for 15 minutes, remove contaminated clothing, bring the MSDS to the clinic.',
  'Gate 1 & Office':'Gate 1 & Office',
  'Ch Emergency':'Emergency Channel',
  'Ch Pit Office':'Pit Office Channel',
  'DILARANG MASUK ALAT BERAT BEKERJA':'NO ENTRY — HEAVY EQUIPMENT OPERATING',
  'AWAS LONGSOR HIGHWALL TIDAK STABIL':'CAUTION — UNSTABLE HIGHWALL LANDSLIDE',
  'SAFE ZONE PARDIR GEOLOGIST':'GEOLOGIST PARKING SAFE ZONE',
  'Selalu ikuti rambu, instruksi radio dari pengawas selama berada di area site.':'Always follow signs and radio instructions from the supervisor while in the site area.',
  'Ore Ni laterite bersifat licin saat basah (limonit). Selalu cek kestabilan pijakan. Pastikan Chain of Custody tidak putus.':'Lateritic Ni ore is slippery when wet (limonite). Always check footing stability. Ensure the Chain of Custody is maintained.',
  'ISO 45001:2018 · SMKP MINERBA · ESDM':'ISO 45001:2018 · SMKP MINERBA · ESDM',
  'K3 & Geotech Engineer':'K3 & Geotechnical Engineer',
  'MINE MANAGER - KTT':'MINE MANAGER - KTT',
  'FOREMAN PIT / STOCKPILE':'PIT / STOCKPILE FOREMAN',
  'DOKUMEN K3 RAHASIA':'CONFIDENTIAL K3 DOCUMENT',
  'INDUKSI WAJIB SEBELUM MASUK PIT':'MANDATORY INDUCTION BEFORE ENTERING PIT',
  'HAL 3/3 - JSA MINE GEOLOGIST':'PAGE 3/3 - JSA MINE GEOLOGIST',
  'Dokumen ini dibuat sesuai regulasi Kepmen ESDM No. 1827 K/30/MEM/2018 tentang Pedoman Pelaksanaan Kaidah Teknik Pertambangan Yang Baik. JSA harus direview ulang jika terjadi perubahan metode kerja, kecelakaan, atau minimal 1 tahun sekali.':'This document is prepared in accordance with ESDM Decree No. 1827 K/30/MEM/2018 on Guidelines for the Implementation of Good Mining Engineering Practices. The JSA must be reviewed when work methods change, an incident occurs, or at least once every year.'
 };
 function openDiggingDetailModal(rowIndex) {
 const row = currentPageDiggingRows[rowIndex];
 if (!row) return;
 currentOpenDiggingRow = row;

 document.getElementById('digging-detail-subtitle').innerText = `${row.tanggal} -- ${row.pit} / ${row.blok} -- ${row.classGrade} (${row.tipeOreLabel})`;
 document.getElementById('digging-detail-waktu-input').innerText = row.waktuInput;
 document.getElementById('digging-detail-cuaca').innerText = row.cuaca;
 document.getElementById('digging-detail-sampel').innerText = row.idSampel;
 document.getElementById('digging-detail-ship').innerText = row.namaShip;
 document.getElementById('digging-detail-pelapor').innerText = row.pelapor;
 document.getElementById('digging-detail-ni').innerText = row.ni;
 document.getElementById('digging-detail-fe').innerText = row.fe;
 document.getElementById('digging-detail-co').innerText = row.co;
 document.getElementById('digging-detail-mgo').innerText = row.mgo;
 document.getElementById('digging-detail-sio2').innerText = row.sio2;
 document.getElementById('digging-detail-tonase').innerText = row.tonase.toLocaleString();
 document.getElementById('digging-detail-total-sampel').innerText = row.totalSampelDisplay;
 document.getElementById('digging-detail-id-efo').innerText = row.idEfo;
 document.getElementById('digging-detail-id-eto').innerText = row.idEto;
 document.getElementById('digging-detail-keterangan').innerText = row.keterangan;

 const tujuanEl = document.getElementById('digging-detail-tujuan');
 const tujuanColors = {
  'efo': 'text-blue-400',
  'eto': 'text-emerald-400',
  'direct': 'text-amber-400'
 };
 tujuanEl.innerText = row.tujuan;
 tujuanEl.className = 'font-semibold text-xs ' + (tujuanColors[row.tujuan.toLowerCase()] || 'text-title');

 // Tombol "Lihat Riwayat Dome" cuma muncul kalau baris ini memang sudah pernah di-assign
 // ke Dome (ID EFO/ETO terisi) DAN user punya akses lihat riwayat (developer-only).
 const hasDomeLink = (row.idEfo && row.idEfo !== '-') || (row.idEto && row.idEto !== '-');
 const btnDomeHistory = document.getElementById('btn-open-dome-history');
 btnDomeHistory.classList.toggle('hidden', !(hasDomeLink && canViewDomeHistory()));

 // BARU (27 Agu): tombol "Update Hasil Assay" cuma muncul kalau baris ini masih
 // menunggu lab (Ni belum ada) -- terbuka utk semua role yang bisa submit Digging
 // (server tetap re-validasi permission production_gc.create saat submit).
 const btnUpdateAssay = document.getElementById('btn-open-update-assay');
 if (btnUpdateAssay) btnUpdateAssay.classList.toggle('hidden', !row.isPendingAssay);

 const modal = document.getElementById('digging-detail-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeDiggingDetailModal() {
 const modal = document.getElementById('digging-detail-modal');
 hideModalAnimated(modal);
 }

 // ==== Fase 3: Riwayat Dome -- buka jurnal transaksi DomeLog untuk Dome yang terkait
 // baris digging ini (bisa 1 atau 2 Dome kalau baris itu hasil Split), supaya QC/Head
 // Geologist bisa lihat bukti audit lengkap tanpa harus buka Google Sheets manual. ====

 function updateRcaPitActualEvidence() {
 const wrap = document.getElementById('rca-pitactual-evidence-wrap');
 const list = document.getElementById('rca-pitactual-evidence-list');
 if (!wrap || !list) return;

 const blok = document.getElementById('rca-blok').value;
 const pit = document.getElementById('rca-pit').value;
 const matches = getPitActualCatatanByBlokPit(blok, pit);

 if (matches.length === 0) {
  wrap.classList.add('hidden');
  list.innerHTML = '';
  return;
 }

 list.innerHTML = matches.map(row => `
  <p class="text-[11px] text-slate-300"><span class="text-slate-500">${row.tanggal || '-'} (${row.pic || '-'}):</span> ${row.catatan}</p>
 `).join('');
 wrap.classList.remove('hidden');
 }

 // ============================================================
 // BARU: LAPORAN REKONSILIASI PROFESIONAL -- narik data LIVE dari
 // globalBlockModelData, globalRcaLogData, globalCOGConfig (bukan data contoh statis
 // seperti referensi mock yang pernah dibahas). Struktur: Ringkasan Eksekutif ->
 // Rekonsiliasi 3-Tahap (BM/GC/Realisasi per Blok+Pit) -> Legenda Toleransi -> Temuan RCA.
 // ============================================================

 function openCOGConfigModal(tab) {
 const modal = document.getElementById('cogconfig-modal');
 document.getElementById('cogconfig-select-tipe').value = 'Sapro';
 loadCOGConfigFormValues();
 switchCOGConfigTab(tab || 'cog');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeCOGConfigModal() {
 hideModalAnimated(document.getElementById('cogconfig-modal'));
 document.getElementById('cogconfig-status-msg').classList.add('hidden');
 }

 // Ganti tab aktif di modal COGConfig -- toggle konten & styling tombol tab, sembunyikan
 // selector Tipe Ore di tab Flag (warna per Grade tidak terkait Tipe Ore).
 function switchCOGConfigTab(tab) {
 const tabs = ['cog', 'flag', 'bucket'];
 const titleMap = {
  cog: { title: 'cogconfig_modal_title', subtitle: 'cogconfig_modal_subtitle', icon: 'sliders-horizontal', color: 'cyan' },
  flag: { title: 'flagconfig_card_title', subtitle: 'flagconfig_modal_subtitle', icon: 'flag', color: 'fuchsia' },
  bucket: { title: 'bucketconfig_card_title', subtitle: 'bucketconfig_modal_subtitle', icon: 'package', color: 'orange' }
 };
 const info = titleMap[tab] || titleMap.cog;
 tabs.forEach(t => {
  const btn = document.getElementById('cogconfig-tabbtn-' + t);
  const content = document.getElementById('cogconfig-tab-content-' + t);
  const active = t === tab;
  if (content) content.classList.toggle('hidden', !active);
  if (btn) {
  const activeColorClass = active ? ('bg-' + (titleMap[t] ? titleMap[t].color : 'cyan') + '-600 text-white') : 'text-slate-400 hover:text-slate-200';
  btn.className = 'flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ' + activeColorClass;
  }
 });
 // Selector Tipe Ore relevan buat tab COG & Bucket, disembunyikan di tab Flag.
 const tipeOreWrap = document.getElementById('cogconfig-tipeore-wrap');
 if (tipeOreWrap) tipeOreWrap.classList.toggle('hidden', tab === 'flag');

 const titleEl = document.getElementById('cogconfig-modal-title');
 const subtitleEl = document.getElementById('cogconfig-modal-subtitle');
 if (titleEl) { titleEl.setAttribute('data-i18n', info.title); titleEl.innerText = translations[currentLang][info.title] || titleEl.innerText; }
 if (subtitleEl) { subtitleEl.setAttribute('data-i18n', info.subtitle); subtitleEl.innerText = translations[currentLang][info.subtitle] || subtitleEl.innerText; }
 const iconEl = document.getElementById('cogconfig-modal-icon');
 if (iconEl) iconEl.setAttribute('data-lucide', info.icon);
 lucide.createIcons();
 }

 // Isi form dari globalCOGConfig sesuai Tipe_Ore yang dipilih di dropdown. Field global
 // (Limo_Aktif, SM_Threshold, Target_Ship, Warna, Bucket_per_Sampel, Sampel_per_Dome_Max)
 // selalu ditampilkan sama untuk kedua Tipe_Ore. WMT_per_Bucket beda per Tipe_Ore.
 function loadCOGConfigFormValues() {
 const tipe = document.getElementById('cogconfig-select-tipe').value;
 const cfg = globalCOGConfig || {
  Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
  Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
  Limo_Aktif: false,
  SM_Threshold_AutoDetect: 3,
  Target_Ship_Ni_Min: 1.3,
  Target_Ship_Ni_Max: 1.6,
  Bucket_per_Sampel: 8,
  Sampel_per_Dome_Max: 25
 };
 const batas = cfg[tipe] || cfg.Sapro;

 document.getElementById('cogconfig-batas-waste-lg').value = batas.Batas_Waste_LG;
 document.getElementById('cogconfig-batas-lg-mg').value = batas.Batas_LG_MG;
 document.getElementById('cogconfig-batas-mg-hg').value = batas.Batas_MG_HG;
 document.getElementById('cogconfig-batas-hg-vhg').value = batas.Batas_HG_VHG;
 document.getElementById('cogconfig-limo-aktif').checked = !!cfg.Limo_Aktif;
 document.getElementById('cogconfig-sm-threshold').value = cfg.SM_Threshold_AutoDetect;
 document.getElementById('cogconfig-target-ship-min').value = cfg.Target_Ship_Ni_Min;
 document.getElementById('cogconfig-target-ship-max').value = cfg.Target_Ship_Ni_Max;
 document.getElementById('cogconfig-toleransi-warning').value = cfg.Toleransi_Warning_Pct !== undefined ? cfg.Toleransi_Warning_Pct : 5;
 document.getElementById('cogconfig-toleransi-ootol').value = cfg.Toleransi_OutOfTol_Pct !== undefined ? cfg.Toleransi_OutOfTol_Pct : 10;
 document.getElementById('cogconfig-warna-waste').value = cfg.Warna_Waste || 'abu';
 document.getElementById('cogconfig-warna-lg').value = cfg.Warna_LG || 'kuning';
 document.getElementById('cogconfig-warna-mg').value = cfg.Warna_MG || 'biru';
 document.getElementById('cogconfig-warna-hg').value = cfg.Warna_HG || 'hijau';
 document.getElementById('cogconfig-warna-vhg').value = cfg.Warna_VHG || 'hijau';
 document.getElementById('cogconfig-wmt-bucket').value = batas.WMT_per_Bucket !== undefined ? batas.WMT_per_Bucket : 2.2;
 document.getElementById('cogconfig-bucket-sampel').value = cfg.Bucket_per_Sampel || 8;
 document.getElementById('cogconfig-sampel-dome').value = cfg.Sampel_per_Dome_Max || 25;
 }

 async function submitCOGConfigForm() {
 const statusMsg = document.getElementById('cogconfig-status-msg');
 const submitBtn = document.getElementById('btn-submit-cogconfig');
 const originalHtml = submitBtn.innerHTML;

 const tipeOre = document.getElementById('cogconfig-select-tipe').value;
 const batasWasteLG = parseFloat(document.getElementById('cogconfig-batas-waste-lg').value);
 const batasLGMG = parseFloat(document.getElementById('cogconfig-batas-lg-mg').value);
 const batasMGHG = parseFloat(document.getElementById('cogconfig-batas-mg-hg').value);
 const batasHGVHG = parseFloat(document.getElementById('cogconfig-batas-hg-vhg').value);
 const limoAktif = document.getElementById('cogconfig-limo-aktif').checked;
 const smThreshold = parseFloat(document.getElementById('cogconfig-sm-threshold').value);
 const targetShipMin = parseFloat(document.getElementById('cogconfig-target-ship-min').value);
 const targetShipMax = parseFloat(document.getElementById('cogconfig-target-ship-max').value);
 const warnaWaste = document.getElementById('cogconfig-warna-waste').value;
 const warnaLG = document.getElementById('cogconfig-warna-lg').value;
 const warnaMG = document.getElementById('cogconfig-warna-mg').value;
 const warnaHG = document.getElementById('cogconfig-warna-hg').value;
 const warnaVHG = document.getElementById('cogconfig-warna-vhg').value;
 const wmtPerBucket = parseFloat(document.getElementById('cogconfig-wmt-bucket').value);
 const bucketPerSampel = document.getElementById('cogconfig-bucket-sampel').value;
 const sampelPerDomeMax = document.getElementById('cogconfig-sampel-dome').value;
 const toleransiWarning = parseFloat(document.getElementById('cogconfig-toleransi-warning').value);
 const toleransiOotol = parseFloat(document.getElementById('cogconfig-toleransi-ootol').value);

 // Validasi urutan naik di sisi client juga -- feedback lebih cepat sebelum kirim ke
 // server (server tetap validasi ulang, ini cuma UX supaya tidak nunggu roundtrip percuma).
 if (isNaN(batasWasteLG) || isNaN(batasLGMG) || isNaN(batasMGHG) || isNaN(batasHGVHG)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'All 4 COG thresholds must be filled with numbers.' : 'Semua 4 batas COG wajib diisi angka.';
  statusMsg.classList.remove('hidden');
  return;
 }
 if (!(batasWasteLG < batasLGMG && batasLGMG < batasMGHG && batasMGHG < batasHGVHG)) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Threshold order must be ascending: Waste->LG < LG->MG < MG->HG < HG->VHG.' : 'Urutan batas harus naik: Waste->LG < LG->MG < MG->HG < HG->VHG.';
  statusMsg.classList.remove('hidden');
  return;
 }
 // Validasi range Target Ship Ni% -- Min harus < Max (kalau keduanya diisi).
 if (!isNaN(targetShipMin) && !isNaN(targetShipMax) && targetShipMin >= targetShipMax) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Ship Target Ni% Min must be less than Max.' : 'Target Ship Ni% Min harus lebih kecil dari Max.';
  statusMsg.classList.remove('hidden');
  return;
 }
 // Validasi ambang toleransi -- WARNING harus < OUT OF TOL (kalau keduanya diisi).
 if (!isNaN(toleransiWarning) && !isNaN(toleransiOotol) && toleransiWarning >= toleransiOotol) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'WARNING threshold must be less than OUT OF TOL threshold.' : 'Ambang WARNING harus lebih kecil dari ambang OUT OF TOL.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'updateCOGConfig',
  tipe_ore: tipeOre,
  batas_waste_lg: batasWasteLG,
  batas_lg_mg: batasLGMG,
  batas_mg_hg: batasMGHG,
  batas_hg_vhg: batasHGVHG,
  limo_aktif: limoAktif ? 'true' : 'false',
  sm_threshold_autodetect: smThreshold,
  target_ship_ni_min: isNaN(targetShipMin) ? '' : targetShipMin,
  target_ship_ni_max: isNaN(targetShipMax) ? '' : targetShipMax,
  warna_waste: warnaWaste,
  warna_lg: warnaLG,
  warna_mg: warnaMG,
  warna_hg: warnaHG,
  warna_vhg: warnaVHG,
  wmt_per_bucket: isNaN(wmtPerBucket) ? '' : wmtPerBucket,
  bucket_per_sampel: bucketPerSampel,
  sampel_per_dome_max: sampelPerDomeMax,
  toleransi_warning_pct: isNaN(toleransiWarning) ? '' : toleransiWarning,
  toleransi_ootol_pct: isNaN(toleransiOotol) ? '' : toleransiOotol,
  updated_by: 'Developer'
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save COG parameters.' : 'Gagal menyimpan parameter COG.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'COG parameters saved!' : 'Parameter COG berhasil disimpan!';
  statusMsg.classList.remove('hidden');

  // Ambil ulang COGConfig dari server (bukan cuma update state lokal) supaya baris
  // yang TIDAK diedit (Tipe_Ore lawannya) tetap sinkron dengan data sheet sebenarnya,
  // lalu render ulang Tabel Digging & KPI -- sama pola race-condition mitigation
  // yang dipakai fetchCOGConfig() saat load awal.
  await fetchCOGConfig();

  setTimeout(() => {
  statusMsg.classList.add('hidden');
  }, 1500);
 } catch (error) {
  console.error('Error submitting COGConfig:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred while saving.' : 'Terjadi kesalahan saat menyimpan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 function openFormPitActualPopup() {
 if (!canManagePitActual()) {
  showNoticeModal(
  currentLang === 'en' ? 'Locked' : 'Terkunci',
  currentLang === 'en' ? 'Unlock "Developer Access" in the Settings menu with the Developer PIN first.' : 'Buka "Akses Developer" di menu Settings dengan PIN Developer terlebih dahulu.'
  );
  return;
 }
 ['pa-tanggal', 'pa-blok', 'pa-pit', 'pa-rit', 'pa-catatan'].forEach(id => document.getElementById(id).value = '');
 document.getElementById('pa-shift').value = '';
 document.getElementById('pa-tf').value = 26;
 document.getElementById('pa-tonase-preview').innerText = '';
 populateNameOptions(document.getElementById('pa-pic'));
 document.getElementById('pa-status-msg').classList.add('hidden');
 const modal = document.getElementById('form-pitactual-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeFormPitActualPopup() {
 hideModalAnimated(document.getElementById('form-pitactual-popup-modal'));
 }

 // ============================================================
 // BARU: RIWAYAT PIT ACTUAL -- tabel semua baris timbangan + Catatan/kendala lapangan,
 // terbuka untuk SEMUA orang lihat (data globalPitActualData sudah ter-fetch bareng saat
 // tab Rekonsiliasi dibuka, tidak perlu fetch ulang). Search filter di client-side.
 // ============================================================

 function openPitActualHistoryModal() {
 const modal = document.getElementById('pitactual-history-modal');
 document.getElementById('pitactual-history-search').value = '';
 renderPitActualHistoryTable();
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closePitActualHistoryModal() {
 hideModalAnimated(document.getElementById('pitactual-history-modal'));
 }

 function renderPitActualHistoryTable() {
 const tbody = document.getElementById('pitactual-history-body');
 if (!tbody) return;

 const searchInput = document.getElementById('pitactual-history-search');
 const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

 // Urutkan terbaru dulu (tanggal string format YYYY-MM-DD dari formatTanggal backend,
 // aman dibandingkan sebagai string) -- riwayat lebih enak dibaca dari yang paling baru.
 const sorted = [...(globalPitActualData || [])].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

 const filtered = query ? sorted.filter(row => {
  const haystack = [row.blok, row.pit, row.pic, row.catatan].map(v => (v || '').toString().toLowerCase()).join(' ');
  return haystack.includes(query);
 }) : sorted;

 if (filtered.length === 0) {
  const msg = query
  ? (currentLang === 'en' ? 'No matching records found.' : 'Tidak ada data yang cocok.')
  : (currentLang === 'en' ? 'No Pit Actual records yet.' : 'Belum ada data Pit Actual.');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium">${msg}</td></tr>`;
  return;
 }

 tbody.innerHTML = filtered.map(row => {
  const tonase = typeof row.tonase === 'number' ? row.tonase.toLocaleString('id-ID') : (row.tonase || '-');
  const catatanHtml = row.catatan
  ? `<span class="text-amber-300">${row.catatan}</span>`
  : `<span class="text-slate-600">-</span>`;
  return `
  <tr class="hover:bg-slate-800/30 transition-colors">
   <td class="p-2.5 text-slate-300">${row.tanggal || '-'}</td>
   <td class="p-2.5 text-slate-300">${row.shift || '-'}</td>
   <td class="p-2.5 font-semibold text-title">${row.blok || '-'}</td>
   <td class="p-2.5 text-slate-300">${row.pit || '-'}</td>
   <td class="p-2.5 text-right text-slate-300">${row.rit || '-'}</td>
   <td class="p-2.5 text-right text-slate-300">${row.tf || '-'}</td>
   <td class="p-2.5 text-right font-bold text-title">${tonase}</td>
   <td class="p-2.5 text-slate-300">${row.pic || '-'}</td>
   <td class="p-2.5">${catatanHtml}</td>
  </tr>
  `;
 }).join('');
 }

 // BARU: cari semua Catatan Pit Actual untuk Blok+Pit tertentu -- dipakai form RCA supaya
 // catatan kendala lapangan (misal "muatan bucket bervariatif") bisa langsung kelihatan
 // sebagai bukti pendukung saat investigasi penyimpangan, tanpa perlu buka sheet manual.
 function getPitActualCatatanByBlokPit(blok, pit) {
 const blokUp = (blok || '').toString().trim().toUpperCase();
 const pitUp = (pit || '').toString().trim().toUpperCase();
 if (!blokUp) return [];
 return (globalPitActualData || []).filter(row => {
  const rowBlok = (row.blok || '').toString().trim().toUpperCase();
  const rowPit = (row.pit || '').toString().trim().toUpperCase();
  if (rowBlok !== blokUp) return false;
  if (pitUp && rowPit !== pitUp) return false;
  return !!(row.catatan && row.catatan.toString().trim());
 });
 }

 function updatePitActualTonasePreview() {
 const rit = parseFloat(document.getElementById('pa-rit').value) || 0;
 const tf = parseFloat(document.getElementById('pa-tf').value) || 0;
 const preview = document.getElementById('pa-tonase-preview');
 preview.innerText = (rit > 0 && tf > 0) ? (currentLang === 'en' ? 'Tonnage: ' : 'Tonase: ') + (rit * tf).toLocaleString() + (currentLang === 'en' ? ' tons' : ' ton') : '';
 }

 async function submitPitActual() {
 const tanggal = document.getElementById('pa-tanggal').value;
 const shift = document.getElementById('pa-shift').value;
 const blok = document.getElementById('pa-blok').value.trim();
 const pit = document.getElementById('pa-pit').value.trim();
 const rit = parseFloat(document.getElementById('pa-rit').value) || 0;
 const tf = parseFloat(document.getElementById('pa-tf').value) || 0;
 const pic = document.getElementById('pa-pic').value;
 const catatan = document.getElementById('pa-catatan').value.trim();
 const statusMsg = document.getElementById('pa-status-msg');
 const submitBtn = document.getElementById('btn-submit-pitactual');
 const originalHtml = submitBtn.innerHTML;

 if (!tanggal || !shift || !blok || rit <= 0 || tf <= 0) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Fill in Date, Shift, Blok, Rit, and TF.' : 'Isi Tanggal, Shift, Blok, Rit, dan TF.';
  statusMsg.classList.remove('hidden');
  return;
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const payload = buildAuthenticatedPayload({
  action: 'addPitActual',
  tanggal, shift, blok, pit, rit, tf, pic, catatan
  }, { developerOnly: true });
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to save Pit Actual.' : 'Gagal mencatat Pit Actual.'));

  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Recorded!' : 'Berhasil dicatat!';
  statusMsg.classList.remove('hidden');
  setTimeout(() => {
  closeFormPitActualPopup();
  statusMsg.classList.add('hidden');
  fetchPitActualData();
  }, 900);
 } catch (error) {
  console.error('Error recording Pit Actual:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error.message || (currentLang === 'en' ? 'An error occurred.' : 'Terjadi kesalahan.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;
  lucide.createIcons();
 }
 }

 function openFormDiggingPopup() {
 populateReporterDropdown();
 const dateInput = document.querySelector('#diggingManagerForm input[name="tanggal"]');
 if (dateInput) {
  dateInput.value = getLocalDateYyyyMmDd();
 }
 document.getElementById('digging-id-sampel-warning').classList.add('hidden');
 const modal = document.getElementById('form-digging-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeFormDiggingPopup() {
 const modal = document.getElementById('form-digging-popup-modal');
 hideModalAnimated(modal);
 }

 // Peringatan (bukan blokir) kalau ID Sampel yang diketik sudah pernah dipakai di data
 // yang sudah ada -- membantu cegah salah ketik/ke-reuse tidak sengaja. Re-sampling yang
 // memang disengaja tetap bisa lanjut (biasanya pakai kode berbeda, contoh DM01.A.L1 jadi
 // DM01.R.A.L1, dicatat juga di kolom Keterangan) karena ini exact-match, bukan mirip-mirip.
 function updateDiggingSM() {
 const mgo = parseFloat(document.querySelector('#diggingManagerForm input[name="mgo"]').value);
 const sio2 = parseFloat(document.querySelector('#diggingManagerForm input[name="sio2"]').value);
 const smInput = document.getElementById('digging-sm-input');
 if (!isNaN(mgo) && mgo > 0 && !isNaN(sio2)) {
  smInput.value = (sio2 / mgo).toFixed(2);
 } else {
  smInput.value = '';
 }
 // SM% ikut menentukan Tipe Ore final kalau dropdown Tipe Ore diset "Auto" -- recalc
 // Tonase juga di sini supaya tetap sinkron begitu SM% berubah.
 updateDiggingTonaseAuto();
 }

 // BARU (Bucket & Sampel): hitung Tonase otomatis dari Total Sampel x Bucket_per_Sampel x
 // WMT_per_Bucket (WMT_per_Bucket beda per Tipe Ore, ambil dari globalCOGConfig). Dipanggil
 // tiap kali Total Sampel, Tipe Ore, atau SM% (untuk mode Auto Detect) berubah.
 function updateDiggingTonaseAuto() {
 const totalSampelInput = document.getElementById('digging-total-sampel-input');
 const tonaseInput = document.getElementById('digging-tonase-input');
 if (!totalSampelInput || !tonaseInput) return;

 const totalSampel = parseFloat(totalSampelInput.value);
 const tipeOreSelected = document.getElementById('digging-tipe-ore-select').value;
 const smInput = document.getElementById('digging-sm-input');
 const smVal = smInput ? parseFloat(smInput.value) : NaN;

 if (isNaN(totalSampel) || totalSampel <= 0) {
  tonaseInput.value = '';
  return;
 }

 const cfg = globalCOGConfig || {
  Sapro: { WMT_per_Bucket: 2.2 }, Limo: { WMT_per_Bucket: 2.2 },
  Limo_Aktif: false, SM_Threshold_AutoDetect: 3, Bucket_per_Sampel: 8
 };
 // Tentukan Tipe Ore final -- kalau "Auto" dan SM% belum diisi, sementara pakai Sapro
 // (tonase akan otomatis terkoreksi begitu SM% diisi, lewat panggilan dari updateDiggingSM).
 let tipeOreFinal = tipeOreSelected;
 if (!cfg.Limo_Aktif) {
  tipeOreFinal = 'Sapro';
 } else if (tipeOreSelected === 'Auto') {
  tipeOreFinal = (!isNaN(smVal) && smVal >= (cfg.SM_Threshold_AutoDetect || 3)) ? 'Limo' : 'Sapro';
 } else if (tipeOreSelected !== 'Sapro' && tipeOreSelected !== 'Limo') {
  tipeOreFinal = 'Sapro';
 }

 const wmtPerBucket = (cfg[tipeOreFinal] && cfg[tipeOreFinal].WMT_per_Bucket) || 2.2;
 const bucketPerSampel = cfg.Bucket_per_Sampel || 8;
 const tonase = totalSampel * bucketPerSampel * wmtPerBucket;
 tonaseInput.value = tonase.toFixed(2);
 }

 function onDiggingTujuanChange() {
 const tujuan = document.getElementById('digging-tujuan-select').value;
 const shipWrapper = document.getElementById('digging-ship-wrapper');
 if (tujuan === 'Direct') {
  shipWrapper.classList.remove('hidden');
 } else {
  shipWrapper.classList.add('hidden');
  document.querySelector('#diggingManagerForm input[name="ship"]').value = '';
 }
 }

 // ==== BARU (27 Agu, "Submit Dulu, Koreksi Nanti"): modal Update Hasil Assay ====
 async function submitDiggingForm(event) {
 event.preventDefault();
 const form = document.getElementById('diggingManagerForm');
 const submitBtn = document.getElementById('btn-submit-digging');
 const statusMsg = document.getElementById('digging-form-status-msg');
 const originalBtnHtml = submitBtn.innerHTML;

 const tanggal = form.tanggal.value;
 const pit = form.pit.value.trim();
 const blok = form.blok.value.trim();
 const tonase = form.tonase.value;
 const totalSampel = form.total_sampel.value;
 const idSampelVal = form.id_sampel.value.trim();

 if (!tanggal || !pit || !blok || !totalSampel || !tonase || !idSampelVal) {
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en' ? 'Date, Pit, Block, Total Samples, and Sample ID are required.' : 'Tanggal, Pit, Blok, Total Sampel, dan ID Sampel wajib diisi.';
  statusMsg.classList.remove('hidden');
  return;
 }

 const payload = buildAuthenticatedPayload(form);

 // BARU (27 Agu, "Submit Dulu, Koreksi Nanti"): kalau Ni belum diisi (assay masih
 // ditunggu lab), JANGAN klasifikasi Waste/LG/MG/HG/VHG (hasilnya bakal salah, seolah
 // Ni=0 asli). Tandai eksplisit "Menunggu Assay" -- Tabel Digging akan kasih badge
 // berkedip utk baris ini, beda dari klasifikasi grade manapun.
 const niRawInput = form.ni.value.trim();
 if (!niRawInput) {
  payload.set('material', 'Menunggu Assay');
  payload.set('tipe_ore', form.tipe_ore.value === 'Auto' ? 'Sapro' : form.tipe_ore.value);
 } else {
  const niForClassify = parseFloat(niRawInput) || 0;
  const smForClassify = parseFloat(form.sm.value) || 0;
  const tipeOreSelected = form.tipe_ore.value;
  const classifyResultForm = classifyMaterial(niForClassify, tipeOreSelected, smForClassify);
  payload.set('material', classifyResultForm.classGrade);
  payload.set('tipe_ore', classifyResultForm.tipeOreFinal);
 }

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, { method: 'POST', body: payload });
  const result = await response.json();

  if (result.status === 'success') {
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = result.auto_route ? ((currentLang === 'en' ? 'Production data saved -- ' : 'Data produksi berhasil disimpan -- ') + result.auto_route) : (currentLang === 'en' ? 'Production data saved!' : 'Data produksi berhasil disimpan!');
  statusMsg.classList.remove('hidden');
  form.reset();
  populateReporterDropdown();
  document.getElementById('digging-id-sampel-warning').classList.add('hidden');
  document.getElementById('digging-ship-wrapper').classList.add('hidden');

  setTimeout(() => {
   closeFormDiggingPopup();
   statusMsg.classList.add('hidden');
   fetchDataFromGoogleSheets(true);
  }, 900);
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to save production data.' : 'Gagal menyimpan data produksi.'));
  }
 } catch (error) {
  console.error('Error submitting digging form:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 function computeGcTonaseByBlok() {
 const acc = {};
 (globalRawData || []).forEach(row => {
  const c = rawToCleanRow.get(row) || {};
  const blok = (c['blok'] || c['id blok'] || c['idblok'] || c['id_blok'] || '').toString().trim().toUpperCase();
  const pit = (c['pit'] || '').toString().trim().toUpperCase();
  if (!blok) return;
  const key = blok + '|' + pit;
  const tonase = cleanNumber(c['tonase']);
  if (tonase <= 0) return;
  acc[key] = (acc[key] || 0) + tonase;
 });
 return acc;
 }

 async function fetchValidasiData() {
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=validasi&t=' + new Date().getTime());
  const result = await response.json();

  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to load validation data.' : 'Gagal memuat data validasi'));
  }

  globalValidasiData = groupValidasiRows(result.data || []);
  globalValidasiConfig = result.config || {};
  renderValidasiTable();
  // Kolom "Validasi (Ni %)" di tabel Block Model butuh data ini juga -- render ulang di
  // sini supaya benar terlepas dari urutan mana yang datang duluan (fetch Validasi vs
  // Block Model jalan paralel, tidak ada jaminan urutan selesainya, backend Apps Script
  // sering variatif latency-nya). Aman dipanggil walau tabelnya sedang tidak kelihatan.
  renderBlockModelTable();
  markDataFresh_('Validasi');
 } catch (err) {
  console.error('Gagal memuat data validasi:', err);
  markDataStale_('Validasi');
  // FIX (23 Agu): dikembalikan ke tabel asli -- pesan error fetch ditulis ke tbody
  // seperti semula, TIDAK lagi diarahkan ke kartu (kartu sudah dihapus, dikoreksi user).
  const isTimeout = err.name === 'AbortError';
  const tbody = document.getElementById('validasi-table-body');
  if (tbody) {
  const msg = isTimeout ? (currentLang === 'en' ? 'Server did not respond within 20s (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') : (currentLang === 'en' ? 'Failed to load validation data from Google Sheets.' : 'Gagal memuat data validasi dari Google Sheets.');
  tbody.innerHTML = `<tr><td colspan="15" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium"><p>${msg}</p><button onclick="fetchValidasiData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">${currentLang === 'en' ? 'Retry' : 'Coba Lagi (Retry)'}</button></td></tr>`;
  }
 }
 }

 // BARU (v89.16.24): baca sheet "COGConfig" -- parameter Cut of Grade (Waste/LG/MG/HG/VHG)
 // per Tipe_Ore (Sapro/Limo), toggle Limo_Aktif, dan ambang SM_Threshold_AutoDetect.
 // Dipanggil sekali di awal load (sama pola dengan fetchValidasiData), hasilnya disimpan
 // di globalCOGConfig supaya classifyMaterial() bisa dipakai di banyak tempat tanpa fetch ulang.
 // BARU (v90.2.123, temuan audit COGConfig fallback diam-diam): toast peringatan
 // dibuat murni via JS (tidak perlu markup baru di index.html), gaya konsisten dgn
 // pwa-update-toast yg sudah ada. TIDAK auto-hilang -- user harus sadar & klik "Mengerti"
 // supaya tidak terlewat begitu saja (beda dari toast update biasa yg boleh diabaikan).
 let cogFallbackToastShown = false;
 function showCogFallbackWarning_() {
 if (cogFallbackToastShown) return; // jangan dobel kalau fetchCOGConfig kepanggil berkali2
 cogFallbackToastShown = true;
 const toast = document.createElement('div');
 toast.id = 'cog-fallback-toast';
 toast.className = 'fixed bottom-4 left-4 z-[95] max-w-xs rounded-xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl p-3.5';
 toast.innerHTML = `
  <div class="flex items-start gap-2.5">
  <div class="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 shrink-0"><i data-lucide="triangle-alert" class="w-3.5 h-3.5"></i></div>
  <div class="min-w-0 flex-1">
   <p class="text-title text-xs font-bold">${currentLang === 'en' ? 'Using default COG parameters' : 'Memakai parameter COG default'}</p>
   <p class="text-slate-400 text-[10px] font-medium mt-0.5">${currentLang === 'en' ? 'Failed to load COGConfig from sheet. Grade classification (HG/MG/LG/Waste) currently uses fallback numbers, not the live configured values.' : 'Gagal memuat COGConfig dari sheet. Klasifikasi Grade (HG/MG/LG/Waste) saat ini memakai angka default, bukan nilai yang benar-benar berlaku.'}</p>
   <div class="flex gap-2 mt-2.5">
    <button onclick="document.getElementById('cog-fallback-toast')?.remove()" class="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all cursor-pointer">${currentLang === 'en' ? 'Understood' : 'Mengerti'}</button>
    <button onclick="document.getElementById('cog-fallback-toast')?.remove(); fetchCOGConfig();" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer">${currentLang === 'en' ? 'Retry' : 'Coba Lagi'}</button>
   </div>
  </div>
  </div>`;
 document.body.appendChild(toast);
 if (window.lucide) lucide.createIcons();
 }

 // v90.2.125 FIX (temuan audit -- race condition nyata): sequence guard -- kalau
 // fetchCOGConfig() dipanggil lagi (mis. auto-refresh) SEBELUM panggilan sebelumnya
 // selesai, response yg datang belakangan dari panggilan LAMA bisa menimpa
 // globalCOGConfig dgn config LAMA, walau user baru saja Save config BARU & trigger
 // fetch ulang. Skenario nyata: Fetch A mulai -> user Save config baru -> Fetch B
 // (refresh pasca-save) mulai&selesai duluan -> Fetch A (basi) selesai belakangan,
 // tetap menimpa globalCOGConfig balik ke config LAMA.
 let cogConfigFetchRequestSeq = 0;
 async function fetchCOGConfig() {
 const requestSeq = ++cogConfigFetchRequestSeq;
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=cogconfig&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to load COG configuration.' : 'Gagal memuat COGConfig'));
  }

  const rows = result.data || [];
  const cfg = {
  Sapro: null, Limo: null, Limo_Aktif: false, SM_Threshold_AutoDetect: 3,
  Target_Ship_Ni_Min: 1.3, Target_Ship_Ni_Max: 1.6,
  Warna_Waste: 'abu', Warna_LG: 'kuning', Warna_MG: 'biru', Warna_HG: 'hijau', Warna_VHG: 'hijau',
  Bucket_per_Sampel: 8, Sampel_per_Dome_Max: 25,
  Toleransi_Warning_Pct: 5, Toleransi_OutOfTol_Pct: 10
  };
  const VALID_COLOR_PRESETS = ['merah', 'abu', 'kuning', 'biru', 'hijau'];
  // v90.2.126 FIX (temuan audit -- edge case): SEBELUMNYA komentar bilang parameter
  // global "cuma dibaca dari baris pertama yg punya nilai", TAPI implementasinya menimpa
  // TIAP KALI ketemu baris dgn nilai -- kalau 2 baris (Sapro & Limo) kebetulan SAMA-SAMA
  // terisi beda nilai, hasil akhir tergantung urutan baris (baris TERAKHIR menang), bukan
  // baris pertama spt yg didokumentasikan. Set ini melacak field mana yg SUDAH di-set,
  // supaya beneran first-value-wins sesuai maksud aslinya.
  const alreadySetFields = new Set();
  function setOnceGlobal_(fieldName, value) {
  if (alreadySetFields.has(fieldName)) return;
  alreadySetFields.add(fieldName);
  cfg[fieldName] = value;
  }
  rows.forEach(row => {
  const tipe = (row['Tipe_Ore'] || '').toString().trim();
  const batas = {
   Batas_Waste_LG: parseFloat(row['Batas_Waste_LG']),
   Batas_LG_MG: parseFloat(row['Batas_LG_MG']),
   Batas_MG_HG: parseFloat(row['Batas_MG_HG']),
   Batas_HG_VHG: parseFloat(row['Batas_HG_VHG']),
   // BARU: WMT_per_Bucket beda per Tipe_Ore (density Sapro & Limo beda) -- fallback 2.2
   // (angka kesepakatan awal) kalau sheet belum diisi.
   WMT_per_Bucket: row['WMT_per_Bucket'] !== undefined && row['WMT_per_Bucket'] !== '' && !isNaN(parseFloat(row['WMT_per_Bucket']))
   ? parseFloat(row['WMT_per_Bucket']) : 2.2
  };
  if (tipe === 'Sapro') cfg.Sapro = batas;
  if (tipe === 'Limo') cfg.Limo = batas;
  // Limo_Aktif, SM_Threshold_AutoDetect, Target_Ship_Ni_Min/Max, Warna_*, Bucket_per_Sampel,
  // & Sampel_per_Dome_Max sifatnya global -- cuma dibaca dari baris PERTAMA yang punya
  // nilai (setOnceGlobal_ menjamin ini, baris berikutnya diabaikan meski ada nilai lagi).
  if (row['Limo_Aktif'] !== undefined && row['Limo_Aktif'] !== '') {
   const v = row['Limo_Aktif'].toString().trim().toUpperCase();
   setOnceGlobal_('Limo_Aktif', v === 'TRUE');
  }
  if (row['SM_Threshold_AutoDetect'] !== undefined && row['SM_Threshold_AutoDetect'] !== '') {
   const smT = parseFloat(row['SM_Threshold_AutoDetect']);
   if (!isNaN(smT)) setOnceGlobal_('SM_Threshold_AutoDetect', smT);
  }
  if (row['Target_Ship_Ni_Min'] !== undefined && row['Target_Ship_Ni_Min'] !== '') {
   const tsMin = parseFloat(row['Target_Ship_Ni_Min']);
   if (!isNaN(tsMin)) setOnceGlobal_('Target_Ship_Ni_Min', tsMin);
  }
  if (row['Target_Ship_Ni_Max'] !== undefined && row['Target_Ship_Ni_Max'] !== '') {
   const tsMax = parseFloat(row['Target_Ship_Ni_Max']);
   if (!isNaN(tsMax)) setOnceGlobal_('Target_Ship_Ni_Max', tsMax);
  }
  if (row['Bucket_per_Sampel'] !== undefined && row['Bucket_per_Sampel'] !== '') {
   const bps = parseFloat(row['Bucket_per_Sampel']);
   if (!isNaN(bps)) setOnceGlobal_('Bucket_per_Sampel', bps);
  }
  if (row['Sampel_per_Dome_Max'] !== undefined && row['Sampel_per_Dome_Max'] !== '') {
   const spd = parseFloat(row['Sampel_per_Dome_Max']);
   if (!isNaN(spd)) setOnceGlobal_('Sampel_per_Dome_Max', spd);
  }
  if (row['Toleransi_Warning_Pct'] !== undefined && row['Toleransi_Warning_Pct'] !== '') {
   const twp = parseFloat(row['Toleransi_Warning_Pct']);
   if (!isNaN(twp)) setOnceGlobal_('Toleransi_Warning_Pct', twp);
  }
  if (row['Toleransi_OutOfTol_Pct'] !== undefined && row['Toleransi_OutOfTol_Pct'] !== '') {
   const top = parseFloat(row['Toleransi_OutOfTol_Pct']);
   if (!isNaN(top)) setOnceGlobal_('Toleransi_OutOfTol_Pct', top);
  }
  // Preferensi warna per grade -- validasi terhadap 5 preset yang sah, kalau nilai
  // di sheet rusak/tidak dikenal, biarkan default (jangan sampai badge/teks error).
  // Sama spt field global lain -- first-value-wins, bukan overwrite tiap baris.
  ['Waste', 'LG', 'MG', 'HG', 'VHG'].forEach(grade => {
   const colKey = 'Warna_' + grade;
   const val = row[colKey];
   if (val !== undefined && val !== '' && VALID_COLOR_PRESETS.indexOf(val.toString().trim()) !== -1) {
   setOnceGlobal_(colKey, val.toString().trim());
   }
  });
  });

  // Fallback aman kalau sheet belum lengkap -- jangan sampai classifyMaterial() error
  // dan mematikan render tabel lain gara-gara COGConfig kosong/belum diisi.
  const sapreoMissing = !cfg.Sapro, limoMissing = !cfg.Limo;
  if (sapreoMissing) cfg.Sapro = { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 };
  if (limoMissing) cfg.Limo = { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 };

  if (requestSeq !== cogConfigFetchRequestSeq) return; // fetch lebih baru sudah menang, buang hasil basi ini
  globalCOGConfig = cfg;
  // BARU (v90.2.123, temuan audit): tampilkan peringatan VISIBLE kalau sebagian/seluruh
  // COGConfig pakai default fallback -- sebelumnya cuma console.error(), badge Grade tetap
  // terlihat normal padahal pakai parameter default, bukan dari sheet yg sebenarnya berlaku.
  cogConfigUsingFallback = sapreoMissing || limoMissing;
  if (cogConfigUsingFallback) showCogFallbackWarning_();
 } catch (err) {
  if (requestSeq !== cogConfigFetchRequestSeq) return;
  console.error('Gagal memuat COGConfig, pakai fallback default Sapro:', err);
  // Fallback total kalau fetch gagal -- dashboard tetap jalan pakai angka default lama,
  // supaya kegagalan endpoint baru ini tidak mematikan seluruh Tabel Digging/BlockModel.
  globalCOGConfig = {
  Sapro: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
  Limo: { Batas_Waste_LG: 0.8, Batas_LG_MG: 1.25, Batas_MG_HG: 1.45, Batas_HG_VHG: 1.7, WMT_per_Bucket: 2.2 },
  Limo_Aktif: false,
  SM_Threshold_AutoDetect: 3,
  Target_Ship_Ni_Min: 1.3,
  Target_Ship_Ni_Max: 1.6,
  Warna_Waste: 'abu', Warna_LG: 'kuning', Warna_MG: 'biru', Warna_HG: 'hijau', Warna_VHG: 'hijau',
  Bucket_per_Sampel: 8, Sampel_per_Dome_Max: 25,
  Toleransi_Warning_Pct: 5, Toleransi_OutOfTol_Pct: 10
  };
  cogConfigUsingFallback = true;
  showCogFallbackWarning_();
 }
 // Race condition: fetchCOGConfig() jalan paralel dengan fetchDataFromGoogleSheets(),
 // tidak ada jaminan urutan selesainya. Tabel Digging & KPI Saprolit/Limonit/LG/Waste
 // butuh globalCOGConfig SAAT render -- kalau data produksi datang lebih dulu, dia sudah
 // sempat render pakai fallback default. Render ulang di sini dari SEMUA sumber terkait,
 // sama pola dengan renderBlockModelTable() yang dipanggil ulang di akhir fetchValidasiData().
 if (typeof globalFilteredTableData !== 'undefined' && globalFilteredTableData.length > 0) {
  if (typeof renderTableData === 'function') renderTableData(globalFilteredTableData);
  if (typeof updateDashboard === 'function') updateDashboard(globalFilteredTableData);
 }
 // BARU: legenda toleransi & badge OK/WARNING/OUT OF TOL di tabel Block Model juga
 // butuh globalCOGConfig -- render ulang kalau data BlockModel sudah sempat datang duluan.
 if (typeof globalBlockModelData !== 'undefined' && globalBlockModelData.length > 0) {
  if (typeof renderBlockModelTable === 'function') renderBlockModelTable();
 }
 }

 // BARU (v89.16.24): fungsi kalkulasi terpusat -- SATU-SATUNYA tempat yang menentukan
 // Class_Grade (Waste/LG/MG/HG/VHG) dari Ni% + Tipe_Ore. Semua badge/chart/KPI yang
 // butuh klasifikasi grade WAJIB panggil fungsi ini, bukan hitung threshold sendiri-sendiri
 // -- supaya tidak ada tempat yang "lupa update" kalau angka COG diubah dari Settings.
 //
 // tipeOreInput: 'Sapro' | 'Limo' | 'Auto' | '' (kosong dianggap Sapro)
 // smValue: SiO2/MgO, dipakai HANYA kalau tipeOreInput = 'Auto'
 // Return: { classGrade: 'Waste'|'LG'|'MG'|'HG'|'VHG', tipeOreFinal: 'Sapro'|'Limo' }
 async function fetchBlockModelData() {
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=blockmodel&t=' + new Date().getTime());
  const result = await response.json();

  if (result.status !== 'success') {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Block Model data.' : 'Gagal memuat data Block Model'));
  }

  globalBlockModelData = result.data || [];
  markDataFresh_('Block Model');
  renderBlockModelChart();
  renderBlockModelTable();
  updateBlockModelSummaryCard();
  computeReconciliationMatrix();
 } catch (err) {
  console.error('Gagal memuat data Block Model:', err);
  markDataStale_('Block Model');
  const isTimeout = err.name === 'AbortError';
  const tbody = document.getElementById('rekon-blockmodel-body');
  if (tbody) {
  const msg = isTimeout ? (currentLang === 'en' ? 'Server did not respond within 20s (timeout).' : 'Server tidak merespons dalam 20 detik (timeout).') : (currentLang === 'en' ? 'Failed to load Block Model data from Google Sheets.' : 'Gagal memuat data Block Model dari Google Sheets.');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-rose-400 text-xs space-y-2 font-medium"><p>${msg}</p><button onclick="fetchBlockModelData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all">${currentLang === 'en' ? 'Retry' : 'Coba Lagi (Retry)'}</button></td></tr>`;
  }
 }
 }

 // Card ringkasan di tab Ringkasan -- hanya menghitung blok yang statusnya
 // sudah final (Status_Depletion terisi "Selesai"), mengecualikan baris
 // "Menunggu Data" supaya angkanya representasi murni dari blok yang lengkap.
 function updateBlockModelSummaryCard() {
 const estEl = document.getElementById('summary-blockmodel-estimasi');
 const realEl = document.getElementById('summary-blockmodel-realisasi');
 const varEl = document.getElementById('summary-blockmodel-variance');
 const countEl = document.getElementById('summary-blockmodel-count');
 const estNiEl = document.getElementById('summary-blockmodel-estimasi-ni');
 const realNiEl = document.getElementById('summary-blockmodel-realisasi-ni');
 if (!estEl || !realEl || !varEl) return;

 const finalRows = (globalBlockModelData || []).filter(row => {
  const statusKpi = (row['Status_KPI'] || '').toString();
  const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
  const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';
  return !isBelumFinal;
 });

 if (finalRows.length === 0) {
  estEl.innerText = '0 ' + (currentLang === 'en' ? 'Tons' : 'Ton');
  realEl.innerText = '0 ' + (currentLang === 'en' ? 'Tons' : 'Ton');
  varEl.innerText = '0%';
  if (estNiEl) estNiEl.innerText = '-';
  if (realNiEl) realNiEl.innerText = '-';
  if (countEl) countEl.innerText = currentLang === 'en' ? 'Overall Variance (no finalized blocks yet)' : 'Variance Keseluruhan (belum ada blok final)';
  const varTonElEmpty = document.getElementById('summary-blockmodel-variance-ton');
  if (varTonElEmpty) { varTonElEmpty.innerText = '-'; varTonElEmpty.className = 'text-[10px] text-slate-500 font-medium mt-0.5'; }
  return;
 }

 const totalEstimasi = finalRows.reduce((s, r) => s + (typeof r['Estimasi_tonase'] === 'number' ? r['Estimasi_tonase'] : 0), 0);
 const totalRealisasi = finalRows.reduce((s, r) => s + (typeof r['Realisasi_Tonase'] === 'number' ? r['Realisasi_Tonase'] : 0), 0);
 const variancePct = totalEstimasi === 0 ? 0 : Math.abs(totalEstimasi - totalRealisasi) / totalEstimasi * 100;

 estEl.innerText = totalEstimasi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 realEl.innerText = totalRealisasi.toLocaleString('id-ID', { maximumFractionDigits: 0 }) + (currentLang === 'en' ? ' Tons' : ' Ton');
 varEl.innerText = variancePct.toFixed(2) + '%';
 if (countEl) {
  const label = currentLang === 'en' ? `Overall Variance (${finalRows.length} finalized blocks)` : `Variance Keseluruhan (${finalRows.length} blok final)`;
  countEl.innerText = label;
 }

 // BARU: Total Loss/Dilusi dalam satuan Ton (bukan cuma %) -- selisih Realisasi - Estimasi
 // dari populasi blok final yang sama dipakai di atas. Negatif = Loss (realisasi kurang dari
 // rencana), positif = Dilusi (realisasi lebih dari rencana, ada tambahan material).
 const varTonEl = document.getElementById('summary-blockmodel-variance-ton');
 if (varTonEl) {
  const varianceTon = totalRealisasi - totalEstimasi;
  const isLossTon = varianceTon < 0;
  const absVarianceTonFmt = Math.abs(varianceTon).toLocaleString('id-ID', { maximumFractionDigits: 0 });
  const labelTon = isLossTon
  ? (currentLang === 'en' ? `Loss: ${absVarianceTonFmt} Ton` : `Loss: ${absVarianceTonFmt} Ton`)
  : (varianceTon > 0
    ? (currentLang === 'en' ? `Dilution: +${absVarianceTonFmt} Ton` : `Dilusi: +${absVarianceTonFmt} Ton`)
    : (currentLang === 'en' ? '0 Ton' : '0 Ton'));
  varTonEl.innerText = labelTon;
  varTonEl.className = 'text-[10px] font-medium mt-0.5 ' + (isLossTon ? 'text-amber-400' : (varianceTon > 0 ? 'text-rose-400' : 'text-slate-500'));
 }

 // Ni% Estimasi -- rata-rata tertimbang TONASE (bukan rata-rata polos) dari Block Model,
 // cuma Blok yang sudah final -- konsisten dengan populasi yang sama seperti perbandingan
 // Estimasi/Realisasi Ton di atas.
 if (estNiEl) {
  let sumEstimasiMetal = 0;
  finalRows.forEach(r => {
  const t = typeof r['Estimasi_tonase'] === 'number' ? r['Estimasi_tonase'] : 0;
  const ni = typeof r['Estimasi_Ni %'] === 'number' ? r['Estimasi_Ni %'] : 0;
  sumEstimasiMetal += t * ni;
  });
  const avgEstimasiNi = totalEstimasi > 0 ? sumEstimasiMetal / totalEstimasi : 0;
  estNiEl.innerText = avgEstimasiNi > 0 ? avgEstimasiNi.toFixed(2) + '%' : '-';
 }

 // Ni% Realisasi -- sheet BlockModel TIDAK menyimpan kadar aktual (cuma Realisasi_Tonase),
 // jadi dihitung dari data Digging asli (globalRawData), difilter cuma baris yang Blok-nya
 // termasuk dalam set Blok final di atas, rata-rata tertimbang tonase juga.
 if (realNiEl) {
  // v90.2.125 FIX (temuan audit -- bug serius): SEBELUMNYA finalBlokSet cuma kunci
  // Id_blok, padahal granularitas final yg BENAR adalah Blok+Pit (1 Blok bisa punya
  // banyak Pit, sebagian final sebagian belum). Contoh nyata: L-01/Pit A sudah Final,
  // L-01/Pit B belum -- Summary lama tetap ikutkan SEMUA produksi L-01 termasuk Pit B yg
  // belum final. Sekarang kunci Blok+Pit, konsisten dgn renderReconciliation() (v90.2.124).
  const finalBlokPitSet = new Set(finalRows.map(r => {
  const b = (r['Id_blok'] || '').toString().trim().toUpperCase();
  const p = (r['Pit'] || '').toString().trim().toUpperCase();
  return b + '|' + p;
  }));
  let sumRealisasiMetal = 0, sumRealisasiTon = 0;
  (globalRawData || []).forEach(row => {
  const cleanRow = rawToCleanRow ? rawToCleanRow.get(row) : null;
  if (!cleanRow) return;
  const blok = (cleanRow['blok'] || cleanRow['id blok'] || cleanRow['id_blok'] || '').toString().trim().toUpperCase();
  const pit = (cleanRow['pit'] || cleanRow['area'] || '').toString().trim().toUpperCase();
  if (!finalBlokPitSet.has(blok + '|' + pit)) return;
  const tonase = cleanNumber(cleanRow['tonase']);
  let ni = cleanPercentValue(cleanRow['ni %'] || cleanRow['ni']);
  if (ni > 50) ni = ni / 100;
  if (tonase > 0 && ni > 0) {
   sumRealisasiMetal += tonase * ni;
   sumRealisasiTon += tonase;
  }
  });
  const avgRealisasiNi = sumRealisasiTon > 0 ? sumRealisasiMetal / sumRealisasiTon : 0;
  realNiEl.innerText = avgRealisasiNi > 0 ? avgRealisasiNi.toFixed(2) + '%' : '-';
 }
 }

 function renderBlockModelTable() {
 const tbody = document.getElementById('rekon-blockmodel-body');
 const countEl = document.getElementById('rekon-blockmodel-badge');
 if (!tbody) return;

 if (!globalBlockModelData || globalBlockModelData.length === 0) {
  const emptyMsg = currentLang === 'en' ? 'No Block Model data yet.' : 'Belum ada data Block Model.';
  tbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-500 text-xs font-medium">${emptyMsg}</td></tr>`;
  if (countEl) countEl.classList.add('hidden');
  return;
 }

 if (countEl) {
  countEl.innerText = globalBlockModelData.length;
  countEl.classList.remove('hidden');
 }

 const realisasiKimiaByBlok = computeRealisasiKimiaByBlok();

 // Isi teks legenda toleransi -- ambang dari globalCOGConfig, fallback 5%/10% kalau
 // belum diatur (sama default yang dipakai di kalkulasi toleransiBadge di bawah).
 const legendEl = document.getElementById('blockmodel-toleransi-legend');
 if (legendEl) {
  const tolCfgLegend = globalCOGConfig || {};
  const warnPctLegend = typeof tolCfgLegend.Toleransi_Warning_Pct === 'number' ? tolCfgLegend.Toleransi_Warning_Pct : 5;
  const ootPctLegend = typeof tolCfgLegend.Toleransi_OutOfTol_Pct === 'number' ? tolCfgLegend.Toleransi_OutOfTol_Pct : 10;
  legendEl.innerHTML = (currentLang === 'en'
  ? `Tolerance legend: <span class="text-emerald-400 font-semibold">OK</span> &le; &plusmn;${warnPctLegend}% &middot; <span class="text-amber-400 font-semibold">WARNING</span> &plusmn;${warnPctLegend}%-${ootPctLegend}% &middot; <span class="text-rose-400 font-semibold">OUT OF TOL</span> &gt; &plusmn;${ootPctLegend}%`
  : `Legenda toleransi: <span class="text-emerald-400 font-semibold">OK</span> &le; &plusmn;${warnPctLegend}% &middot; <span class="text-amber-400 font-semibold">WARNING</span> &plusmn;${warnPctLegend}%-${ootPctLegend}% &middot; <span class="text-rose-400 font-semibold">OUT OF TOL</span> &gt; &plusmn;${ootPctLegend}%`);
 }

 tbody.innerHTML = globalBlockModelData.map((row, idx) => {
  const idBlok = row['Id_blok'] || '-';
  const pit = row['Pit'] || '-';
  const estimasiNi = row['Estimasi_Ni %'];
  const estimasi = row['Estimasi_tonase'];
  const realisasi = row['Realisasi_Tonase'];
  const variasi = row['Variasi_%'];
  const arahRaw = (row['Arah'] || '').toString();
  const statusKpi = (row['Status_KPI'] || '').toString();
  const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
  const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';

  const estimasiFmt = (typeof estimasi === 'number') ? estimasi.toLocaleString('id-ID') : (estimasi || '-');
  const realisasiFmt = (typeof realisasi === 'number') ? realisasi.toLocaleString('id-ID') : (realisasi || '-');
  const variasiFmt = (typeof variasi === 'number') ? variasi.toFixed(2) + '%' : (variasi || '-');
  // BARU: Total Loss/Dilusi dalam satuan Ton (bukan cuma %) per baris -- selisih
  // Realisasi - Estimasi, cuma dihitung untuk blok yang sudah final (sama syarat variasiColorClass).
  const variasiTon = (!isBelumFinal && typeof realisasi === 'number' && typeof estimasi === 'number') ? (realisasi - estimasi) : null;
  const variasiTonFmt = variasiTon === null ? '' : `<div class="text-[9.5px] font-normal text-slate-500 mt-0.5">${variasiTon < 0 ? '-' : '+'}${Math.abs(variasiTon).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Ton</div>`;

  // Realisasi Ni/Fe % (rata-rata tertimbang dari Produksi_GC, per Blok+Pit) untuk kolom
  // ringkas Ni%/Fe% -- detail lengkap (+Co/MgO/SiO2, +Validasi cross-check) ada di popup.
  const realKimiaKey = idBlok.trim().toUpperCase() + '|' + pit.trim().toUpperCase();
  const realKimia = realisasiKimiaByBlok[realKimiaKey] || null;
  // Warna Ni% Aktual ikut classGrade lewat preset terpusat (getGradeTextClass) -- pakai
  // mode Auto Detect (SM% realisasi) karena BlockModel tidak simpan Tipe_Ore per baris.
  const niAktColorBM = realKimia && typeof realKimia.ni === 'number'
  ? getGradeTextClass(classifyMaterial(realKimia.ni, 'Auto', realKimia.sm).classGrade)
  : 'text-title';
  const niCellHtml = formatEstAktCell(estimasiNi, realKimia ? realKimia.ni : null, niAktColorBM);
  const feCellHtml = formatEstAktCell(row['Estimasi_Fe %'], realKimia ? realKimia.fe : null);
  const smCellHtml = formatEstAktCell(row['Estimasi_SM %'], realKimia ? realKimia.sm : null);

  // Loss/Dilusi cuma berlaku untuk blok yang SUDAH final (Aman/Tidak Aman) -- blok yang
  // masih "Menunggu Data" tetap netral, karena variance di situ bukan Loss/Dilusi
  // beneran, cuma belum ada realisasi sama sekali (lihat diskusi soal salah kaprah ini).
  let variasiColorClass = 'text-slate-300';
  if (!isBelumFinal) {
  if (arahRaw.includes('Realisasi < Estimasi')) {
   variasiColorClass = 'text-amber-400 font-bold'; // Loss
  } else if (arahRaw.includes('Realisasi > Estimasi')) {
   variasiColorClass = 'text-rose-400 font-bold'; // Dilusi
  }
  }

  // BARU: badge toleransi (OK/WARNING/OUT OF TOL) berdasar BESARAN |Variasi %| dibanding
  // ambang di COGConfig (Toleransi_Warning_Pct, Toleransi_OutOfTol_Pct) -- ini pelengkap,
  // BEDA dari statusBadge (Aman/Tidak Aman dari Status_KPI sheet, itu cek arah Loss/Dilusi
  // vs batas kebijakan Ni%). Badge ini soal SEBERAPA BESAR penyimpangannya, bukan arahnya.
  let toleransiBadge = '';
  let isOutOfTol = false;
  if (!isBelumFinal && typeof variasi === 'number') {
  const tolCfg = globalCOGConfig || {};
  const warnPct = typeof tolCfg.Toleransi_Warning_Pct === 'number' ? tolCfg.Toleransi_Warning_Pct : 5;
  const ootPct = typeof tolCfg.Toleransi_OutOfTol_Pct === 'number' ? tolCfg.Toleransi_OutOfTol_Pct : 10;
  const absVariasi = Math.abs(variasi);
  if (absVariasi > ootPct) {
   toleransiBadge = `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">OUT OF TOL</span>`;
   isOutOfTol = true;
  } else if (absVariasi > warnPct) {
   toleransiBadge = `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">WARNING</span>`;
  } else {
   toleransiBadge = `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>`;
  }
  }

  // BARU: Quick Link RCA -- cuma muncul di baris OUT OF TOL, cuma untuk Developer (sama
  // pola canManageRca() yang sudah dipakai tombol "Catat RCA" biasa). Klik langsung buka
  // Form RCA Baru dengan Blok & Pit sudah terisi dari baris ini -- kontrol akses TETAP
  // di endpoint addRcaLog (server-side rca.create/rca.close), tombol ini cuma jalan pintas UI, bukan celah baru.
  let quickLinkRca = '';
  if (isOutOfTol && canManageRca()) {
  const blokEsc = idBlok.toString().replace(/'/g, "\\'");
  const pitEsc = pit.toString().replace(/'/g, "\\'");
  quickLinkRca = `<button onclick="event.stopPropagation(); openFormRcaPopup('${blokEsc}', '${pitEsc}')" title="${currentLang === 'en' ? 'Quick RCA' : 'Catat RCA Cepat'}" class="ml-1 inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 transition-all cursor-pointer align-middle"><i data-lucide="zap" class="w-2.5 h-2.5"></i></button>`;
  }

  let statusBadge;
  if (isBelumFinal) {
  const label = currentLang === 'en' ? 'Awaiting Data' : 'Menunggu Data';
  statusBadge = `<span class="px-2 py-0.5 rounded-lg bg-slate-700/40 text-slate-400 border border-slate-600/40 font-semibold text-[11px]">${label}</span>`;
  // v90.2.125 FIX (temuan audit -- BUG PALING KRITIS sesi ini): SEBELUMNYA pakai
  // .includes('Aman'), tapi "Tidak Aman".includes('Aman') === true di JS -- blok yg
  // sebenarnya TIDAK AMAN bisa dirender badge hijau "Aman", kebalikan total dari
  // status sebenarnya. Sekarang exact-match (trim+lowercase), tidak lagi substring.
  } else if (statusKpi.trim().toLowerCase() === 'aman') {
  const label = currentLang === 'en' ? 'Safe' : 'Aman';
  statusBadge = `<span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">${label}</span>`;
  } else {
  const label = currentLang === 'en' ? 'Not Safe' : 'Tidak Aman';
  statusBadge = `<span class="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px]">${label}</span>`;
  }

  const rowClass = isBelumFinal ? 'opacity-50 cursor-pointer hover:bg-slate-800/30 transition-colors' : 'cursor-pointer hover:bg-slate-800/30 transition-colors';

  return `
  <tr class="${rowClass}" onclick="openBlockModelDetailModal(${idx})">
   <td class="p-2.5 font-semibold text-title">${idBlok}</td>
   <td class="p-2.5 text-slate-300">${pit}</td>
   <td class="p-2.5 text-center">${niCellHtml}</td>
   <td class="p-2.5 text-center">${feCellHtml}</td>
   <td class="p-2.5 text-center">${smCellHtml}</td>
   <td class="p-2.5 text-right text-slate-300">${estimasiFmt}</td>
   <td class="p-2.5 text-right text-slate-300">${realisasiFmt}</td>
   <td class="p-2.5 text-right ${variasiColorClass}">${variasiFmt}${toleransiBadge}${quickLinkRca}${variasiTonFmt}</td>
   <td class="p-2.5 text-center">${statusBadge}</td>
  </tr>
  `;
 }).join('');

 // BARU: render ulang ikon Lucide (termasuk "zap" di tombol Quick Link RCA) setelah
 // tbody diisi -- innerHTML tidak otomatis proses data-lucide, harus dipanggil manual.
 lucide.createIcons();
 }

 // Format sel ringkas "Estimasi -> Aktual" dipakai kolom Ni%/Fe% di tabel utama.
 function openBlockModelDetailModal(idx) {
 const row = globalBlockModelData[idx];
 if (!row) return;
 const idBlok = (row['Id_blok'] || '-').toString();
 const pit = row['Pit'] || '-';
 const estimasiNi = row['Estimasi_Ni %'];

 const realisasiKimiaByBlok = computeRealisasiKimiaByBlok();
 const realKimiaKey = idBlok.trim().toUpperCase() + '|' + pit.toString().trim().toUpperCase();
 const realKimia = realisasiKimiaByBlok[realKimiaKey] || null;

 const paramRows = [
  { label: 'Ni %', est: estimasiNi, akt: realKimia ? realKimia.ni : null },
  { label: 'Fe %', est: row['Estimasi_Fe %'], akt: realKimia ? realKimia.fe : null },
  { label: 'Co %', est: row['Estimasi_Co %'], akt: realKimia ? realKimia.co : null },
  { label: 'MgO %', est: row['Estimasi_MgO %'], akt: realKimia ? realKimia.mgo : null },
  { label: 'SiO2 %', est: row['Estimasi_SiO %'], akt: realKimia ? realKimia.sio2 : null },
  { label: 'SM % (SiO2/MgO)', est: row['Estimasi_SM %'], akt: realKimia ? realKimia.sm : null }
 ];

 const rowsHtml = paramRows.map(p => {
  const estFmt = (typeof p.est === 'number') ? p.est.toFixed(2) : '-';
  const aktFmt = (typeof p.akt === 'number') ? p.akt.toFixed(2) : '-';
  let deltaHtml = '<span class="text-slate-600">-</span>';
  if (typeof p.est === 'number' && typeof p.akt === 'number') {
  const delta = p.akt - p.est;
  const sign = delta >= 0 ? '+' : '';
  const color = Math.abs(delta) <= 0.1 ? 'text-emerald-400' : 'text-amber-400';
  deltaHtml = `<span class="${color} font-semibold">${sign}${delta.toFixed(2)}</span>`;
  }
  return `
  <tr class="border-b border-slate-800/40">
   <td class="p-2 text-slate-300 font-medium">${p.label}</td>
   <td class="p-2 text-right text-slate-400">${estFmt}</td>
   <td class="p-2 text-right text-title font-semibold">${aktFmt}</td>
   <td class="p-2 text-right">${deltaHtml}</td>
  </tr>
  `;
 }).join('');

 // Validasi cross-check (Test Pit SEBELUM digali vs Estimasi) -- tetap ditampilkan di
 // popup, cuma dipindah dari kolom tabel utama supaya tabel tidak terlalu lebar.
 let validasiHtml = `<span class="text-slate-600">-</span>`;
 if (typeof estimasiNi === 'number' && globalValidasiData && globalValidasiData.length > 0) {
  const matchingGroups = globalValidasiData.filter(g => (g.blok || '').trim().toUpperCase() === idBlok.trim().toUpperCase());
  const niValues = matchingGroups.map(g => g.avg && g.avg.ni).filter(v => v !== null && v !== undefined);
  if (niValues.length > 0) {
  const avgValidasiNi = niValues.reduce((a, b) => a + b, 0) / niValues.length;
  const delta = avgValidasiNi - estimasiNi;
  const deltaColor = Math.abs(delta) <= 0.1 ? 'text-emerald-400' : 'text-amber-400';
  const sign = delta >= 0 ? '+' : '';
  validasiHtml = `<span class="text-slate-300 font-semibold">${avgValidasiNi.toFixed(2)}%</span> <span class="${deltaColor} text-[10px] font-semibold">(${sign}${delta.toFixed(2)} vs Estimasi)</span>`;
  }
 }

 document.getElementById('blockmodel-detail-title').innerText = `${idBlok} / ${pit}`;
 document.getElementById('blockmodel-detail-validasi').innerHTML = validasiHtml;
 document.getElementById('blockmodel-detail-kimia-body').innerHTML = rowsHtml;

 showModalAnimated(document.getElementById('blockmodel-detail-modal'));
 lucide.createIcons();
 }

 function closeBlockModelDetailModal() {
 hideModalAnimated(document.getElementById('blockmodel-detail-modal'));
 }

 // ============================================================
 // MATRIKS REKONSILIASI F1-F4 (5 tahap: BM -> Validasi -> GC -> Pit Actual -> Plant)
 // F1 (GC/BM) & F2 (PitActual/GC) dihitung PER BLOK -- masih bisa dilacak balik.
 // F3 (Plant/PitActual) & F4 (Plant/BM) cuma LEVEL TOTAL -- begitu material masuk Dome,
 // tercampur dari banyak Blok sekaligus (itu memang tujuan Dome), jadi identitas Blok
 // asalnya hilang dan tidak bisa dilacak balik per Blok lagi tanpa data yang salah.
 // ============================================================

 async function fetchPitActualData() {
 try {
  const response = await fetchWithTimeout(GOOGLE_SCRIPT_READ_URL + '?sheet=pitactual&t=' + new Date().getTime());
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || (currentLang === 'en' ? 'Failed to load Pit Actual data.' : 'Gagal memuat data Pit Actual'));
  globalPitActualData = result.data || [];
  computeReconciliationMatrix();
  markDataFresh_('Pit Actual');
 } catch (err) {
  console.error('Gagal memuat data Pit Actual:', err);
  markDataStale_('Pit Actual');
 }
 }

 // Unlock AudioContext saat user pertama kali interaksi APAPUN dgn halaman (klik/tap/keydown) --
 // syarat browser modern (Chrome/Safari) supaya AudioContext bisa benar-benar bunyi. Tanpa ini,
 // AudioContext yang dibuat TANPA didahului gesture user akan tetap berstatus "suspended" dan
 // TIDAK akan pernah mengeluarkan suara -- ini kebijakan browser (autoplay policy) demi keamanan
 // user, BUKAN bug kode & tidak bisa dilewati sepenuhnya dari sisi kode manapun. Context dibuat
 // SEKALI saja saat interaksi pertama & dipakai ulang oleh triggerEwsAlert() seterusnya.
 let ewsAudioCtx = null;
 function renderBlockModelChart() {
 const countEl = document.getElementById('blockmodel-badge');
 if (!blockModelChart) return;

 if (!globalBlockModelData || globalBlockModelData.length === 0) {
  blockModelChart.data.labels = [];
  blockModelChart.data.datasets[0].data = [];
  blockModelChart.data.datasets[1].data = [];
  blockModelChart.data.datasets[2].data = [];
  blockModelChart.data.datasets[2].backgroundColor = [];
  blockModelChart.update();
  if (countEl) countEl.classList.add('hidden');
  return;
 }

 if (countEl) {
  countEl.innerText = globalBlockModelData.length;
  countEl.classList.remove('hidden');
 }

 // Nilai "Arah" datang sebagai teks Indonesia mentah langsung dari sheet
 // (bukan dari dictionary i18n dashboard), jadi diterjemahkan lewat pemetaan di sini.
 const arahLabel = (arahRaw) => {
  if (currentLang !== 'en') return arahRaw;
  if (arahRaw.includes('Realisasi < Estimasi')) return 'Actual < Estimate';
  if (arahRaw.includes('Realisasi > Estimasi')) return 'Actual > Estimate';
  if (arahRaw.includes('Sama Persis')) return 'Exact Match';
  return arahRaw;
 };

 const labels = [];
 const estimasiData = [];
 const gcData = [];
 const realisasiData = [];
 const realisasiColors = [];
 const meta = []; // info tambahan (variasi %, arah, status) untuk tooltip

 const gcTonaseByBlok = computeGcTonaseByBlok();

 globalBlockModelData.forEach(row => {
  const idBlok = row['Id_blok'] || '-';
  const pit = row['Pit'] || '-';
  const estimasi = row['Estimasi_tonase'];
  const realisasi = row['Realisasi_Tonase'];
  const variasi = row['Variasi_%'];
  const arah = arahLabel(row['Arah'] || '-');
  const statusKpi = (row['Status_KPI'] || '').toString();
  const depletionVal_ = (row['Status_Depletion'] || '').toString().trim();
  const isBelumFinal = statusKpi.includes('Belum Final') || depletionVal_ !== 'Selesai';

  labels.push([`${idBlok} ${pit}`, isBelumFinal ? '-' : (typeof variasi === 'number' ? variasi.toFixed(2) + '%' : '-')]);
  estimasiData.push(typeof estimasi === 'number' ? estimasi : 0);
  const gcKey = idBlok.toString().trim().toUpperCase() + '|' + pit.toString().trim().toUpperCase();
  gcData.push(gcTonaseByBlok[gcKey] || 0);
  realisasiData.push(typeof realisasi === 'number' ? realisasi : 0);

  let barColor, statusLabel;
  if (isBelumFinal) {
  barColor = '#64748b';
  statusLabel = currentLang === 'en' ? 'Awaiting Data' : 'Menunggu Data';
  } else if (statusKpi.trim().toLowerCase() === 'aman') {
  barColor = '#10b981';
  statusLabel = currentLang === 'en' ? 'Safe' : 'Aman';
  } else {
  barColor = '#f43f5e';
  statusLabel = currentLang === 'en' ? 'Not Safe' : 'Tidak Aman';
  }
  realisasiColors.push(barColor);

  const variasiFmt = isBelumFinal ? '-' : ((typeof variasi === 'number') ? variasi.toFixed(2) + '%' : (variasi || '-'));
  meta.push({ variasiFmt, arah, statusLabel });
 });

 blockModelChart.data.labels = labels;
 blockModelChart.data.datasets[0].label = currentLang === 'en' ? 'Estimated (Ton)' : 'Estimasi (Ton)';
 blockModelChart.data.datasets[0].data = estimasiData;
 blockModelChart.data.datasets[1].label = 'GC (Ton)';
 blockModelChart.data.datasets[1].data = gcData;
 blockModelChart.data.datasets[2].label = currentLang === 'en' ? 'Actual (Ton)' : 'Realisasi (Ton)';
 blockModelChart.data.datasets[2].data = realisasiData;
 blockModelChart.data.datasets[2].backgroundColor = realisasiColors;

 blockModelChart.options.plugins.tooltip = {
  callbacks: {
  afterLabel: function(context) {
   if (context.datasetIndex !== 2) return '';
   const m = meta[context.dataIndex];
   const variasiLabel = currentLang === 'en' ? 'Variance' : 'Variasi';
   const statusLabelText = currentLang === 'en' ? 'Status' : 'Status';
   return `${variasiLabel}: ${m.variasiFmt} (${m.arah})\n${statusLabelText}: ${m.statusLabel}`;
  }
  }
 };

 blockModelChart.update();
 }

 function groupValidasiRows(rawRows) {
 const groups = [];
 const groupMap = {};
 let current = null;

 const fillIfBlank = (obj, key, val) => {
  if (val && (!obj[key] || obj[key] === '-')) obj[key] = val;
 };

 rawRows.forEach(row => {
  const cleanRow = {};
  Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
  const idTp = (cleanRow['id tp'] || cleanRow['id_tp'] || '').toString().trim();

  if (idTp) {
  if (groupMap[idTp]) {
   current = groupMap[idTp];
  } else {
   current = {
   idTp: idTp, tanggal: '-', blok: '-', area: '-', user: '-', bench: '-', timur: '-', utara: '-',
   warna: '-', struktur: '-', pelapor: '-', depths: []
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
  const hasAssay = cleanRow['ni %'] || cleanRow['fe %'] || cleanRow['co %'] || cleanRow['mgo %'] || cleanRow['sio2 %'] || cleanRow['sm %'] || cleanRow['catatan'] || laterit;
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

 groups.forEach(g => {
  g.depths.sort((a, b) => a.meter - b.meter);
  g.avg = {};
  ['ni', 'fe', 'co', 'mgo', 'sio2', 'sm'].forEach(param => {
  const vals = g.depths.map(d => cleanNumber(d[param])).filter(v => v > 0);
  g.avg[param] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  });
 });

 return groups;
 }

 function getValidasiNiStatus(avgNi) {
 if (avgNi === null || avgNi === undefined) {
  return { label: '-', cls: 'bg-slate-700/40 text-slate-400 border-slate-600/40' };
 }
 const targetNi = parseFloat(globalValidasiConfig['Target Ni']);
 const batasMin = parseFloat(globalValidasiConfig['Batas Ni Min']);
 if (isNaN(targetNi) || isNaN(batasMin)) {
  return { label: '-', cls: 'bg-slate-700/40 text-slate-400 border-slate-600/40' };
 }
 const waspadaMargin = 0.05; // Ni dalam radius ini dari Batas Min dianggap "mendekati"

 if (avgNi < batasMin) {
  return { label: currentLang === 'en' ? 'Poor' : 'Jelek', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
 } else if (avgNi < batasMin + waspadaMargin) {
  return { label: currentLang === 'en' ? 'Caution' : 'Waspada', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
 } else if (avgNi < targetNi) {
  return { label: currentLang === 'en' ? 'Safe' : 'Aman', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
 } else {
  return { label: currentLang === 'en' ? 'Good' : 'Bagus', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
 }
 }

 // BARU: tab-switcher Grafik <-> TP (pola persis switchTrendView di Visual & Trend) --
 // eksklusif, cuma 1 view aktif dalam satu waktu. Default: Grafik aktif, TP tersembunyi.
 // FIX (23 Agu, dikoreksi user): view "TP" sekarang menampilkan TABEL asli (bukan kartu) --
 // toggle tetap sama polanya (pola persis switchTrendView di Visual & Trend), cuma target
 // elemen dikembalikan ke tabel.
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
  btnTp.classList.add(...activeCls); btnTp.classList.remove(...inactiveCls);
  btnChart.classList.remove(...activeCls); btnChart.classList.add(...inactiveCls);
 } else {
  tableCard.classList.add('hidden');
  chartCard.classList.remove('hidden');
  btnChart.classList.add(...activeCls); btnChart.classList.remove(...inactiveCls);
  btnTp.classList.remove(...activeCls); btnTp.classList.add(...inactiveCls);
 }
 }

 // CATATAN (23 Agu): tabel dikembalikan seperti semula (bukan kartu) -- render langsung
 // ke <tbody>, sama seperti sebelum sempat diubah ke kartu.
 function renderValidasiTable() {
 const tbody = document.getElementById('validasi-table-body');
 const countLabel = document.getElementById('validasi-count');
 const search = (document.getElementById('validasi-search').value || '').toLowerCase();

 const filtered = globalValidasiData.filter(g => {
  if (!search) return true;
  return g.idTp.toLowerCase().includes(search) || g.blok.toLowerCase().includes(search) || g.bench.toLowerCase().includes(search) || g.depths.some(d => d.laterit.toLowerCase().includes(search));
 });

 countLabel.innerText = filtered.length + (currentLang === 'en' ? ' test pits' : ' titik TP');

 if (filtered.length === 0) {
  tbody.innerHTML = `<tr><td colspan="15" class="text-center p-6 text-slate-500 font-medium">${currentLang === 'en' ? 'No data found.' : 'Tidak ada data yang ditemukan.'}</td></tr>`;
 } else {
  const fmt = v => v === null || v === undefined ? '-' : v.toFixed(2);
  tbody.innerHTML = filtered.map((g) => {
  const idx = globalValidasiData.indexOf(g);
  const niStatus = getValidasiNiStatus(g.avg.ni);
  // Class Grade (Waste/LG/MG/HG/VHG) dihitung dari rata-rata Ni% + Auto Detect (pakai
  // SM% rata-rata yang sudah ada) -- sama fungsi classifyMaterial() dengan Tabel Digging,
  // supaya klasifikasi grade konsisten di seluruh dashboard.
  const classifyValidasi = classifyMaterial(g.avg.ni, 'Auto', g.avg.sm);
  const niColorClassValidasi = getGradeTextClass(classifyValidasi.classGrade);
  return `
  <tr class="hover:bg-slate-800/30 transition-colors cursor-pointer" onclick="openValidasiDetailModal(${idx})">
   <td class="p-3 text-slate-300">${g.tanggal}</td>
   <td class="p-3 font-semibold text-title">${g.idTp}</td>
   <td class="p-3 font-medium text-title">${g.blok}</td>
   <td class="p-3 text-slate-300">${g.bench}</td>
   <td class="p-3 text-slate-300">${g.area}</td>
   <td class="p-3 text-slate-300">${g.pelapor}</td>
   <td class="p-3 text-center text-slate-400">${g.depths.length}/5 m</td>
   <td class="p-3 text-center ${niColorClassValidasi} font-bold">${fmt(g.avg.ni)}</td>
   <td class="p-3 text-center text-slate-300">${fmt(g.avg.fe)}</td>
   <td class="p-3 text-center text-slate-300">${fmt(g.avg.co)}</td>
   <td class="p-3 text-center text-slate-300">${fmt(g.avg.mgo)}</td>
   <td class="p-3 text-center text-slate-300">${fmt(g.avg.sio2)}</td>
   <td class="p-3 text-center text-slate-300">${fmt(g.avg.sm)}</td>
   <td class="p-3 text-center">${renderClassGradeBadge(classifyValidasi.classGrade)}</td>
   <td class="p-3 text-center">
   <span class="px-2 py-0.5 rounded-md text-[11px] border font-semibold ${niStatus.cls}">${niStatus.label}</span>
   </td>
  </tr>
  `;
  }).join('');
 }

 if (validasiChart) {
  const byArea = {};
  filtered.forEach(g => {
  const area = g.area || '-';
  if (!byArea[area]) byArea[area] = [];
  if (g.avg.ni !== null && g.avg.ni !== undefined) byArea[area].push(g.avg.ni);
  });
  const areaNames = Object.keys(byArea).sort();
  validasiChart.data.labels = areaNames;
  validasiChart.data.datasets[0].data = areaNames.map(a => {
  const vals = byArea[a];
  return vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length) : 0;
  });
  validasiChart.update();
 }

 lucide.createIcons();
 }

 function openValidasiDetailModal(idx) {
 const g = globalValidasiData[idx];
 if (!g) return;

 document.getElementById('validasi-detail-idtp').innerText = g.idTp;
 const uniqueLaterit = [...new Set(g.depths.map(d => d.laterit).filter(v => v && v !== '-'))].join(', ') || '-';
 document.getElementById('validasi-detail-subtitle').innerText = `${uniqueLaterit} -- ${g.pelapor}`;
 document.getElementById('validasi-detail-tanggal').innerText = g.tanggal;
 document.getElementById('validasi-detail-bench').innerText = g.bench;
 document.getElementById('validasi-detail-area').innerText = g.area;
 document.getElementById('validasi-detail-koordinat').innerText = `${g.timur} / ${g.utara}`;
 document.getElementById('validasi-detail-warna').innerText = g.warna;
 document.getElementById('validasi-detail-struktur').innerText = g.struktur;

 const fmt = v => v === null || v === undefined ? '-' : v.toFixed(2);
 document.getElementById('validasi-detail-average').innerText =
  `Ni ${fmt(g.avg.ni)}% | Fe ${fmt(g.avg.fe)}% | Co ${fmt(g.avg.co)}% | MgO ${fmt(g.avg.mgo)}% | SiO2 ${fmt(g.avg.sio2)}% | SM ${fmt(g.avg.sm)}`;

 const body = document.getElementById('validasi-detail-body');
 body.innerHTML = g.depths.map(d => `
  <tr>
  <td class="p-2.5 font-semibold text-title">${d.meter} m</td>
  <td class="p-2.5 text-center text-emerald-400 font-bold">${d.ni || '-'}</td>
  <td class="p-2.5 text-center">${d.fe || '-'}</td>
  <td class="p-2.5 text-center">${d.co || '-'}</td>
  <td class="p-2.5 text-center">${d.mgo || '-'}</td>
  <td class="p-2.5 text-center">${d.sio2 || '-'}</td>
  <td class="p-2.5 text-center">${d.sm || '-'}</td>
  <td class="p-2.5 text-slate-300">${d.laterit}</td>
  <td class="p-2.5 text-slate-400">${d.catatan}</td>
  </tr>
 `).join('');

 const modal = document.getElementById('validasi-detail-modal');
 showModalAnimated(modal);
 lucide.createIcons();
 }

 function closeValidasiDetailModal() {
 const modal = document.getElementById('validasi-detail-modal');
 hideModalAnimated(modal);
 }
 function canEditValidasiCoordinates() {
 const identity = getLoggedInChatIdentity();
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
  // Koordinat selalu dikunci untuk Member, baik TP baru maupun TP lama.
  // Hanya Head/Developer yang boleh mengubah koordinat yang berasal dari Plan.
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
  note.innerText = canEditCoords
   ? 'Head/Developer: koordinat berasal/ditetapkan melalui Plan dan dapat dikoreksi bila diperlukan.'
   : 'Member: koordinat Timur/Utara tidak boleh diisi atau diubah. Gunakan koordinat yang sudah ditetapkan Head/Developer melalui Plan.';
 }
 }

 function openFormValidasiPopup() {
 const form = document.getElementById('validasiManagerForm');
 form.reset();
 document.getElementById('validasi-tanggal-input').value = getLocalDateYyyyMmDd();
 document.getElementById('validasi-header-fields').classList.remove('hidden');
 document.getElementById('validasi-idtp-hint').classList.add('hidden');
 document.getElementById('validasi-sm-input').value = '';
 setValidasiHeaderFieldState(false, canEditValidasiCoordinates());
 populateReporterDropdown();

 const modal = document.getElementById('form-validasi-popup-modal');
 showModalAnimated(modal);
 lucide.createIcons();
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

 // BLOKIR KERAS: cegah kombinasi ID TP + Meter yang PERSIS sudah pernah tercatat.
 // Area dipakai bergantian banyak member (bukan 1 orang = 1 area tetap), jadi tidak bisa
 // mengandalkan orang untuk selalu ingat/cek histori TP sebelum input -- baik itu submit ulang
 // TP yang sudah lengkap 5/5, atau mulai dari meter 1 lagi padahal TP itu sudah pernah dipakai
 // orang lain di hari/shift lain. Ini berlaku apapun yang terjadi, disadari atau tidak oleh user.
 const idTpVal = form.id_tp.value.trim();
 const meterVal = parseInt(document.getElementById('validasi-meter-input').value, 10);
 const existingTp = globalValidasiData.find(g => g.idTp.toLowerCase() === idTpVal.toLowerCase());
 if (existingTp && existingTp.depths.some(d => d.meter === meterVal)) {
  const areaInfo = existingTp.area && existingTp.area !== '-' ? existingTp.area : (currentLang === 'en' ? 'unknown' : 'tidak diketahui');
  const tglInfo = existingTp.tanggal && existingTp.tanggal !== '-' ? existingTp.tanggal : (currentLang === 'en' ? 'unknown date' : 'tanggal tidak diketahui');
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = currentLang === 'en'
  ? `Blocked: depth ${meterVal}m for TP "${idTpVal}" was already recorded (Area: ${areaInfo}, ${tglInfo}). Check the TP number or existing data before continuing.`
  : `Ditolak: kedalaman ${meterVal}m untuk TP "${idTpVal}" sudah pernah tercatat (Area: ${areaInfo}, ${tglInfo}). Cek lagi nomor TP atau data yang sudah ada sebelum lanjut.`;
  statusMsg.classList.remove('hidden');
  return;
 }

 const payload = buildAuthenticatedPayload(form);

 submitBtn.disabled = true;
 submitBtn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> ' + (currentLang === 'en' ? 'Saving...' : 'Menyimpan...');
 statusMsg.classList.add('hidden');

 try {
  const response = await fetch(GOOGLE_SCRIPT_READ_URL, {
  method: 'POST',
  body: payload
  });
  const result = await response.json();

  if (result.status === 'success') {
  statusMsg.className = 'text-xs text-emerald-400';
  statusMsg.innerText = currentLang === 'en' ? 'Validation data successfully saved!' : 'Data validasi berhasil disimpan!';
  statusMsg.classList.remove('hidden');
  form.reset();
  populateReporterDropdown();

  setTimeout(() => {
   closeFormValidasiPopup();
   statusMsg.classList.add('hidden');
   fetchValidasiData();
  }, 900);
  } else {
  throw new Error(result.message || (currentLang === 'en' ? 'Failed to save validation data.' : 'Gagal menyimpan data validasi.'));
  }
 } catch (error) {
  console.error('Error submitting validasi form:', error);
  statusMsg.className = 'text-xs text-rose-400';
  statusMsg.innerText = error && error.message ? error.message : (currentLang === 'en' ? 'An error occurred while saving. Please try again.' : 'Terjadi kesalahan saat menyimpan data. Coba lagi.');
  statusMsg.classList.remove('hidden');
 } finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHtml;
  lucide.createIcons();
 }
 }

 function isDiggingRowComplete(cleanRow) {
  const requiredKeys = [
   'tanggal', 'shift', 'cuaca', 'pelapor', 'pit', 'blok', 'material',
   'id sampel', 'total sampel (karung)', 'tonase', 'ni %', 'fe %', 'co %',
   'mgo %', 'sio2 %', 'sm %', 'tujuan'
  ];
  const requiredOk = requiredKeys.every(key => {
   const value = cleanRow[key];
   return value !== null && value !== undefined && String(value).trim() !== '';
  });
  // BARU (v90.2.108): samakan dgn backend isProduksiGcComplete_() yg mewajibkan Tipe_Ore --
  // sebelumnya frontend TIDAK cek field ini, jadi baris yg Tipe_Ore-nya kosong di sheet bisa
  // tampil "lengkap" (urutan sorting) padahal backend menganggapnya belum lengkap.
  // v90.2.123 FIX (temuan audit): SEBELUMNYA cek `cleanRow['tipe_ore'] !== undefined` duluan
 // -- kalau kunci sebenarnya 'tipe ore' (spasi, bukan underscore), kondisi ini langsung
 // gagal (short-circuit &&) SEBELUM sempat cek fallback 'tipe ore' di baris yg sama,
 // padahal datanya sendiri valid. Sekarang resolve nilai dulu dari SALAH SATU kunci yg
 // ada, baru divalidasi -- konsisten apapun nama kunci yg dikembalikan endpoint.
 const tipeOreResolved = cleanRow['tipe_ore'] !== undefined ? cleanRow['tipe_ore'] : cleanRow['tipe ore'];
 const tipeOreOk = tipeOreResolved !== null && tipeOreResolved !== undefined && String(tipeOreResolved).trim() !== '';
  return requiredOk && tipeOreOk;
 }

 function sortDiggingCompleteFirst(data) {
  if (!Array.isArray(data)) return data || [];
  return data
   .map((row, index) => ({ row, index, clean: rawToCleanRow.get(row) || {} }))
   .sort((a, b) => {
    const completeA = isDiggingRowComplete(a.clean) ? 1 : 0;
    const completeB = isDiggingRowComplete(b.clean) ? 1 : 0;
    if (completeA !== completeB) return completeB - completeA;
    return a.index - b.index;
   })
   .map(item => item.row);
 }

 function parseDiggingDate(val) {
 if (!val) return null;
 const raw = val.toString().split(' ')[0].trim();
 // Format sheet: DD-MMM-YY (contoh: 29-Jul-26) atau YYYY-MM-DD
 const monthMap = { jan:0, feb:1, mar:2, apr:3, mei:4, may:4, jun:5, jul:6, agu:7, aug:7, sep:8, okt:9, oct:9, nov:10, des:11, dec:11 };
 const partsDash = raw.split('-');
 if (partsDash.length === 3 && isNaN(partsDash[0]) === false && partsDash[1].length <= 3 && isNaN(partsDash[1])) {
  const mon = monthMap[partsDash[1].toLowerCase()];
  let yr = parseInt(partsDash[2], 10);
  if (yr < 100) yr += 2000;
  if (mon !== undefined) return new Date(yr, mon, parseInt(partsDash[0], 10));
 }
 const d = new Date(raw);
 return isNaN(d.getTime()) ? null : d;
 }
