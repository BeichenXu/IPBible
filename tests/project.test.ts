import test from "node:test";
import assert from "node:assert/strict";
import { blankBook, validateBook, type Book } from "../src/model.ts";

// A real 1 × 1 PNG keeps the valid case independent from application encoding.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=";
function project(): Book {
  return {
    ...blankBook(),
    id: "book-01",
    title: "设定书",
    subtitle: "A character study",
    description: "Original notes",
    author: "An author",
    accent: "#627555",
    seed: 37,
    revision: 4,
    updatedAt: 1700000000000,
    assets: [
      {
        id: "asset-01",
        name: "人物",
        url: PNG,
        width: 1,
        height: 1,
        role: "character",
        description: "A layered import",
        layerPath: "Characters / 人物",
        sourceFile: "author.psd",
        hidden: false,
        opacity: 0.8,
        credit: "An artist",
        license: "CC BY 4.0",
      },
    ],
    pages: [
      {
        id: "page-01",
        name: "人物介绍",
        kind: "character",
        background: "#ffffff",
        locked: true,
        elements: [
          {
            id: "image-01",
            type: "image",
            assetId: "asset-01",
            x: 40,
            y: 50,
            w: 300,
            h: 400,
            fit: "contain",
            locked: true,
          },
          {
            id: "text-01",
            type: "text",
            text: "作者自己的设定\n第二段",
            fontSize: 24,
            x: 400,
            y: 50,
            w: 300,
            h: 150,
            color: "#123456",
          },
        ],
      },
    ],
  };
}
function rejects(change: (book: Book) => void) {
  const b = project();
  change(b);
  assert.throws(() => validateBook(b));
}

test("project round-trip preserves authored content, provenance and layer state", () => {
  const original = project();
  const loaded = validateBook(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(loaded, original);
  assert.deepEqual(validateBook(blankBook()).pages, []);
});

test("rejects unsupported or structurally damaged project documents", () => {
  for (const invalid of [
    null,
    [],
    {},
    { ...project(), version: 2 },
    { ...project(), assets: {} },
    { ...project(), pages: null },
  ])
    assert.throws(() => validateBook(invalid));
});

test("rejects empty identifiers that cannot safely represent project objects", () => {
  rejects((b) => {
    b.id = "";
  });
  rejects((b) => {
    b.assets[0].id = " ";
    b.pages[0].elements[0].assetId = " ";
  });
  rejects((b) => {
    b.pages[0].id = "";
  });
  rejects((b) => {
    b.pages[0].elements[0].id = "\t";
  });
});

test("rejects duplicate identities instead of aliasing or overwriting saved objects", () => {
  rejects((b) => {
    b.assets.push({
      ...b.assets[0],
      name: "Different content with the same identity",
    });
  });
  rejects((b) => {
    b.pages.push({ ...b.pages[0], name: "Second page with the same identity" });
  });
  rejects((b) => {
    b.pages[0].elements.push({ ...b.pages[0].elements[0], x: 400 });
  });
});

test("rejects unavailable image references before accepting a project", () => {
  rejects((b) => {
    b.pages[0].elements[0].assetId = "missing-asset";
  });
  rejects((b) => {
    delete b.pages[0].elements[0].assetId;
  });
  rejects((b) => {
    b.assets = [];
  });
});

test("rejects malformed, remote or executable image payloads", () => {
  for (const url of [
    "https://example.org/private-image.png",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zy8+",
    "data:text/html;base64,PGh0bWw+",
    "data:image/png;base64,",
    "data:image/png;base64,%%%not-base64%%%",
  ])
    rejects((b) => {
      b.assets[0].url = url;
    });
});

test("rejects geometry that cannot be rendered or exported without corruption", () => {
  rejects((b) => {
    b.assets[0].width = 0;
  });
  rejects((b) => {
    b.assets[0].height = Number.NaN;
  });
  rejects((b) => {
    b.pages[0].elements[0].x = Infinity;
  });
  rejects((b) => {
    b.pages[0].elements[0].w = -20;
  });
  rejects((b) => {
    b.pages[0].elements[0].h = 10001;
  });
  rejects((b) => {
    b.pages[0].elements[1].fontSize = NaN;
  });
});
