"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  SketchbookBackdrop,
  SketchbookBook,
} from "@/components/SketchbookPopup";
import { PastelShaderBackground } from "@/components/PastelShaderBackground";
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
  }
> = {
  en: {
    badge: "Little Artist Drawing Exhibition",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Click anywhere to start",
    chooseTool: "Choose a tool",
    pencil: "Pencil",
    brush: "Brush",
    drawing: "Drawing",
    pencilDrawings: "Pencil drawings",
    brushDrawings: "Brush drawings",
    emptyPencilGallery: "No pencil drawings yet. Add images to gallery/pencil.",
    emptyBrushGallery: "No brush drawings yet. Add images to gallery/brush.",
    mascotAlt: "Main character",
  },
  uk: {
    badge: "Виставка малюнків маленької художниці",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Натисніть будь-де, щоб почати",
    chooseTool: "Оберіть інструмент",
    pencil: "Олівець",
    brush: "Пензлик",
    drawing: "Малюнок",
    pencilDrawings: "Малюнки олівцем",
    brushDrawings: "Малюнки пензликом",
    emptyPencilGallery: "Поки немає малюнків олівцем. Додайте файли в gallery/pencil.",
    emptyBrushGallery: "Поки немає малюнків пензликом. Додайте файли в gallery/brush.",
    mascotAlt: "Головний персонаж",
  },
  ru: {
    badge: "Выставка рисунков маленькой художницы",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Нажмите в любом месте, чтобы начать",
    chooseTool: "Выберите инструмент",
    pencil: "Карандаш",
    brush: "Кисть",
    drawing: "Рисунок",
    pencilDrawings: "Рисунки карандашом",
    brushDrawings: "Рисунки кистью",
    emptyPencilGallery: "Пока нет рисунков карандашом. Добавьте файлы в gallery/pencil.",
    emptyBrushGallery: "Пока нет рисунков кистью. Добавьте файлы в gallery/brush.",
    mascotAlt: "Главный персонаж",
  },
  pl: {
    badge: "Wystawa rysunków małej artystki",
    titleTop: "MASHA'S",
    titleBottom: "DRAWINGS",
    clickToStart: "Kliknij gdziekolwiek, aby zaczac",
    chooseTool: "Wybierz narzedzie",
    pencil: "Olowek",
    brush: "Pedzel",
    drawing: "Rysunek",
    pencilDrawings: "Rysunki olowkiem",
    brushDrawings: "Rysunki pedzlem",
    emptyPencilGallery: "Brak rysunkow olowkiem. Dodaj pliki do gallery/pencil.",
    emptyBrushGallery: "Brak rysunkow pedzlem. Dodaj pliki do gallery/brush.",
    mascotAlt: "Glowna postac",
  },
};

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "uk", label: "Ukrainian" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
];

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
  const t = translations[language];

  const toolLineLabel =
    hoveredTool === "pencil"
      ? t.pencilDrawings
      : hoveredTool === "brush"
        ? t.brushDrawings
        : t.chooseTool;

  const renderIsoLine = (text: string) => (
    <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
      {text.split("").map((char, index) => (
        <span
          key={`${text}-${index}`}
          className="iso-letter text-5xl font-extrabold uppercase leading-tight text-[#fff2e7] sm:text-6xl md:text-8xl lg:text-9xl"
          style={{ animationDelay: `${index * 0.07}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );

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
      className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-4 text-center md:py-6"
      onClick={() => {
        if (!started) setStarted(true);
      }}
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

      <section className="relative z-10 w-full px-1 pb-2 pt-0 md:px-2 md:pb-3">
        {!started ? (
          <div className="flex min-h-[68vh] flex-col items-center justify-start gap-5 pt-10 md:min-h-[70vh] md:gap-6 md:pt-14">
            {renderIsoLine(t.titleTop)}
            {renderIsoLine(t.titleBottom)}
            <p className="rounded-full border border-white/75 bg-white/85 px-6 py-3 text-base font-medium text-[#813f1a] shadow-md">
              {t.clickToStart}
            </p>
          </div>
        ) : (
          <div className="flex min-h-[68vh] w-full flex-col items-center justify-start pt-2 md:min-h-[70vh] md:pt-4">
            <div className="relative mx-auto aspect-square w-[min(88vw,620px)] md:-mt-2 md:w-[min(72vw,620px)]">
              <Image
                src="/mainchar.png"
                alt={t.mascotAlt}
                fill
                priority
                className="z-10 object-contain"
              />

              <div
                className={`pointer-events-none absolute inset-0 z-30 transition duration-200 ${
                  hoveredTool === "pencil"
                    ? "scale-[1.03] drop-shadow-[0_0_30px_rgba(255,66,196,0.95)]"
                    : "hover:scale-[1.02] hover:drop-shadow-[0_0_24px_rgba(255,66,196,0.8)]"
                }`}
              >
                <Image src="/pencil.png" alt={t.pencil} fill className="object-contain" />
              </div>

              <div
                className={`pointer-events-none absolute inset-0 z-40 transition duration-200 ${
                  hoveredTool === "brush"
                    ? "scale-[1.03] drop-shadow-[0_0_30px_rgba(255,66,196,0.95)]"
                    : "hover:scale-[1.02] hover:drop-shadow-[0_0_24px_rgba(255,66,196,0.8)]"
                }`}
              >
                <Image src="/brush.png" alt={t.brush} fill className="object-contain" />
              </div>

              <button
                type="button"
                aria-label={t.pencil}
                onMouseEnter={() => setHoveredTool("pencil")}
                onMouseLeave={() => setHoveredTool(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  setHoveredTool(null);
                  setOpenAlbum("pencil");
                }}
                className="absolute inset-0 z-50 rounded-full"
                style={{ clipPath: "polygon(0 0, 60% 0, 56% 100%, 0% 100%)" }}
              />
              <button
                type="button"
                aria-label={t.brush}
                onMouseEnter={() => setHoveredTool("brush")}
                onMouseLeave={() => setHoveredTool(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  setHoveredTool(null);
                  setOpenAlbum("brush");
                }}
                className="absolute inset-0 z-50 rounded-full"
                style={{ clipPath: "polygon(42% 0, 100% 0, 100% 100%, 46% 100%)" }}
              />
            </div>

            <p
              className={`iso-tool-text relative z-10 mx-auto mt-3 max-w-md px-3 py-2 text-2xl font-extrabold tracking-wide transition-all duration-300 md:mt-4 md:text-3xl ${
                hoveredTool ? "text-[#fff2e7]" : "text-[#fff6ee]"
              }`}
              style={{
                textShadow: hoveredTool
                  ? "1.6px 0 rgba(0,0,0,0.75), -1.6px 0 rgba(0,0,0,0.75), 0 1.6px rgba(0,0,0,0.75), 0 -1.6px rgba(0,0,0,0.75), 0 0 8px rgba(255, 182, 216, 0.32)"
                  : "1.4px 0 rgba(0,0,0,0.7), -1.4px 0 rgba(0,0,0,0.7), 0 1.4px rgba(0,0,0,0.7), 0 -1.4px rgba(0,0,0,0.7), 0 0 6px rgba(255, 182, 216, 0.24)",
              }}
            >
              <span key={toolLineLabel} className="inline-block">
                {renderWaveText(toolLineLabel)}
              </span>
            </p>
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
