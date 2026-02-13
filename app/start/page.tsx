"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, type Answers } from "./questions";

export default function Start() {
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [stage, setStage] = useState<"questions" | "generating" | "preview">(
    "questions"
  );
  const [progress, setProgress] = useState(0);
  const [generation, setGeneration] = useState<{
    name: string;
    headline: string;
    bio: string;
    sections: Array<{ title: string; items: string[] }>;
    callToAction: string;
  } | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [progressDone, setProgressDone] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasRequested = useRef(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const isTransitioning = phase !== "idle";
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  useEffect(() => {
    setAnswer(answers[currentQuestion.id] ?? "");
    const isFocused = document.activeElement === inputRef.current;
    setOpen(isFocused);
    setHighlightedIndex(-1);
  }, [answers, currentQuestion.id]);

  const filtered = useMemo(() => {
    const q = answer.trim().toLowerCase();
    const presets = currentQuestion.suggestions.filter(
      (p) => p.trim() !== currentQuestion.placeholder.trim()
    );
    if (!q) return presets;
    return presets.filter((p) => p.toLowerCase().includes(q));
  }, [answer, currentQuestion.suggestions]);

  const showDropdown = open && (answer.trim() === "" || filtered.length > 0);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    if (highlightedIndex < 0) return;
    const el = itemRefs.current[highlightedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, showDropdown]);

  useEffect(() => {
    if (highlightedIndex >= filtered.length) setHighlightedIndex(-1);
  }, [filtered.length, highlightedIndex]);

  const pick = (v: string) => {
    setAnswer(v);
    setOpen(false);
    setHighlightedIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const trimmed = answer.trim();
  const canContinue = currentQuestion.validate
    ? currentQuestion.validate(trimmed)
    : trimmed.length > 0;

  const transitionTo = (nextIndex: number) => {
    if (isTransitioning) return;
    if (nextIndex === currentIndex) return;
    if (panelRef.current) {
      setPanelHeight(panelRef.current.getBoundingClientRect().height);
    }
    setOpen(false);
    setHighlightedIndex(-1);
    setPhase("out");
    window.setTimeout(() => {
      setCurrentIndex(nextIndex);
      setPhase("in");
      window.setTimeout(() => {
        setPhase("idle");
        window.setTimeout(() => setPanelHeight(null), 140);
      }, 140);
    }, 140);
  };

  const goToNext = (nextId: string | null) => {
    if (!nextId) return;
    const nextIndex = QUESTIONS.findIndex((q) => q.id === nextId);
    if (nextIndex === -1) return;
    transitionTo(nextIndex);
  };

  const onContinue = () => {
    if (isTransitioning) return;
    if (!canContinue) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: trimmed };
    setAnswers(nextAnswers);
    const nextId = currentQuestion.branch?.(trimmed, nextAnswers) ?? null;
    if (nextId) {
      goToNext(nextId);
      return;
    }
    if (isLastQuestion) {
      setStage("generating");
      return;
    }
    transitionTo(Math.min(currentIndex + 1, QUESTIONS.length - 1));
  };

  const onSkip = () => {
    if (isTransitioning) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: "" };
    setAnswers(nextAnswers);
    const nextId = currentQuestion.branch?.("", nextAnswers) ?? null;
    if (nextId) {
      goToNext(nextId);
      return;
    }
    if (isLastQuestion) {
      setStage("generating");
      return;
    }
    transitionTo(Math.min(currentIndex + 1, QUESTIONS.length - 1));
  };

  useEffect(() => {
    if (stage !== "generating") return;
    setProgress(0);
    setProgressDone(false);
    const start = Date.now();
    const duration = 7200;
    const tick = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(eased * 100);
      setProgress(next);
      if (t >= 1) {
        window.clearInterval(tick);
        setProgressDone(true);
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [stage]);

  useEffect(() => {
    if (stage !== "generating") return;
    if (hasRequested.current) return;
    hasRequested.current = true;
    setGenerationError(null);
    setGeneration(null);
    setShareId(null);
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Generation failed");
        setGeneration(json.data);
        const saveRes = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: json.data }),
        });
        const saveJson = await saveRes.json();
        if (saveJson?.ok && saveJson.id) setShareId(saveJson.id);
      })
      .catch((err: Error) => {
        setGenerationError(err.message || "Generation failed");
      });
  }, [stage, answers]);

  useEffect(() => {
    if (stage !== "generating") return;
    if (!progressDone) return;
    if (!generation && !generationError) return;
    const t = window.setTimeout(() => setStage("preview"), 250);
    return () => window.clearTimeout(t);
  }, [stage, progressDone, generation, generationError]);

  const displayValue = (id: string, fallback: string) =>
    answers[id]?.trim() ? answers[id].trim() : fallback;

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <div className="w-full max-w-xl px-6 relative">
        <div
          ref={panelRef}
          style={panelHeight ? { minHeight: `${panelHeight}px` } : undefined}
          data-phase={phase}
          className="
            transition-all duration-150
            data-[phase=out]:opacity-0 data-[phase=out]:translate-y-1
            data-[phase=in]:opacity-100 data-[phase=in]:translate-y-0
          "
        >
          {stage === "questions" && (
            <>
              <p className="text-neutral-400 mb-2 text-sm">
                Question {currentIndex + 1} of {QUESTIONS.length}
              </p>

              <h1 className="text-3xl font-semibold mb-6 tracking-tight">
                {currentQuestion.text}
              </h1>

              <div ref={wrapRef} className="relative">

                {/* INPUT */}
                <input
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                    if (e.key === "ArrowDown") {
                      if (!showDropdown) setOpen(true);
                      if (filtered.length > 0) {
                        e.preventDefault();
                        setHighlightedIndex((i) =>
                          i < 0 ? 0 : (i + 1) % filtered.length
                        );
                      }
                    }
                    if (e.key === "ArrowUp") {
                      if (!showDropdown) setOpen(true);
                      if (filtered.length > 0) {
                        e.preventDefault();
                        setHighlightedIndex((i) =>
                          i <= 0 ? filtered.length - 1 : i - 1
                        );
                      }
                    }
                    if (e.key === "Enter") {
                      if (showDropdown && highlightedIndex >= 0) {
                        const v = filtered[highlightedIndex];
                        if (v) {
                          e.preventDefault();
                          pick(v);
                          return;
                        }
                      }
                      if (canContinue) {
                        setOpen(false);
                        onContinue();
                      }
                    }
                  }}
                  placeholder={currentQuestion.placeholder}
                  className="
                    w-full bg-transparent
                    border-b border-white/20
                    py-3 text-lg
                    outline-none
                    focus:border-white/60
                    transition
                  "
                  autoComplete="off"
                  spellCheck={false}
                  aria-expanded={showDropdown}
                  aria-controls="suggestions-list"
                  disabled={isTransitioning}
                />

                {/* DROPDOWN */}
                <div
                  data-open={showDropdown}
                  className="
                    dropdown absolute left-0 right-0 mt-3
                    rounded-2xl border border-white/10
                    bg-white/5 backdrop-blur-xl
                    shadow-[0_20px_80px_rgba(0,0,0,0.65)]
                    overflow-hidden
                  "
                >
                  <div className="px-4 py-3 text-xs text-white/50">
                    Suggestions (you can still type anything)
                  </div>

                  <div id="suggestions-list" role="listbox" className="max-h-64 overflow-auto">
                    {filtered.slice(0, 10).map((p, i) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => pick(p)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        role="option"
                        aria-selected={i === highlightedIndex}
                        className="
                          w-full text-left px-4 py-3
                          text-white/90
                          hover:bg-white/10
                          transition
                          data-[active=true]:bg-white/10
                        "
                        data-active={i === highlightedIndex}
                        disabled={isTransitioning}
                      >
                        {p}
                      </button>
                    ))}

                    {answer.trim() !== "" && filtered.length === 0 && (
                      <div className="px-4 py-3 text-white/60">
                        No matches — press Enter to use “{answer.trim()}”.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  className="text-white/50 hover:text-white/80 transition"
                  onClick={onSkip}
                  disabled={isTransitioning}
                >
                  Skip
                </button>

                <button
                  type="button"
                  disabled={!canContinue || isTransitioning}
                  className="text-white/90 disabled:text-white/30 transition"
                  onClick={onContinue}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {stage === "generating" && (
            <div>
              <p className="text-neutral-400 mb-2 text-sm">Generating site</p>
              <h1 className="text-3xl font-semibold mb-8 tracking-tight">
                Crafting your Buildfolio…
              </h1>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-6">
                <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                  <span>{generationError ? "Retrying content" : "Preparing layout"}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/70 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 opacity-70">
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10" />
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10" />
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10" />
                </div>
                {generationError && (
                  <div className="mt-4 text-xs text-white/60">
                    {generationError}
                  </div>
                )}
              </div>
            </div>
          )}

          {stage === "preview" && (
            <div>
              <p className="text-neutral-400 mb-2 text-sm">Preview</p>
              <h1 className="text-3xl font-semibold mb-8 tracking-tight">
                Your Buildfolio is ready
              </h1>

              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-white/50 text-sm">Name</p>
                    <p className="text-xl font-semibold">
                      {generation?.name ?? displayValue("name", "Your Name")}
                    </p>
                    <p className="text-white/70 mt-2">
                      {generation?.headline ??
                        displayValue("headline", "Your one-line headline")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-sm">Location</p>
                    <p className="text-white/80">
                      {displayValue("location", "City, Country")}
                    </p>
                  </div>
                </div>

                <p className="text-white/70 mt-6">
                  {generation?.bio ??
                    "A concise bio that highlights your strengths, focus areas, and what you’re looking to build next."}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {(generation?.sections?.length
                    ? generation.sections
                    : [
                        {
                          title: "Role",
                          items: [displayValue("role", "Your role")],
                        },
                        {
                          title: "Goal",
                          items: [displayValue("goal", "Your goal")],
                        },
                        {
                          title: "Top project",
                          items: [displayValue("project", "Project name")],
                        },
                        {
                          title: "Tools",
                          items: [displayValue("stack", "Your tools")],
                        },
                      ]
                  ).map((section) => (
                    <div
                      key={section.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-white/50 text-xs mb-2">
                        {section.title}
                      </p>
                      <div className="text-white/90 space-y-1">
                        {section.items.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-white/70">
                  {generation?.callToAction ?? "Get in touch to collaborate."}
                </div>

                {shareId && (
                  <div className="mt-6">
                    <p className="text-white/50 text-xs mb-2">Share link</p>
                    <a
                      href={`/preview/${shareId}`}
                      className="text-white/80 hover:text-white transition text-sm underline underline-offset-4"
                    >
                      /preview/{shareId}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
