import { gsap, ScrollTrigger, useGSAP } from "../../../../../utils/gsap.js";

function useGalleryScrubAnimation({ rootRef, finishRef, geometry, animated, items, reducedMotion }) {
    useGSAP(() => {
        const root = rootRef.current;
        if (!root || reducedMotion || window.matchMedia("(max-width: 767px)").matches) return undefined;
        if (!animated || items.length < 4) {
            const heading = root.querySelectorAll("[data-gallery-title], [data-gallery-action]");
            const fitsViewport = root.offsetHeight <= window.innerHeight + 1;
            if (fitsViewport) {
                const reveal = gsap.timeline({
                    scrollTrigger: {
                        id: "gallery-flow-pin",
                        trigger: root,
                        start: "top top",
                        end: "+=100%",
                        pin: true,
                        pinSpacing: true,
                        anticipatePin: 1,
                        scrub: 0.4,
                    },
                });
                reveal.fromTo(heading, { autoAlpha: 0, y: 40 }, {
                    autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.16,
                    ease: "power2.out", immediateRender: true,
                }, 0);
                reveal.to(heading, { autoAlpha: 1, duration: 0.7 }, 0.9);
            } else {
                ScrollTrigger.create({
                    id: "gallery-flow-pin",
                    trigger: root,
                    start: "bottom bottom",
                    end: "+=75%",
                    pin: true,
                    pinSpacing: true,
                    anticipatePin: 1,
                });
                gsap.fromTo(heading, { autoAlpha: 0, y: 12 }, {
                    autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: root,
                        start: "clamp(top 85%)",
                        once: true,
                    },
                });
            }
            root.querySelectorAll("[data-gallery-card]").forEach((card) => {
                gsap.fromTo(card, { opacity: 0 }, {
                    opacity: 1,
                    duration: 0.45,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "clamp(top 90%)",
                        once: true,
                    },
                });
            });
            ScrollTrigger.refresh(true);
            return undefined;
        }
        if (!geometry) return undefined;
        const track = root.querySelector(".gallery-intro-track");
        const stack = root.querySelector(".gallery-panel > [data-gallery-stack]");
        const cards = gsap.utils.toArray("[data-gallery-card]", stack);
        const title = root.querySelector("[data-gallery-title]");
        const action = root.querySelector("[data-gallery-action]");
        const skip = root.querySelector("[data-gallery-skip]");
        if (!track || !cards.length || !title || !action) return undefined;

        const offsets = cards.map((card) => ({
            x: stack.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2),
            y: stack.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2),
        }));
        const setPhase = (progress) => {
            const split = progress >= 0.51;
            root.dataset.galleryPhase = split ? "split" : progress > 0.28 ? "splitting" : "stack";
            if (root.dataset.gallerySpotlight === "closed") stack.inert = !split;
            if (skip) skip.hidden = split;
        };
        const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                id: "gallery-stack-split",
                trigger: track,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => setPhase(self.progress),
                onRefresh: (self) => setPhase(self.progress),
            },
        });
        timeline.fromTo(cards, {
            x: (index) => offsets[index].x,
            y: (index) => offsets[index].y - 100,
            rotation: (index) => index % 2 ? 6 : -6,
            autoAlpha: 0,
        }, {
            x: (index) => offsets[index].x,
            y: (index) => offsets[index].y,
            rotation: 0,
            autoAlpha: 1,
            duration: 0.38,
            stagger: 0.065,
            immediateRender: true,
        }, 0);
        timeline.to(cards, {
            x: 0,
            y: 0,
            rotation: (index) => geometry.placements[index]?.rotation ?? 0,
            duration: 0.48,
            stagger: 0.035,
        }, 0.52);
        timeline.fromTo(title, { autoAlpha: 0, y: 14, scale: 0.96 }, {
            autoAlpha: 1, y: 0, scale: 1, duration: 0.23, immediateRender: true,
        }, 0.8);
        timeline.fromTo(action, { autoAlpha: 0, y: 12 }, {
            autoAlpha: 1, y: 0, duration: 0.2, immediateRender: true,
        }, 0.94);
        // Leave the composition interactive for the second half of the pinned viewport.
        timeline.to(action, { autoAlpha: 1, duration: 1.25 }, 1.25);

        finishRef.current = () => {
            const trigger = timeline.scrollTrigger;
            const interactiveY = trigger.start + (trigger.end - trigger.start) * 0.55;
            window.scrollTo({ top: Math.max(window.scrollY, interactiveY), behavior: "smooth" });
        };
        setPhase(timeline.scrollTrigger.progress);
        ScrollTrigger.refresh(true);
        return () => {
            finishRef.current = null;
            stack.inert = false;
            delete root.dataset.galleryPhase;
            if (skip) skip.hidden = false;
        };
    }, { scope: rootRef, dependencies: [animated, geometry, items, reducedMotion], revertOnUpdate: true });
}

export default useGalleryScrubAnimation;
