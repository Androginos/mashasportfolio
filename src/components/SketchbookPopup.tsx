"use client";

/**
 * Sayfa çevirme: AnimatePresence + rotateY yok — sabit back + front katmanları,
 * tek CSS transform transition; ortada içerik swap + transition:none sıfırlama.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { mascotPngSrc } from "@/lib/mascotAssets";
import type { SketchbookDrawing } from "@/lib/publicDrawings";

export type SketchbookTool = "brush" | "pencil";

export type { SketchbookDrawing };

const SWIPE_THRESHOLD = 55;
const FLIP_MS = 460;

/** A4 dikey */
const A4_ASPECT = "1 / 1.414";

/**
 * Albüm kabuğu: 92vw kullanma — padding’li üstten taşır (iPhone / büyük Android).
 * %100 = backdrop içi alan; üst sınır = A4 yüksekliği ekrana sığacak genişlik + masaüstü 480px.
 */
const BOOK_SHELL_STYLE: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  maxWidth:
    "min(480px, calc((100dvh - 9.5rem) / 1.414), calc(100vw - max(2rem, env(safe-area-inset-left) + env(safe-area-inset-right))))",
};

/** Ana sayfa teması: --background turuncu, --foreground koyu kahve */
const BOOK_COVER_GRADIENT =
  "linear-gradient(150deg, #ff9d4d 0%, #e07b3a 38%, #8f4a28 72%, #4a2f1f 100%)";

/** Seçilen dil — html lang=tr iken İngilizce metinde CSS uppercase hatasını önlemek için */
export type SketchbookUiLanguage = "en" | "uk" | "ru" | "pl";

function ModalChrome({
  albumTitle,
  tool,
  onClose,
  contentLang,
  children,
}: {
  albumTitle: string;
  tool: SketchbookTool;
  onClose: () => void;
  contentLang: SketchbookUiLanguage;
  children: ReactNode;
}) {
  const emoji = tool === "brush" ? "🖌️" : "✏️";
  return (
    <div
      lang={contentLang}
      className="flex w-full max-w-full flex-col items-center gap-2.5 overflow-x-clip"
      style={BOOK_SHELL_STYLE}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-full px-4 sm:px-8 md:px-11">
        <h2
          className="text-center text-lg font-extrabold leading-snug tracking-wide text-[#fff2e7] md:text-xl"
          style={{
            textShadow:
              "1.2px 0 rgba(0,0,0,0.7), -1.2px 0 rgba(0,0,0,0.7), 0 1.2px rgba(0,0,0,0.7), 0 -1.2px rgba(0,0,0,0.7), 0 0 5px rgba(255, 182, 216, 0.22)",
          }}
        >
          {emoji} {albumTitle}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-white/90 text-base font-bold text-[#4a2f1f] shadow-md transition hover:bg-white"
        >
          ✕
        </button>
      </div>
      <div className="flex w-full justify-center">{children}</div>
    </div>
  );
}

interface FlipState {
  shown: number;
  frontIndex: number;
  backIndex: number;
  rotate: number;
  /** İleri: sol kenar + rotateY(-90). Geri: sağ kenar + rotateY(+90) — simetrik menteşe */
  hinge: "left" | "right";
  locked: boolean;
}

function suggestedBackIndex(shown: number, total: number): number {
  if (total <= 1) return 0;
  if (shown < total - 1) return shown + 1;
  return shown - 1;
}

function initialFlipState(total: number): FlipState {
  if (total <= 0) {
    return {
      shown: 0,
      frontIndex: 0,
      backIndex: 0,
      rotate: 0,
      hinge: "left",
      locked: false,
    };
  }
  return {
    shown: 0,
    frontIndex: 0,
    backIndex: suggestedBackIndex(0, total),
    rotate: 0,
    hinge: "left",
    locked: false,
  };
}

function useFlip(total: number) {
  const [s, setS] = useState<FlipState>(() => initialFlipState(total));
  const t1 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t2 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flipGen = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(t1.current);
      clearTimeout(t2.current);
      flipGen.current += 1;
    },
    [],
  );

  const flip = useCallback(
    (dir: "next" | "prev") => {
      setS((prev) => {
        if (prev.locked || total <= 0) return prev;
        const target = dir === "next" ? prev.shown + 1 : prev.shown - 1;
        if (target < 0 || target >= total) return prev;

        const newBack = target;
        const hinge = dir === "next" ? "left" : "right";
        const endAngle = dir === "next" ? -90 : 90;

        clearTimeout(t1.current);
        clearTimeout(t2.current);
        const gen = ++flipGen.current;

        t1.current = setTimeout(() => {
          if (flipGen.current !== gen) return;
          setS((s2) => ({
            ...s2,
            shown: target,
            frontIndex: target,
            rotate: 0,
            hinge: "left",
            backIndex: suggestedBackIndex(target, total),
          }));
          t2.current = setTimeout(() => {
            if (flipGen.current !== gen) return;
            setS((s3) => ({ ...s3, locked: false }));
          }, 20);
        }, FLIP_MS / 2);

        return {
          shown: prev.shown,
          frontIndex: prev.shown,
          backIndex: newBack,
          rotate: endAngle,
          hinge,
          locked: true,
        };
      });
    },
    [total],
  );

  const canNext = total > 0 && s.shown < total - 1 && !s.locked;
  const canPrev = total > 0 && s.shown > 0 && !s.locked;

  return { s, flip, canNext, canPrev };
}

function useDrag(onFlip: (dir: "next" | "prev") => void) {
  const startX = useRef<number | null>(null);
  const active = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    active.current = true;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!active.current || startX.current === null) return;
      active.current = false;
      const dx = e.clientX - startX.current;
      startX.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (dx < -SWIPE_THRESHOLD) onFlip("next");
      else if (dx > SWIPE_THRESHOLD) onFlip("prev");
    },
    [onFlip],
  );

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    active.current = false;
    startX.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}

function PageLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 38 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "1px",
            top: `${30 + i * 27}px`,
            background: "rgba(140,160,210,0.11)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "38px",
          width: "1px",
          background: "rgba(210,70,70,0.14)",
        }}
      />
    </div>
  );
}

function SketchPage({ drawing }: { drawing: SketchbookDrawing }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#f5f0e8",
        borderRadius: "0 10px 10px 0",
        overflow: "hidden",
      }}
    >
      <PageLines />
      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        <Image
          src={drawing.src}
          alt={drawing.alt}
          fill
          className="object-cover"
          sizes="(max-width: 600px) 95vw, 460px"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          background:
            "linear-gradient(to right, rgba(0,0,0,0.07) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.05) 100%)",
        }}
      />
    </div>
  );
}

export interface SketchbookOverlayProps {
  tool: SketchbookTool;
  onClose: () => void;
}

export interface SketchbookBookProps extends SketchbookOverlayProps {
  brushDrawings: SketchbookDrawing[];
  pencilDrawings: SketchbookDrawing[];
  /** Seçili dilde albüm başlığı (ör. t.brushDrawings / t.pencilDrawings) */
  albumTitle: string;
  /** Boş albüm mesajı (ör. t.emptyBrushGallery / t.emptyPencilGallery) */
  emptyAlbumMessage: string;
  /** Ana sayfa dil seçimi — doğru büyük/küçük harf ve lang */
  uiLanguage: SketchbookUiLanguage;
}

type SketchbookBackdropProps = {
  children: ReactNode;
  onBackdropClose: () => void;
};

const SketchbookBackdropBase = forwardRef<HTMLDivElement, SketchbookBackdropProps>(
  function SketchbookBackdropBase({ children, onBackdropClose }, ref) {
    return (
      <div
        ref={ref}
        className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden overscroll-y-contain"
        style={{
          /* backdrop-filter: flip animasyonunda bulanık örnekleme kayar; düz opak katman */
          background: "rgba(10, 8, 5, 0.94)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onBackdropClose();
        }}
      >
        <div
          className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full items-center justify-center px-4 py-6"
          style={{
            paddingTop: "max(1.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onBackdropClose();
          }}
        >
          {children}
        </div>
      </div>
    );
  },
);

SketchbookBackdropBase.displayName = "SketchbookBackdropBase";

export const SketchbookBackdrop = motion(SketchbookBackdropBase);

/** total veya tool değişince sayfa çevirme state’i sıfırlansın diye üstte key ile yeniden mount edilir. */
function SketchbookBookInner({
  tool,
  onClose,
  albumTitle,
  emptyAlbumMessage,
  uiLanguage,
  brushDrawings,
  pencilDrawings,
}: SketchbookBookProps) {
  const drawings = tool === "brush" ? brushDrawings : pencilDrawings;
  const total = drawings.length;
  const { s, flip, canNext, canPrev } = useFlip(total);
  const drag = useDrag(flip);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (total === 0) {
        if (e.key === "Escape") onClose();
        return;
      }
      if (e.key === "ArrowRight") flip("next");
      else if (e.key === "ArrowLeft") flip("prev");
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [flip, onClose, total]);

  const titleColor = "#4a2f1f";
  const accentRing = "rgba(224, 123, 58, 0.75)";

  const frontTransition =
    s.rotate !== 0
      ? `transform ${FLIP_MS / 2}ms cubic-bezier(0.42, 0, 0.58, 1)`
      : "none";

  const backDrawing = drawings[s.backIndex];
  const frontDrawing = drawings[s.frontIndex];

  if (total === 0) {
    return (
      <ModalChrome
        albumTitle={albumTitle}
        tool={tool}
        onClose={onClose}
        contentLang={uiLanguage}
      >
        <motion.div
          className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl shadow-2xl"
          initial={{ scale: 0.84, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.84, y: 32, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
        >
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: BOOK_COVER_GRADIENT,
              boxShadow:
                "0 28px 72px rgba(74,47,31,0.45), 0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          />
          <div className="relative z-10 rounded-xl bg-[#f5f0e8] px-5 py-10 text-center text-sm font-bold leading-snug tracking-wide text-[#4a2f1f] md:text-base">
            {emptyAlbumMessage}
          </div>
        </motion.div>
      </ModalChrome>
    );
  }

  return (
    <ModalChrome
      albumTitle={albumTitle}
      tool={tool}
      onClose={onClose}
      contentLang={uiLanguage}
    >
      <motion.div
        className="relative w-full min-w-0 max-w-full"
        style={{
          aspectRatio: A4_ASPECT,
        }}
        initial={{ scale: 0.84, y: 32, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.84, y: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: BOOK_COVER_GRADIENT,
            boxShadow:
              "0 28px 72px rgba(74,47,31,0.45), 0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "7px",
            bottom: "7px",
            left: "10px",
            right: "7px",
            perspectiveOrigin:
              s.hinge === "left" ? "left center" : "right center",
          }}
        >
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            {backDrawing ? <SketchPage drawing={backDrawing} /> : null}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              transformOrigin:
                s.hinge === "left" ? "left center" : "right center",
              transform: `perspective(1200px) rotateY(${s.rotate}deg)`,
              transition: frontTransition,
              boxShadow:
                s.locked && s.rotate !== 0
                  ? s.hinge === "left"
                    ? "6px 0 28px rgba(0,0,0,0.4)"
                    : "-6px 0 28px rgba(0,0,0,0.4)"
                  : "2px 0 8px rgba(0,0,0,0.1)",
            }}
          >
            {frontDrawing ? <SketchPage drawing={frontDrawing} /> : null}
          </div>

          <div
            className="cursor-grab active:cursor-grabbing"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              touchAction: "none",
            }}
            onPointerDown={drag.onPointerDown}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
          />
        </div>

        <AnimatePresence>
          {canPrev ? (
            <motion.button
              key="prev"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Önceki sayfa"
              onClick={() => flip("prev")}
              className="absolute left-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold"
              style={{
                border: `2px solid ${accentRing}`,
                background: "rgba(255,255,255,0.95)",
                color: titleColor,
                boxShadow: "0 2px 10px rgba(74,47,31,0.2)",
              }}
            >
              ‹
            </motion.button>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {canNext ? (
            <motion.button
              key="next"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Sonraki sayfa"
              onClick={() => flip("next")}
              className="absolute right-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold"
              style={{
                border: `2px solid ${accentRing}`,
                background: "rgba(255,255,255,0.95)",
                color: titleColor,
                boxShadow: "0 2px 10px rgba(74,47,31,0.2)",
              }}
            >
              ›
            </motion.button>
          ) : null}
        </AnimatePresence>

        <div className="pointer-events-none absolute bottom-3 right-3 z-30 text-xs font-bold tracking-wide text-[#4a2f1f]/80 md:text-sm">
          {s.shown + 1} / {total}
        </div>
      </motion.div>
    </ModalChrome>
  );
}

export function SketchbookBook(props: SketchbookBookProps) {
  const drawings = props.tool === "brush" ? props.brushDrawings : props.pencilDrawings;
  const total = drawings.length;
  const flipResetKey = `${props.tool}-${total}`;
  return <SketchbookBookInner key={flipResetKey} {...props} />;
}

interface ToolButtonsProps {
  onSelect: (tool: SketchbookTool) => void;
}

export function SketchbookToolButtons({ onSelect }: ToolButtonsProps) {
  return (
    <div className="relative inline-flex items-end justify-center">
      <div className="relative h-64 w-48 select-none">
        <Image
          src={mascotPngSrc("mainchar")}
          alt="Kız karakteri"
          fill
          className="object-contain object-bottom"
          sizes="192px"
        />
      </div>

      <motion.button
        type="button"
        className="absolute bottom-14 left-0"
        whileHover={{ scale: 1.22, rotate: -8 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        onClick={() => onSelect("brush")}
        aria-label="Fırça çizimlerini aç"
      >
        <div className="relative h-12 w-12 drop-shadow-lg">
          <Image
            src={mascotPngSrc("brush")}
            alt="Fırça"
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
      </motion.button>

      <motion.button
        type="button"
        className="absolute bottom-14 right-0"
        whileHover={{ scale: 1.22, rotate: 8 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        onClick={() => onSelect("pencil")}
        aria-label="Kalem çizimlerini aç"
      >
        <div className="relative h-10 w-10 drop-shadow-lg">
          <Image
            src={mascotPngSrc("pencil")}
            alt="Kalem"
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
      </motion.button>
    </div>
  );
}

export const ToolButtons = SketchbookToolButtons;

export default function SketchbookSection({
  brushDrawings = [],
  pencilDrawings = [],
  albumTitleBrush = "Brush drawings",
  albumTitlePencil = "Pencil drawings",
  emptyAlbumBrush = "No brush drawings yet.",
  emptyAlbumPencil = "No pencil drawings yet.",
  uiLanguage = "en",
}: {
  brushDrawings?: SketchbookDrawing[];
  pencilDrawings?: SketchbookDrawing[];
  albumTitleBrush?: string;
  albumTitlePencil?: string;
  emptyAlbumBrush?: string;
  emptyAlbumPencil?: string;
  uiLanguage?: SketchbookUiLanguage;
}) {
  const [activeTool, setActiveTool] = useState<SketchbookTool | null>(null);

  return (
    <>
      <SketchbookToolButtons onSelect={setActiveTool} />

      <AnimatePresence>
        {activeTool ? (
          <SketchbookBackdrop
            key={activeTool}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onBackdropClose={() => setActiveTool(null)}
          >
            <SketchbookBook
              tool={activeTool}
              albumTitle={
                activeTool === "brush" ? albumTitleBrush : albumTitlePencil
              }
              emptyAlbumMessage={
                activeTool === "brush" ? emptyAlbumBrush : emptyAlbumPencil
              }
              uiLanguage={uiLanguage}
              onClose={() => setActiveTool(null)}
              brushDrawings={brushDrawings}
              pencilDrawings={pencilDrawings}
            />
          </SketchbookBackdrop>
        ) : null}
      </AnimatePresence>
    </>
  );
}
