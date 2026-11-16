import { gsap, useGSAP } from "../../../utils/gsap.js";
import { ROUTE_PATHS } from "../../../config/routePaths.js";
import { clamp, distanceAt, FLIGHT_DURATION, JOURNEY_DURATION, mix, ORBIT_STEPS, random, sampleOrbit, smooth, SVG_NS, timeAtDistance } from "./footerJourney.js";

const HERO_VISIBLE_RATIO = .65;

export default function useFooterJourney(footerRef, pathname) {
	useGSAP(() => {
		if (pathname !== ROUTE_PATHS.home) return undefined;
		const footer = footerRef.current;
		const find = (selector) => footer.querySelector(`[data-footer-${selector}]`);
		const hero = find("hero"), copy = find("copy"), layer = find("flight");
		const dust = find("dust"), moving = find("moving-star"), target = find("logo-star");
		const exclusions = find("mask-exclusions"), maskBase = find("mask-base");
		const exclusionElements = Array.from(footer.querySelectorAll("[data-footer-dust-exclusion]"));
		const mobileQuery = window.matchMedia("(max-width: 650px)");
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const particleEase = gsap.parseEase("power3.out");
		const clock = { elapsed: 0 };
		let particles = [], orbit, targetScale = 1, flightScale = 1;
		let firstUnsettled = 0, landed = true, lastGeometry;
		let started = false, alive = true, measureFrame = 0, timeline, visibilityObserver;
		let heroVisible = false, dockVisible = false;
		let cancelPreload;

		const render = () => {
			if (!orbit) return;
			const elapsed = clock.elapsed;
			for (let i = firstUnsettled; i < particles.length; i++) {
				const p = particles[i];
				const age = elapsed - p.birth;
				if (age < 0) break;
				const burst = particleEase(clamp(age / .48));
				const pop = smooth(age / .12), settle = smooth(age / .5);
				p.element.setAttribute("opacity", String(pop * mix(1, p.opacity, settle)));
				p.element.setAttribute("transform", `translate(${p.x + p.dx * burst} ${p.y + p.dy * burst}) rotate(${p.rotation + burst * 30}) scale(${p.size * mix(.25, 1, pop)})`);
				if (age >= .5) firstUnsettled = i + 1;
			}

			const hasLanded = elapsed >= FLIGHT_DURATION;
			if (hasLanded !== landed) {
				landed = hasLanded;
				target.style.opacity = landed ? "1" : "0";
				if (landed) moving.setAttribute("opacity", "0");
			}
			if (landed) return;

			const distance = distanceAt(elapsed / FLIGHT_DURATION);
			const index = distance * ORBIT_STEPS, low = Math.floor(index);
			const a = orbit[low], b = orbit[Math.min(ORBIT_STEPS, low + 1)], t = index - low;
			const angle = mix(a.angle, b.angle, t);
			const dock = smooth((distance - .88) / .12);
			const finalAngle = 360 * Math.round(orbit[ORBIT_STEPS].angle / 360);
			moving.setAttribute("transform", `translate(${mix(a.x, b.x, t)} ${mix(a.y, b.y, t)}) rotate(${mix(angle, finalAngle, dock)}) scale(${mix(flightScale, targetScale, dock)})`);
			moving.setAttribute("opacity", String(clamp(elapsed / .2)));
		};

		const measure = () => {
			if (!alive) return;
			const bounds = footer.getBoundingClientRect(), heroBounds = hero.getBoundingClientRect(), dock = target.getBoundingClientRect();
			if (!bounds.width || !bounds.height) return;
			const mobile = mobileQuery.matches;
			const heroTop = heroBounds.top - bounds.top;
			const dockX = dock.left + dock.width / 2 - bounds.left;
			const dockY = dock.top + dock.height / 2 - bounds.top;
			const maskRects = exclusionElements.map((element) => {
				const rect = element.getBoundingClientRect();
				// Use the copy's resting box even during its reveal.
				const yOffset = element === copy ? Number(gsap.getProperty(copy, "y")) || 0 : 0;
				return [rect.left - bounds.left - 8, rect.top - bounds.top - yOffset - 8, rect.width + 16, rect.height + 16];
			});
			const geometry = [bounds.width, bounds.height, heroTop, heroBounds.height, dockX, dockY, dock.width,
				Number(mobile), ...maskRects.flat()].map((value) => value.toFixed(2)).join(",");
			if (geometry === lastGeometry) return;
			lastGeometry = geometry;

			layer.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
			maskBase.setAttribute("width", String(bounds.width));
			maskBase.setAttribute("height", String(bounds.height));
			exclusions.replaceChildren(...maskRects.map(([x, y, width, height]) => {
				const mask = document.createElementNS(SVG_NS, "rect");
				Object.entries({ x, y, width, height, rx: 12, fill: "black" }).forEach(([key, value]) => mask.setAttribute(key, String(value)));
				return mask;
			}));
			orbit = sampleOrbit({ width: bounds.width, heroTop, heroHeight: heroBounds.height, dockX, dockY, mobile });
			targetScale = dock.width / 50;
			flightScale = mobile ? .90 : Math.min(1.5, bounds.width / 780);
			const count = mobile ? 105 : 210;
			const reuseParticles = dust.childElementCount === count;
			if (!reuseParticles) {
				const fragment = document.createDocumentFragment();
				for (let i = 0; i < count; i++) {
					const sparkle = random(i + 900) > .49;
					const element = document.createElementNS(SVG_NS, sparkle ? "path" : "circle");
					if (sparkle) element.setAttribute("d", "M0 -6Q1.2 -1.2 6 0Q1.2 1.2 0 6Q-1.2 1.2 -6 0Q-1.2 -1.2 0 -6Z");
					else element.setAttribute("r", String(1.1 + random(i + 1200) * 1.7));
					element.setAttribute("fill", random(i + 1800) < .34 ? "#fff8db" : random(i + 1900) < .27 ? "#fff0b6" : "#032b36");
					element.setAttribute("opacity", "0");
					fragment.append(element);
				}
				dust.replaceChildren(fragment);
			}
			firstUnsettled = 0;
			particles = [...dust.children].map((element, i) => {
				const u = (i + .2 + random(i + 11) * .55) / count;
				const index = u * ORBIT_STEPS, low = Math.floor(index);
				const a = orbit[low], b = orbit[low + 1], t = index - low;
				const theta = random(i + 300) * Math.PI * 2;
				const taper = mix(.075, 1, smooth((1 - u) / .15));
				const radius = ((mobile ? 65 : 105) * Math.pow(random(i + 600), .62) + 5) * taper;
				if (reuseParticles && clock.elapsed > 0) element.setAttribute("opacity", "0");
				return { element, birth: timeAtDistance(u) * FLIGHT_DURATION, x: mix(a.x, b.x, t), y: mix(a.y, b.y, t),
					dx: Math.cos(theta) * radius, dy: Math.sin(theta) * radius * .78,
					size: (mobile ? .76 : 1) * (.48 + random(i + 1500)) * (.48 + .52 * taper),
					rotation: random(i + 2100) * 180, opacity: .45 + random(i + 2400) * .5 };
			});
			if (started) render();
		};

		const startWhenVisible = () => {
			if (!alive || started || document.hidden || (!heroVisible && !dockVisible)) return;
			if (!orbit) {
				scheduleMeasure();
				return;
			}
			started = true;
			visibilityObserver.disconnect();
			cancelPreload?.();
			footer.dataset.journey = "travelling";
			timeline.play();
		};
		const scheduleMeasure = () => {
			if (!alive || measureFrame) return;
			measureFrame = requestAnimationFrame(() => {
				measureFrame = 0;
				measure();
				if (orbit) startWhenVisible();
			});
		};
		const finishStatic = () => {
			started = true;
			visibilityObserver?.disconnect();
			cancelPreload?.();
			timeline?.kill();
			clock.elapsed = JOURNEY_DURATION;
			gsap.set(copy, { autoAlpha: 1, y: 0 });
			footer.dataset.journey = "complete";
			measure();
			render();
		};
		footer.dataset.journey = "waiting";
		if (reducedMotion.matches) finishStatic();
		else {
			gsap.set(copy, { autoAlpha: 0, y: 18 });
			timeline = gsap.timeline({ paused: true, onUpdate: render, onComplete: () => { footer.dataset.journey = "complete"; } });
			timeline.to(clock, { elapsed: JOURNEY_DURATION, duration: JOURNEY_DURATION, ease: "none" }, 0)
				.to(copy, { autoAlpha: 1, y: 0, duration: 1.15, ease: "power3.out" }, .25);
			// Preload the orbit and hidden dust independently of playback.
			if (window.requestIdleCallback) {
				const idle = window.requestIdleCallback(measure);
				cancelPreload = () => window.cancelIdleCallback(idle);
			} else {
				const timeout = window.setTimeout(scheduleMeasure, 150);
				cancelPreload = () => window.clearTimeout(timeout);
			}
			visibilityObserver = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.target === hero) heroVisible = entry.intersectionRatio >= HERO_VISIBLE_RATIO;
					else dockVisible = entry.isIntersecting;
				}
				startWhenVisible();
			}, { threshold: [0, HERO_VISIBLE_RATIO] });
			visibilityObserver.observe(hero);
			// A short viewport can jump directly to the dock without showing most of the hero.
			visibilityObserver.observe(target);
			document.addEventListener("visibilitychange", startWhenVisible);
		}
		const updateGeometry = () => {
			if (started || lastGeometry) scheduleMeasure();
		};
		const observer = new ResizeObserver(updateGeometry);
		observer.observe(footer);
		observer.observe(target);
		exclusionElements.forEach((element) => observer.observe(element));
		const onMotionChange = () => { if (reducedMotion.matches) finishStatic(); };
		reducedMotion.addEventListener("change", onMotionChange);
		document.fonts?.ready.then(updateGeometry);

		return () => {
			alive = false;
			cancelAnimationFrame(measureFrame);
			cancelPreload?.();
			visibilityObserver?.disconnect();
			observer.disconnect();
			document.removeEventListener("visibilitychange", startWhenVisible);
			reducedMotion.removeEventListener("change", onMotionChange);
			timeline?.kill();
			dust.replaceChildren();
			exclusions.replaceChildren();
			target.style.removeProperty("opacity");
			moving.setAttribute("opacity", "0");
			delete footer.dataset.journey;
		};
	}, { scope: footerRef, dependencies: [pathname], revertOnUpdate: true });
}
