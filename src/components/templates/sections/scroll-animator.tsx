"use client";

import { useEffect } from "react";

export function ScrollAnimator() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-animate]");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.animateDelay || "0ms";
            el.style.animationDelay = delay;
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      [data-animate] {
        opacity: 0;
      }
      [data-animate].is-visible {
        animation-duration: 0.6s;
        animation-fill-mode: both;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      }
      [data-animate="fade-in"].is-visible {
        animation-name: mw-fade-in;
      }
      [data-animate="slide-up"].is-visible {
        animation-name: mw-slide-up;
      }
      [data-animate="slide-down"].is-visible {
        animation-name: mw-slide-down;
      }
      [data-animate="slide-left"].is-visible {
        animation-name: mw-slide-left;
      }
      [data-animate="slide-right"].is-visible {
        animation-name: mw-slide-right;
      }
      [data-animate="zoom-in"].is-visible {
        animation-name: mw-zoom-in;
      }
      [data-animate="blur-in"].is-visible {
        animation-name: mw-blur-in;
      }
      @keyframes mw-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mw-slide-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mw-slide-down {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mw-slide-left {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mw-slide-right {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mw-zoom-in {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes mw-blur-in {
        from { opacity: 0; filter: blur(10px); }
        to { opacity: 1; filter: blur(0); }
      }
    `}</style>
  );
}
