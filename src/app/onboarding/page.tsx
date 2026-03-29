"use client";

import { useRouter } from "next/navigation";
import { OnboardingClient } from "@/components/landing/OnboardingClient";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <OnboardingClient
      onComplete={() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("loop_onboarding_seen", "1");
        }
        router.push("/vi");
      }}
    />
  );
}
