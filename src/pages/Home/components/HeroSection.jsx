import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

import HeroAnimation from "../animations/HeroAnimation.jsx";
import { HERO_COPY } from "../config/heroContent.js";
import heroVideoUrl from "../../../assets/videos/hero.m3u8?url";
import Preloader from "./Preloader.jsx";
import { SoftStar } from "../../../components/Shapes.jsx";

function HeroSection({ downloadProgress, isIntroDone, onIntroComplete, onLoadProgress }) {
	const rootRef = useRef(null);
	const videoRef = useRef(null);
	const transitionControlRef = useRef(null);
	const [isHeroReady, setIsHeroReady] = useState(false);
	const [isVideoPlaying, setIsVideoPlaying] = useState(false);
	const [HeroScene, setHeroScene] = useState(null);
	const [modelStatus, setModelStatus] = useState("loading");
	const [isModelVisible, setIsModelVisible] = useState(true);
	const [isHeroInView, setIsHeroInView] = useState(true);
	const isIntroReady = modelStatus !== "loading";
	const progress = isIntroReady ? 100 : Math.min(99, downloadProgress ?? 0);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return undefined;

		let inView = false;
		let active = true;
		let hls;
		let playPromise;
		let playRetryId;
		let recoveryId;
		let stallCheckId;
		let playFailures = 0;
		let hlsRecoveries = 0;
		let stallRecoveries = 0;
		let lastPlaybackTime = 0;
		let lastProgressAt = performance.now();
		const shouldPlay = () => inView && !document.hidden;
		const requestPlayback = () => {
			if (!shouldPlay() || !video.paused || playPromise ||
				video.readyState < HTMLMediaElement.HAVE_METADATA) return;
			playPromise = video.play();
			playPromise?.catch(() => {
				// Metadata may arrive before the first HLS fragment can be played.
				if (active && shouldPlay() && playFailures < 3) {
					playFailures += 1;
					window.clearTimeout(playRetryId);
					playRetryId = window.setTimeout(requestPlayback, playFailures * 800);
				}
			}).finally(() => {
				playPromise = null;
			});
		};
		const syncPlayback = () => {
			if (!shouldPlay()) {
				window.clearTimeout(playRetryId);
				video.pause();
			} else {
				requestPlayback();
			}
		};
		const handleCanPlay = () => {
			playFailures = 0;
			syncPlayback();
		};
		const handlePlaying = () => {
			playFailures = 0;
			lastProgressAt = performance.now();
			setIsVideoPlaying(true);
		};
		const handlePause = () => {
			setIsVideoPlaying(false);
			if (shouldPlay() && playFailures < 3) {
				window.clearTimeout(playRetryId);
				playRetryId = window.setTimeout(requestPlayback, 600);
			}
		};
		const checkForStall = () => {
			if (!shouldPlay() || video.paused || video.seeking ||
				video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
			const now = performance.now();
			if (Math.abs(video.currentTime - lastPlaybackTime) > 0.1) {
				lastPlaybackTime = video.currentTime;
				lastProgressAt = now;
				stallRecoveries = 0;
			hlsRecoveries = 0;
			} else if (now - lastProgressAt > 6000 && stallRecoveries < 2) {
				stallRecoveries += 1;
				lastProgressAt = now;
				if (hls) {
					if (stallRecoveries === 1) hls.startLoad();
					else hls.recoverMediaError();
				} else {
					video.load();
				}
			}
		};
		const syncVisibility = () => {
			setIsHeroInView(inView && !document.hidden);
			syncPlayback();
		};
		const observer = new IntersectionObserver(([entry]) => {
			inView = entry.isIntersecting;
			syncVisibility();
		});
		observer.observe(rootRef.current);
		video.addEventListener("loadedmetadata", syncPlayback);
		video.addEventListener("canplay", handleCanPlay);
		video.addEventListener("playing", handlePlaying);
		video.addEventListener("pause", handlePause);
		document.addEventListener("visibilitychange", syncVisibility);
		stallCheckId = window.setInterval(checkForStall, 1500);

		const attachNativeStream = () => {
			if (!video.canPlayType("application/vnd.apple.mpegurl")) return;
			video.src = heroVideoUrl;
			video.load();
		};
		// Skip the disposable StrictMode setup before starting network requests.
		const setupId = window.setTimeout(async () => {
			try {
				const { default: Hls } = await import("hls.js");
				if (!active) return;
				// Chrome can report native HLS support but fail on encrypted streams.
				if (Hls.isSupported()) {
					hls = new Hls({ startFragPrefetch: true });
					hls.on(Hls.Events.ERROR, (_, error) => {
						if (!error.fatal || !active || hlsRecoveries >= 2) return;
						hlsRecoveries += 1;
						window.clearTimeout(recoveryId);
						recoveryId = window.setTimeout(() => {
							if (!active) return;
							if (error.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
							else if (error.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
						}, hlsRecoveries * 1000);
					});
					hls.loadSource(heroVideoUrl);
					hls.attachMedia(video);
				} else {
					attachNativeStream();
				}
			} catch {
				if (active) attachNativeStream();
			}
		}, 0);

		return () => {
			active = false;
			observer.disconnect();
			video.removeEventListener("loadedmetadata", syncPlayback);
			video.removeEventListener("canplay", handleCanPlay);
			video.removeEventListener("playing", handlePlaying);
			video.removeEventListener("pause", handlePause);
			document.removeEventListener("visibilitychange", syncVisibility);
			window.clearTimeout(setupId);
			window.clearTimeout(playRetryId);
			window.clearTimeout(recoveryId);
			window.clearInterval(stallCheckId);
			hls?.destroy();
			video.pause();
			video.removeAttribute("src");
			video.load();
		};
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
			<Preloader
				isDone={isIntroDone}
				progress={progress}
			/>

			<div className="hero-sticky-viewport">
				<div className="hero-shell">
					<div
						className={`hero-backdrop${
							isVideoPlaying ? " hero-backdrop--video-playing" : ""
						}`}
						data-hero="backdrop"
						aria-hidden="true"
					>
						<video
							ref={videoRef}
							className="hero-section__video"
							muted
							autoPlay
							loop
							playsInline
							preload="auto"
							onError={() => setIsVideoPlaying(false)}
							aria-hidden="true"
						/>
					</div>

					<main id="home" className="hero-composition">
						<h1 className="hero-composition__heading">{HERO_COPY.heading}</h1>

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
											<SoftStar
												className="hero-crocs-star"
												data-hero="crocs-star"
											/>
											{HeroScene && (
												<HeroScene
													ariaLabel={HERO_COPY.modelAlt}
													enablePointerMotion={false}
													isRenderActive={!isIntroDone || (isModelVisible && isHeroInView)}
													onError={handleModelError}
													onLoadProgress={onLoadProgress}
													onReady={handleModelReady}
													transitionControlRef={transitionControlRef}
												/>
											)}
										</div>
									</div>
								</div>
							</div>

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
								<p className="hero-quote" data-hero="quote">
									“{HERO_COPY.quote}”
								</p>
							</div>
						</div>
					</main>
					<a
						href="#about"
						className={`hero-scroll-hint${isHeroReady ? " hero-scroll-hint--ready" : ""}`}
						data-hero="scroll-hint"
					>
						<span className="hero-scroll-hint__label">LET'S EXPLORE</span>
						<span className="hero-scroll-hint__icon" aria-hidden="true">
							<ArrowDown size={20} strokeWidth={3} />
						</span>
					</a>
				</div>
			</div>

			<HeroAnimation
				isHeroReady={isHeroReady}
				isIntroDone={isIntroDone}
				isIntroReady={isIntroReady}
				modelStatus={modelStatus}
				onHeroReady={handleHeroReady}
				onIntroComplete={onIntroComplete}
				onModelVisibilityChange={setIsModelVisible}
				rootRef={rootRef}
				transitionControlRef={transitionControlRef}
			/>
		</section>
	);
}

export default HeroSection;
