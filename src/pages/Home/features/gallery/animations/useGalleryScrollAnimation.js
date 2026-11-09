import { gsap, ScrollTrigger, useGSAP } from "../../../../../utils/gsap.js";
import {
	GALLERY_SPLIT_LAYOUTS,
	GALLERY_SPLIT_MOTION,
	GALLERY_STACK_MOTION,
	MOBILE_GALLERY_MOTION,
} from "../config/galleryMotionConfig.js";

const GALLERY_ANIMATION_LOCK = "gallery-animation-lock";
const GALLERY_ANIMATION_UNLOCK = "gallery-animation-unlock";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
	return splitLayout[card.dataset.galleryCard]?.rotation ?? 0;
}

function placeCard(card, x, y, rotation, opacity) {
	card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
	card.style.opacity = String(opacity);
	card.style.visibility = opacity > 0 ? "visible" : "hidden";
}

function createCardStackAnimation(cards, splitLayout, onComplete) {
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

function useGalleryScrollAnimation(rootRef, fisheyeRef) {
	useGSAP(
		() => {
			const root = rootRef.current;
			const panel = root?.querySelector(".gallery-panel");
			const collage = root?.querySelector("[data-gallery-stack]");
			const title = root?.querySelector("[data-gallery-title]");
			const cards = gsap.utils.toArray("[data-gallery-card]", root);

			if (!root || !panel || !collage || !title || cards.length === 0) {
				return undefined;
			}

			const media = gsap.matchMedia();
			media.add(
				{
					isDesktop: "(min-width: 768px)",
					isMobile: "(max-width: 767px)",
					reduceMotion: "(prefers-reduced-motion: reduce)",
				},
				(context) => {
					const { isDesktop, isMobile, reduceMotion } = context.conditions;
					const fisheye = fisheyeRef.current;
					const splitLayout = GALLERY_SPLIT_LAYOUTS[isDesktop ? "desktop" : "mobile"];

					if (isMobile) {
						gsap.set(panel, { autoAlpha: 1 });
						gsap.set(collage, { autoAlpha: 1 });
						gsap.set(cards, {
							autoAlpha: 1,
							rotation: (_, card) => getSplitRotation(card, splitLayout),
							scale: 1,
							x: 0,
							y: 0,
							zIndex: (_, card) => cards.indexOf(card) + 1,
						});
						gsap.set(title, { autoAlpha: 1, scale: 1, y: 0 });
						fisheye?.setActive(false);
						fisheye?.setOpacity(0);
						fisheye?.reset();

						if (reduceMotion) {
							gsap.set(title, { autoAlpha: 1, scale: 1, y: 0 });
							gsap.set(cards, {
								autoAlpha: 1,
								scale: 1,
								x: 0,
								y: 0,
							});

							const reducedTrigger = ScrollTrigger.create({
								end: "bottom bottom",
								id: "gallery-mobile-static-scroll",
								onUpdate: (self) => {
									const galleryProgress = clamp(
										self.progress /
											MOBILE_GALLERY_MOTION.galleryScrollEnd,
										0,
										1,
									);
									gsap.set(collage, { y: -window.innerHeight * galleryProgress });
									gsap.set(title, {
										autoAlpha: 1,
										y: 0,
									});
								},
								start: "top top",
								trigger: root,
							});

							return () => reducedTrigger.kill();
						}

						gsap.set(collage, { autoAlpha: 0, y: 0 });

						let isPreEntryActive = false;
						let mobileGalleryTrigger;

						const isGalleryActive = () =>
							Boolean(
								mobileGalleryTrigger?.isActive ||
									(mobileGalleryTrigger?.progress > 0 &&
										mobileGalleryTrigger?.progress < 1),
							);

						const syncFisheyeVisibility = (galleryActive = isGalleryActive()) => {
							const isVisible = isPreEntryActive || galleryActive;
							fisheye?.setActive(isVisible);
							fisheye?.setOpacity(isVisible ? 1 : 0);
						};

						const syncPreEntry = (self) => {
							isPreEntryActive = self.isActive;
							syncFisheyeVisibility();
						};

						const syncMobileGallery = (self) => {
							const progress = clamp(self.progress, 0, 1);
							const isActive = self.isActive || (progress > 0 && progress < 1);

							gsap.set(title, {
								autoAlpha: 1,
								y: 0,
							});
							fisheye?.setProgress(progress, self.getVelocity());
							syncFisheyeVisibility(isActive);
						};

						const mobilePreEntryTrigger = ScrollTrigger.create({
							end: "bottom top",
							id: "gallery-mobile-pre-entry",
							invalidateOnRefresh: true,
							onRefresh: syncPreEntry,
							onToggle: syncPreEntry,
							start: "top bottom",
							trigger: root,
						});

						mobileGalleryTrigger = ScrollTrigger.create({
							end: "bottom bottom",
							id: "gallery-mobile-fisheye",
							invalidateOnRefresh: true,
							onRefresh: syncMobileGallery,
							onUpdate: syncMobileGallery,
							start: "top top",
							trigger: root,
						});

						syncMobileGallery(mobileGalleryTrigger);

						return () => {
							mobilePreEntryTrigger.kill();
							mobileGalleryTrigger.kill();
							fisheye?.setActive(false);
							fisheye?.setOpacity(0);
							fisheye?.reset();
						};
					}

					let stackComplete = reduceMotion;
					let stackStarted = false;
					let scrollLocked = false;
					let galleryTrigger;

					const setCollageFinal = () => {
						gsap.set(panel, { autoAlpha: 1 });
						gsap.set([collage, title], { autoAlpha: 1 });
						gsap.set(cards, {
							autoAlpha: 1,
							rotation: (_, card) => getSplitRotation(card, splitLayout),
							x: 0,
							y: 0,
							zIndex: 0,
						});
					};

					const unlockScroll = () => {
						if (!scrollLocked) return;
						scrollLocked = false;
						window.dispatchEvent(new CustomEvent(GALLERY_ANIMATION_UNLOCK));
					};

					const finishStack = () => {
						stackComplete = true;
						setCollageFinal();
						unlockScroll();
						if (galleryTrigger) syncGallery(galleryTrigger);
					};

					const cardAnimation = createCardStackAnimation(
						cards,
						splitLayout,
						finishStack,
					);
					const titleTimeline = gsap.timeline({ paused: true });
					titleTimeline.fromTo(
						title,
						{ autoAlpha: 0, scale: 0.82, y: 14 },
						{
							autoAlpha: 1,
							duration: 0.42,
							ease: "power2.out",
							scale: 1,
							y: 0,
						},
					);

					const playStackOnce = () => {
						if (stackComplete || stackStarted) return;
						stackStarted = true;
						scrollLocked = true;
						fisheye?.setActive(false);
						fisheye?.setOpacity(0);
						window.dispatchEvent(new CustomEvent(GALLERY_ANIMATION_LOCK));
						titleTimeline.play(0);
						cardAnimation.play();
					};

					function syncGallery(self) {
						const progress = clamp(self.progress, 0, 1);

						if (!stackComplete) {
							fisheye?.setActive(false);
							fisheye?.setOpacity(0);
							if (!stackStarted) {
								gsap.set(collage, { autoAlpha: 1 });
								gsap.set(title, { autoAlpha: 0 });
							}
							return;
						}

						if (progress <= 0.001) {
							fisheye?.setActive(false);
							fisheye?.setOpacity(0);
							gsap.set([collage, title], { autoAlpha: 1 });
							return;
						}

						fisheye?.setProgress(progress, self.getVelocity());
						fisheye?.setActive(true);
						fisheye?.setOpacity(1);
						gsap.set(collage, { autoAlpha: 0 });
						const titleProgress = clamp((progress - 0.18) / 0.82, 0, 1);
						gsap.set(title, {
							autoAlpha: 1 - titleProgress,
							yPercent: -135 * titleProgress,
						});
					}

					if (reduceMotion) {
						setCollageFinal();
						fisheye?.setActive(false);
						fisheye?.setOpacity(0);
						return () => {
							cardAnimation.cancel();
							titleTimeline.kill();
						};
					}

					gsap.set(panel, { autoAlpha: 1 });
					gsap.set([title, cards], { autoAlpha: 0 });

					galleryTrigger = ScrollTrigger.create({
						end: "bottom bottom",
						id: "gallery-stack-fisheye",
						invalidateOnRefresh: true,
						onEnter: playStackOnce,
						onEnterBack: () => syncGallery(galleryTrigger),
						onLeaveBack: () => syncGallery(galleryTrigger),
						onRefresh: (self) => {
							if (self.progress > 0 && !stackStarted) playStackOnce();
							syncGallery(self);
						},
						onUpdate: syncGallery,
						start: "top top",
						trigger: root,
					});

					syncGallery(galleryTrigger);

					return () => {
						unlockScroll();
						cardAnimation.cancel();
						titleTimeline.kill();
						galleryTrigger.kill();
						fisheye?.setActive(false);
						fisheye?.setOpacity(0);
						fisheye?.reset();
					};
				},
			);

			return () => media.revert();
		},
		{ scope: rootRef },
	);
}

export default useGalleryScrollAnimation;
