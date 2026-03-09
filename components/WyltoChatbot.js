"use client";

import { useEffect } from "react";

export default function WyltoChatbot() {
  useEffect(() => {
    console.log("🟢 WyltoChatbot: Initializing...");

    // Check if script already exists
    if (document.getElementById("wylto-widget-script")) {
      console.log("🟡 WyltoChatbot: Script already exists");
      return;
    }

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

    script.onload = () => {
      console.log("🟢 WyltoChatbot: Script loaded successfully");

      // Check if widget was created after a delay
      setTimeout(() => {
        const widgetElements = document.querySelectorAll('[class*="wylto"], [id*="wylto"], [class*="wa-"], [id*="wa-widget"]');
        console.log("🔍 WyltoChatbot: Found widget elements:", widgetElements.length, widgetElements);

        // Check all iframes
        const iframes = document.querySelectorAll('iframe');
        console.log("🔍 WyltoChatbot: Found iframes:", iframes.length);

        // Check for any fixed position elements that might be the widget
        const fixedElements = document.querySelectorAll('[style*="fixed"]');
        console.log("🔍 WyltoChatbot: Fixed position elements:", fixedElements.length);
      }, 2000);
    };

    script.onerror = (e) => {
      console.error("🔴 WyltoChatbot: Script failed to load", e);
    };

    document.body.appendChild(script);
    console.log("🟢 WyltoChatbot: Script appended to body");

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById("wylto-widget-script");
      if (existingScript) {
        existingScript.remove();
      }
      // Also remove the widget container if it exists
      const widgetContainer = document.querySelector('[class*="wylto"]');
      if (widgetContainer) {
        widgetContainer.remove();
      }
    };
  }, []);

  return null;
}
