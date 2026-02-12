"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  phrases: string[];
  typingMs?: number;
  deletingMs?: number;
  holdMs?: number;
  pauseMs?: number;
};

export default function TypingText({
  phrases,
  typingMs = 45,
  deletingMs = 25,
  holdMs = 1000,
  pauseMs = 250,
}: Props) {
  const safePhrases = useMemo(() => phrases.filter(Boolean), [phrases]);

  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"typing" | "holding" | "deleting" | "pausing">(
    "typing"
  );

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const full = safePhrases[i % safePhrases.length];

    let t: number;

    if (mode === "typing") {
      if (text.length < full.length) {
        t = window.setTimeout(() => setText(full.slice(0, text.length + 1)), typingMs);
      } else {
        t = window.setTimeout(() => setMode("holding"), holdMs);
      }
    } else if (mode === "holding") {
      t = window.setTimeout(() => setMode("deleting"), holdMs);
    } else if (mode === "deleting") {
      if (text.length > 0) {
        t = window.setTimeout(() => setText(text.slice(0, -1)), deletingMs);
      } else {
        t = window.setTimeout(() => setMode("pausing"), pauseMs);
      }
    } else {
      t = window.setTimeout(() => {
        setI((v) => v + 1);
        setMode("typing");
      }, pauseMs);
    }

    return () => window.clearTimeout(t);
  }, [safePhrases, i, mode, text, typingMs, deletingMs, holdMs, pauseMs]);

  return (
    <span>
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] align-[-0.125em] bg-neutral-400 animate-pulse" />
    </span>
  );
}