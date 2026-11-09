import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import HeroAnimation from "../animations/HeroAnimation.jsx";
import { HERO_COPY } from "../config/heroContent.js";
import heroVideoUrl from "../../../assets/videos/hero.m3u8?url";
import Preloader from "./Preloader.jsx";

function HeroSection() {
	const rootRef = useRef(null);
	const videoRef = useRef(null);
	const transitionControlRef = useRef(null);
	const [isIntroReady, setIsIntroReady] = useState(false);
	const [isIntroDone, setIsIntroDone] = useState(false);
	const [isHeroReady, setIsHeroReady] = useState(false);
	const [HeroScene, setHeroScene] = useState(null);
	const [modelStatus, setModelStatus] = useState("loading");
	const [isModelVisible, setIsModelVisible] = useState(true);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return undefined;

		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(heroVideoUrl);
			hls.attachMedia(video);

			return () => hls.destroy();
		}

		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = heroVideoUrl;
		}

		return () => {
			video.removeAttribute("src");
			video.load();
		};
	}, []);

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => setIsIntroReady(true));
		return () => window.cancelAnimationFrame(frame);
	}, []);

	useEffect(() => {
		let mounted = true;
		import("../three/HeroScene.jsx").then(
			({ default: Scene }) => {
				if (mounted) setHeroScene(() => Scene);
			},
			() => {
				if (mounted) setModelStatus("error");
			},
		);
		return () => {
			mounted = false;
		};
	}, []);

	const handleIntroComplete = useCallback(() => {
		setIsIntroDone(true);
	}, []);

	const handleHeroReady = useCallback(() => {
		setIsHeroReady(true);
	}, []);

	const handleModelReady = useCallback(() => setModelStatus("ready"), []);
	const handleModelError = useCallback(() => setModelStatus("error"), []);

	return (
		<section
			ref={rootRef}
			className="hero-transition-track"
			aria-label="MOIMODE hero"
		>
			<Preloader isDone={isIntroDone} progress={100} />

			<div className="hero-sticky-viewport">
				<div className="hero-shell">
					<div className="hero-backdrop" data-hero="backdrop" aria-hidden="true">
						<video
							ref={videoRef}
							className="hero-section__video"
							autoPlay
							muted
							loop
							playsInline
							aria-hidden="true"
						/>
					</div>

					<main id="home" className="hero-composition">
						<h1 className="sr-only">{HERO_COPY.heading}</h1>

						<div className="hero-stack" data-hero="slogan-stack">
							<div
								className="hero-slogan hero-slogan--top"
								data-hero="top-slogan"
								aria-hidden="true"
							>
								<div className="hero-slogan-hinge" data-hero="make-hinge">
									<span
										className="hero-slogan-text hero-slogan-word--make"
										data-hero="make-text"
									>
										{HERO_COPY.make}
									</span>
								</div>
								<div className="hero-crocs-track" data-hero="crocs-track">
									<div className="hero-crocs-slide" data-hero="crocs-slide">
										<div className="hero-crocs-model">
											{HeroScene && (
												<HeroScene
													ariaLabel={HERO_COPY.modelAlt}
													enablePointerMotion={false}
													isRenderActive={isModelVisible}
													onError={handleModelError}
													onReady={handleModelReady}
													transitionControlRef={transitionControlRef}
												/>
											)}
										</div>
									</div>
								</div>
							</div>

							<div className="hero-model-stage" aria-hidden="true" />

							<div
								className="hero-slogan hero-slogan--bottom"
								data-hero="bottom-slogan"
								aria-hidden="true"
							>
								<span
									className="hero-slogan-text hero-slogan-word--yours"
									data-hero="yours-text"
								>
									{HERO_COPY.yours}
								</span>
							</div>

							<div className="hero-quote-slot" data-hero="quote-exit">
								<p className="hero-quote" data-hero="quote">“{HERO_COPY.quote}”</p>
							</div>
						</div>
					</main>
				</div>
			</div>

			<HeroAnimation
				isHeroReady={isHeroReady}
				isIntroDone={isIntroDone}
				isIntroReady={isIntroReady}
				modelStatus={modelStatus}
				onHeroReady={handleHeroReady}
				onIntroComplete={handleIntroComplete}
				onModelVisibilityChange={setIsModelVisible}
				rootRef={rootRef}
				transitionControlRef={transitionControlRef}
			/>
		</section>
	);
}

export default HeroSection;
