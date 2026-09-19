"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomeMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.1 });

    lenis.on("scroll", ScrollTrigger.update);
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".site-header", { y: -24, opacity: 0, duration: 0.7 })
        .from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.5 }, "-=0.25")
        .from(".hero-line", { yPercent: 105, rotate: 2, opacity: 0, duration: 0.85, stagger: 0.12 }, "-=0.25")
        .from(".hero-lede, .hero-actions", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.45")
        .from(".hero-corner", { x: -18, opacity: 0, duration: 0.55 }, "-=0.35");

      gsap.to(".hero-backdrop", {
        yPercent: 6,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.7 },
      });

      ScrollTrigger.batch(".reveal-up", {
        start: "top 88%",
        once: true,
        onEnter: (elements) => gsap.from(elements, { y: 38, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", overwrite: true }),
      });

      gsap.from(".reveal-clip img", {
        scale: 1.13,
        duration: 1.25,
        ease: "power3.out",
        scrollTrigger: { trigger: ".reveal-clip", start: "top 82%", once: true },
      });

      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return null;
}
