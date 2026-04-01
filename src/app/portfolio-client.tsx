"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence } from "framer-motion";
import {
  SketchbookBackdrop,
  SketchbookBook,
} from "@/components/SketchbookPopup";
import { PastelShaderBackground } from "@/components/PastelShaderBackground";
import { TitleLetterDropGame } from "@/components/TitleLetterDropGame";
import { SpeechBubble } from "@/components/SpeechBubble";
import { ButtonAttention, ToolAttention } from "@/components/AttentionEffect";
import { mascotPngSrc } from "@/lib/mascotAssets";
import type { SketchbookDrawing } from "@/lib/publicDrawings";

type Language = "en" | "uk" | "ru" | "pl";
type Tool = "pencil" | "brush";

const translations: Record<
  Language,
  {
    badge: string;
    titleTop: string;
    titleBottom: string;
    clickToStart: string;
    chooseTool: string;
    pencil: string;
    brush: string;
    drawing: string;
    pencilDrawings: string;
    brushDrawings: string;
    emptyPencilGallery: string;
    emptyBrushGallery: string;
    mascotAlt: string;
    /** Başlık oyunu: {score} yer tutucu */
    titleGameScoreFmt: string;
    titleGameCompleteFmt: string;
    pencilBubble: string;
    brushBubble: string;
  }
> = {
  en: {
    badge: "Little Artist Drawing Exhibition",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Click here for my Portfolio",
    chooseTool: "Choose a tool",
    pencil: "Pencil",
    brush: "Brush",
    drawing: "Drawing",
    pencilDrawings: "Pencil drawings",
    brushDrawings: "Brush drawings",
    emptyPencilGallery: "No pencil drawings yet. Add images to gallery/pencil.",
    emptyBrushGallery: "No brush drawings yet. Add images to gallery/brush.",
    mascotAlt: "Main character",
    titleGameScoreFmt: "⭐ {score} points",
    titleGameCompleteFmt: "🎉 {score} points! Great!",
    pencilBubble: "my pencil drawings",
    brushBubble: "my brush drawings",
  },
  uk: {
    badge: "Виставка малюнків маленької художниці",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Натисніть тут для мого портфоліо",
    chooseTool: "Оберіть інструмент",
    pencil: "Олівець",
    brush: "Пензлик",
    drawing: "Малюнок",
    pencilDrawings: "Малюнки олівцем",
    brushDrawings: "Малюнки пензликом",
    emptyPencilGallery: "Поки немає малюнків олівцем. Додайте файли в gallery/pencil.",
    emptyBrushGallery: "Поки немає малюнків пензликом. Додайте файли в gallery/brush.",
    mascotAlt: "Головний персонаж",
    titleGameScoreFmt: "⭐ {score} балів",
    titleGameCompleteFmt: "🎉 {score} балів! Чудово!",
    pencilBubble: "мої малюнки олівцем",
    brushBubble: "мої малюнки пензликом",
  },
  ru: {
    badge: "Выставка рисунков маленькой художницы",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Нажмите сюда, чтобы открыть мое портфолио",
    chooseTool: "Выберите инструмент",
    pencil: "Карандаш",
    brush: "Кисть",
    drawing: "Рисунок",
    pencilDrawings: "Рисунки карандашом",
    brushDrawings: "Рисунки кистью",
    emptyPencilGallery: "Пока нет рисунков карандашом. Добавьте файлы в gallery/pencil.",
    emptyBrushGallery: "Пока нет рисунков кистью. Добавьте файлы в gallery/brush.",
    mascotAlt: "Главный персонаж",
    titleGameScoreFmt: "⭐ {score} очков",
    titleGameCompleteFmt: "🎉 {score} очков! Отлично!",
    pencilBubble: "мои рисунки карандашом",
    brushBubble: "мои рисунки кистью",
  },
  pl: {
    badge: "Wystawa rysunków małej artystki",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Kliknij tutaj, aby zobaczyć moje portfolio",
    chooseTool: "Wybierz narzedzie",
    pencil: "Olowek",
    brush: "Pedzel",
    drawing: "Rysunek",
    pencilDrawings: "Rysunki olowkiem",
    brushDrawings: "Rysunki pedzlem",
    emptyPencilGallery: "Brak rysunkow olowkiem. Dodaj pliki do gallery/pencil.",
    emptyBrushGallery: "Brak rysunkow pedzlem. Dodaj pliki do gallery/brush.",
    mascotAlt: "Glowna postac",
    titleGameScoreFmt: "⭐ {score} pkt",
    titleGameCompleteFmt: "🎉 {score} pkt! Świetnie!",
    pencilBubble: "moje rysunki ołówkiem",
    brushBubble: "moje rysunki pędzlem",
  },
};

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "uk", label: "Ukrainian" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
];

/** Eski clip-path bölgeleriyle uyumlu; parmak/mouse için normalize x,y */
function toolAtNormalizedPosition(nx: number, ny: number): Tool | null {
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
  const pencilRightX = 0.6 + (0.56 - 0.6) * ny;
  const brushLeftX = 0.42 + (0.46 - 0.42) * ny;
  const inPencil = nx <= pencilRightX;
  const inBrush = nx >= brushLeftX;
  if (inPencil && inBrush) return nx < 0.5 ? "pencil" : "brush";
  if (inPencil) return "pencil";
  if (inBrush) return "brush";
  return null;
}

export default function PortfolioClient({
  brushDrawings,
  pencilDrawings,
}: {
  brushDrawings: SketchbookDrawing[];
  pencilDrawings: SketchbookDrawing[];
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [started, setStarted] = useState(false);
  /** Sadece açık albüm; kalem/fırça “basılı” görünümü buna bağlı değil */
  const [openAlbum, setOpenAlbum] = useState<Tool | null>(null);
  const [hoveredTool, setHoveredTool] = useState<Tool | null>(null);
  const mascotHitRef = useRef<HTMLDivElement | null>(null);
  const t = translations[language];

  const updateHoverFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = mascotHitRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setHoveredTool(toolAtNormalizedPosition(nx, ny));
  };

  const openToolFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = mascotHitRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const tool = toolAtNormalizedPosition(nx, ny);
    if (!tool) return;
    e.preventDefault();
    e.stopPropagation();
    setHoveredTool(null);
    setOpenAlbum(tool);
  };

  const renderWaveText = (text: string) => (
    <span className="inline-flex flex-wrap items-center justify-center gap-[1px]">
      {text.split("").map((char, index) => (
        <span
          key={`${text}-${index}`}
          className="iso-tool-letter"
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );

  return (
    <main
      lang={language}
      className="relative mx-auto flex min-h-[100dvh] min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-4 text-center md:py-6"
    >
      <PastelShaderBackground />
      <div
        className="absolute right-4 top-4 z-[70] md:right-6 md:top-6"
        onClick={(event) => event.stopPropagation()}
      >
        <label
          htmlFor="lang-select"
          className="mb-1 block text-right text-xs font-medium tracking-wide text-[#4a3e4a]"
        >
          Language
        </label>
        <div className="rounded-full border border-white/55 bg-white/28 px-3 py-1 shadow-[0_8px_24px_rgba(26,20,39,0.2)] backdrop-blur-md">
          <select
            id="lang-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="rounded-full bg-transparent pr-5 text-sm font-medium text-[#4a3e4a] outline-none"
          >
            {languageOptions.map((option) => (
              <option
                key={option.code}
                value={option.code}
                className="bg-[#f7b9d8] text-[#4a3e4a]"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section
        className={`relative z-10 w-full px-1 pb-2 pt-0 md:px-2 md:pb-3 ${
          started
            ? "flex min-h-0 flex-1 flex-col md:block md:flex-none"
            : ""
        }`}
      >
        {!started ? (
          <div className="flex min-h-[calc(100dvh-5.5rem)] w-full max-w-full flex-col items-center justify-center gap-5 px-3 py-4 max-md:overflow-x-clip max-md:text-center md:min-h-[70vh] md:justify-start md:gap-6 md:overflow-x-hidden md:px-2 md:pt-14">
            <TitleLetterDropGame
              line1={t.titleTop}
              line2={t.titleBottom}
              scoreFmt={t.titleGameScoreFmt}
              completeFmt={t.titleGameCompleteFmt}
            />
            <ButtonAttention>
              <button
                type="button"
                className="rounded-full border border-white/75 bg-white/85 px-6 py-3 text-center text-base font-medium text-[#813f1a] shadow-md transition hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c76b9e]"
                style={{ animation: "aeBtnCombo 2.8s ease-in-out infinite" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setStarted(true);
                }}
              >
                {t.clickToStart}
              </button>
            </ButtonAttention>
          </div>
        ) : (
          <div className="flex w-full max-w-full flex-1 flex-col px-1 py-2 max-md:min-h-[calc(100dvh-5.75rem)] max-md:justify-center md:min-h-[70vh] md:flex-none md:justify-start md:pt-4">
            <div className="flex w-full flex-col items-center gap-0.5 md:min-h-0 md:flex-1 md:gap-1.5">
              <div className="flex w-full shrink-0 flex-col items-center justify-center md:min-h-0 md:flex-1">
            {/*
              Tek kutu: karakter + kalem + fırça aynı ölçekte (absolute inset-0 katmanlar).
            */}
            {/*
              Mobil: geniş ekran hissi (yüksek px üst sınırı, tam genişlik vw).
              Masaüstü (md+): tarayıcıda ~%20 daha küçük → önceki 90vw/1008 → 72vw/806.
            */}
            <div className="relative mx-auto aspect-square w-[min(100vw,1024px)] max-w-[100%] shrink-0 overflow-visible md:w-[min(72vw,806px)]">
              {/*
                Mobil: mainchar + pencil + brush + hit aynı ölçekte %40 büyür, origin-center ile merkezde kalır.
                Balon bu sarmalayıcının dışında — kutunun üst ortasında sabit (ölçeklenmez).
              */}
              <div className="absolute inset-0 max-md:origin-center max-md:scale-[1.4]">
                <Image
                  src={mascotPngSrc("mainchar")}
                  alt={t.mascotAlt}
                  fill
                  priority
                  className="z-10 object-contain"
                />

                <div className="pointer-events-none absolute inset-0 z-30">
                  <ToolAttention delay={0} className="absolute inset-0">
                    <div
                      className={`absolute inset-0 transition duration-200 ${
                        hoveredTool === "pencil"
                          ? "scale-[1.03]"
                          : "md:hover:scale-[1.02]"
                      }`}
                    >
                      <Image
                        src={mascotPngSrc("pencil")}
                        alt={t.pencil}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </ToolAttention>
                </div>

                <div className="pointer-events-none absolute inset-0 z-40">
                  <ToolAttention delay={0.55} className="absolute inset-0">
                    <div
                      className={`absolute inset-0 transition duration-200 ${
                        hoveredTool === "brush"
                          ? "scale-[1.03]"
                          : "md:hover:scale-[1.02]"
                      }`}
                    >
                      <Image
                        src={mascotPngSrc("brush")}
                        alt={t.brush}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </ToolAttention>
                </div>

                <div
                  ref={mascotHitRef}
                  role="presentation"
                  className="absolute inset-0 z-50 cursor-pointer touch-manipulation rounded-full"
                  style={{ touchAction: "manipulation" }}
                  onPointerMove={(e) => {
                    if (e.pointerType === "mouse") updateHoverFromPointer(e);
                  }}
                  onPointerLeave={() => setHoveredTool(null)}
                  onPointerDown={(e) => {
                    if (e.pointerType === "touch" || e.pointerType === "pen") {
                      updateHoverFromPointer(e);
                    }
                  }}
                  onPointerUp={(e) => {
                    if (e.pointerType === "mouse" && e.button !== 0) return;
                    openToolFromPointer(e);
                  }}
                />
              </div>

              <SpeechBubble
                text={
                  hoveredTool === "pencil"
                    ? t.pencilBubble
                    : t.brushBubble
                }
                visible={hoveredTool !== null}
              />
            </div>

              <p
                aria-hidden={hoveredTool !== null}
                className="iso-tool-text relative z-10 mx-auto mt-1 flex w-full max-w-md shrink-0 justify-center px-3 py-0 text-center text-2xl font-extrabold tracking-wide text-[#fff6ee] transition-opacity duration-300 md:mt-2 md:text-3xl"
                style={{
                  textShadow:
                    "1.4px 0 rgba(0,0,0,0.7), -1.4px 0 rgba(0,0,0,0.7), 0 1.4px rgba(0,0,0,0.7), 0 -1.4px rgba(0,0,0,0.7), 0 0 6px rgba(255, 182, 216, 0.24)",
                  opacity: hoveredTool ? 0 : 1,
                  visibility: hoveredTool ? "hidden" : "visible",
                }}
              >
                <span
                  key={t.chooseTool}
                  className="flex w-full flex-wrap justify-center"
                >
                  {renderWaveText(t.chooseTool)}
                </span>
              </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {started && openAlbum ? (
          <SketchbookBackdrop
            key={openAlbum}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onBackdropClose={() => setOpenAlbum(null)}
          >
            <SketchbookBook
              tool={openAlbum}
              albumTitle={
                openAlbum === "brush"
                  ? t.brushDrawings
                  : t.pencilDrawings
              }
              emptyAlbumMessage={
                openAlbum === "brush"
                  ? t.emptyBrushGallery
                  : t.emptyPencilGallery
              }
              uiLanguage={language}
              onClose={() => setOpenAlbum(null)}
              brushDrawings={brushDrawings}
              pencilDrawings={pencilDrawings}
            />
          </SketchbookBackdrop>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
