/**
 * public/mainchar.png, brush.png, pencil.png yolları.
 * Next.js 16’da `?v=` gibi sorgu dizgileri `images.localPatterns` ile ayrıca
 * tanımlanmadığı için runtime hatası verir; bu yüzden düz path kullanılıyor.
 */
export function mascotPngSrc(name: "mainchar" | "brush" | "pencil"): string {
  return `/${name}.png`;
}
