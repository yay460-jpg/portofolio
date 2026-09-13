# MG1 / LITHOSITE — VERSION HISTORY INDEX

## Tujuan

Dokumen ini adalah **daftar induk**. Detail teknis dipisahkan menjadi satu `.md` per versi agar mudah dicari, dibandingkan, dan dikembangkan tanpa membuat satu dokumen raksasa.

### Format setiap versi

```text
Technical Issue
Root Cause / konteks
Feature / Requirement
Before Flow
Fix / Implementation
After Flow
Before Architecture
After Architecture
Files / Ownership
Data / State Contract
Validation
Technical Debt
Baseline Decision
Ringkasan
```

## Progress Dashboard

> **Catatan:** persentase di bawah adalah **progress scope engineering**, bukan skor performa, benchmark, atau kualitas kode.

| Area | Progress | Status |
|---|---:|---|
| Historical version records yang saat ini punya evidence | **100%** | Terdokumentasi |
| V2 offline geospatial runtime foundation | **100%** | LOCKED |
| Adaptive Device → C1 → C2 evolution V14.22–V14.41 | **100%** | RECORDED |
| V22 Atomic Surface foundation | **100%** | LOCKED |
| V23 Management/modal isolation | **100%** | LOCKED |
| V24.1 RAM-first save lifecycle | **100%** | LOCKED |
| V24.2 Protected runtime baseline | **100%** | LOCKED |
| V24.3 Map Library / Management scope | **100%** | FINAL LOCKED |
| V24.4 Map Lifecycle Completion | **0%** | NEXT |
| Duplicate / Copy Map | **0%** | V24.4 |
| Update / Replace Map | **0%** | V24.4 |
| Failure / Recovery Boundary | **0%** | V24.4 |
| Lifecycle Regression Test | **0%** | V24.4 |
| Import / Export Package | **0%** | Future scope |
| Package Integrity | **0%** | Future scope |
| Storage / Capacity Management | **0%** | Future scope |
| Transfer / Sharing | **0%** | Future scope |

### Current position

```text
V1
 ↓
V2  ████████████████████ 100%  Runtime foundation
 ↓
V14.22–V14.41  ████████████████████ 100%  Adaptive engine evolution
 ↓
V19 ████████████████████ 100%
 ↓
V22 ████████████████████ 100%
 ↓
V23 ████████████████████ 100%
 ↓
V24.1 ████████████████████ 100%
 ↓
V24.2 ████████████████████ 100%  🔒 Protected
 ↓
V24.3 ████████████████████ 100%  🔒 Final Locked
 ↓
V24.4 ░░░░░░░░░░░░░░░░░░░░ 0%    Next
```

**Jangan menjumlahkan persentase antar-versi**. Setiap angka adalah completion terhadap scope versi/area masing-masing.

## Version List

| Versi | Nama | Status | Progress | Dokumen |
|---|---|---|---:|---|
| V1 | Functional Mining Member App | FOUNDATION | **100%** | [V01](./V01_functional_mining_member_app.md) |
| V2 | Offline Geospatial Runtime | LOCKED FOUNDATION | **100%** | [V02](./V02_offline_geospatial_runtime.md) |
| V14.15 | Boot / Dashboard / Gesture Baseline | PASS / BASELINE | **100%** | [V14.15](./V14.15_boot_dashboard_gesture_baseline.md) |
| V14.22 | Device Profiler V1 | RECORDED | **100%** | [V14.22](./V14.22_device_profiler_v1.md) |
| V14.23 | Device Profiler Diagnostic | RECORDED | **100%** | [V14.23](./V14.23_device_profiler_diagnostic.md) |
| V14.24 | Device Profiler V2 | RECORDED | **100%** | [V14.24](./V14.24_device_profiler_v2.md) |
| V14.25 | Tile Engine Profile V1 | PARAMETER ONLY | **100%** | [V14.25](./V14.25_tile_engine_profile_v1.md) |
| V14.26 | C1 Viewport Tile Planner | PLANNER ONLY | **100%** | [V14.26](./V14.26_c1_viewport_tile_planner.md) |
| V14.27 | Diagnostic Panel Minimize | RECORDED | **100%** | [V14.27](./V14.27_diagnostic_panel_minimize.md) |
| V14.28 | C2 Adaptive Visible Tile Render | EXPERIMENTAL | **100%** | [V14.28](./V14.28_c2_adaptive_visible_tile_render.md) |
| V14.29 | Service Worker Cache Bump | RECORDED | **100%** | [V14.29](./V14.29_service_worker_cache_bump.md) |
| V14.30 | C2 Render Diagnostic | RECORDED | **100%** | [V14.30](./V14.30_c2_render_diagnostic.md) |
| V14.31 | C2 Auto Visible Field Test | FIELD TEST | **100%** | [V14.31](./V14.31_c2_auto_visible_field_test.md) |
| V14.32 | C1/C2 Handoff Fix | RECORDED | **100%** | [V14.32](./V14.32_c1_c2_handoff_fix.md) |
| V14.33 | C2 Quality 0.5x | RECORDED | **100%** | [V14.33](./V14.33_c2_quality_0_5x.md) |
| V14.34 | C2 Native 1x | RECORDED | **100%** | [V14.34](./V14.34_c2_native_1x.md) |
| V14.35 | C2 Diagnostic Factor Fix | RECORDED | **100%** | [V14.35](./V14.35_c2_diagnostic_factor_fix.md) |
| V14.36 | GeoRef Handoff Fix | RECORDED | **100%** | [V14.36](./V14.36_georef_handoff_fix.md) |
| V14.37 | C4 Tile 512 | RECORDED | **100%** | [V14.37](./V14.37_c4_tile_512.md) |
| V14.38 | C4B Tile 768 + Density | RECORDED | **100%** | [V14.38](./V14.38_c4b_tile_768_density.md) |
| V14.39 | C5 Native Sharp Render | RECORDED | **100%** | [V14.39](./V14.39_c5_native_sharp_render.md) |
| V14.40 | C5 Sharp 1.50x | RECORDED | **100%** | [V14.40](./V14.40_c5_sharp_1_50x.md) |
| V14.41 | C5 25 Tile Target | RECORDED | **100%** | [V14.41](./V14.41_c5_25_tile_target.md) |
| V19 | Isolated Map Modal | LOCKED COMPATIBILITY | **100%** | [V19](./V19_isolated_map_modal.md) |
| V22 | Atomic Surface Lifecycle | LOCKED | **100%** | [V22](./V22_atomic_surface_lifecycle.md) |
| V23 | No-Modal-Flicker / Management Isolation | LOCKED | **100%** | [V23](./V23_no_modal_flicker_management_isolation.md) |
| V24.1 | RAM-first / Instant Save | LOCKED | **100%** | [V24.1](./V24.1_ram_first_instant_save.md) |
| V24.2 | Protected Map Runtime Baseline | LOCKED | **100%** | [V24.2](./V24.2_protected_map_runtime_baseline.md) |
| V24.3 | Map Library / Map Management | FINAL LOCKED | **100%** | [V24.3](./V24.3_map_library_map_management.md) |

## Struktur Folder Dokumen

```text
LITHOSITE_VERSION_DOCS/
├── 00_INDEX_LITHOSITE_VERSION_HISTORY.md
├── V01_Functional_Mining_Member_App.md
├── V02_Offline_Geospatial_Runtime.md
├── V14.15_Boot_Dashboard_Gesture_Baseline.md
├── V14.22_Device_Profiler_V1.md
├── ...
├── V14.41_C5_25_Tile_Target.md
├── V19_Isolated_Map_Modal.md
├── V22_Atomic_Surface_Lifecycle.md
├── V23_No_Modal_Flicker_Management_Isolation.md
├── V24.1_RAM_First_Instant_Save.md
├── V24.2_Protected_Map_Runtime_Baseline.md
├── V24.3_Map_Library_Map_Management.md
└── V24.3_MAP_LIBRARY_DETAILED.md
```

## Search Strategy

Cari dari index berdasarkan:

- `V24.3`
- `Atomic Surface`
- `C1`
- `C2`
- `GeoReference`
- `RAM-first`
- `Label`
- `Collection`
- `Technical Debt`
- `Before Architecture`
- `After Architecture`
- `Validation`
- `Ringkasan`

## Release Rule

Versi baru **tidak mengubah dokumen versi lama** kecuali ada koreksi historis yang memiliki evidence. Tambahkan file versi baru dan update index.

## Ringkasan

> **Dokumentasi sekarang dipisahkan per versi agar history teknis, flow, arsitektur, ownership, validation, dan progress dapat dicari tanpa membuka satu dokumen besar. V24.3 adalah current final locked stage; V24.4 dimulai dari 0% dan scope-nya Map Lifecycle Completion.**
