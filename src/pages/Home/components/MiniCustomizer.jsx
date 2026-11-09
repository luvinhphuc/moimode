import { useLayoutEffect, useRef, useState } from "react";

import CustomizerScene from "../../Customize/three/CustomizerScene.jsx";
import {
	CHARM_BY_ID,
	COLOUR_BY_ID,
} from "../../Customize/config/customizerConfig.js";
import { gsap } from "../../../utils/gsap.js";

const COLOUR_IDS = ["white", "pink", "mint", "butter-yellow"];
const CHARM_IDS = ["smiley-vietnam", "flower", "lotus", "bubble-tea"];
const PREVIEW_SLOT = "CharmSlot_08";
const HINT_COPY = {
	colour: { title: "Pick your color", body: "Start with a shade that feels like you." },
	charm: { title: "Add a charm", body: "Pick one to make it yours." },
	done: { title: "LOOKING GOOD! ✦", body: "Your pair is ready to show off." },
};

function MiniCustomizer() {
	const [colourId, setColourId] = useState("white");
	const [selectedCharmId, setSelectedCharmId] = useState(null);
	const [hasTriedColour, setHasTriedColour] = useState(false);
	const rootRef = useRef(null);
	const previewRef = useRef(null);
	const colourLegendRef = useRef(null);
	const charmLegendRef = useRef(null);
	const charmTargetRef = useRef(null);
	const hintRef = useRef(null);
	const arrowRef = useRef(null);
	const arrowHeadRef = useRef(null);
	const arrowSvgRef = useRef(null);
	const hintStep = selectedCharmId ? "done" : hasTriedColour ? "charm" : "colour";
	const placements = selectedCharmId ? { [PREVIEW_SLOT]: selectedCharmId } : {};

	useLayoutEffect(() => {
		const root = rootRef.current;
		const card = hintRef.current;
		const path = arrowRef.current;
		const head = arrowHeadRef.current;
		const svg = arrowSvgRef.current;
		const target = hintStep === "colour"
			? colourLegendRef.current
			: hintStep === "charm" ? charmTargetRef.current : previewRef.current;
		if (!root || !card || !path || !head || !svg || !target) return undefined;

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		let timeline;
		let frame;
		const draw = () => {
			const rootBox = root.getBoundingClientRect();
			const targetBox = target.getBoundingClientRect();
			const width = root.clientWidth;
			const height = root.clientHeight;
			if (!width || !height) return 0;

			const done = hintStep === "done";
			const charmHint = hintStep === "charm";
			const startX = done
				? card.offsetLeft + 8
				: card.offsetLeft + card.offsetWidth * (hintStep === "colour" ? 0.65 : 0.25);
			const startY = done
				? card.offsetTop + card.offsetHeight * 0.7
				: card.offsetTop + card.offsetHeight - 3;
			const endX = done
				? targetBox.left - rootBox.left + targetBox.width * (targetBox.width < 680 ? 0.76 : 0.68)
				: charmHint
					? targetBox.left - rootBox.left + targetBox.width / 2
					: targetBox.right - rootBox.left + 6;
			const endY = done
				? targetBox.top - rootBox.top + targetBox.height * 0.58
				: charmHint
					? targetBox.top - rootBox.top - 8
					: targetBox.bottom - rootBox.top + 1;

			svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
			const distance = Math.hypot(endX - startX, endY - startY);
			const curl = Math.min(18, Math.max(10, distance * 0.08));
			const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
			// Match the hand-drawn looped arrow from the reference demo.
			const p = (n) => (distance * n).toFixed(1);
			path.setAttribute("d", [
				"M 0 0",
				`C ${p(0.10)} -6, ${p(0.23)} 10, ${p(0.33)} 9`,
				`C ${p(0.45)} 7, ${p(0.46)} ${-curl}, ${p(0.38)} ${-curl}`,
				`C ${p(0.28)} ${-curl}, ${p(0.30)} ${curl}, ${p(0.49)} ${(curl * 0.65).toFixed(1)}`,
				`C ${p(0.69)} ${(curl * 0.35).toFixed(1)}, ${p(0.82)} -5, ${distance.toFixed(1)} 0`,
			].join(" "));
			path.setAttribute("transform", `translate(${startX} ${startY}) rotate(${angle})`);
			head.setAttribute("transform", `translate(${endX} ${endY}) rotate(${angle})`);
			return path.getTotalLength();
		};

		const animate = () => {
			timeline?.kill();
			gsap.killTweensOf([card, path, head]);
			gsap.set(card, { clearProps: "transform" });
			const length = draw();
			if (!length) return;
			gsap.set(path, { autoAlpha: 1, strokeDasharray: length, strokeDashoffset: length });
			gsap.set(head, { autoAlpha: 0 });
			if (reduceMotion.matches) {
				gsap.set(card, { autoAlpha: 1, scale: 1, y: 0 });
				gsap.set(path, { strokeDashoffset: 0 });
				gsap.set(head, { autoAlpha: 1 });
				if (hintStep === "done") {
					timeline = gsap.timeline()
						.set([card, path, head], { autoAlpha: 0 }, 5);
				}
				return;
			}
			timeline = gsap.timeline();
			timeline
				.fromTo(card,
					{ autoAlpha: 0, scale: 0.76, y: 12 },
					{ autoAlpha: 1, scale: 1, y: 0, duration: 0.38, ease: "back.out(1.8)" },
				)
				.to(path, { strokeDashoffset: 0, duration: 0.58, ease: "power2.inOut" }, "-=0.05")
				.to(head, { autoAlpha: 1, duration: 0.2, ease: "power2.out" }, "-=0.1");
			if (hintStep === "done") {
				timeline
					.to(head, { autoAlpha: 0, duration: 0.1 }, "+=4.2")
					.to(path, { strokeDashoffset: length, duration: 0.52, ease: "power2.inOut" })
					.set(path, { autoAlpha: 0 })
					.to(card, { scale: 0.45, y: -8, autoAlpha: 0, duration: 0.35, ease: "back.in(1.5)" });
			}
		};

		animate();
		const observer = new ResizeObserver(() => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				const length = draw();
				if (length && !timeline?.isActive()) {
					gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
				}
			});
		});
		for (const element of [root, card, target]) observer.observe(element);
		const onMotionChange = () => animate();
		reduceMotion.addEventListener("change", onMotionChange);
		return () => {
			observer.disconnect();
			reduceMotion.removeEventListener("change", onMotionChange);
			window.cancelAnimationFrame(frame);
			timeline?.kill();
			gsap.killTweensOf([card, path, head]);
		};
	}, [hintStep]);

	const toggleCharm = (id) => {
		setSelectedCharmId((current) => current === id ? null : id);
	};

	return (
		<div ref={rootRef} className="about-mini" data-about-mini-customizer aria-label="Try the mini customizer">
			<div ref={previewRef} className="about-mini__preview">
				<CustomizerScene
					bodyColour={COLOUR_BY_ID[colourId].value}
					compactPreview
					controlsEnabled={false}
					placements={placements}
					rotations={{}}
					view="mini"
				/>
			</div>

			<div className="about-mini__controls">
				<fieldset className="about-mini__group">
					<legend ref={colourLegendRef}>COLOR</legend>
					<div className="about-mini__options about-mini__options--colours">
						{COLOUR_IDS.map((id) => {
							const colour = COLOUR_BY_ID[id];
							return (
								<button
									key={id}
									type="button"
									className="about-mini__colour"
									aria-label={colour.label}
									aria-pressed={colourId === id}
									title={colour.label}
									onClick={() => {
										setColourId(id);
										setHasTriedColour(true);
									}}
								>
									<span style={{ backgroundColor: colour.value }} />
								</button>
							);
						})}
					</div>
				</fieldset>

				<fieldset className="about-mini__group">
					<legend ref={charmLegendRef}>CHARMS</legend>
					<div className="about-mini__options about-mini__options--charms">
						{CHARM_IDS.map((id) => {
							const charm = CHARM_BY_ID[id];
							return (
								<button
									key={id}
									type="button"
					ref={id === CHARM_IDS[CHARM_IDS.length - 1] ? charmTargetRef : undefined}
									className="about-mini__charm-option"
									aria-label={charm.label}
									aria-pressed={selectedCharmId === id}
									title={charm.label}
									onClick={() => toggleCharm(id)}
								>
									<img src={`/model/charms/previews/${id}.png`} alt="" width="64" height="64" loading="lazy" />
								</button>
							);
						})}
					</div>
				</fieldset>
			</div>

			<svg ref={arrowSvgRef} className="about-mini__arrow" aria-hidden="true" preserveAspectRatio="none">
				<path ref={arrowRef} className="about-mini__arrow-line" />
				<g ref={arrowHeadRef} className="about-mini__arrow-head">
					<path d="M -11 -6 L 0 0 L -11 6" />
				</g>
			</svg>
			<div ref={hintRef} className={`about-mini__hint about-mini__hint--${hintStep}`} role="status" aria-live="polite">
				<strong>{HINT_COPY[hintStep].title}</strong>
				<span>{HINT_COPY[hintStep].body}</span>
			</div>
		</div>
	);
}

export default MiniCustomizer;
