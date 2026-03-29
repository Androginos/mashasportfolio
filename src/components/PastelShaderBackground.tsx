"use client";

import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { PastelShaderRemotion } from "./PastelShaderRemotion";

export const PastelShaderBackground = () => {
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: Math.max(window.innerWidth, 1),
        height: Math.max(window.innerHeight, 1),
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return (
    <div className="pastel-shader-backdrop pointer-events-none fixed inset-0 z-0 w-full overflow-hidden">
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
};
