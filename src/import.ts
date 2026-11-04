import { readPsd, type Layer } from "ag-psd";
import {
  uid,
  inferRole,
  type Asset,
  type Example,
  type Book,
  blankBook,
} from "./model";
import { generateBook } from "./engine";
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(Error("图片无法读取"));
    image.src = url;
  });
}
export const dataURL = (blob: Blob): Promise<string> =>
  new Promise((res, rej) => {
    const f = new FileReader();
    f.onload = () => res(String(f.result));
    f.onerror = () => rej(Error("文件读取失败"));
    f.readAsDataURL(blob);
  });
export async function bitmapAsset(blob: Blob, name: string): Promise<Asset> {
  const source = await dataURL(blob),
    im = await loadImage(source);
  if (im.width * im.height > 64000000)
    throw Error("图片超过 6400 万像素，请缩小后导入。");
  const canvas = document.createElement("canvas"),
    scale = Math.min(1, 2200 / Math.max(im.width, im.height));
  canvas.width = Math.max(1, Math.round(im.width * scale));
  canvas.height = Math.max(1, Math.round(im.height * scale));
  canvas.getContext("2d")!.drawImage(im, 0, 0, canvas.width, canvas.height);
  return {
    id: uid(),
    name: name.replace(/\.[^.]+$/, ""),
    url: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    role: inferRole(name),
    description: "",
  };
}
function canvasURL(canvas: HTMLCanvasElement) {
  const out = document.createElement("canvas"),
    s = Math.min(1, 2200 / Math.max(canvas.width, canvas.height));
  out.width = Math.max(1, Math.round(canvas.width * s));
  out.height = Math.max(1, Math.round(canvas.height * s));
  out.getContext("2d")!.drawImage(canvas, 0, 0, out.width, out.height);
  return {
    url: out.toDataURL("image/png"),
    width: out.width,
    height: out.height,
  };
}
export async function importFile(
  file: File,
): Promise<{ assets: Asset[]; notes: string[]; text?: string }> {
  if (file.size > 120 * 1024 * 1024)
    throw Error(`${file.name} 超过 120 MB，请先精简图层。`);
  if (/\.(md|txt)$/i.test(file.name)) {
    const text = await file.text();
    if (text.length > 30000)
      throw Error("单次设定文字最多 30000 字，请按章节导入。");
    return { assets: [], notes: [], text };
  }
  if (!/\.psd$/i.test(file.name)) {
    if (
      !/^image\/(png|jpeg|webp)$/.test(file.type) &&
      !/\.(png|jpe?g|webp)$/i.test(file.name)
    )
      throw Error("支持 PSD、PNG、JPG、WebP 和 TXT / Markdown。");
    return { assets: [await bitmapAsset(file, file.name)], notes: [] };
  }
  const buffer = await file.arrayBuffer(),
    header = new DataView(buffer);
  if (
    buffer.byteLength < 26 ||
    header.getUint32(0) !== 0x38425053 ||
    header.getUint16(4) !== 1
  )
    throw Error("文件不是标准 PSD（暂不支持 PSB）。");
  const height = header.getUint32(14),
    width = header.getUint32(18);
  if (width * height > 64000000 || width > 16000 || height > 16000)
    throw Error("PSD 画布过大，请缩小到 6400 万像素以内。");
  const structure = readPsd(buffer, {
    skipThumbnail: true,
    skipLinkedFilesData: true,
    skipLayerImageData: true,
    skipCompositeImageData: true,
  });
  let pixels = width * height,
    leafCount = 0;
  const count = (layers: Layer[]) => {
    for (const l of layers) {
      if (l.children) count(l.children);
      else {
        leafCount++;
        pixels +=
          Math.max(0, (l.right ?? 0) - (l.left ?? 0)) *
          Math.max(0, (l.bottom ?? 0) - (l.top ?? 0));
      }
    }
  };
  count(structure.children || []);
  if (leafCount > 160 || pixels > 64000000)
    throw Error(
      "PSD 图层展开后超过当前内存限制（160 层 / 6400 万总像素），请按角色拆分导入。",
    );
  const psd = readPsd(buffer, {
    skipThumbnail: true,
    skipLinkedFilesData: true,
    throwForMissingFeatures: false,
    logMissingFeatures: false,
  });
  const assets: Asset[] = [],
    notes: string[] = [],
    documentId = uid();
  const visit = (
    layers: Layer[],
    path: string[],
    inheritedHidden = false,
    inheritedOpacity = 1,
  ) => {
    for (const layer of layers) {
      const names = [...path, layer.name || "未命名图层"],
        hidden = inheritedHidden || !!layer.hidden,
        opacity = inheritedOpacity * (layer.opacity ?? 1);
      if (layer.children) {
        visit(layer.children, names, hidden, opacity);
        continue;
      }
      if (!layer.canvas || !layer.canvas.width || !layer.canvas.height)
        continue;
      if (assets.length >= 160)
        throw Error("PSD 超过 160 个可用图层，请分组后分别导入。");
      const warnings = [];
      if (layer.effects) warnings.push("图层样式使用原 PSD 位图");
      if (layer.mask || layer.vectorMask) warnings.push("蒙版需核对");
      if (layer.clipping) warnings.push("剪贴图层需核对");
      if (layer.blendMode && layer.blendMode !== "normal")
        warnings.push(`混合模式 ${layer.blendMode}`);
      assets.push({
        id: uid(),
        name: layer.name || "未命名图层",
        ...canvasURL(layer.canvas),
        role: inferRole(names.join("/")),
        description: layer.text?.text || "",
        layerPath: names.join(" / "),
        sourceFile: file.name,
        hidden,
        opacity,
        blendMode: layer.blendMode,
        originalX: layer.left ?? 0,
        originalY: layer.top ?? 0,
        originalWidth: layer.canvas.width,
        originalHeight: layer.canvas.height,
        documentId,
        documentWidth: width,
        documentHeight: height,
        warning: warnings.join("；"),
      });
    }
  };
  visit(psd.children || [], []);
  if (psd.canvas)
    assets.unshift({
      id: uid(),
      name: file.name.replace(/\.psd$/i, ""),
      ...canvasURL(psd.canvas),
      role: inferRole(file.name),
      description: "",
      sourceFile: file.name,
      hidden: true,
      composite: true,
      documentId,
      documentWidth: width,
      documentHeight: height,
    });
  if (!assets.length) throw Error("这个 PSD 没有可读取的栅格图层或合成预览。");
  const affected = assets.filter((a) => a.warning).length;
  if (affected)
    notes.push(`${affected} 个图层含蒙版、混合模式或样式，请与合成预览核对。`);
  return { assets, notes };
}
export async function loadExample(ex: Example): Promise<Book> {
  const assets: Asset[] = [];
  for (const a of ex.assets) {
    const r = await fetch(a.url);
    if (!r.ok) throw Error(`样例素材加载失败：${a.name}`);
    const b = await bitmapAsset(await r.blob(), a.name);
    assets.push({
      ...b,
      ...a,
      url: b.url,
      width: b.width,
      height: b.height,
      id: uid(),
    });
  }
  return generateBook({
    ...blankBook(),
    title: ex.title,
    subtitle: ex.subtitle,
    description: ex.description,
    author: ex.credit,
    accent: ex.accent,
    assets,
  });
}
