# MG1 / LITHOSITE — HISTORICAL DEVELOPMENT INDEX

## Tujuan

Dokumen ini adalah **daftar induk**. Detail teknis tetap dipisahkan ke dokumen historis dengan nama file netral agar mudah dicari dan dibandingkan. Informasi versi tetap tercatat di isi dokumen.

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
| V24.4 Map Lifecycle Completion | **100%** | FINAL LOCKED |
| Duplicate / Copy Map | **100%** | V24.4 PASS |
| Update / Replace Map | **100%** | V24.4 PASS |
| Failure / Recovery Boundary | **100%** | V24.4 PASS |
| Lifecycle Regression Test | **100%** | V24.4 PASS |
| Import / Export Package | **100%** | V24.5 FINAL LOCKED |
| Package Integrity | **100%** | V24.5 FINAL LOCKED |
| Storage / Capacity Management | **100%** | V24.5 FINAL LOCKED |
| Transfer / Sharing | **PARTIAL** | Backup/Restore PASS; native Share Sheet CANCELLED/DEFERRED |

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
V24.4 ████████████████████ 100%  🔒 Final Locked
 ↓
V24.5 ████████████████████ 100%  🔒 Final Release Locked
 ↓
V25   ░░░░░░░░░░░░░░░░░░░░ 0%    Next — Advanced Map Library / Layer Architecture
```

**Jangan menjumlahkan persentase antar-versi**. Setiap angka adalah completion terhadap scope versi/area masing-masing.

## Historical Record List

| Versi | Nama | Status | Progress | Dokumen |
|---|---|---|---:|---|
| V1 | Functional Mining Member App | FOUNDATION | **100%** | [V01](functional_mining_member_app.md) |
| V2 | Offline Geospatial Runtime | LOCKED FOUNDATION | **100%** | [V02](offline_geospatial_runtime.md) |
| V14.15 | Boot / Dashboard / Gesture Baseline | PASS / BASELINE | **100%** | [V14.15](boot_dashboard_gesture_baseline.md) |
| V14.22 | Device Profiler V1 | RECORDED | **100%** | [V14.22](device_profiler_initial.md) |
| V14.23 | Device Profiler Diagnostic | RECORDED | **100%** | [V14.23](device_profiler_diagnostic.md) |
| V14.24 | Device Profiler V2 | RECORDED | **100%** | [V14.24](device_profiler_refined.md) |
| V14.25 | Tile Engine Profile V1 | PARAMETER ONLY | **100%** | [V14.25](tile_engine_profile.md) |
| V14.26 | C1 Viewport Tile Planner | PLANNER ONLY | **100%** | [V14.26](c1_viewport_tile_planner.md) |
| V14.27 | Diagnostic Panel Minimize | RECORDED | **100%** | [V14.27](diagnostic_panel_minimize.md) |
| V14.28 | C2 Adaptive Visible Tile Render | EXPERIMENTAL | **100%** | [V14.28](c2_adaptive_visible_tile_render.md) |
| V14.29 | Service Worker Cache Bump | RECORDED | **100%** | [V14.29](service_worker_cache_bump.md) |
| V14.30 | C2 Render Diagnostic | RECORDED | **100%** | [V14.30](c2_render_diagnostic.md) |
| V14.31 | C2 Auto Visible Field Test | FIELD TEST | **100%** | [V14.31](c2_auto_visible_field_test.md) |
| V14.32 | C1/C2 Handoff Fix | RECORDED | **100%** | [V14.32](c1_c2_handoff_fix.md) |
| V14.33 | C2 Quality 0.5x | RECORDED | **100%** | [V14.33](c2_quality_0_5x.md) |
| V14.34 | C2 Native 1x | RECORDED | **100%** | [V14.34](c2_native_1x.md) |
| V14.35 | C2 Diagnostic Factor Fix | RECORDED | **100%** | [V14.35](c2_diagnostic_factor_fix.md) |
| V14.36 | GeoRef Handoff Fix | RECORDED | **100%** | [V14.36](georef_handoff_fix.md) |
| V14.37 | C4 Tile 512 | RECORDED | **100%** | [V14.37](c4_tile_512.md) |
| V14.38 | C4B Tile 768 + Density | RECORDED | **100%** | [V14.38](c4b_tile_768_density.md) |
| V14.39 | C5 Native Sharp Render | RECORDED | **100%** | [V14.39](c5_native_sharp_render.md) |
| V14.40 | C5 Sharp 1.50x | RECORDED | **100%** | [V14.40](c5_sharp_1_50x.md) |
| V14.41 | C5 25 Tile Target | RECORDED | **100%** | [V14.41](c5_25_tile_target.md) |
| V19 | Isolated Map Modal | LOCKED COMPATIBILITY | **100%** | [V19](isolated_map_modal.md) |
| V22 | Atomic Surface Lifecycle | LOCKED | **100%** | [V22](atomic_surface_lifecycle.md) |
| V23 | No-Modal-Flicker / Management Isolation | LOCKED | **100%** | [V23](no_modal_flicker_management_isolation.md) |
| V24.1 | RAM-first / Instant Save | LOCKED | **100%** | [V24.1](ram_first_instant_save.md) |
| V24.2 | Protected Map Runtime Baseline | LOCKED | **100%** | [V24.2](protected_map_runtime_baseline.md) |
| V24.3 | Map Library / Map Management | FINAL LOCKED | **100%** | [V24.3](map_library_map_management.md) |
| V24.4 | Map Lifecycle Completion | FINAL LOCKED | **100%** | [V24.4](MAP_LIFECYCLE_COMPLETION.md) |
| V24.5 | Map Package / Storage / Recovery | FINAL RELEASE LOCKED | **100%** | [V24.5](FINAL_AUDIT_RELEASE_LOCK.md) |

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
├── V24.4_Map_Lifecycle_Completion.md
├── V24.5_Map_Package_Storage_Recovery.md
└── V24.5_FINAL_RELEASE_LOCKED.md
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
- `Map Package`
- `Backup / Restore`
- `SHA-256`
- `Storage / Capacity`
- `Safe Cleanup`
- `Recovery Journal`
- `Technical Debt`
- `Before Architecture`
- `After Architecture`
- `Validation`
- `Ringkasan`

## Historical Record Rule

Nama file bersifat netral dan tidak memakai nomor versi atau stage. Riwayat versi, keputusan, dan status historis dipertahankan di isi dokumen serta `dokumentasi.md`. Perubahan nama tidak mengubah keputusan teknis historis.

## Ringkasan

> **V24.5 adalah current final release locked stage.** V24.4 telah menyelesaikan Map Lifecycle Completion (Duplicate/Copy, Update/Replace, Failure/Recovery Boundary, dan Lifecycle Regression). V24.5 kemudian menyelesaikan Map Package Transfer, SHA-256 integrity, Storage/Capacity Management, Safe Cleanup, Package Management Hardening, serta Recovery/Failure Hardening. Backup/Restore runtime tervalidasi; native in-app Share Sheet dibatalkan/deferred dan bukan capability stable release. Protected V24.2 runtime tetap tidak diubah. Tahap berikutnya dimulai sebagai V25 dengan **cross-file Ownership/Dependency Mapping + State Contract**, berfokus pada **Advanced Map Library → Layer → Features**, bukan membongkar Tile Engine.
