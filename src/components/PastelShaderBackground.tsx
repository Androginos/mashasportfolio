"use client";

import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { PastelShaderRemotion } from "./PastelShaderRemotion";

function readInnerSize() {
  if (typeof window === "undefined") return { width: 1920, height: 1080 };
  return {
    width: Math.max(window.innerWidth, 1),
    height: Math.max(window.innerHeight, 1),
  };
}

/** fixed katman: will-change yok — stacking context şişirmesin */
const FIXED_LAYER_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
  pointerEvents: "none",
  overflow: "hidden",
  transform: "translateZ(0)",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

export const PastelShaderBackground = () => {
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const scheduleUpdate = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = undefined;
        setViewport(readInnerSize());
      }, 100);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (debounce) clearTimeout(debounce);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  const layer = (
    <div className="pastel-shader-backdrop" style={FIXED_LAYER_STYLE}>
      <Player
        component={PastelShaderRemotion}
        durationInFrames={60 * 60}
        fps={30}
        compositionWidth={viewport.width}
        compositionHeight={viewport.height}
        acknowledgeRemotionLicense
        autoPlay
        loop
        controls={false}
        className="pastel-shader-player h-full w-full"
        style={{
          width: "100%",
          height: "100%",
          opacity: 1,
          display: "block",
        }}
      />
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(layer, document.body);
};
