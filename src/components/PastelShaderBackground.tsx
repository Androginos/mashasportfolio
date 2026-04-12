"use client";

import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PastelShaderRemotion } from "./PastelShaderRemotion";

function readVisualViewportSize() {
  if (typeof window === "undefined") return { width: 1920, height: 1080 };
  const vv = window.visualViewport;
  return {
    width: Math.max(vv?.width ?? window.innerWidth, 1),
    height: Math.max(vv?.height ?? window.innerHeight, 1),
  };
}

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
        setViewport(readVisualViewportSize());
      }, 100);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", scheduleUpdate);
    vv?.addEventListener("scroll", scheduleUpdate);
    return () => {
      if (debounce) clearTimeout(debounce);
      window.removeEventListener("resize", scheduleUpdate);
      vv?.removeEventListener("resize", scheduleUpdate);
      vv?.removeEventListener("scroll", scheduleUpdate);
    };
  }, []);

  const layer = (
    <div className="pastel-shader-backdrop pointer-events-none fixed inset-0 z-0 w-full overflow-hidden [transform:translateZ(0)]">
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
