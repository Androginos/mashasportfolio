# Masha’s Drawings — portfolyo

Next.js tabanlı tek sayfalık portfolyo: başlık etkileşimi, ana karakter sahnesi, çoklu dil ve pastel shader arka plan.

## Stack

- **Next.js** (App Router), React 19, TypeScript  
- **Tailwind CSS v4**  
- **Framer Motion**  
- **Remotion** — arka plan shader (`PastelShaderRemotion` / `PastelShaderBackground`)  
- Site fontu: **Luckiest Guy** (`src/app/layout.tsx`)

## Komutlar

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run start
npm run lint
```

Mobil veya aynı ağdaki cihazdan denemek için geliştirme sunucusunu ağa açabilirsin: `next dev -H 0.0.0.0` (gerekirse `package.json` içinde script olarak eklenebilir).

## Önemli dosyalar

| Alan | Dosya |
|------|--------|
| Ana UI | `src/app/portfolio-client.tsx` |
| Giriş sayfası | `src/app/page.tsx` |
| Global stiller | `src/app/globals.css` |
| Başlık sürükle-bırak oyunu | `src/components/TitleLetterDropGame.tsx` |
| Shader bileşenleri | `src/components/PastelShaderRemotion.tsx`, `PastelShaderBackground.tsx` |
| Görseller | `public/mainchar.png`, `public/pencil.png`, `public/brush.png` |

Başlık (`MASHA’S` / `DRAWINGS`) harfleri fizik + snap ile yerleştirilir; slot aralıkları başlık `font-size` ile ölçeklenen `em` grid ile hizalanır.

## Tasarım ve akış notları

Ayrıntılı kurallar ve akış özeti: [`.cursor/rules/masha-portfolio.mdc`](.cursor/rules/masha-portfolio.mdc).  
Ajan/Next uyarıları: [`AGENTS.md`](AGENTS.md).

## Son UI notlari

- Baslangic butonu `ButtonAttention` ile yildiz burst + buton animasyonu kullanir.
- `pencil` ve `brush` katmanlari `ToolAttention` ile daha yumusak hareket + yogun yildiz efekti alir.
- Tool yildizlari mobilde ve desktop'ta kapsayici disina tasabilir (`overflow: visible`).
- `SpeechBubble` mobilde daha kucuk ve daha yukari konumlanir.
- `choose a tool` metni hover'da gorunmez olsa da alanini korur; layout kaymasi engellenir.

## Deploy

[Vercel](https://vercel.com) veya tercih ettiğin platformda `main` dalından `next build` ile yayınlanabilir. Resmî rehber: [Next.js — Deploying](https://nextjs.org/docs/app/building-your-application/deploying).
