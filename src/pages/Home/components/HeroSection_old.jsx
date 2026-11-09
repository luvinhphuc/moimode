import { useCallback, useEffect, useRef, useState } from "react";

import HeroAnimation from "../animations/HeroAnimation.jsx";
import { HERO_COPY } from "../config/heroContent.js";
import ModelStage from "../three/ModelStage.jsx";
import Preloader from "./Preloader.jsx";

function HeroSection() {
	const rootRef = useRef(null);
	const transitionControlRef = useRef(null);
	const [isSceneReady, setIsSceneReady] = useState(false);
	const [loadProgress, setLoadProgress] = useState(0);
	const [hasSceneError, setHasSceneError] = useState(false);
	const [isIntroDone, setIsIntroDone] = useState(false);
	const [areHeroCharmsReady, setAreHeroCharmsReady] = useState(false);
	const [isHeroReady, setIsHeroReady] = useState(false);
	const [isRenderActive, setIsRenderActive] = useState(true);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;

		const observer = new IntersectionObserver(
			([entry]) => setIsRenderActive(entry.isIntersecting),
			{ rootMargin: "100% 0px" },
		);
		observer.observe(root);

		return () => observer.disconnect();
	}, []);

	const handleSceneReady = useCallback(() => {
		setIsSceneReady(true);
		setLoadProgress(100);
	}, []);

	const handleSceneError = useCallback(() => {
		setHasSceneError(true);
		setIsIntroDone(true);
		setIsHeroReady(true);
	}, []);

	const handleIntroComplete = useCallback(() => {
		setIsIntroDone(true);
	}, []);

	const handleModelSettled = useCallback(() => {
		setAreHeroCharmsReady(true);
	}, []);

	const handleHeroReady = useCallback(() => {
		setIsHeroReady(true);
	}, []);

	return (
		<section
			ref={rootRef}
			className="hero-transition-track"
			aria-label="MOIMODE hero"
		>
			<Preloader isDone={isIntroDone} progress={loadProgress} />

			<div className="hero-sticky-viewport">
				<div className="hero-shell">
					<div className="hero-backdrop" data-hero="backdrop" aria-hidden="true" />

					<main id="home" className="hero-composition">
						<h1 className="sr-only">{HERO_COPY.heading}</h1>

						<div className="hero-stack">
							<div
								className="hero-slogan hero-slogan--top"
								data-hero="top-slogan"
								aria-hidden="true"
							>
								<span
									className="hero-slogan-text hero-slogan-word--make"
									data-hero="make-text"
								>
									{HERO_COPY.make}
								</span>
							</div>

							<ModelStage
								ariaLabel={HERO_COPY.modelAlt}
								hasError={hasSceneError}
								isReady={isSceneReady}
								isRenderActive={isRenderActive}
								progress={loadProgress}
								charmsReady={areHeroCharmsReady}
								stageLabel={HERO_COPY.modelLabel}
								transitionControlRef={transitionControlRef}
								onReady={handleSceneReady}
								onLoadProgress={setLoadProgress}
								onError={handleSceneError}
							/>

							<div
								className="hero-slogan hero-slogan--bottom"
								aria-hidden="true"
							>
								<span
									className="hero-slogan-text hero-slogan-word--yours"
									data-hero="yours-text"
								>
									{HERO_COPY.yours}
								</span>
							</div>
						</div>
					</main>
				</div>
			</div>

			<HeroAnimation
				hasSceneError={hasSceneError}
				isHeroReady={isHeroReady}
				isIntroDone={isIntroDone}
				isSceneReady={isSceneReady}
				onHeroReady={handleHeroReady}
				onIntroComplete={handleIntroComplete}
				onModelSettled={handleModelSettled}
				rootRef={rootRef}
				transitionControlRef={transitionControlRef}
			/>
		</section>
	);
}

export default HeroSection;
