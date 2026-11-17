import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CustomEase } from "gsap/CustomEase";

import AppRoutes from "../../routes/AppRoutes.jsx";
import { ROUTE_PATHS } from "../../config/routePaths.js";
import { gsap } from "../../utils/gsap.js";
import { PageTransitionContext } from "./PageTransitionContext.js";
import "./PageTransition.css";

gsap.registerPlugin(CustomEase);
const entranceEase = CustomEase.create("moimode-paper-enter", "0.65,0,0.35,1");
const exitEase = CustomEase.create("moimode-paper-exit", "0.22,0.61,0.36,1");
const entranceDuration = 0.32;
const holdDuration = 0.06;
const exitDuration = 0.34;
const routeDepth = { [ROUTE_PATHS.home]: 0, [ROUTE_PATHS.customize]: 1, [ROUTE_PATHS.policies]: 1 };
const REVEAL_EVENT = "moimode-transition-reveal";
const COMPLETE_EVENT = "moimode-transition-complete";

function nextPaint() {
	return new Promise((resolve) => requestAnimationFrame(resolve));
}

export default function PageTransition() {
	const location = useLocation();
	const navigate = useNavigate();
	const [visibleLocation, setVisibleLocation] = useState(location);
	const visibleRef = useRef(location);
	const latestRef = useRef(location);
	const historyIndex = useRef(window.history.state?.idx ?? 0);
	const overlayRef = useRef(null);
	const timelineRef = useRef(null);
	const busyRef = useRef(false);
	const phaseRef = useRef("idle");
	const queuedDirectionRef = useRef(null);

	const showLocation = useCallback((next) => {
		visibleRef.current = next;
		setVisibleLocation(next);
	}, []);

	const runTransition = useCallback(function runTransition({ direction = "forward", onCovered, ready, onReveal } = {}) {
		if (busyRef.current || !overlayRef.current) return false;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			onCovered?.();
			onReveal?.();
			return true;
		}
		busyRef.current = true;
		phaseRef.current = "covering";
		const overlay = overlayRef.current;
		overlay.dataset.phase = "covering";
		document.documentElement.dataset.pageTransition = "busy";
		const sign = direction === "back" ? -1 : 1;
		gsap.set(overlay, { x: 0, xPercent: sign * 115, skewX: sign * -8 });
		timelineRef.current = gsap.timeline({
			paused: true,
			onComplete: () => {
				busyRef.current = false;
				phaseRef.current = "idle";
				overlay.dataset.phase = "idle";
				delete document.documentElement.dataset.pageTransition;
				timelineRef.current = null;
				window.dispatchEvent(new Event(COMPLETE_EVENT));
				// A second browser history action can arrive while the paper is leaving.
				const next = latestRef.current;
				if (next.pathname !== visibleRef.current.pathname) {
					runTransition({ direction: queuedDirectionRef.current ?? "forward", onCovered: () => showLocation(latestRef.current) });
				}
				queuedDirectionRef.current = null;
			},
		});
		timelineRef.current
			.to(overlay, { xPercent: 0, skewX: 0, duration: entranceDuration, ease: entranceEase })
			.addPause(">", () => {
				phaseRef.current = "covered";
				overlay.dataset.phase = "covered";
				Promise.resolve()
					.then(() => onCovered?.())
					.then(() => ready?.())
					.then(nextPaint)
					.catch((error) => { console.error("Page transition destination failed to prepare", error); })
					.finally(() => {
						if (!timelineRef.current) return;
						timelineRef.current.play();
					});
			})
			.to({}, { duration: holdDuration })
			.call(() => {
				phaseRef.current = "exiting";
				overlay.dataset.phase = "exiting";
				onReveal?.();
				window.dispatchEvent(new Event(REVEAL_EVENT));
			})
			.to(overlay, { xPercent: -sign * 115, skewX: sign * -8, duration: exitDuration, ease: exitEase });
		timelineRef.current.play();
		return true;
	}, [showLocation]);

	const transitionTo = useCallback((to) => {
		const target = new URL(to, window.location.href);
		if (target.origin !== window.location.origin) return false;
		if (busyRef.current) return true;
		if (target.pathname === latestRef.current.pathname) {
			navigate(target.pathname + target.search + target.hash);
			return true;
		}
		const direction = (routeDepth[target.pathname] ?? 1) < (routeDepth[latestRef.current.pathname] ?? 0) ? "back" : "forward";
		return runTransition({ direction, onCovered: () => navigate(target.pathname + target.search + target.hash) });
	}, [navigate, runTransition]);

	useEffect(() => {
		const interceptLink = (event) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const link = event.target.closest?.("a[href]");
			if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
			const target = new URL(link.href);
			if (target.origin !== window.location.origin) return;
			if (busyRef.current) {
				event.preventDefault();
				return;
			}
			if (target.pathname === latestRef.current.pathname) return;
			event.preventDefault();
			transitionTo(target.href);
		};
		document.addEventListener("click", interceptLink, true);
		return () => document.removeEventListener("click", interceptLink, true);
	}, [transitionTo]);

	useLayoutEffect(() => {
		latestRef.current = location;
		const previousIndex = historyIndex.current;
		const nextIndex = window.history.state?.idx ?? previousIndex;
		historyIndex.current = nextIndex;
		if (location.pathname === visibleRef.current.pathname) {
			showLocation(location);
			return;
		}
		if (busyRef.current) {
			if (phaseRef.current === "covered") showLocation(location);
			else if (phaseRef.current === "exiting") queuedDirectionRef.current = nextIndex < previousIndex ? "back" : "forward";
			return;
		}
		runTransition({ direction: nextIndex < previousIndex ? "back" : "forward", onCovered: () => showLocation(latestRef.current) });
	}, [location, runTransition, showLocation]);

	useEffect(() => () => {
		timelineRef.current?.kill();
		delete document.documentElement.dataset.pageTransition;
	}, []);
	const transitionController = useMemo(() => ({ transitionTo, runTransition }), [transitionTo, runTransition]);

	return (
		<PageTransitionContext.Provider value={transitionController}>
			<div id="site-page-content"><AppRoutes location={visibleLocation} /></div>
			<div ref={overlayRef} className="page-wipe" aria-hidden="true"><span className="page-wipe__star" /></div>
		</PageTransitionContext.Provider>
	);
}
