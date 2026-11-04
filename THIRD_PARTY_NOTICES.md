# Third-party notices

IP Bible's application code is MIT licensed. Copied design code, runtime dependencies, fonts and example artwork retain the separate notices below. An open-source code license does not grant rights to unrelated user artwork or IP.

## JIZURA — directly reused design runtime

- Repository: [852wa/JIZURA](https://github.com/852wa/JIZURA)
- Pinned commit: `fc16bfe43ea4a6c25a21f1caf04d17326de14f00`
- MIT License; Copyright (c) 2026 hakoniwa.
- Full license: [source copy](third_party/jizura/LICENSE), [distributed notice](public/licenses/JIZURA-MIT.txt).

The 40 original JavaScript files are retained in `third_party/jizura/src/`. The application concatenates 37 of them into `src/vendor/jizura-upstream.mjs`, excluding the original UI, audio and video-export modules. A private module-local `window` isolates the upstream registry.

`src/vendor/jizura.ts` adapts the original `BG`/`DECOR` planners and renderers to static book-page graphics: **195 background/decorative motifs and 27 style palettes**. It fixes the animation time, provides page geometry, and assigns application/system fonts without invoking the upstream Google Fonts downloader. The `tyGlyphBody` motif receives a horizontal glyph anchor. This integration does not claim to adapt all 860 upstream motion, layout and effect components.

## CardLab — adapter wiring and catalogue names

- Source project: CardLab by BeichenXu.
- Source revision: `128ebdd4ef80aba107ab6840f10ac3e252c1f59f`.
- MIT License; Copyright (c) 2026 BeichenXu.
- Full license: [source copy](third_party/CardLab-LICENSE), [distributed notice](public/licenses/CardLab-MIT.txt).

The static JIZURA environment wiring was adapted from CardLab's `jizura-adapter.mjs`. The catalogue and Chinese display names derive from its `catalog.json` and `materials.mjs`. The original JIZURA vendor files are pinned to the upstream revision listed above; CardLab's editor and product code are not included.

## Evo-poster — direct metrics and adapted evolution

- Repository: [sergiomrebelo/evo-poster](https://github.com/sergiomrebelo/evo-poster)
- Pinned commit: `f13d779f11f7637aaac786724d778de873463d33`
- MIT License; Copyright (c) 2023 Sérgio M. Rebelo.
- Full notices: [project license](third_party/evo-poster/LICENSE.md), [evaluator license](third_party/evo-poster/evaluator-LICENSE.md), [distributed notice](public/licenses/Evo-poster-MIT.txt).

Direct runtime reuse includes the unmodified `Alignment.mjs` and `WhiteSpaceFraction.mjs` metrics plus `utils.js` and `metrics.config.js`. IP Bible supplies geometry-derived values to these functions.

`src/vendor/evolution.ts` adapts coordinate-aware visual balance from `VisualBalance.mjs` and the elite-selection, uniform-crossover and mutation approach in `Population.js`. Original files remain for comparison; `Population.reference.js` is not executed. The book adaptation moves elements on an 8 px grid, at most 24 px from the supplied template position in one invocation. It preserves element identity, dimensions, order and locks, and penalizes text collisions and out-of-page content.

These are geometric heuristics. They are not semantic understanding or a guarantee of aesthetic quality. Evo-poster's NLP models, translation APIs and p5.js application are not included.

Pinned source hashes are recorded in [third_party/manifest.json](third_party/manifest.json). Feature verification is documented separately from these provenance records.

## Fonts — SIL Open Font License 1.1

| Font | Copyright / license notice | Bundled file |
| --- | --- | --- |
| Noto Sans SC | Copyright 2014–2021 Adobe; Reserved Font Name “Source”; [OFL](public/fonts/NotoSansSC-OFL.txt) | `public/fonts/NotoSansSC.woff2` |
| Noto Serif JP | Copyright 2012 Google Inc.; [OFL](public/fonts/NotoSerifJP-OFL.txt) | `public/fonts/NotoSerifJP.woff2` |

These are unmodified WOFF2 font copies. The stylesheet is `public/fonts/fonts.css`; it does not request fonts from an external service. Noto Serif JP provides common Han characters; the application can fall back to Noto Sans SC for simplified characters absent from that font. Preserve the OFL notices when redistributing the font files.

## Example IP artwork — Creative Commons Attribution

The bundled examples contain 11 publicly released artworks / film images from three Blender projects. They are included for artbook-layout exercises, with no claim of affiliation or endorsement.

| Example | Credit | License | Official source |
| --- | --- | --- | --- |
| Spring | © Blender Foundation · studio.blender.org/spring | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Project licensing](https://studio.blender.org/projects/spring/pages/about/) |
| Sintel | © Blender Foundation · durian.blender.org; David Revoy credited for selected concept art | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Project licensing](https://durian.blender.org/about/) |
| Big Buck Bunny | © 2008 Blender Foundation · www.bigbuckbunny.org | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Project licensing](https://peach.blender.org/about/) |

Bundled images were proportionally resized to a maximum dimension of 1600 px and encoded as WebP at quality 90. No repainting, background removal or generative editing was applied to the source images. Chinese descriptions are short editorial summaries; development artwork is identified as such. No official map or faction-territory dataset is bundled.

Exact image URLs, hashes, per-image credits and changes are recorded in [public/examples/manifest.json](public/examples/manifest.json), [catalog.json](public/examples/catalog.json) and [ATTRIBUTION.md](public/examples/ATTRIBUTION.md). Preserve the corresponding attribution, source and license link when sharing or exporting these images. Embedded logos do not grant separate trademark permission.

## Application runtime dependencies

Versions are pinned by `package-lock.json`; each dependency retains its own license. Copies of the direct runtime dependency notices are shipped under `public/licenses/`.

| Dependency | Use | License |
| --- | --- | --- |
| ag-psd | PSD decoding | [MIT](public/licenses/ag-psd-LICENSE.txt) |
| fflate | Project ZIP import/export | [MIT](public/licenses/fflate-LICENSE.txt) |
| idb-keyval | IndexedDB storage | [Apache 2.0](public/licenses/idb-keyval-LICENSE.txt) |
| jsPDF | PDF export | [MIT](public/licenses/jspdf-LICENSE.txt) |
| lucide-react | Interface icons | [ISC](public/licenses/lucide-react-LICENSE.txt) |
| React / React DOM | Application UI | [React MIT](public/licenses/react-LICENSE.txt), [React DOM MIT](public/licenses/react-dom-LICENSE.txt) |

Retain the applicable notices for any additional or transitive dependencies in distributed builds. User-provided files keep their original rights and permissions; this notice does not change them.
