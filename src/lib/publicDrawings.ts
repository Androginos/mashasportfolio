import { readdir } from "fs/promises";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";

export type SketchbookDrawing = {
  id: number;
  src: string;
  alt: string;
  title: string;
};

const BRUSH_FILE = /^brush(\d+)\.(png|jpe?g|webp|gif)$/i;
const PENCIL_FILE = /^pencil(\d+)\.(png|jpe?g|webp|gif)$/i;

/**
 * `public/drawings` içindeki brush1.png, pencil2.webp vb. dosyaları okur;
 * sayıya göre sıralar. Yeni dosya eklemek için kod değişikliği gerekmez.
 */
export async function listSketchDrawingsFromPublic(): Promise<{
  brush: SketchbookDrawing[];
  pencil: SketchbookDrawing[];
}> {
  noStore();
  const dir = path.join(process.cwd(), "public", "drawings");
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return { brush: [], pencil: [] };
  }

  const brush: { n: number; file: string }[] = [];
  const pencil: { n: number; file: string }[] = [];

  for (const name of files) {
    const brushMatch = name.match(BRUSH_FILE);
    if (brushMatch) {
      brush.push({ n: parseInt(brushMatch[1], 10), file: name });
      continue;
    }
    const pencilMatch = name.match(PENCIL_FILE);
    if (pencilMatch) {
      pencil.push({ n: parseInt(pencilMatch[1], 10), file: name });
    }
  }

  brush.sort((a, b) => a.n - b.n);
  pencil.sort((a, b) => a.n - b.n);

  return {
    brush: brush.map(({ n, file }) => ({
      id: n,
      src: `/drawings/${file}`,
      alt: `Fırça çizimi ${n}`,
      title: `#${n}`,
    })),
    pencil: pencil.map(({ n, file }) => ({
      id: n,
      src: `/drawings/${file}`,
      alt: `Kalem çizimi ${n}`,
      title: `#${n}`,
    })),
  };
}
