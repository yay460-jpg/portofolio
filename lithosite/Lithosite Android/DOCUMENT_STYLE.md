# Lithosite Android — Document Style

## Typography

GitHub renders Markdown using GitHub's own interface fonts. Repository documentation therefore standardizes **Markdown structure**, not a custom font.

## Heading hierarchy

```text
# Document title
## Major section
### Subsection
```

Do not skip heading levels without a clear reason.

## Naming

Prefer concise names such as:

- `Tile_Budget_Contract.md`
- `Pyramid_Engine_Migration.md`
- `Backend_Split_8Files.md`

Avoid redundant prefixes, dates, and words such as `FINAL`, `UPDATED(1)`, or `NEW` when the document status can be represented inside the document. Version-specific contracts belong in `01_Baseline` or `05_Version-History` and may retain a version identifier in the filename when it materially identifies that document. Global/current architecture and system documents should not carry a release version in their filename.

## Status language

Use explicit status terms such as `Locked`, `Active`, `Reference`, `Historical`, and `Archived`.
