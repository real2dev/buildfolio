"use client";

import TypingText from "@/components/TypingText";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Background layers */}
      <div className="bg-stars" aria-hidden />
      <div className="bg-glow" aria-hidden />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl font-semibold tracking-tight text-neutral-100">
          Buildfolio
        </h1>

        <p className="mt-4 text-neutral-300">
          <TypingText
            phrases={[
              "Clean, professional site in minutes.",
              "Your portfolio, instantly.",
              "No design. No setup. Just publish.",
            ]}
          />
        </p>

        <Link href="/start" className="glass-btn mt-8">
         <span className="glass-btn__label">Create My Site</span>
        </Link>
      </div>
    </main>
  );
}