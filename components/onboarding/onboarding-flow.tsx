"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWelcome } from "./onboarding-welcome";
import { OnboardingGoals } from "./onboarding-goals";
import { OnboardingConnect } from "./onboarding-connect";

type Step = "welcome" | "goals" | "connect";

async function completeOnboarding() {
  await fetch("/api/user/onboarding", { method: "POST" });
}

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const router = useRouter();

  const handleSkip = async () => {
    await completeOnboarding();
    router.push("/workspace");
  };

  const handleConnected = async () => {
    await completeOnboarding();
    router.push("/workspace");
  };

  if (step === "connect") {
    return (
      <OnboardingConnect
        onBack={() => setStep("goals")}
        onSkip={handleSkip}
        onConnected={handleConnected}
      />
    );
  }

  if (step === "goals") {
    return (
      <OnboardingGoals
        onContinue={() => setStep("connect")}
        onBack={() => setStep("welcome")}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <OnboardingWelcome
      onContinue={() => setStep("goals")}
      onSkip={handleSkip}
    />
  );
}
