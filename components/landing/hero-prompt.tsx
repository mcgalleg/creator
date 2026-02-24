"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowUp } from "lucide-react";

const PROMPTS = [
  "What's my best time to post on Tuesdays?",
  "Why did my last video underperform?",
  "Write a hook about summer fashion trends",
  "Compare my engagement this week vs last",
  "Draft a content calendar for next month",
];

const TYPING_SPEED = 45;
const ERASING_SPEED = 25;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_ERASING = 400;

const SUGGESTION_CHIPS = [
  { label: "Reporting Dashboard", prompt: "Show me my top performing videos this month" },
  { label: "Content Ideas", prompt: "Give me 5 content ideas based on my niche" },
  { label: "Posting Strategy", prompt: "What posting strategy would grow my account fastest?" },
  { label: "Trend Analysis", prompt: "What trends should I hop on this week?" },
  { label: "Engagement Review", prompt: "Compare my engagement this week vs last" },
];

export function HeroPrompt() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [displayText, setDisplayText] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [userText, setUserText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<"typing" | "pausing" | "erasing">("typing");

  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAnimating) return;

    function tick() {
      const currentPrompt = PROMPTS[promptIndexRef.current];
      const phase = phaseRef.current;

      if (phase === "typing") {
        if (charIndexRef.current < currentPrompt.length) {
          charIndexRef.current++;
          setDisplayText(currentPrompt.slice(0, charIndexRef.current));
          animationRef.current = setTimeout(tick, TYPING_SPEED);
        } else {
          phaseRef.current = "pausing";
          animationRef.current = setTimeout(tick, PAUSE_AFTER_TYPING);
        }
      } else if (phase === "pausing") {
        phaseRef.current = "erasing";
        animationRef.current = setTimeout(tick, 0);
      } else if (phase === "erasing") {
        if (charIndexRef.current > 0) {
          charIndexRef.current--;
          setDisplayText(currentPrompt.slice(0, charIndexRef.current));
          animationRef.current = setTimeout(tick, ERASING_SPEED);
        } else {
          promptIndexRef.current = (promptIndexRef.current + 1) % PROMPTS.length;
          phaseRef.current = "typing";
          animationRef.current = setTimeout(tick, PAUSE_AFTER_ERASING);
        }
      }
    }

    animationRef.current = setTimeout(tick, PAUSE_AFTER_ERASING);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isAnimating]);

  function handleFocus() {
    stopAnimation();
    setIsFocused(true);
    setDisplayText("");
  }

  function handleBlur() {
    setIsFocused(false);
    if (!userText) {
      setIsAnimating(true);
      promptIndexRef.current = 0;
      charIndexRef.current = 0;
      phaseRef.current = "typing";
    }
  }

  function handleSubmit() {
    if (isSignedIn) {
      const q = userText.trim();
      router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSignedIn) return;
      handleSubmit();
    }
  }

  function handleChipClick(prompt: string) {
    stopAnimation();
    setIsFocused(true);
    setUserText(prompt);
    setDisplayText("");
    textareaRef.current?.focus();
  }

  const showPlaceholderAnimation = isAnimating && !isFocused && !userText;

  const inputCard = (
    <div
      className="relative mx-auto w-full max-w-2xl cursor-text rounded-2xl border bg-background shadow-lg transition-shadow hover:shadow-xl focus-within:shadow-xl"
      onClick={() => textareaRef.current?.focus()}
    >
      <div className="relative min-h-[120px] px-5 pt-4 pb-14">
        {showPlaceholderAnimation && (
          <div className="pointer-events-none absolute inset-0 px-5 pt-4">
            <span className="text-muted-foreground/60">{displayText}</span>
            <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-muted-foreground/40" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isFocused && !userText ? "Ask anything about your TikTok..." : ""}
          rows={2}
          className="w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Submit button — bottom right */}
      <div className="absolute bottom-3 right-3">
        <button
          type="button"
          onClick={isSignedIn ? handleSubmit : undefined}
          className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-10">
      {isSignedIn ? (
        inputCard
      ) : (
        <SignUpButton mode="modal">
          {inputCard}
        </SignUpButton>
      )}

      {/* Suggestion chips */}
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
        Not sure where to start? Try one of these:
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleChipClick(chip.prompt)}
            className="rounded-full border bg-background/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
