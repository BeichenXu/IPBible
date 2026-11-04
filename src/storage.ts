import { get, update, del, keys, createStore } from "idb-keyval";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { validateBook, type Book } from "./model";
const db = createStore("ip-bible-v1", "books");
export interface Summary {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: number;
  pages: number;
  cover?: string;
}
export const listBooks = async (): Promise<Book[]> => {
  const ks = await keys(db);
  return (
    await Promise.all(
      ks
        .filter((k) => String(k).startsWith("book:"))
        .map((k) => get<Book>(k, db)),
    )
  )
    .filter((b): b is Book => !!b)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};
export async function saveBook(b: Book, expectedRevision?: number) {
  await update<Book>(
    "book:" + b.id,
    (current) => {
      if (
        expectedRevision !== undefined &&
        current &&
        current.revision !== expectedRevision
      )
        throw Error(
          "另一个窗口已更新这本书。请导出当前项目后重新打开，以免覆盖。",
        );
      return b;
    },
    db,
  );
}
export const deleteBook = (id: string) => del("book:" + id, db);
export function projectBlob(b: Book) {
  validateBook(b);
  return new Blob(
    [
      zipSync(
        { "book.json": strToU8(JSON.stringify(b)) },
        { level: 1 },
      ) as Uint8Array<ArrayBuffer>,
    ],
    { type: "application/zip" },
  );
}
export async function readProject(file: File): Promise<Book> {
  if (file.size > 180 * 1024 * 1024) throw Error("项目超过 180 MB。");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;
  if (file.name.endsWith(".json")) text = strFromU8(bytes);
  else {
    const entries = unzipSync(bytes, {
      filter: (e) =>
        e.name === "book.json" && e.originalSize <= 300 * 1024 * 1024,
    });
    if (!entries["book.json"])
      throw Error("缺少 book.json，或项目解压后过大。");
    text = strFromU8(entries["book.json"]);
  }
  return validateBook(JSON.parse(text));
}
export function download(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 30000);
}
