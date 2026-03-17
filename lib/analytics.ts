// GA4 analytics utility
// Wraps gtag calls with typed event helpers

export const GA_MEASUREMENT_ID = "G-SHKE5Y3LN3";

// Extend window for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// ── Page view (handled automatically by GA4, but available for SPA navigation) ──

export function trackPageView(url: string) {
  gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

// ── Custom events ──

type EventParams = Record<string, string | number | boolean>;

function trackEvent(eventName: string, params?: EventParams) {
  gtag("event", eventName, params);
}

// Landing page events
export function trackCtaClicked(buttonText: string, location: string) {
  trackEvent("cta_clicked", { button_text: buttonText, location });
}

export function trackHeroPromptSubmitted(queryLength: number) {
  trackEvent("hero_prompt_submitted", {
    query_length: queryLength,
    has_query: queryLength > 0,
  });
}

export function trackHeroChipClicked(chipLabel: string) {
  trackEvent("hero_chip_clicked", { chip_label: chipLabel });
}

export function trackPricingTabViewed(tab: string) {
  trackEvent("pricing_tab_viewed", { tab });
}

export function trackPricingBillingToggled(billingPeriod: string) {
  trackEvent("pricing_billing_toggled", { billing_period: billingPeriod });
}

// App events (for future use)
export function trackSignupCompleted(method: string) {
  trackEvent("signup_completed", { method });
}

export function trackSubscriptionPurchased(plan: string, value: number) {
  trackEvent("subscription_purchased", { plan, value });
}

export function trackChatQuerySent() {
  trackEvent("chat_query_sent");
}
