"use client";

/**
 * TitleLetterDropGame.tsx  — v3
 *
 * Değişiklik: CSS animasyonu → Canvas + rAF tabanlı parçacık sistemi.
 * Canvas parçacık motoru preview ile aynı fizik:
 *   - vy += 0.30 gravity, vx *= 0.97 hava direnci
 *   - alpha: son %45'te lineer fade; yıldız / kıvılcım / daire
 * Patlama: 50-puan tarzı — 30 + 150ms sonra 12, speed*0.72 ile yavaş dağılım
 *
 * globals.css'ten splash-star-particle ve ilgili @keyframes SİLİNEBİLİR
 * artık kullanılmıyor (ama bırakılsa da zarar vermez).
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Tipler
// ─────────────────────────────────────────────────────────────────────────────

interface LetterState {
  id: string;
  char: string;
  targetIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  placed: boolean;
  landed: boolean;
  restY: number;
  rotation: number;
  rotSpeed: number;
  delay: number;
}

interface SlotRect {
  x: number;
  y: number;
}

/** Canvas parçacığı — tamamen mutable, React state'e girmiyor */
interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  life: number;      // kalan frame sayısı
  maxLife: number;
  shape: "star" | "spark" | "circle";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sabitler — harf fiziği
// ─────────────────────────────────────────────────────────────────────────────

const GRAVITY     = 0.52;
const BOUNCE      = 0.30;
const FRICTION    = 0.80;
/** Büyük harflerle hizalı snap */
const SNAP_RADIUS = 72;
const FONT_SIZE = "clamp(4rem, 11.5vw, 6.65rem)";
/**
 * Grid, başlıkla aynı fontSize kullanır; track/gap em ile ölçeklenir.
 * Böylece büyük başlıkta dar rem hücreler yüzünden binme olmaz; üst/alt aynı kural.
 */
const LETTER_GRID_TRACK = "1.05em";
const LETTER_GRID_GAP = "0.06em";

function formatScoreTemplate(template: string, score: number): string {
  return template.replace(/\{score\}/g, String(score));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sabitler — canvas parçacıkları (preview widget'tan birebir)
// ─────────────────────────────────────────────────────────────────────────────

const P_GRAVITY  = 0.30;   // preview: s.vy += 0.30
const P_AIR      = 0.97;   // preview: s.vx *= 0.97
const P_COLORS   = [
  "#FFD700", "#FFD700",    // altın ağırlıklı (preview'daki large palette)
  "#FFA500", "#FF4444",
  "#FF6EC7", "#B57BFF",
  "#00EAFF", "#ffffff",
  "#FFAA00",
];

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────────────────────────────────────

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function buildLetters(line1: string, line2: string): LetterState[] {
  const chars = [...line1, "|", ...line2];
  return chars.map((char, i) => ({
    id:          `l${i}`,
    char,
    targetIndex: i,
    x:           rand(60, 480),
    y:           -rand(30, 280),
    vx:          rand(-2.2, 2.2),
    vy:          rand(0.8, 2.5),
    placed:      false,
    landed:      false,
    restY:       0,
    rotation:    rand(-45, 45),
    rotSpeed:    rand(-3.5, 3.5),
    delay:       i * 55 + rand(0, 70),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas çizim yardımcıları — preview widget'tan kopyalandı
// ─────────────────────────────────────────────────────────────────────────────

function drawStarShape(ctx: CanvasRenderingContext2D, r: number) {
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a  = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    if (i === 0) ctx.moveTo(rr * Math.cos(a), rr * Math.sin(a));
    else         ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a));
  }
  ctx.closePath();
}

function renderParticle(ctx: CanvasRenderingContext2D, p: CanvasParticle) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  if (p.shape === "star") {
    drawStarShape(ctx, p.size);
    ctx.fill();
  } else if (p.shape === "spark") {
    ctx.fillRect(-p.size * 1.2, -p.size * 0.15, p.size * 2.4, p.size * 0.3);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// useParticleCanvas — canvas + rAF parçacık motoru
// ─────────────────────────────────────────────────────────────────────────────

function useParticleCanvas(containerRef: RefObject<HTMLDivElement | null>) {
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<CanvasParticle[]>([]);
  const rafRef       = useRef<number | null>(null);

  // Canvas'ı container'a mount et
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;";
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.remove();
      canvasRef.current = null;
    };
  // containerRef mount'ta sabit olduğu için dep array boş
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render loop — sadece parçacık varsa çalışır
  const startLoop = useCallback(() => {
    if (rafRef.current) return; // zaten çalışıyor

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: CanvasParticle[] = [];

      for (const p of particlesRef.current) {
        // Fizik — preview widget ile birebir
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += P_GRAVITY;
        p.vx *= P_AIR;
        p.rotation += p.rotSpeed;
        p.life--;

        // Alpha: son %45'te lineer fade
        const fadeStart = p.maxLife * 0.55;
        p.alpha = p.life < fadeStart ? p.life / fadeStart : 1;

        if (p.life > 0) {
          alive.push(p);
          renderParticle(ctx, p);
        }
      }

      particlesRef.current = alive;

      if (alive.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  /** Parçacık patlaması — preview widget'taki burst() ile aynı imza */
  const burst = useCallback(
    (cx: number, cy: number, count: number, speed: number, scale: number) => {
      const batch: CanvasParticle[] = Array.from({ length: count }, () => {
        const angle   = rand(0, Math.PI * 2);
        const vel     = rand(speed * 0.4, speed);
        const maxLife = Math.round(rand(44, 80));
        const shape   =
          Math.random() < 0.55 ? "star"
          : Math.random() < 0.55 ? "circle"
          : "spark";

        return {
          x:        cx,
          y:        cy,
          vx:       Math.cos(angle) * vel,
          vy:       Math.sin(angle) * vel - rand(1, 3), // hafif yukarı
          size:     rand(5, 13) * scale,
          rotation: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.22, 0.22),
          color:    P_COLORS[Math.floor(Math.random() * P_COLORS.length)]!,
          alpha:    1,
          life:     maxLife,
          maxLife,
          shape,
        };
      });

      particlesRef.current.push(...batch);
      startLoop();
    },
    [startLoop],
  );

  return { burst };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana bileşen
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  line1: string;
  line2: string;
  /** Örn. "⭐ {score} points" — dil çevirisinden */
  scoreFmt: string;
  /** Örn. "🎉 {score} points! Great!" */
  completeFmt: string;
  onComplete?: (score: number) => void;
}

export function TitleLetterDropGame({
  line1,
  line2,
  scoreFmt,
  completeFmt,
  onComplete,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const slotRefs      = useRef<(HTMLSpanElement | null)[]>([]);
  const physicsRafRef = useRef<number | null>(null);
  const startTimeRef  = useRef<number>(Date.now());
  const draggingIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const capturedPointerIdRef = useRef<number | null>(null);
  const particleBurstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [letters, setLetters]   = useState<LetterState[]>(() => buildLetters(line1, line2));
  const [slots, setSlots]       = useState<SlotRect[]>([]);
  const [score, setScore]       = useState(0);
  const [allPlaced, setAllPlaced] = useState(false);
  const [gameReady, setGameReady] = useState(false);

  // Canvas parçacık motoru
  const { burst } = useParticleCanvas(containerRef);

  // ── Slot ölçümü ──────────────────────────────────────────────────────────

  const measureSlots = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const rects: SlotRect[] = slotRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    });
    setSlots(rects);
    setGameReady(true);
  }, []);

  useEffect(() => {
    if (document.fonts?.ready) {
      void document.fonts.ready.then(measureSlots);
    } else {
      setTimeout(measureSlots, 200);
    }
    window.addEventListener("resize", measureSlots);
    return () => window.removeEventListener("resize", measureSlots);
  }, [measureSlots]);

  useEffect(() => {
    return () => {
      if (particleBurstTimeoutRef.current) {
        clearTimeout(particleBurstTimeoutRef.current);
        particleBurstTimeoutRef.current = null;
      }
    };
  }, []);

  // ── Harf fizik döngüsü ────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !gameReady) return;

    const tick = () => {
      const floor   = container.clientHeight - 28;
      const elapsed = Date.now() - startTimeRef.current;

      setLetters((prev) =>
        prev.map((l) => {
          if (l.placed)                      return l;
          if (elapsed < l.delay)             return l;
          if (l.landed)                      return l;
          if (l.char === "|")                return l;
          if (l.id === draggingIdRef.current) return l;

          let { x, y, vx, vy, rotation, rotSpeed } = l;
          vy += GRAVITY;
          x  += vx;
          y  += vy;
          rotation += rotSpeed;

          const w = container.clientWidth;
          if (x < 10)     { x = 10;     vx =  Math.abs(vx) * BOUNCE; }
          if (x > w - 10) { x = w - 10; vx = -Math.abs(vx) * BOUNCE; }

          let landed = false;
          let restY  = l.restY;

          if (y >= floor) {
            y  = floor;
            vy = -Math.abs(vy) * BOUNCE;
            vx *= FRICTION;
            rotSpeed *= 0.55;
            if (Math.abs(vy) < 1.0) {
              landed = true; restY = floor;
              vx = 0; vy = 0; rotSpeed = 0;
              rotation = Math.round(rotation % 360);
            }
          }

          return { ...l, x, y, vx, vy, rotation, rotSpeed, landed, restY };
        })
      );

      physicsRafRef.current = requestAnimationFrame(tick);
    };

    physicsRafRef.current = requestAnimationFrame(tick);
    return () => { if (physicsRafRef.current) cancelAnimationFrame(physicsRafRef.current); };
  }, [gameReady]);

  // ── Tümü yerleşince ─────────────────────────────────────────────────────

  useEffect(() => {
    const real = letters.filter((l) => l.char !== "|");
    if (real.length > 0 && real.every((l) => l.placed)) {
      setAllPlaced(true);
      onComplete?.(score);
    }
  }, [letters, score, onComplete]);

  // ── Parçacık patlaması — 50-puan örneği boyutu, biraz yavaş ─────────────

  const spawnParticles = useCallback(
    (cx: number, cy: number) => {
      if (particleBurstTimeoutRef.current) {
        clearTimeout(particleBurstTimeoutRef.current);
        particleBurstTimeoutRef.current = null;
      }

      const sc = Math.min(window.innerWidth / 500, 1.6);

      // 50-puan örneği: count=30, speed=7.5, scale=0.9
      // speed ekstra *0.72 → daha gerçekçi, yavaş dağılım
      burst(cx, cy, 30, 7.5 * sc * 0.72, 0.9 * sc);

      // Küçük ikinci dalga
      particleBurstTimeoutRef.current = setTimeout(() => {
        particleBurstTimeoutRef.current = null;
        burst(cx, cy, 12, 5 * sc * 0.72, 0.65 * sc);
      }, 150);
    },
    [burst],
  );

  // ── Pointer down ────────────────────────────────────────────────────────

  const onLetterPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      e.stopPropagation();

      setLetters((prev) => {
        const letter = prev.find((l) => l.id === id);
        if (!letter || letter.placed) return prev;
        const container = containerRef.current;
        if (!container) return prev;
        const cr = container.getBoundingClientRect();
        dragOffsetRef.current = {
          x: e.clientX - cr.left - letter.x,
          y: e.clientY - cr.top  - letter.y,
        };
        draggingIdRef.current = id;
        capturedPointerIdRef.current = e.pointerId;
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return prev;
      });
    },
    [],
  );

  // ── Pointer move ────────────────────────────────────────────────────────

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const id = draggingIdRef.current;
    if (!id) return;
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const nx = e.clientX - cr.left - dragOffsetRef.current.x;
    const ny = e.clientY - cr.top - dragOffsetRef.current.y;

    setLetters((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, x: nx, y: ny, vx: 0, vy: 0, rotation: 0, landed: false }
          : l
      )
    );
  }, []);

  // ── Pointer up ──────────────────────────────────────────────────────────

  const onPointerUp = useCallback(() => {
    const id = draggingIdRef.current;
    if (!id) return;
    draggingIdRef.current = null;

    const container = containerRef.current;
    const capId = capturedPointerIdRef.current;
    capturedPointerIdRef.current = null;
    if (container != null && capId != null) {
      try {
        container.releasePointerCapture(capId);
      } catch {
        /* ignore */
      }
    }

    setLetters((prev) => {
      const letter = prev.find((l) => l.id === id);
      if (!letter) return prev;

      const slot = slots[letter.targetIndex];
      if (slot) {
        const d = dist(letter.x, letter.y, slot.x, slot.y);
        if (d < SNAP_RADIUS) {
          spawnParticles(slot.x, slot.y);
          setScore((s) => s + 10);
          return prev.map((l) =>
            l.id === id
              ? { ...l, x: slot.x, y: slot.y, placed: true, landed: true, rotation: 0, vx: 0, vy: 0 }
              : l
          );
        }
      }

      return prev.map((l) =>
        l.id === id ? { ...l, vx: rand(-1.5, 1.5), vy: -0.5, landed: false } : l
      );
    });
  }, [slots, spawnParticles]);

  // ── Render ───────────────────────────────────────────────────────────────

  const line1Chars = [...line1];
  const line2Chars = [...line2];

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ minHeight: "240px", height: "clamp(240px, 40vw, 360px)" }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >

      {/* ── Silüet slotlar ───────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ zIndex: 1 }}
        aria-hidden
      >
        <div
          className="mx-auto flex w-full max-w-[min(96vw,52rem)] justify-center px-1"
        >
          <div
            style={{
              display:          "inline-grid",
              fontFamily:       "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
              fontSize:         FONT_SIZE,
              lineHeight:       1,
              gridTemplateColumns: `repeat(${line1.length}, ${LETTER_GRID_TRACK})`,
              columnGap:        LETTER_GRID_GAP,
              alignItems:       "center",
              justifyItems:     "center",
            }}
          >
          {line1Chars.map((char, i) => (
            <span
              key={`s${i}`}
              ref={(el) => { slotRefs.current[i] = el; }}
              style={{
                boxSizing:        "border-box",
                display:          "flex",
                alignItems:       "center",
                justifyContent:   "center",
                width:            "100%",
                minWidth:         0,
                fontFamily:       "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
                fontSize:         FONT_SIZE,
                lineHeight:       1,
                letterSpacing:    "normal",
                textAlign:        "center",
                color:            "transparent",
                WebkitTextStroke: "1px rgba(160,100,140,0.45)",
                userSelect:       "none",
                opacity:          letters[i]?.placed ? 0 : 1,
                transition:       "opacity 0.25s ease",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
          </div>
        </div>

        <div
          className="mx-auto flex w-full max-w-[min(96vw,52rem)] justify-center px-1"
        >
          <div
            style={{
              display:          "inline-grid",
              fontFamily:       "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
              fontSize:         FONT_SIZE,
              lineHeight:       1,
              gridTemplateColumns: `repeat(${line2.length}, ${LETTER_GRID_TRACK})`,
              columnGap:        LETTER_GRID_GAP,
              alignItems:       "center",
              justifyItems:     "center",
            }}
          >
          {line2Chars.map((char, localI) => {
            const gi = line1.length + 1 + localI;
            return (
              <span
                key={`s${gi}`}
                ref={(el) => { slotRefs.current[gi] = el; }}
                style={{
                  boxSizing:        "border-box",
                  display:          "flex",
                  alignItems:       "center",
                  justifyContent:   "center",
                  width:            "100%",
                  minWidth:         0,
                  fontFamily:       "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
                  fontSize:         FONT_SIZE,
                  lineHeight:       1,
                  letterSpacing:    "normal",
                  textAlign:        "center",
                  color:            "transparent",
                  WebkitTextStroke: "1px rgba(160,100,140,0.45)",
                  userSelect:       "none",
                  opacity:          letters[gi]?.placed ? 0 : 1,
                  transition:       "opacity 0.25s ease",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
          </div>
        </div>
      </div>

      {/* ── Puan ──────────────────────────────────────────────────────── */}
      {score > 0 && (
        <div
          className="pointer-events-none absolute right-3 top-2 z-50 max-w-[min(92vw,20rem)] text-right leading-tight"
          style={{
            fontFamily: "var(--font-luckiest-guy), cursive",
            fontSize:   "1.15rem",
            color:      "#FFD700",
            textShadow: "1px 2px 0 rgba(0,0,0,0.45)",
            letterSpacing: 0,
          }}
        >
          {formatScoreTemplate(scoreFmt, score)}
        </div>
      )}

      {/* ── Tamamlandı ────────────────────────────────────────────────── */}
      {allPlaced && (
        <div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-3 text-center"
          style={{
            fontFamily: "var(--font-luckiest-guy), cursive",
            fontSize:   "clamp(1.05rem, 3.8vw, 1.4rem)",
            color:      "#FF6EC7",
            textShadow: "1px 2px 0 rgba(0,0,0,0.35)",
            animation:  "fadeInUp 0.45s ease both",
            letterSpacing: 0,
          }}
        >
          {formatScoreTemplate(completeFmt, score)}
        </div>
      )}

      {/* Canvas parçacıkları useParticleCanvas ile DOM'a mount edildi */}

      {/* ── Harfler ───────────────────────────────────────────────────── */}
      {letters.map((l) => {
        if (l.char === "|") return null;
        const elapsed    = Date.now() - startTimeRef.current;
        const isDragging = draggingIdRef.current === l.id;
        if (elapsed < l.delay && !l.landed && !l.placed) return null;

        const waveIx =
          l.targetIndex > line1.length ? l.targetIndex - 1 : l.targetIndex;
        const glyph = l.char === " " ? "\u00A0" : l.char;

        return (
          <div
            key={l.id}
            onPointerDown={(e) => onLetterPointerDown(e, l.id)}
            style={{
              position:    "absolute",
              left:        l.x,
              top:         l.y,
              transform:   `translate(-50%, -50%) rotate(${l.placed || isDragging ? 0 : l.rotation}deg) scale(${isDragging ? 1.12 : 1})`,
              fontFamily:  "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
              fontSize:    FONT_SIZE,
              lineHeight:  1,
              letterSpacing: 0,
              display:     "inline-block",
              minWidth:    "0.55em",
              textAlign:   "center",
              color:       l.placed ? "#c76b9e" : "#d47aae",
              textShadow:  l.placed
                ? "1px 0 rgba(0,0,0,0.4),-1px 0 rgba(0,0,0,0.4),0 1px rgba(0,0,0,0.4),0 -1px rgba(0,0,0,0.4)"
                : isDragging
                  ? "2px 4px 0 rgba(0,0,0,0.35),0 0 18px rgba(255,110,199,0.5)"
                  : "2px 3px 0 rgba(0,0,0,0.28),0 0 10px rgba(255,110,199,0.25)",
              userSelect:  "none",
              cursor:      l.placed ? "default" : isDragging ? "grabbing" : "grab",
              zIndex:      isDragging ? 40 : l.placed ? 5 : 20,
              transition:  l.placed
                ? "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)"
                : "none",
              willChange:  "transform",
              touchAction: "none",
            }}
          >
            {l.placed ? (
              <span
                className="title-drop-placed-wave"
                style={{ animationDelay: `${waveIx * 0.055}s` }}
              >
                {glyph}
              </span>
            ) : (
              glyph
            )}
          </div>
        );
      })}
    </div>
  );
}
