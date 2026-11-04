# IP Bible 0.1 validation — 2026-11-04

This is a working first release for editable IP artbooks. It is not a claim of complete Photoshop fidelity, autonomous worldbuilding, or production community readiness.

The functional application revision accepted on remote TEST is `0542895079d833f249c8517cc5f0a0ba93d0e94d`. Later source formatting and documentation do not change the intended behavior. The TEST application uses an independent service and persistent data directory; access is protected by the existing ordinary-user TEST login.

## Executed

- **7 project integrity tests**: authored content/provenance round-trip, damaged documents, blank and duplicate identities, missing asset references, unsafe image payloads, and invalid geometry. The GitHub check also builds the application with TypeScript.
- **13 remote browser workflow groups**, exercised in stages on the relevant committed application revisions. These include the three licensed sample books, editable project export/import, draft reload, invalid-import retention, undo/redo, layer locks, authored-content preservation during re-arrangement, JIZURA motif insertion, page reordering, direct pointer movement/resizing, PDF/HTML export, stale-tab overwrite prevention, and community publication/reading/owner-only withdrawal.
- Publication tests confirmed that read responses contain flattened book pages without original assets or owner-token hashes; an incorrect owner token cannot withdraw a publication, and an SVG payload is rejected. The disposable publication was withdrawn after the test.
- The deployed application was inspected at a 1440 px desktop viewport and 390 px / 360 px mobile viewports. Mobile navigation and horizontal overflow were checked. A real remote application was also opened in the in-app browser.
- **PSD fixture**: a 900 × 1200 RGB document assembled from licensed artwork was imported through the ordinary file control. Its 6 leaf layers, 2 groups, text metadata, 1 hidden layer and composite preview were decoded. Visible layers retained their relative coordinates and formed one character page rather than six independent pages. The resulting project exported successfully.
- **PDF visual review**: Spring (7 pages), Sintel (7 pages), and Big Buck Bunny (6 pages) were exported from the actual app, including automatic attribution pages. Every page was rendered for visual inspection; all pages have A4 dimensions. These are raster reading editions.
- The pinned JIZURA adapter's 195 motif previews were rendered during module verification. This is a draw/compatibility check, not proof that every graphic suits every book page.

The first broad browser run stopped on a share-button accessible-name mismatch after nine successful groups. The label was made explicit; the remaining workflows and later direct-manipulation checks passed. Passing persistence tests were not repeatedly rerun after unrelated visual adjustments.

## Not executed / optional

- Physical phone/tablet testing, print/manufacturer acceptance, CMYK proofing, accessibility audit, and production launch.
- An artist-authored production PSD containing complex masks, clipping chains, adjustment layers, smart objects or Photoshop effects. The fixture is deliberately simple and is not an official Blender source PSD.
- Live multimodal model inference. The optional provider interface exists, but the TEST server has no configured model key. Filename/layer-name classification and geometry-based book layout are available independently.
- Load testing, multiuser collaborative editing, account recovery for share tokens, moderation and paid features.

## Reproduce

```bash
npm ci
npm test
npm run build

# Point to a real deployed environment. Do not commit credentials or sessions.
IPBIBLE_URL=https://your-test.example/ip-bible/ \
IPBIBLE_SESSION=/private/path/browser-session.json \
node scripts/browser-check.mjs
```

Browser reports, screenshots, exported sample files and rendering intermediates are written under ignored `.local/acceptance/`. Browser sessions and credentials must remain outside the repository. The test script expects the three bundled examples and checks a disposable community publication which it subsequently withdraws.

The PSD fixture and regeneration instructions are in [tests/fixtures/README.md](tests/fixtures/README.md). The source and artwork licenses are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
