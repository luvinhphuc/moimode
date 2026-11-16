import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, LockKeyhole, RotateCcw, X } from "lucide-react";

import { Shape } from "../../../components/Shapes.jsx";
import { CHARM_BY_ID } from "../config/customizerConfig.js";
import { PERSONALITIES } from "../config/personalityConfig.js";
import { createPersonalityCardBlob } from "../utils/exportPersonalityCard.js";
import { countStoryWords, validateStoryDraft } from "../utils/storySubmission.js";

const INITIAL_DRAFT = { nickname: "", email: "", story: "", consent: false };
const FIELD_CLASS = "block w-full rounded-lg border border-moi-ink/35 bg-transparent px-3.5 py-3 text-moi-ink outline-none focus:border-moi-ink focus:ring-2 focus:ring-moi-mid";
const LABEL_CLASS = "mb-2 block text-xs font-black tracking-[0.1em] uppercase";
const FULL_BUTTON = "flex min-h-13 w-full items-center justify-between gap-3 rounded-full border border-moi-ink bg-moi-ink px-5 py-3.5 text-left font-black text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moi-mid disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";
const OUTLINE_BUTTON = "flex min-h-13 w-full items-center justify-between gap-3 rounded-full border border-moi-ink bg-transparent px-5 py-3.5 text-left font-black text-moi-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moi-mid";

function FieldError({ id, message }) {
	return message ? <p id={id} className="mt-2 text-sm font-bold text-moi-danger" role="alert">{message}</p> : null;
}

function CreationSummary({ colour, personality, selectedCharms, shoeUrl }) {
	return (
		<div className="relative mt-4 grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3 overflow-hidden rounded-xl p-3 sm:grid-cols-[7rem_minmax(0,1fr)_4rem] sm:gap-4" style={{ backgroundColor: `color-mix(in srgb, ${personality.theme} 45%, #f6f1e8)` }} aria-label="Your customized creation">
			<Shape type="sunburst" size={110} color={personality.theme} className="pointer-events-none absolute -top-10 -right-6 opacity-50" aria-hidden="true" />
			{shoeUrl ? <img src={shoeUrl} alt={`Your customized ${colour.label} Crocs with selected charms`} className="relative z-10 h-20 w-full object-contain" /> : <p role="status" className="relative z-10 text-xs">Preparing image…</p>}
			<div className="relative z-10 min-w-0">
				<p className="text-[0.65rem] font-black tracking-[0.12em] uppercase">Your creation</p>
				<p className="mt-1 font-display text-base leading-tight sm:text-lg">{personality.name}</p>
				<p className="mt-1 text-xs leading-snug">{colour.label} · {selectedCharms.length ? selectedCharms.join(", ") : "No charms"}</p>
			</div>
			<img src={personality.front} alt={`${personality.name} wrapper card`} className="relative z-10 w-full -rotate-6 rounded-md shadow-[3px_4px_0_#032b36]" />
		</div>
	);
}

function StorySubmission({ colour, placements, result, shoeBlob, shoeUrl, onClose }) {
	const [draft, setDraft] = useState(INITIAL_DRAFT);
	const [errors, setErrors] = useState({});
	const [mode, setMode] = useState("form");
	const [artworkUrl, setArtworkUrl] = useState(null);
	const [artworkError, setArtworkError] = useState("");
	const [preparing, setPreparing] = useState(false);
	const preparingRef = useRef(false);
	const formRef = useRef(null);
	const headingRef = useRef(null);
	const dialogRef = useRef(null);
	const artworkUrlRef = useRef(null);
	const mountedRef = useRef(true);
	const personality = PERSONALITIES[result.primaryPersonality];
	const wordCount = countStoryWords(draft.story);
	const selectedCharms = Object.values(placements).map((id) => CHARM_BY_ID[id]?.label).filter(Boolean);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
		};
	}, []);

	useEffect(() => {
		const previousFocus = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		const appRoot = document.getElementById("root");
		const previousInert = appRoot?.inert;
		if (appRoot) appRoot.inert = true;
		document.body.style.overflow = "hidden";
		function handleKeyDown(event) {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose();
				return;
			}
			if (event.key !== "Tab") return;
			const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
			if (!controls.length) return;
			const first = controls[0];
			const last = controls.at(-1);
			if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		headingRef.current?.focus();
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = previousOverflow;
			if (appRoot) appRoot.inert = previousInert;
			previousFocus?.focus?.();
		};
	}, [onClose]);

	useEffect(() => {
		if (dialogRef.current) dialogRef.current.scrollTop = 0;
		headingRef.current?.focus();
	}, [mode]);

	function updateField(name, value) {
		setDraft((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: undefined }));
		setArtworkError("");
	}

	async function preparePreview() {
		if (preparingRef.current) return;
		const nextErrors = validateStoryDraft(draft);
		if (!shoeBlob) nextErrors.image = "Your Crocs image is still being prepared. Please try again shortly.";
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length) {
			requestAnimationFrame(() => {
				const first = ["nickname", "email", "story", "consent"].find((field) => nextErrors[field]);
				if (first) formRef.current?.elements.namedItem(first)?.focus();
				else formRef.current?.querySelector("[type=submit]")?.focus();
			});
			return;
		}
		preparingRef.current = true;
		setPreparing(true);
		setArtworkError("");
		try {
			const blob = await createPersonalityCardBlob({ result, shoeBlob });
			const url = URL.createObjectURL(blob);
			if (!mountedRef.current) {
				URL.revokeObjectURL(url);
				return;
			}
			if (artworkUrlRef.current) URL.revokeObjectURL(artworkUrlRef.current);
			artworkUrlRef.current = url;
			setArtworkUrl(url);
			setMode("preview");
		} catch (error) {
			if (mountedRef.current) setArtworkError(error?.message ?? "Could not prepare your Wrapped artwork. Please try again.");
		} finally {
			preparingRef.current = false;
			if (mountedRef.current) setPreparing(false);
		}
	}

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-moi-ink/55 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
			<section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="story-share-title" className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[1.5rem] border border-moi-ink bg-moi-bg text-moi-ink shadow-[0_2rem_5rem_#032b3650] sm:max-h-[calc(100dvh-3rem)]">
				<div className="sticky top-0 z-20 flex items-center justify-between border-b border-moi-ink/15 bg-moi-bg px-5 py-3 sm:px-8">
					<p className="text-xs font-black tracking-[0.16em] uppercase">Share Your Story</p>
					<button type="button" aria-label="Close Share Your Story" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-moi-ink/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moi-mid"><X size={20} aria-hidden="true" /></button>
				</div>
				<div className="px-5 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
				{mode === "form" ? (
					<div>
						<p className="text-xs font-black tracking-[0.16em] uppercase">The Missing Piece</p>
						<h2 id="story-share-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-[clamp(2.4rem,5vw,3.7rem)] leading-[0.95] tracking-[-0.06em] outline-none">Every sole has a <em className="font-serif font-normal">story.</em></h2>
						<CreationSummary colour={colour} personality={personality} selectedCharms={selectedCharms} shoeUrl={shoeUrl} />
						<form ref={formRef} noValidate onSubmit={(event) => { event.preventDefault(); preparePreview(); }} className="mt-5">
						<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="story-nickname" className={LABEL_CLASS}>Your name / nickname <span aria-hidden="true">*</span></label>
							<input id="story-nickname" name="nickname" autoComplete="nickname" type="text" required maxLength={60} value={draft.nickname} onChange={(event) => updateField("nickname", event.target.value)} aria-invalid={!!errors.nickname} aria-describedby={errors.nickname ? "story-nickname-error" : undefined} className={`${FIELD_CLASS} ${errors.nickname ? "border-moi-danger" : ""}`} placeholder="What should we call you?" />
							<FieldError id="story-nickname-error" message={errors.nickname} />
						</div>
						<div>
							<label htmlFor="story-email" className={LABEL_CLASS}>Email address <span aria-hidden="true">*</span></label>
							<input id="story-email" name="email" autoComplete="email" type="email" required maxLength={254} value={draft.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "story-email-error" : undefined} className={`${FIELD_CLASS} ${errors.email ? "border-moi-danger" : ""}`} placeholder="you@example.com" />
							<FieldError id="story-email-error" message={errors.email} />
						</div>
						</div>
						<div className="mt-4">
							<div className="flex flex-wrap items-baseline justify-between gap-2"><label htmlFor="story-text" className={LABEL_CLASS}>Your story <span aria-hidden="true">*</span></label><span id="story-word-count" className={`text-xs ${wordCount > 100 ? "font-bold text-moi-danger" : "text-moi-muted"}`} aria-live="polite">{wordCount} / 100 words</span></div>
							<textarea id="story-text" name="story" rows={4} required value={draft.story} onChange={(event) => updateField("story", event.target.value)} aria-invalid={!!errors.story} aria-describedby={`story-word-count${errors.story ? " story-text-error" : ""}`} className={`${FIELD_CLASS} min-h-28 resize-y ${errors.story ? "border-moi-danger" : ""}`} placeholder="I made these Crocs because…" />
							<FieldError id="story-text-error" message={errors.story} />
						</div>
						<label htmlFor="story-consent" className="my-4 flex cursor-pointer items-start gap-3 text-sm leading-snug">
							<input id="story-consent" name="consent" type="checkbox" required checked={draft.consent} onChange={(event) => updateField("consent", event.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "story-consent-error" : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-moi-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moi-mid" />
							<span>I agree that Móimode may feature my nickname, story, creation and personality in The Missing Piece gallery after review. My email will remain private.</span>
						</label>
						<FieldError id="story-consent-error" message={errors.consent} />
						{errors.image ? <p className="mt-4 text-sm font-bold text-moi-danger" role="alert">{errors.image}</p> : null}
						{artworkError ? <div className="mt-4 rounded-xl bg-moi-danger-soft p-4 text-sm text-moi-danger" role="alert">{artworkError} <button type="button" className="ml-2 inline-flex items-center gap-1 font-bold underline" onClick={preparePreview}><RotateCcw size={15} /> Retry</button></div> : null}
						<button type="submit" className={FULL_BUTTON} disabled={preparing || !shoeBlob}><span>{preparing ? "Preparing preview…" : "Preview my story"}</span><ArrowRight size={18} aria-hidden="true" /></button>
						{preparing ? <p className="mt-2 text-center text-sm" role="status">Preparing your Wrapped artwork…</p> : null}
					</form>
				</div>
			) : (
				<div>
					<p className="text-xs font-black tracking-[0.16em] uppercase">Review your story</p>
					<h2 id="story-share-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-[clamp(2.4rem,5vw,3.7rem)] leading-[0.95] tracking-[-0.06em] outline-none">One last <em className="font-serif font-normal">look.</em></h2>
					<CreationSummary colour={colour} personality={personality} selectedCharms={selectedCharms} shoeUrl={shoeUrl} />
					<div className="my-4 rounded-xl border border-moi-ink/25 bg-white/70 p-4 break-words">
						<p className="text-xs font-black tracking-[0.1em] uppercase text-moi-muted">From</p>
						<h2 className="mt-1 mb-4 font-display text-2xl">{draft.nickname.trim()}</h2>
						<p className="text-xs font-black tracking-[0.1em] uppercase text-moi-muted">Email · private</p>
						<p className="mt-1 mb-4 break-all">{draft.email.trim()}</p>
						<p className="text-xs font-black tracking-[0.1em] uppercase text-moi-muted">Your story</p>
						<p className="mt-1 mb-4 whitespace-pre-wrap">{draft.story.trim()}</p>
						<div className="flex items-center gap-3 border-t border-moi-ink/15 pt-3">
							{artworkUrl ? <img src={artworkUrl} alt="Your personalized Wrapped artwork preview" className="h-20 w-16 shrink-0 rounded-md object-cover shadow-md" /> : null}
							<p className="text-sm">Wrapped artwork and Crocs render are ready from your design.</p>
						</div>
					</div>
					<button type="button" className={FULL_BUTTON} disabled aria-describedby="story-send-unavailable"><span>Send my story</span><ArrowRight size={18} aria-hidden="true" /></button>
					<button type="button" className={`${OUTLINE_BUTTON} mt-3`} onClick={() => setMode("form")}><span>Edit my story</span><ArrowLeft size={18} aria-hidden="true" /></button>
					<p id="story-send-unavailable" className="mt-3 flex items-start justify-center gap-2 text-center text-xs text-moi-muted" role="status"><LockKeyhole size={15} className="shrink-0" aria-hidden="true" /> Email submission is not connected yet. Your story has not been sent.</p>
				</div>
			)}
				</div>
			</section>
		</div>,
		document.body,
	);
}

export default StorySubmission;
