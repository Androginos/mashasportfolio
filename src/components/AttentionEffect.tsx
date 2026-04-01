"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface StarSeed {
  size: number;
  color: string;
  edge: "top" | "right" | "bottom" | "left";
  edgePos: number;
  burst: number;
  dur: number;
  delay: number;
}

const STARS: StarSeed[] = [
  { size: 14, color: "#FFD700", edge: "top", edgePos: 0.16, burst: 0.96, dur: 2.1, delay: 0.0 },
  { size: 16, color: "#FF6EC7", edge: "top", edgePos: 0.5, burst: 1.04, dur: 2.3, delay: 0.3 },
  { size: 13, color: "#B57BFF", edge: "top", edgePos: 0.84, burst: 0.92, dur: 2.0, delay: 0.6 },
  { size: 15, color: "#7EC8FF", edge: "right", edgePos: 0.22, burst: 1.02, dur: 2.2, delay: 0.15 },
  { size: 12, color: "#FFA500", edge: "right", edgePos: 0.5, burst: 1.08, dur: 2.4, delay: 0.75 },
  { size: 14, color: "#FFD700", edge: "right", edgePos: 0.76, burst: 0.96, dur: 2.1, delay: 0.45 },
  { size: 16, color: "#FF4444", edge: "bottom", edgePos: 0.82, burst: 1.02, dur: 2.3, delay: 0.9 },
  { size: 13, color: "#B57BFF", edge: "bottom", edgePos: 0.49, burst: 0.94, dur: 2.0, delay: 0.2 },
  { size: 15, color: "#FF6EC7", edge: "bottom", edgePos: 0.15, burst: 0.98, dur: 2.2, delay: 0.55 },
  { size: 14, color: "#7EC8FF", edge: "left", edgePos: 0.76, burst: 1.0, dur: 2.1, delay: 0.8 },
  { size: 12, color: "#FFD700", edge: "left", edgePos: 0.46, burst: 1.08, dur: 2.4, delay: 0.35 },
  { size: 15, color: "#FFA500", edge: "left", edgePos: 0.18, burst: 0.9, dur: 2.0, delay: 1.0 },
];

const STAR_CLIP =
  "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";

function buildStars(
  size: { width: number; height: number },
  config?: { burstScale?: number; sizeScale?: number; xPadRatio?: number; yPadRatio?: number }
) {
  const { width, height } = size;
  const centerX = width / 2;
  const centerY = height / 2;
  const xPadding = Math.min(14, width * (config?.xPadRatio ?? 0.08));
  const yPadding = Math.min(10, height * (config?.yPadRatio ?? 0.22));
  const baseBurst =
    Math.max(28, Math.min(44, width * 0.18 + height * 0.28)) * (config?.burstScale ?? 1);
  const sizeScale = config?.sizeScale ?? 1;

  return STARS.map((s) => {
    let x = centerX;
    let y = centerY;

    if (s.edge === "top") {
      x = xPadding + s.edgePos * Math.max(1, width - xPadding * 2);
      y = 0;
    } else if (s.edge === "right") {
      x = width;
      y = yPadding + s.edgePos * Math.max(1, height - yPadding * 2);
    } else if (s.edge === "bottom") {
      x = xPadding + s.edgePos * Math.max(1, width - xPadding * 2);
      y = height;
    } else {
      x = 0;
      y = yPadding + s.edgePos * Math.max(1, height - yPadding * 2);
    }

    const vx = x - centerX;
    const vy = y - centerY;
    const len = Math.hypot(vx, vy) || 1;
    const burstLen = baseBurst * s.burst;

    return {
      ...s,
      size: s.size * sizeScale,
      left: x,
      top: y,
      tx: (vx / len) * burstLen,
      ty: (vy / len) * burstLen,
    };
  });
}

export function ButtonAttention({ children }: { children: ReactNode }) {
  const buttonWrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 190, height: 44 });

  useEffect(() => {
    const el = buttonWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(1, entry.contentRect.width);
      const height = Math.max(1, entry.contentRect.height);
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderedStars = useMemo(() => buildStars(size), [size]);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {renderedStars.map((s, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            clipPath: STAR_CLIP,
            background: s.color,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 1,
            ["--tx" as string]: `${s.tx}px`,
            ["--ty" as string]: `${s.ty}px`,
            animation: `aeBurst ${s.dur}s ease-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div ref={buttonWrapRef} style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}

export function ToolAttention({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const toolWrapRef = useRef<HTMLDivElement | null>(null);
  const [toolSize, setToolSize] = useState({ width: 180, height: 180 });

  useEffect(() => {
    const el = toolWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(1, entry.contentRect.width);
      const height = Math.max(1, entry.contentRect.height);
      setToolSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toolStars = useMemo(
    () => buildStars(toolSize, { burstScale: 0.62, sizeScale: 0.78, xPadRatio: 0.12, yPadRatio: 0.12 }),
    [toolSize]
  );

  return (
    <div
      ref={toolWrapRef}
      className={className}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
      }}
    >
      {toolStars.map((s, i) => (
        <div
          key={`tool-star-${i}`}
          aria-hidden
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            clipPath: STAR_CLIP,
            background: s.color,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 1,
            ["--tx" as string]: `${s.tx}px`,
            ["--ty" as string]: `${s.ty}px`,
            animation: `aeBurst ${s.dur}s ease-out ${s.delay + delay}s infinite`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          animation: `aeToolShake 3.1s ease-in-out ${delay}s infinite`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
