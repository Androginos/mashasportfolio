"use client";

/**
 * SpeechBubble.tsx
 *
 * Karakter alanının üst ortasında konuşma balonu.
 * portfolio-client.tsx'teki hoveredTool state'iyle çalışır.
 */

import { motion, AnimatePresence } from "framer-motion";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
}

export function SpeechBubble({ text, visible }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={text}
          className="pointer-events-none absolute top-3 z-[60] max-md:top-2"
          style={{ left: "50%" }}
          initial={{ x: "-50%", opacity: 0, scale: 0.75, y: 12 }}
          animate={{ x: "-50%", opacity: 1, scale: 1, y: 0 }}
          exit={{ x: "-50%", opacity: 0, scale: 0.75, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          <div
            style={{
              position: "relative",
              background: "#fef9c3",
              border: "5px solid #f59e0b",
              borderRadius: "24px",
              padding: "14px 28px",
              whiteSpace: "nowrap",
              boxShadow: "4px 4px 0 #fbbf24",
              fontFamily: "var(--font-luckiest-guy), 'Luckiest Guy', cursive",
              fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
              color: "#92400e",
              userSelect: "none",
            }}
          >
            {text}

            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "18px solid #f59e0b",
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "calc(100% - 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "16px solid #fef9c3",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
