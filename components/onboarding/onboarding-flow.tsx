"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWelcome } from "./onboarding-welcome";
import { OnboardingConnect } from "./onboarding-connect";

type Step = "welcome" | "connect";

async function completeOnboarding() {
  await fetch("/api/user/onboarding", { method: "POST" });
}

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const router = useRouter();

  const handleSkip = async () => {
    await completeOnboarding();
    router.push("/dashboard");
  };

  const handleConnected = async () => {
    await completeOnboarding();
    router.push("/dashboard");
  };

  if (step === "connect") {
    return (
      <OnboardingConnect
        onBack={() => setStep("welcome")}
        onSkip={handleSkip}
        onConnected={handleConnected}
      />
    );
  }

  return (
    <OnboardingWelcome
      onContinue={() => setStep("connect")}
      onSkip={handleSkip}
    />
  );
}
