import { gsap, ScrollTrigger, useGSAP } from "../../../../../utils/gsap.js";
import {
	GALLERY_CTA_MOTION,
	GALLERY_SPLIT_MOTION,
	GALLERY_STACK_MOTION,
} from "../config/galleryMotionConfig.js";

function getLayoutCenterOffset(element) {
	const layoutParent = element.parentElement;
	if (!layoutParent) return { x: 0, y: 0 };

	return {
		x:
			layoutParent.clientWidth / 2 -
			(element.offsetLeft + element.offsetWidth / 2),
		y:
			layoutParent.clientHeight / 2 -
			(element.offsetTop + element.offsetHeight / 2),
	};
}

function getSplitRotation(card, splitLayout) {
    return splitLayout[Number(card.dataset.galleryIndex)]?.rotation ?? 0;
}

function placeCard(card, x, y, rotation, opacity) {
	card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
	card.style.opacity = String(opacity);
	card.style.visibility = opacity > 0 ? "visible" : "hidden";
}

function createCardStackAnimation(cards, splitLayout, onComplete, onSplit) {
	let animations = [];
	let splitTimer = 0;
	let stackOffsets = [];

	const cancelAnimations = () => {
		window.clearTimeout(splitTimer);
		splitTimer = 0;
		animations.forEach((animation) => {
			animation.onfinish = null;
			animation.cancel();
		});
		animations = [];
	};

	const setFinalState = () => {
		cards.forEach((card) => {
			placeCard(card, 0, 0, getSplitRotation(card, splitLayout), 1);
			card.style.zIndex = "0";
		});
	};

	const playSplit = () => {
        onSplit?.();
		animations.forEach((animation) => {
			animation.onfinish = null;
			animation.cancel();
		});

		animations = cards.map((card, index) => {
			const stack = stackOffsets[index];
			const side = index % 2 === 0 ? -1 : 1;
			const rotation = getSplitRotation(card, splitLayout);
			const midpoint = {
				x:
					stack.x * GALLERY_SPLIT_MOTION.midpointPull +
					side * GALLERY_SPLIT_MOTION.midpointX,
				y:
					stack.y * GALLERY_SPLIT_MOTION.midpointPull +
					GALLERY_SPLIT_MOTION.midpointY,
			};

			placeCard(card, stack.x, stack.y, 0, 1);
			const animation = card.animate(
				[
					{
						opacity: 1,
						transform: `translate3d(${stack.x}px, ${stack.y}px, 0) rotate(0deg)`,
					},
					{
						offset: 0.5,
						opacity: 1,
						transform: `translate3d(${midpoint.x}px, ${midpoint.y}px, 0) rotate(${rotation * 0.5}deg)`,
					},
					{
						opacity: 1,
						transform: `translate3d(0, 0, 0) rotate(${rotation}deg)`,
					},
				],
				{
					delay: index * GALLERY_SPLIT_MOTION.stagger,
					duration: GALLERY_SPLIT_MOTION.duration,
					easing: GALLERY_SPLIT_MOTION.easing,
					fill: "both",
				},
			);

			if (index === cards.length - 1) {
				animation.onfinish = () => {
					cancelAnimations();
					setFinalState();
					onComplete?.();
				};
			}

			return animation;
		});
	};

	return {
		cancel() {
			cancelAnimations();
			cards.forEach((card) => {
				card.style.transform = "";
				card.style.opacity = "";
				card.style.visibility = "";
				card.style.zIndex = "";
			});
		},
		finish() {
			cancelAnimations();
			setFinalState();
		},
		play() {
			cancelAnimations();
			stackOffsets = cards.map(getLayoutCenterOffset);

			animations = cards.map((card, index) => {
				const stack = stackOffsets[index];
				const side = index % 2 === 0 ? -1 : 1;
				card.style.visibility = "visible";
				card.style.zIndex = String(index + 1);

				const animation = card.animate(
					[
						{
							offset: 0,
							opacity: 0,
							transform: `translate3d(${stack.x + side * GALLERY_STACK_MOTION.startX}px, ${stack.y - GALLERY_STACK_MOTION.startY}px, 0) rotate(${side * GALLERY_STACK_MOTION.tilt}deg)`,
						},
						{
							offset: 0.62,
							opacity: 1,
							transform: `translate3d(${stack.x + side * GALLERY_STACK_MOTION.startX * 0.25}px, ${stack.y - GALLERY_STACK_MOTION.startY * 0.27}px, 0) rotate(${side * GALLERY_STACK_MOTION.tilt * 0.27}deg)`,
						},
						{
							opacity: 1,
							transform: `translate3d(${stack.x}px, ${stack.y}px, 0) rotate(0deg)`,
						},
					],
					{
						delay:
							GALLERY_STACK_MOTION.hold +
							index * GALLERY_STACK_MOTION.stagger,
						duration: GALLERY_STACK_MOTION.duration,
						easing: GALLERY_STACK_MOTION.easing,
						fill: "both",
					},
				);

				if (index === cards.length - 1) {
					animation.onfinish = () => {
						splitTimer = window.setTimeout(
							playSplit,
							GALLERY_SPLIT_MOTION.hold,
						);
					};
				}

				return animation;
			});
		},
	};
}

function useGalleryScrollAnimation({ rootRef, finishRef, geometry, animated, items, lockScroll, unlockScroll }) {
    useGSAP(() => {
        const root = rootRef.current;
        if (!root || !geometry || !animated || items.length < 4) return undefined;
        const track = root.querySelector(".gallery-intro-track");
        const panel = root.querySelector(".gallery-panel");
        const collage = root.querySelector("[data-gallery-stack]");
        const title = root.querySelector("[data-gallery-title]");
        const action = root.querySelector("[data-gallery-action]");
        const skip = root.querySelector("[data-gallery-skip]");
        const cards = gsap.utils.toArray("[data-gallery-card]", collage);
        const stacks = root.querySelectorAll("[data-gallery-stack]");
        const setInteractive = (interactive) => stacks.forEach((stack) => { stack.inert = !interactive; });
        let complete = false;
        let started = false;
        let locked = false;
        const unlock = () => {
            if (!locked) return;
            locked = false;
            root.dataset.galleryLocked = "false";
            unlockScroll();
            panel.style.width = "";
        };
        const reveal = gsap.timeline({ paused: true })
            .fromTo(title, { opacity: 0, y: 14, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: GALLERY_CTA_MOTION.duration, ease: GALLERY_CTA_MOTION.ease })
            .fromTo(action, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: GALLERY_CTA_MOTION.actionDuration, ease: GALLERY_CTA_MOTION.ease }, GALLERY_CTA_MOTION.actionDelay);
        const finish = () => {
            // Once split, the spotlight owns card transforms until it closes.
            if (complete) return;
            complete = true;
            setInteractive(true);
            root.dataset.galleryPhase = "split";
            animation.finish();
            reveal.progress(1).pause();
            gsap.set([title, action], { opacity: 1, y: 0, scale: 1 });
            if (skip) skip.hidden = true;
            unlock();
        };
        const animation = createCardStackAnimation(cards, geometry.placements, finish, () => {
            root.dataset.galleryPhase = "splitting";
            reveal.play(0);
        });
        finishRef.current = finish;
        const play = () => {
            if (started || complete) return;
            started = true;
            setInteractive(false);
            // Keep the measured panel width stable while scrolling is locked.
            panel.style.width = `${geometry.width}px`;
            locked = true;
            root.dataset.galleryPhase = "stack";
            root.dataset.galleryLocked = "true";
            lockScroll();
            animation.play();
        };
        const replay = () => {
            if (root.dataset.gallerySpotlight !== "closed") return;
            animation.finish();
            complete = false;
            started = false;
            reveal.pause(0);
            gsap.set([title, action], { opacity: 0 });
            if (skip) skip.hidden = false;
            play();
        };
        root.addEventListener("gallery-preview-intro", replay);
        window.addEventListener("resize", finish);
        const bounds = track.getBoundingClientRect();
        if ((bounds.top < window.innerHeight && bounds.bottom > 0) || bounds.bottom <= 0) finish();
        else {
            root.dataset.galleryPhase = "waiting";
            setInteractive(false);
            gsap.set(cards, { autoAlpha: 0 });
            // The link stays keyboard accessible; focusing it completes the reveal.
            gsap.set([title, action], { opacity: 0 });
        }
        const trigger = ScrollTrigger.create({
            id: "gallery-stack-split", trigger: track, start: "top top", end: "bottom bottom",
            invalidateOnRefresh: true,
            onEnter: play,
            onLeave: finish,
            onUpdate: (self) => { if (!complete && self.progress > 0.12) finish(); },
            onRefresh: (self) => { if (!started && !complete && self.progress > 0) finish(); },
        });
        return () => {
            root.removeEventListener("gallery-preview-intro", replay);
            window.removeEventListener("resize", finish);
            unlock();
            setInteractive(true);
            delete root.dataset.galleryPhase;
            delete root.dataset.galleryLocked;
            animation.cancel();
            for (const element of [title, action]) {
                element.style.opacity = "";
                element.style.transform = "";
            }
            reveal.kill();
            trigger.kill();
            finishRef.current = null;
            if (skip) skip.hidden = false;
        };
    }, { scope: rootRef, dependencies: [animated, geometry, items, lockScroll, unlockScroll], revertOnUpdate: true });
}

export default useGalleryScrollAnimation;
