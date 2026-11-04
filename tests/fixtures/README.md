# Layered import fixture

`layered-sample.psd` is a **synthetic import test PSD assembled from openly licensed artwork**. It is not an official Blender source PSD or a Photoshop-authored production document.

The document is 900 × 1200 pixels, RGB / 8-bit, 2,837,804 bytes. It has a merged preview, 2 groups and 6 leaf layers:

1. Paper background — visible raster layer.
2. Editable title — raster appearance plus Photoshop text metadata.
3. Characters / Spring character sheet — visible raster layer at (130, 160).
4. Characters / Sintel character concept — visible raster layer at (130, 610).
5. Hidden alternatives / Autumn alternate - hidden — hidden raster layer at (250, 500).
6. Attribution and fixture notice — raster appearance plus Photoshop text metadata.

The Python generator composites only visible layers. The Node encoder uses `ag-psd` raw `imageData`, without a canvas or additional JavaScript dependencies. It reads the completed bytes back and verifies leaf count, group count, hidden state, text metadata and nonempty raster data.

## Regeneration

From the repository root, after installing the application's Node dependencies:

```sh
python -m pip install Pillow
python scripts/generate-psd-fixture.py
```

The generator uses temporary RGBA files and invokes `scripts/write-psd-fixture.mjs`. It requires Python with Pillow and Node.js on PATH. It does not start an application server, change the package lock or install Node canvas bindings.

## Attribution

- **Spring and Autumn**: © Blender Foundation | studio.blender.org/spring — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Updated Spring Characters](https://studio.blender.org/blog/updated-spring-characters/).
- **Sintel concept art**: © Blender Foundation; artwork David Revoy — [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Source: [Sintel official gallery](https://durian.blender.org/gallery/).

Artwork was proportionally reduced and positioned within this test document. The fixture's typesetting, paper background and structure were created for IP Bible; they are distributed under CC BY 4.0. The embedded artworks retain their respective licenses and credits. Original image details are in `public/examples/manifest.json`.

This fixture verifies the deliberately simple subset above. It does not establish fidelity for arbitrary PSD smart objects, adjustment layers, effects, masks, fonts or complex blend modes. Native Photoshop round-trip verification has not been performed.
