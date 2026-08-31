"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Internal/admin surfaces that must NOT show the patient-facing Wylto WhatsApp
// widget. Everywhere else (public marketing, doctor sites) keeps it.
const HIDDEN_PREFIXES = [
  "/admin",
  "/platform-admin",
  "/clinic-manager",
  "/seo",
  "/reputation-manager",
];

function isHidden(path) {
  if (!path) return false;
  return HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

// Remove the injected script + any widget DOM the embed created.
function teardown() {
  document.getElementById("wylto-widget-script")?.remove();
  document
    .querySelectorAll('[class*="wylto"],[id*="wylto"],[class*="wa-widget"],[id*="wa-widget"]')
    .forEach((el) => el.remove());
}

export default function WyltoChatbot() {
  const pathname = usePathname();

  useEffect(() => {
    // On admin/internal pages: never inject, and tear down if we arrived here
    // via client-side navigation from a page that had it.
    if (isHidden(pathname)) {
      teardown();
      return;
    }

    if (document.getElementById("wylto-widget-script")) return;

    const script = document.createElement("script");
    script.id = "wylto-widget-script";
    script.src = "https://app.wylto.com/js/wa_embed.js";
    script.async = true;
    script.setAttribute("data-phone-number", "+917021227203");
    script.setAttribute("data-brand-name", "Dr. Yuvaraj T");
    script.setAttribute("data-brand-image", "https://dryuvaraj.curago.in/logo.png");
    script.setAttribute("data-display-message", "Hi, how can we help you with your digestive health?");
    script.setAttribute("data-start-chat-message", "Hi, I would like to book a consultation with Dr. Yuvaraj.");
    script.setAttribute("data-bottom-margin", "120px");
    document.body.appendChild(script);

    return () => teardown();
  }, [pathname]);

  return null;
}
