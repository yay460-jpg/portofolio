# Lithosite Android Documentation

Dokumentasi teknis **MG1 / Mine Geologist / Lithosite Android**.

## Source of truth

| Section | Role |
|---|---|
| `01_Baseline` | Current V24.5 contracts and locked baseline |
| `02_Architecture` | Architecture and system-position references |
| `03_Engine` | Engine, runtime, performance and technical behavior |
| `04_Issues-Fixes` | Known issues, fixes and case reminders |
| `05_Version-History` | Historical development record |
| `06_Guides` | Operational and technical guides |
| `99_Archive` | Superseded or historical documents; not current runtime contracts |

### Reading rule

For current V24.5 behavior, start with `01_Baseline`. Documents in `05_Version-History` and `99_Archive` preserve historical context and must not be treated as current runtime contracts unless explicitly promoted into the baseline.

## Naming and Markdown style

- Use short, descriptive filenames.
- Use `#` for the document title, `##` for major sections, and `###` for subsections.
- Keep terminology consistent: **RAJA**, **WAKIL RAJA**, **GUARD RAJA**, **Device Profiler**, **Tile Engine**, **C1**, **C2**, **Store**, **Runtime**, **Geometry Contract**.
- Keep version identifiers in the document title or filename only when they materially identify the document.
- Historical documents retain their original technical content; organization and naming do not rewrite historical decisions.

## Navigation

See `MIGRATION_MAP.md` for the source-to-destination mapping used to build this clean documentation package.
