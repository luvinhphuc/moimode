import { useCallback, useRef, useState } from "react";

import Header from "../../../components/layout/Header/Header.jsx";
import HeroAnimation from "../animations/HeroAnimation.jsx";
import { HERO_COPY } from "../config/heroContent.js";
import ModelStage from "../three/ModelStage.jsx";
import AboutCollage from "./AboutCollage.jsx";
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
	const [isTransitionStarted, setIsTransitionStarted] = useState(false);
	const [isTransitionComplete, setIsTransitionComplete] = useState(false);
	const [ctaStatus, setCtaStatus] = useState("");

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

	const handleTransitionStart = useCallback(() => {
		setIsTransitionStarted(true);
	}, []);

	const handleTransitionComplete = useCallback(() => {
		setIsTransitionComplete(true);
	}, []);

	const handleTransitionReverse = useCallback(() => {
		setIsTransitionComplete(false);
	}, []);

	const handleTransitionReverseComplete = useCallback(() => {
		setIsTransitionStarted(false);
	}, []);

	const handleStartCustomizing = useCallback(() => {
		setCtaStatus(HERO_COPY.buttonStatus);
	}, []);

	return (
		<div
			ref={rootRef}
			className={`hero-transition-track${
				isTransitionStarted ? " is-transitioning" : ""
			}${isTransitionComplete ? " is-transition-complete" : ""}`}
		>
			<Preloader isDone={isIntroDone} progress={loadProgress} />
			<Header onAction={handleStartCustomizing} />

			<div className="hero-sticky-viewport">
				<section className="hero-shell" aria-label="MOIMODE hero">
					<div className="hero-backdrop" data-hero="backdrop" aria-hidden="true" />

					<main
						id="home"
						className="hero-composition"
						aria-hidden={isTransitionComplete || undefined}
					>
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
				</section>

				<section
					id="about"
					className="about-panel"
					data-hero="about-panel"
					aria-labelledby="about-title"
					aria-hidden={!isTransitionComplete}
				>
					<AboutCollage />
					<h2 id="about-title" data-hero="about-title">
						ABOUT US
					</h2>
				</section>
			</div>

			<p className="sr-only" role="status" aria-live="polite">
				{ctaStatus}
			</p>

			<HeroAnimation
				hasSceneError={hasSceneError}
				isHeroReady={isHeroReady}
				isIntroDone={isIntroDone}
				isSceneReady={isSceneReady}
				onHeroReady={handleHeroReady}
				onIntroComplete={handleIntroComplete}
				onModelSettled={handleModelSettled}
				onTransitionComplete={handleTransitionComplete}
				onTransitionReverse={handleTransitionReverse}
				onTransitionReverseComplete={handleTransitionReverseComplete}
				onTransitionStart={handleTransitionStart}
				rootRef={rootRef}
				transitionControlRef={transitionControlRef}
			/>
		</div>
	);
}

export default HeroSection;
