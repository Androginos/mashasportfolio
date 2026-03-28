"use client";

import { Player } from "@remotion/player";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type PortfolioGridCompositionProps = {
  imageSrc: string;
  gridSize?: number;
};

const PortfolioGridComposition = ({
  imageSrc,
  gridSize = 8,
}: PortfolioGridCompositionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cells = Array.from({ length: gridSize * gridSize }, (_, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return { row, col, index };
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #E3F2FD 0%, #FCE4EC 100%)",
        overflow: "hidden",
      }}
    >
      {cells.map(({ row, col, index }) => {
        // Sol-ustten sag-alta dogru dalga gecikmesi.
        const delay = row * 2 + col * 2;
        const reveal = spring({
          fps,
          frame: frame - delay,
          config: {
            stiffness: 100,
            damping: 10,
          },
        });

        const scale = interpolate(reveal, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const opacity = interpolate(reveal, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const leftPct = (col / gridSize) * 100;
        const topPct = (row / gridSize) * 100;
        const sizePct = 100 / gridSize;
        const bgPosX = gridSize === 1 ? 0 : (col / (gridSize - 1)) * 100;
        const bgPosY = gridSize === 1 ? 0 : (row / (gridSize - 1)) * 100;

        return (
          <div
            key={`${index}-${row}-${col}`}
            style={{
              position: "absolute",
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${sizePct}%`,
              height: `${sizePct}%`,
              transform: `scale(${scale})`,
              transformOrigin: "center",
              opacity,
              backgroundImage: `url(${imageSrc})`,
              backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
              backgroundPosition: `${bgPosX}% ${bgPosY}%`,
              borderRadius: "8px",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

type PortfolioGridProps = {
  imageSrc: string;
  gridSize?: 5 | 8;
};

export const PortfolioGrid = ({ imageSrc, gridSize = 8 }: PortfolioGridProps) => {
  return (
    <Player
      component={PortfolioGridComposition}
      inputProps={{ imageSrc, gridSize }}
      durationInFrames={90}
      fps={30}
      compositionWidth={400}
      compositionHeight={300}
      controls={false}
      autoPlay
      loop={false}
      clickToPlay={false}
      acknowledgeRemotionLicense
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
};
