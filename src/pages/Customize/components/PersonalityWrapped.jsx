import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, RotateCcw, Share2, Sparkles } from "lucide-react";

import BrandStar from "../../../components/BrandStar.jsx";
import { Shape } from "../../../components/Shapes.jsx";
import { gsap, useGSAP } from "../../../utils/gsap.js";
import { CHARM_BY_ID, CHARM_CATEGORIES } from "../config/customizerConfig.js";
import { PERSONALITIES, PERSONALITY_ORDER } from "../config/personalityConfig.js";
import { createPersonalityCardBlob, downloadBlob } from "../utils/exportPersonalityCard.js";
import CustomizerScene from "../three/CustomizerScene.jsx";
import PersonalityCard from "./PersonalityCard.jsx";
import StorySubmission from "./StorySubmission.jsx";
import "./PersonalityWrapped.css";

function collectionLabel(id) {
	return CHARM_CATEGORIES.find((category) => category.id === id)?.label ?? null;
}

function ShoeImage({ url, colour, className = "" }) {
	return url ? (
		<img className={className} src={url} alt={`Your customized ${colour.label} Crocs with selected charms`} />
	) : (
		<div className={`${className} wrapped-shoe-pending`} role="status">Preparing your Crocs image…</div>
	);
}

function PersonalityWrapped({ colour, placements, rotations, result, onCustomizeAgain }) {
	const [stage, setStage] = useState("decode");
	const [storyOpen, setStoryOpen] = useState(false);
	const [revealDone, setRevealDone] = useState(false);
	const [shoeBlob, setShoeBlob] = useState(null);
	const [shoeUrl, setShoeUrl] = useState(null);
	const [captureError, setCaptureError] = useState(null);
	const [captureAttempt, setCaptureAttempt] = useState(0);
	const [actionError, setActionError] = useState("");
	const [actionMessage, setActionMessage] = useState("");
	const [actionBusy, setActionBusy] = useState(false);
	const rootRef = useRef(null);
	const personality = PERSONALITIES[result.primaryPersonality];
	const stats = result.customizationStats;
	const selectedCharms = useMemo(() => [...new Set(Object.values(placements))].slice(0, 5)
		.map((id) => CHARM_BY_ID[id]).filter(Boolean), [placements]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" });
	}, [stage]);

	useEffect(() => {
		return () => { if (shoeUrl) URL.revokeObjectURL(shoeUrl); };
	}, [shoeUrl]);

	const handleCapture = useCallback((blob) => {
		setShoeBlob(blob);
		setShoeUrl(URL.createObjectURL(blob));
		setCaptureError(null);
	}, []);
	const handleCaptureError = useCallback((error) => {
		setCaptureError(error?.message ?? "Could not capture your Crocs image.");
	}, []);
	const closeStory = useCallback(() => setStoryOpen(false), []);

	useGSAP(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (stage === "decode") {
			if (reduced) return;
			const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
			timeline.from(".wrapped-decode__intro", { y: 24, autoAlpha: 0, duration: 0.55 });
			timeline.from(".wrapped-decode__fact", { y: 30, autoAlpha: 0, duration: 0.5, stagger: 0.18 }, "-=0.2");
			rootRef.current.querySelectorAll("[data-count]").forEach((element) => {
				const target = Number(element.dataset.count);
				gsap.fromTo(element, { textContent: 0 }, { textContent: target, snap: { textContent: 1 }, duration: 0.8, ease: "power2.out" });
			});
			return;
		}
		if (stage === "reveal") {
			const cards = [...rootRef.current.querySelectorAll(".wrapped-stack__card")];
			const winner = cards.find((card) => card.dataset.personality === result.primaryPersonality);
			const others = cards.filter((card) => card !== winner);
			if (reduced) {
				gsap.set(others, { autoAlpha: 0 });
				gsap.set(winner, { x: 0, y: 0, rotation: 0, scale: 1 });
				setRevealDone(true);
				return;
			}
			cards.forEach((card, index) => gsap.set(card, {
				x: (index - 1.5) * 55,
				y: Math.abs(index - 1.5) * 24,
				rotation: (index - 1.5) * 9,
				scale: 0.9,
			}));
			const winnerEase = {
				playful: "elastic.out(1, 0.45)",
				minimalist: "power2.out",
				creative: "back.out(1.7)",
				bold: "expo.out",
			}[result.primaryPersonality];
			const timeline = gsap.timeline({ onComplete: () => setRevealDone(true) });
			timeline.from(".wrapped-reveal__heading", { y: 20, autoAlpha: 0, duration: 0.45 });
			timeline.to(others, {
				x: (index) => index % 2 ? 480 : -480,
				y: (index) => index * 60 - 80,
				rotation: (index) => index % 2 ? 28 : -28,
				autoAlpha: 0,
				duration: 0.8,
				stagger: 0.08,
				ease: "power3.in",
			}, "+=0.2");
			timeline.to(winner, {
				x: 0, y: 0, rotation: 0,
				scale: result.primaryPersonality === "bold" ? 1.1 : 1.04,
				duration: result.primaryPersonality === "playful" ? 1.1 : 0.65,
				ease: winnerEase,
			}, "-=0.35");
			if (result.primaryPersonality === "playful") {
				timeline.from(".wrapped-reveal__blob", { scale: 0, rotation: -50, autoAlpha: 0, stagger: 0.12, duration: 0.65, ease: "back.out(2)" }, "-=0.65");
			}
			if (result.primaryPersonality === "creative") {
				timeline.fromTo(".wrapped-reveal__scribble path", { strokeDashoffset: 1300 }, { strokeDashoffset: 0, duration: 1, ease: "power2.out" }, "-=0.65");
				timeline.from(".wrapped-reveal__sparkle", { scale: 0, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: "back.out(2)" }, "-=0.5");
			}
			if (result.primaryPersonality === "bold") {
				timeline.from(".wrapped-reveal__shape", { scale: 0, rotation: -80, duration: 0.35, ease: "power4.out" }, "-=0.6");
			}
			timeline.from(".wrapped-reveal__name", { y: 22, autoAlpha: 0, duration: 0.45 }, "-=0.3");
			return;
		}
		if (stage === "card" && !reduced) gsap.from(".wrapped-final__content", { y: 32, autoAlpha: 0, duration: 0.65, ease: "power3.out" });
	}, { scope: rootRef, dependencies: [stage, result.primaryPersonality] });

	async function handleCardAction(mode) {
		setActionBusy(true);
		setActionError("");
		setActionMessage("");
		try {
			const blob = await createPersonalityCardBlob({ result, shoeBlob });
			const filename = `moimode-${result.primaryPersonality}-story.png`;
			if (mode === "share") {
				const file = new File([blob], filename, { type: "image/png" });
				if (navigator.share && navigator.canShare?.({ files: [file] })) {
					try {
						await navigator.share({ files: [file], title: personality.name, text: "My Móimode Style DNA" });
					} catch (error) {
						if (error.name !== "AbortError") throw error;
					}
				} else {
					downloadBlob(blob, filename);
					setActionMessage("Image sharing isn't available here, so your card was downloaded.");
				}
			} else {
				downloadBlob(blob, filename);
			}
		} catch (error) {
			setActionError(error.message ?? "Could not create your card. Please try again.");
		} finally {
			setActionBusy(false);
		}
	}

	return (
		<main ref={rootRef} className={`wrapped wrapped--${stage} wrapped--${result.primaryPersonality}`} style={{ "--wrapped-theme": personality.theme }}>
			{!shoeBlob && !captureError ? (
				<div className="wrapped-capture" aria-hidden="true" key={captureAttempt}>
					<CustomizerScene
						bodyColour={colour.value}
						captureMode
						compactPreview
						controlsEnabled={false}
						onCapture={handleCapture}
						onCaptureError={handleCaptureError}
						onError={handleCaptureError}
						onSlotSelect={() => {}}
						placements={placements}
						rotations={rotations}
						view="side"
					/>
				</div>
			) : null}
			{stage === "decode" ? (
				<section className="wrapped-decode" aria-label="Decode your style">
					<div className="wrapped-decode__intro">
						<p className="wrapped-eyebrow">01 / DECODE YOUR STYLE</p>
						<h1>Every little choice<br />says something.</h1>
						<p>Your colours. Your charms. Your story. Let’s discover your style DNA.</p>
					</div>
					<div className="wrapped-decode__grid">
						<div className="wrapped-decode__fact wrapped-decode__fact--colour">
							<span>YOUR COLOUR</span>
							<i style={{ backgroundColor: colour.value }} />
							<strong>{colour.label}</strong>
						</div>
						<div className="wrapped-decode__fact"><span>CHARMS PLACED</span><strong data-count={stats.charmCount}>{stats.charmCount}</strong></div>
						<div className="wrapped-decode__fact"><span>COLLECTIONS EXPLORED</span><strong data-count={stats.collectionCount}>{stats.collectionCount}</strong></div>
						<div className="wrapped-decode__fact"><span>YOUR TOP COLLECTION</span><strong className="wrapped-decode__top">{collectionLabel(stats.topCollection) ?? "Your canvas is clear"}</strong></div>
					</div>
					<div className="wrapped-decode__shoe"><ShoeImage url={shoeUrl} colour={colour} className="wrapped-shoe" /></div>
					<div className="wrapped-decode__charms" aria-hidden="true">{selectedCharms.map((charm) => <img key={charm.id} src={`/model/charms/previews/${charm.id}.png`} alt="" />)}</div>
					<Shape type="wonkyStar" className="wrapped-decode__shape" size={110} />
					<button type="button" className="wrapped-cta" onClick={() => setStage("reveal")}>Reveal my personality <ArrowRight size={20} /></button>
				</section>
			) : null}

			{stage === "reveal" ? (
				<section className="wrapped-reveal" aria-label="Personality reveal">
					<BrandStar className="wrapped-reveal__star" />
					<p className="wrapped-eyebrow">02 / THE REVEAL</p>
					<h1 className="wrapped-reveal__heading">Meet your alter ego.</h1>
					<div className="wrapped-stack" aria-hidden="true">
						{PERSONALITY_ORDER.map((key) => <img key={key} className="wrapped-stack__card" data-personality={key} src={PERSONALITIES[key].front} alt="" />)}
					</div>
					{result.primaryPersonality === "playful" ? <div className="wrapped-reveal__blobs" aria-hidden="true"><Shape type="groovyBlob" size={100} className="wrapped-reveal__blob" /><Shape type="doubleBubble" size={75} className="wrapped-reveal__blob" /></div> : null}
					{result.primaryPersonality === "creative" ? <div className="wrapped-reveal__creative" aria-hidden="true"><svg className="wrapped-reveal__scribble" viewBox="0 0 600 480"><path d="M95 258 C55 135 158 48 310 48 C510 48 566 142 536 286 C504 425 331 458 148 398 C63 369 42 313 95 258" /></svg><Shape type="twinSparkle" size={70} className="wrapped-reveal__sparkle" /><Shape type="sparkle" size={45} className="wrapped-reveal__sparkle" /></div> : null}
					<Shape type={result.primaryPersonality === "bold" ? "sunburst" : "sparkle"} className="wrapped-reveal__shape" size={120} />
					<h2 className="wrapped-reveal__name">{personality.name}</h2>
					<p className="wrapped-reveal__keywords">{personality.keywords.join(" · ")}</p>
					{revealDone ? <button type="button" className="wrapped-cta" onClick={() => setStage("card")}>See my card <ArrowRight size={20} /></button> : null}
				</section>
			) : null}

			{stage === "card" ? (
				<section className="wrapped-final" aria-label="Your personalized card">
					<div className="wrapped-final__content">
						<p className="wrapped-eyebrow">03 / YOUR PERSONALIZED CARD</p>
						<h1>{personality.name}</h1>
						<p className="wrapped-final__keywords">{personality.keywords.join(" · ")}</p>
						<div className="wrapped-final__grid">
							<div className="wrapped-final__product">
								<ShoeImage url={shoeUrl} colour={colour} className="wrapped-shoe" />
								<div className="wrapped-final__swatch"><i style={{ backgroundColor: colour.value }} /> Your {colour.label} Crocs</div>
							</div>
							<div className="wrapped-final__card"><PersonalityCard personalityId={result.primaryPersonality} /><p>Tap or click to flip the card</p></div>
						</div>
						<div className="wrapped-final__dna">
							<div><p className="wrapped-eyebrow">YOUR STYLE DNA</p><h2>Made from your choices.</h2><p>{stats.charmCount} charms · {stats.collectionCount} collections{stats.topCollection ? ` · ${collectionLabel(stats.topCollection)} on top` : ""}</p></div>
							<div className="wrapped-final__scores">{PERSONALITY_ORDER.map((key) => <div className="wrapped-final__score" key={key}><span>{PERSONALITIES[key].name}</span><div><i style={{ width: `${result.scores[key]}%`, backgroundColor: PERSONALITIES[key].theme }} /></div><strong>{result.scores[key]}%</strong></div>)}</div>
						</div>
						{captureError ? <div className="wrapped-final__notice" role="alert">{captureError} <button type="button" onClick={() => { setCaptureError(null); setCaptureAttempt((value) => value + 1); }}><RotateCcw size={16} /> Retry capture</button></div> : null}
						{actionError ? <p className="wrapped-final__notice" role="alert">{actionError}</p> : null}
						{actionMessage ? <p className="wrapped-final__notice" role="status">{actionMessage}</p> : null}
						<div className="wrapped-final__actions">
							<button type="button" className="wrapped-cta" disabled={!shoeBlob || actionBusy} onClick={() => handleCardAction("download")}><Download size={19} /> Download Card</button>
						<button type="button" className="wrapped-cta wrapped-cta--outline" disabled={!shoeBlob || actionBusy} onClick={() => setStoryOpen(true)}><Share2 size={19} /> Share Your Story</button>
							<button type="button" className="wrapped-cta wrapped-cta--quiet" onClick={onCustomizeAgain}><ArrowLeft size={19} /> Customize Again</button>
						</div>
						{actionBusy ? <p role="status">Preparing your card…</p> : null}
					</div>
				</section>
			) : null}
			{storyOpen ? <StorySubmission colour={colour} placements={placements} result={result} shoeBlob={shoeBlob} shoeUrl={shoeUrl} onClose={closeStory} /> : null}
			{stage !== "card" ? <div className="wrapped-bottom-mark"><Sparkles size={16} /> A little more you, every step.</div> : null}
		</main>
	);
}

export default PersonalityWrapped;
