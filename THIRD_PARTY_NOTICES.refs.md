# Third-party design modules

This file records implemented dependencies, separately from ideas considered.

## JIZURA

- Source: https://github.com/852wa/JIZURA
- Pinned commit: `fc16bfe43ea4a6c25a21f1caf04d17326de14f00`
- License: MIT, Copyright (c) 2026 hakoniwa. Full license: `third_party/jizura/LICENSE`.
- Preserved source: `third_party/jizura/src/` (40 original files, SHA-256 recorded).
- Runtime: 37 original files concatenated in original order into `src/vendor/jizura-upstream.mjs`. UI, audio and video export modules are excluded. A private module-local `window` isolates the registry.
- Actual book adapter: `src/vendor/jizura.ts`, 195 background/decorative motifs and 27 style palettes. Static drawing uses the original upstream `BG`/`DECOR` planners and renderers at a fixed animation time. This is not a port of all 860 motion/layout/effect components.
- No external font requests: the adapter assigns system/application font families and does not invoke JIZURA's font downloader.
- One motif (`tyGlyphBody`) needs a horizontal glyph anchor even on portrait pages; the adapter supplies this anchor.

## CardLab

- Local source checkout: `/home/beichenxu/CardLab`, commit `128ebdd4ef80aba107ab6840f10ac3e252c1f59f`.
- License: MIT, Copyright (c) 2026 BeichenXu. Full license: `third_party/CardLab-LICENSE`.
- Reused/adapted: static JIZURA environment wiring from `src/jizura-adapter.mjs`; catalogue and Chinese material names from `src/catalog.json` and `src/materials.mjs`.
- Original JIZURA files were taken from this checkout's pinned vendor copy and independently hash-checked against its manifest. CardLab product/editor code is not included.

## Evo-poster / Evolutionary Poster Composer

- Source: https://github.com/sergiomrebelo/evo-poster
- Pinned commit: `f13d779f11f7637aaac786724d778de873463d33`
- License: MIT, Copyright (c) 2023 Sérgio M. Rebelo. Full license: `third_party/evo-poster/LICENSE.md`; evaluator notice retained separately.
- Direct runtime reuse: original `Alignment.mjs`, `WhiteSpaceFraction.mjs`, their `utils.js` and `metrics.config.js`. The adapter passes measured/estimated box values to these unmodified functions.
- Adapted: coordinate-aware visual balance from `VisualBalance.mjs`; bounded elite selection, uniform crossover and mutation from the population-evolution approach in `Population.js`. Original files remain for comparison; `Population.reference.js` itself is not executed.
- `src/vendor/evolution.ts` only moves elements on an 8px grid, at most 24px from their initial template positions. It preserves dimensions, identity, order and locked elements. Image/text collisions and out-of-page content receive penalties.
- The geometry score is a heuristic, not an AI semantic evaluation or an aesthetic guarantee. NLP, sentiment models, external translation APIs and the original p5.js application are not included.

## Verification scope

`third_party/render-verification.json` records headless Chromium canvas checks: all 195 adapted motifs produced pixels at 400×560; the initial blank glyph motif was repaired and rechecked. Algorithm checks verified deterministic seeds, lock preservation, unchanged element dimensions/identity, and bounds penalties. These are module checks, not desktop/mobile application acceptance or physical production validation.

## Redistribution

Keep the MIT copyright and permission notices with source and distributed applications. The app build should copy these three notice files into its downloadable/public license directory. The project's MIT license does not replace the separate rights and notices for user artwork, demonstration IP images, or fonts.
