import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../../../../../utils/gsap.js";
import { getAdjacentStoryIndex, getSpotlightBackdrop } from "../utils/gallerySpotlight.js";

const duration = (reduced, value) => reduced ? 0 : value;
const scrollTo = (top) => window.scrollTo({ top, left: 0, behavior: "instant" });

function getThumbnailTransform(card, target) {
    const radians = card.rotation * Math.PI / 180;
    return {
        x: card.rect.left + card.rect.width / 2 - card.width * Math.cos(radians) / 2 + card.height * Math.sin(radians) / 2 - target.left,
        y: card.rect.top + card.rect.height / 2 - card.width * Math.sin(radians) / 2 - card.height * Math.cos(radians) / 2 - target.top,
        scaleX: card.width / target.width, scaleY: card.height / target.height, rotation: card.rotation,
    };
}

export default function useGallerySpotlight({ rootRef, panelRef, ctaRef, items, animated, reducedMotion, lockScroll, unlockScroll }) {
    const spotlightRef = useRef(null);
    const sessionRef = useRef(null);
    const [selection, setSelection] = useState(null);
    const repositionScroll = useCallback((top) => {
        // Reset any in-flight Lenis target around a synchronous native scroll.
        lockScroll();
        scrollTo(top);
        unlockScroll();
    }, [lockScroll, unlockScroll]);

    const restore = useCallback((restorePosition = true) => {
        const session = sessionRef.current;
        if (!session) return;
        session.timeline?.kill();
        if (restorePosition) {
            // Unmount the spotlight first; the layout effect restores geometry,
            // scroll and thumbnails together before the browser can paint.
            session.phase = "restoring";
            setSelection(null);
            return;
        }
        sessionRef.current = null;
        for (const card of session.cards) {
            gsap.set(card.node, { clearProps: "transform,opacity,visibility" });
            card.node.style.cssText = card.style;
        }
        ctaRef.current.style.cssText = session.ctaStyle;
        rootRef.current.dataset.gallerySpotlight = "closed";
        rootRef.current.querySelectorAll("[data-gallery-stack]").forEach((stack) => { stack.inert = false; });
        ctaRef.current.inert = false;
    }, [rootRef, ctaRef]);

    const open = useCallback((item, trigger) => {
        const root = rootRef.current;
        const panel = panelRef.current;
        if (sessionRef.current || (animated && root.dataset.galleryPhase !== "split")) return;
        const index = items.findIndex((story) => story.id === item.id);
        if (index < 0) return;
        gsap.killTweensOf(ctaRef.current);
        gsap.set(ctaRef.current, { clearProps: "transform,opacity,visibility" });
        const panelBox = panel.getBoundingClientRect();
        const ctaBox = ctaRef.current.getBoundingClientRect();
        // Read everything before changing layout; no per-frame layout measurements.
        const cards = [...root.querySelectorAll("[data-gallery-card]")].map((node) => {
            const matrix = new DOMMatrix(getComputedStyle(node).transform);
            return { node, id: node.dataset.galleryCard, rect: node.getBoundingClientRect(),
                width: node.offsetWidth, height: node.offsetHeight, style: node.style.cssText,
                rotation: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, inPanel: panel.contains(node) };
        });
        sessionRef.current = {
            cards, trigger, scrollY: window.scrollY, width: window.innerWidth,
            ctaStyle: ctaRef.current.style.cssText, index, phase: "opening",
        };
        for (const card of cards.filter((entry) => entry.inPanel)) {
            Object.assign(card.node.style, {
                left: `${card.rect.left - panelBox.left + (card.rect.width - card.width) / 2}px`,
                top: `${card.rect.top - panelBox.top + (card.rect.height - card.height) / 2}px`,
                width: `${card.width}px`, height: `${card.height}px`, margin: "0",
            });
            gsap.set(card.node, { x: 0, y: 0, rotation: card.rotation });
        }
        Object.assign(ctaRef.current.style, {
            position: "absolute", left: `${ctaBox.left - panelBox.left}px`, top: `${ctaBox.top - panelBox.top}px`,
            width: `${ctaBox.width}px`, height: `${ctaBox.height}px`, margin: "0",
        });
        root.dataset.gallerySpotlight = "opening";
        root.querySelectorAll("[data-gallery-stack]").forEach((stack) => { stack.inert = true; });
        ctaRef.current.inert = true;
        setSelection({ index, phase: "opening" });
    }, [rootRef, panelRef, ctaRef, items, animated]);

    const close = useCallback(() => {
        const session = sessionRef.current;
        if (!session || session.phase === "closing") return;
        session.timeline?.kill();
        session.phase = "closing";
        setSelection({ index: session.index, phase: "closing" });
    }, []);

    const navigate = useCallback((direction) => {
        const session = sessionRef.current;
        if (!session || session.phase !== "open" || items.length < 2) return;
        session.phase = "switching";
        const next = getAdjacentStoryIndex(session.index, direction, items.length);
        // Keep the nav DOM/focus stable while replacing only the story's content.
        setSelection({ index: session.index, phase: "switching-out" });
        session.timeline?.kill();
        session.timeline = gsap.timeline({ onComplete: () => {
            session.index = next;
            session.direction = direction;
            setSelection({ index: next, phase: "switching" });
        } }).to(spotlightRef.current.querySelectorAll("[data-spotlight-reveal], [data-spotlight-photo]"), {
            opacity: 0, duration: duration(reducedMotion, 0.16), ease: "power1.in",
        });
    }, [items.length, reducedMotion]);

    useLayoutEffect(() => {
        if (!selection) {
            const session = sessionRef.current;
            if (session?.phase !== "restoring") return;
            restore(false);
            const cta = ctaRef.current;
            if (session.revealCta) gsap.set(cta, { autoAlpha: 0, y: reducedMotion ? 0 : 8 });
            ScrollTrigger.refresh();
            repositionScroll(session.scrollY);
            if (session.trigger.isConnected) session.trigger.focus({ preventScroll: true });
            if (session.revealCta) {
                gsap.to(cta, { autoAlpha: 1, y: 0, duration: duration(reducedMotion, 0.32),
                    ease: "power2.out", clearProps: "transform,opacity,visibility" });
            }
            return;
        }
        if (selection.phase === "open" || selection.phase === "switching-out") return;
        const session = sessionRef.current;
        const root = rootRef.current;
        const panel = panelRef.current;
        const spotlight = spotlightRef.current;
        const photo = spotlight.querySelector("[data-spotlight-photo]");
        const editorial = spotlight.querySelector("[data-spotlight-editorial]");
        const text = spotlight.querySelectorAll("[data-spotlight-reveal]");
        const selected = session.cards.find((card) => card.id === items[selection.index].id);
        root.dataset.gallerySpotlight = selection.phase;
        const ready = () => {
            session.phase = "open";
            root.dataset.gallerySpotlight = "open";
            setSelection({ index: session.index, phase: "open" });
        };

        if (selection.phase === "opening") {
            // Spotlight takes over the existing section, with normal document scrolling.
            repositionScroll(window.scrollY + panel.getBoundingClientRect().top);
            const target = photo.getBoundingClientRect();
            gsap.set(photo, getThumbnailTransform(selected, target));
            gsap.set(editorial, { autoAlpha: 0 });
            gsap.set(text, { opacity: 0, y: reducedMotion ? 0 : 12 });
            gsap.set(selected.node, { opacity: 0 });
            spotlight.focus({ preventScroll: true });
            const tl = gsap.timeline({ onComplete: ready });
            session.timeline = tl;
            tl.to(ctaRef.current, { autoAlpha: 0, duration: duration(reducedMotion, 0.18) }, 0);
            session.cards.forEach((card, i) => {
                if (card === selected) return;
                if (card.inPanel) {
                    const targetPosition = getSpotlightBackdrop(i, session.cards.length, panel.clientWidth, panel.clientHeight, card.width, card.height);
                    tl.to(card.node, {
                        x: targetPosition.x - parseFloat(card.node.style.left),
                        y: targetPosition.y - parseFloat(card.node.style.top),
                        rotation: targetPosition.rotation, opacity: 0.2,
                        duration: duration(reducedMotion, 0.6), ease: "power3.inOut",
                    }, duration(reducedMotion, 0.06));
                } else {
                    tl.to(card.node, { opacity: 0.2, duration: duration(reducedMotion, 0.3) }, 0);
                }
            });
            tl.to(photo, {
                x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: duration(reducedMotion, 0.7), ease: "power3.inOut",
            }, duration(reducedMotion, 0.1))
                .addLabel("photoPlaced")
                .to(editorial, { autoAlpha: 1, duration: duration(reducedMotion, 0.24), ease: "power2.out" }, "photoPlaced")
                .to(text, { opacity: 1, y: 0, duration: duration(reducedMotion, 0.4), stagger: duration(reducedMotion, 0.045), ease: "power2.out" }, reducedMotion ? "photoPlaced" : "photoPlaced+=0.06");
        } else if (selection.phase === "switching") {
            session.cards.forEach((card) => gsap.set(card.node, { opacity: card === selected ? 0 : 0.2 }));
            gsap.set(photo, { x: reducedMotion ? 0 : session.direction * 18, y: 0, scaleX: 1, scaleY: 1, opacity: 0 });
            gsap.set(text, { opacity: 0, y: reducedMotion ? 0 : 8 });
            session.timeline = gsap.timeline({ onComplete: ready })
                .to(photo, { opacity: 1, x: 0, duration: duration(reducedMotion, 0.35), ease: "power2.out" }, 0)
                .to(text, { opacity: 1, y: 0, duration: duration(reducedMotion, 0.3), stagger: duration(reducedMotion, 0.035) }, duration(reducedMotion, 0.08));
        } else if (selection.phase === "closing") {
            const rect = photo.getBoundingClientRect();
            const matrix = new DOMMatrix(getComputedStyle(photo).transform);
            const w = photo.offsetWidth;
            const h = photo.offsetHeight;
            const baseLeft = rect.left - matrix.e - Math.min(0, w * matrix.a, h * matrix.c, w * matrix.a + h * matrix.c);
            const baseTop = rect.top - matrix.f - Math.min(0, w * matrix.b, h * matrix.d, w * matrix.b + h * matrix.d);
            const panelBox = panel.getBoundingClientRect();
            const tl = gsap.timeline({ onComplete: () => {
                session.revealCta = true;
                restore();
            } });
            session.timeline = tl;
            // Fade the copy's background and all controls as well as its text.
            // Only the shared photo remains for the handoff to its thumbnail.
            tl.to(spotlight.querySelectorAll("[data-spotlight-editorial], [data-spotlight-chrome]"), {
                autoAlpha: 0, y: reducedMotion ? 0 : -8,
                duration: duration(reducedMotion, 0.2), ease: "power2.in",
            }, 0)
                .to(photo, {
                    ...getThumbnailTransform(selected, { left: baseLeft, top: baseTop, width: w, height: h }),
                    opacity: 1, boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
                    duration: duration(reducedMotion, 0.65), ease: "power3.inOut",
                }, duration(reducedMotion, 0.16));
            session.cards.forEach((card) => {
                if (card === selected) return;
                tl.to(card.node, {
                    ...(card.inPanel ? {
                        x: card.rect.left + (card.rect.width - card.width) / 2 - panelBox.left - parseFloat(card.node.style.left),
                        y: card.rect.top + (card.rect.height - card.height) / 2 - panelBox.top - parseFloat(card.node.style.top), rotation: card.rotation,
                    } : {}),
                    opacity: 1, duration: duration(reducedMotion, 0.65), ease: "power3.inOut",
                }, duration(reducedMotion, 0.16));
            });
        }
    }, [selection, rootRef, panelRef, ctaRef, items, reducedMotion, restore, repositionScroll]);

    useLayoutEffect(() => {
        const cta = ctaRef.current;
        const onKeyDown = (event) => {
            if (sessionRef.current && event.key === "Escape") { event.preventDefault(); close(); }
        };
        const onResize = () => {
            if (sessionRef.current && window.innerWidth !== sessionRef.current.width) restore();
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onResize);
            restore(false);
            gsap.killTweensOf(cta);
        };
    }, [close, restore, ctaRef]);

    return { selection, spotlightRef, open, close, navigate };
}
