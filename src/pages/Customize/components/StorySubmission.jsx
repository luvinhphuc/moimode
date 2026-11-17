import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { CHARM_BY_ID } from "../config/customizerConfig.js";
import { PERSONALITIES } from "../config/personalityConfig.js";
import { blobToDataUrl } from "../utils/exportCrocsImage.js";
import { countStoryWords, validateStoryDraft } from "../utils/storySubmission.js";
import { gsap, useGSAP } from "../../../utils/gsap.js";
import "./StorySubmission.css";

const INITIAL_DRAFT = { nickname: "", email: "", story: "", consent: false, website: "" };

function FieldError({ id, message }) {
	return message ? (
		<p id={id} className="story-field__error" role="alert">
			{message}
		</p>
	) : null;
}

function CreationSummary({ colour, personality, selectedCharms }) {
	return (
		<div className="story-creation" aria-label="Your customized creation">
			<div className="story-creation__preview" aria-hidden="true">
				<span style={{ backgroundColor: colour.value }} />
			</div>
			<div className="story-creation__copy">
				<p className="story-creation__eyebrow">Your creation</p>
				<p className="story-creation__name">{personality.name}</p>
				<p className="story-creation__details">
					{colour.label} · {selectedCharms.length ? selectedCharms.join(", ") : "No charms"}
				</p>
			</div>
		</div>
	);
}

function StorySubmission({ colour, placements, result, onExportCrocs, onClose }) {
	const [draft, setDraft] = useState(INITIAL_DRAFT);
	const [errors, setErrors] = useState({});
	const [mode, setMode] = useState("form");
	const [submissionStatus, setSubmissionStatus] = useState("idle");
	const [submissionError, setSubmissionError] = useState("");
	const submittingRef = useRef(false);
	const formRef = useRef(null);
	const headingRef = useRef(null);
	const dialogRef = useRef(null);
	const hasOpenedRef = useRef(false);
	const personality = PERSONALITIES[result.primaryPersonality];
	const wordCount = countStoryWords(draft.story);
	const selectedCharms = Object.values(placements)
		.map((id) => CHARM_BY_ID[id]?.label)
		.filter(Boolean);
	const isSubmitting = submissionStatus === "preparing" || submissionStatus === "sending";

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
				if (!isSubmitting) onClose();
				return;
			}
			if (event.key !== "Tab") return;
			const controls = [
				...dialogRef.current.querySelectorAll(
					'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
				),
			];
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
	}, [isSubmitting, onClose]);

	useEffect(() => {
		if (dialogRef.current) dialogRef.current.scrollTop = 0;
		headingRef.current?.focus();
	}, [mode]);

	useGSAP(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
		if (!hasOpenedRef.current) {
			hasOpenedRef.current = true;
			timeline.from(dialogRef.current, { y: 24, autoAlpha: 0, duration: 0.45 });
			timeline.from('.story-aside__artwork', { y: 18, rotation: -5, scale: 0.96, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.1);
			timeline.from('.story-main__header, .story-form', { y: 14, autoAlpha: 0, duration: 0.42, stagger: 0.08 }, 0.14);
		} else {
			timeline.from('.story-aside__artwork, .story-main__header, .story-main__body', { y: 12, autoAlpha: 0, duration: 0.38, stagger: 0.06 });
		}
		return () => timeline.kill();
	}, { scope: dialogRef, dependencies: [mode], revertOnUpdate: true });

	function updateField(name, value) {
		setDraft((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: undefined }));
		setSubmissionError("");
		if (submissionStatus === "error") setSubmissionStatus("idle");
	}

	function preparePreview() {
		const nextErrors = validateStoryDraft(draft);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length) {
			requestAnimationFrame(() => {
				const first = ["nickname", "email", "story", "consent"].find((field) => nextErrors[field]);
				if (first) formRef.current?.elements.namedItem(first)?.focus();
				else formRef.current?.querySelector("[type=submit]")?.focus();
			});
			return;
		}
		setSubmissionError("");
		setSubmissionStatus("idle");
		setMode("preview");
	}

	async function sendStory() {
		if (submittingRef.current || submissionStatus === "success") return;
		const nextErrors = validateStoryDraft(draft);
		if (Object.keys(nextErrors).length) {
			setErrors(nextErrors);
			setMode("form");
			return;
		}
		if (typeof onExportCrocs !== "function") {
			setSubmissionError("Your Crocs customization is unavailable. Please try again.");
			setSubmissionStatus("error");
			return;
		}

		submittingRef.current = true;
		setSubmissionError("");
		setSubmissionStatus("preparing");
		let sending = false;
		try {
			const imageBlob = await onExportCrocs();
			const imageData = await blobToDataUrl(imageBlob);
			setSubmissionStatus("sending");
			sending = true;
			const response = await fetch("/api/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: draft.nickname.trim(),
					email: draft.email.trim(),
					story: draft.story.trim(),
					personality: personality.name,
					imageData,
					website: draft.website,
				}),
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok || payload?.success !== true) throw new Error("Email submission failed.");
			setSubmissionStatus("success");
		} catch (error) {
			setSubmissionError(sending
				? "Something went wrong. Please try again."
				: error?.message || "Your Crocs could not be prepared. Please try again.");
			setSubmissionStatus("error");
		} finally {
			submittingRef.current = false;
		}
	}

	const isFormMode = mode === "form";
	const progressStep = isFormMode ? 0 : 1;

	return createPortal(
		<div
			className="story-overlay"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !isSubmitting) onClose();
			}}
		>
			<section
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="story-share-title"
				className="story-dialog"
				style={{ "--story-theme": personality.theme }}
			>
				<button
					type="button"
					aria-label="Close Share Your Story"
					onClick={onClose}
					disabled={isSubmitting}
					className="story-close"
				>
					<X size={22} aria-hidden="true" />
				</button>

				<div className="story-layout">
					<aside className="story-aside" aria-label="Your style artwork">
						<p className="story-aside__eyebrow">MÓIMODE / YOUR STYLE DNA</p>
						<div className="story-aside__artwork-wrap">
							<img
									src={personality.front}
									alt={`${personality.name} personality card`}
								className="story-aside__artwork"
							/>
						</div>
						<div className="story-aside__copy">
							<p className="story-aside__kicker">YOUR PERSONALITY</p>
							<h2 className="story-aside__title">{personality.name}.</h2>
							<p className="story-aside__description">Your story is the missing piece. Make it yours.</p>
							<div className="story-aside__keywords" aria-label="Personality traits">
								{personality.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
							</div>
						</div>
					</aside>

					<div className="story-main">
						<ol className="story-progress" aria-label="Share your story progress">
							{["Story", "Review"].map((label, step) => (
								<li key={label} className={step <= progressStep ? "is-active" : ""} aria-current={step === progressStep ? "step" : undefined}>
									<span className="story-progress__number">0{step + 1}</span>
									<span>{label}</span>
								</li>
							))}
						</ol>

						{isFormMode ? (
							<>
								<div className="story-main__header">
									<p className="story-main__step">01 / SHARE YOUR STORY</p>
									<h1 id="story-share-title" ref={headingRef} tabIndex={-1} className="story-main__title">
										Every sole<br />has a story.
									</h1>
									<p className="story-main__description">
										What makes your creation yours? Share a little piece of yourself with us.
									</p>
								</div>

								<form
									ref={formRef}
									noValidate
									onSubmit={(event) => {
										event.preventDefault();
										preparePreview();
									}}
									className="story-form"
								>
									<div className="story-form__honeypot" aria-hidden="true">
										<label htmlFor="story-website">Leave this field empty</label>
										<input
											id="story-website"
											name="website"
											tabIndex={-1}
											autoComplete="off"
											value={draft.website}
											onChange={(event) => updateField("website", event.target.value)}
										/>
									</div>
									<div className="story-form__identity">
									<div className="story-field">
										<label htmlFor="story-nickname" className="story-field__label">
											Your name / nickname <span aria-hidden="true">*</span>
										</label>
										<input
											id="story-nickname"
											name="nickname"
											autoComplete="nickname"
											type="text"
											required
											maxLength={60}
											value={draft.nickname}
											onChange={(event) => updateField("nickname", event.target.value)}
											aria-invalid={!!errors.nickname}
											aria-describedby={errors.nickname ? "story-nickname-error" : undefined}
											className={`story-field__control${errors.nickname ? " is-invalid" : ""}`}
											placeholder="What should we call you?"
										/>
										<FieldError id="story-nickname-error" message={errors.nickname} />
									</div>

									<div className="story-field">
										<label htmlFor="story-email" className="story-field__label">
											Email address <span aria-hidden="true">*</span>
										</label>
										<input
											id="story-email"
											name="email"
											autoComplete="email"
											type="email"
											required
											maxLength={254}
											value={draft.email}
											onChange={(event) => updateField("email", event.target.value)}
											aria-invalid={!!errors.email}
											aria-describedby={errors.email ? "story-email-error" : undefined}
											className={`story-field__control${errors.email ? " is-invalid" : ""}`}
											placeholder="you@example.com"
										/>
										<FieldError id="story-email-error" message={errors.email} />
									</div>
									</div>

									<div className="story-field">
										<div className="story-field__meta">
											<label htmlFor="story-text" className="story-field__label">
												Your story <span aria-hidden="true">*</span>
											</label>
											<span
												id="story-word-count"
												className={`story-word-count${wordCount > 100 ? " is-over-limit" : ""}`}
												aria-live="polite"
											>
												{wordCount} / 100 words
											</span>
										</div>
										<textarea
											id="story-text"
											name="story"
											rows={5}
											required
											maxLength={1500}
											value={draft.story}
											onChange={(event) => updateField("story", event.target.value)}
											aria-invalid={!!errors.story}
											aria-describedby={`story-word-count${errors.story ? " story-text-error" : ""}`}
											className={`story-field__control story-field__control--textarea${errors.story ? " is-invalid" : ""}`}
											placeholder="I made these Crocs because…"
										/>
										<FieldError id="story-text-error" message={errors.story} />
									</div>

									<label htmlFor="story-consent" className="story-consent">
										<input
											id="story-consent"
											name="consent"
											type="checkbox"
											required
											checked={draft.consent}
											onChange={(event) => updateField("consent", event.target.checked)}
											aria-invalid={!!errors.consent}
											aria-describedby={errors.consent ? "story-consent-error" : undefined}
											className="story-consent__checkbox"
										/>
										<span>
											I agree that Móimode may feature my nickname, story, creation and personality in The Missing Piece gallery after review. My email will remain private.
										</span>
									</label>
									<FieldError id="story-consent-error" message={errors.consent} />
										<button type="submit" className="story-button">
											<span>Review my story</span>
										<ArrowRight size={19} aria-hidden="true" />
									</button>
								</form>
							</>
						) : (
							<>
								<div className="story-main__header">
									<p className="story-main__step">02 / REVIEW YOUR STORY</p>
									<h1 id="story-share-title" ref={headingRef} tabIndex={-1} className="story-main__title story-main__title--review">
										One last look.
									</h1>
									<p className="story-main__description">
										Make sure your story is ready to share with The Missing Piece gallery.
									</p>
								</div>
								<div className="story-main__body">
								<CreationSummary
									colour={colour}
									personality={personality}
									selectedCharms={selectedCharms}
								/>
								<div className="story-review">
									<div className="story-review__identity">
										<div>
											<p className="story-review__label">From</p>
											<h2>{draft.nickname.trim()}</h2>
										</div>
										<div>
											<p className="story-review__label">Email · private</p>
											<p className="story-review__email">{draft.email.trim()}</p>
										</div>
									</div>
									<div className="story-review__story-block">
										<p className="story-review__label">Your story</p>
										<p className="story-review__story">{draft.story.trim()}</p>
									</div>
								</div>
								<div className="story-actions">
										<button
											type="button"
											className="story-button"
											disabled={isSubmitting || submissionStatus === "success"}
											onClick={sendStory}
											aria-live="polite"
										>
											<span>{
												submissionStatus === "preparing" ? "Preparing your Crocs..."
													: submissionStatus === "sending" ? "Sending your story..."
														: submissionStatus === "success" ? "Story sent successfully!"
															: "Send my story"
													}</span>
										<ArrowRight size={19} aria-hidden="true" />
									</button>
										<button type="button" className="story-button story-button--outline" disabled={isSubmitting} onClick={() => setMode("form")}>
										<ArrowLeft size={19} aria-hidden="true" />
										<span>Edit my story</span>
									</button>
								</div>
									{isSubmitting ? (
										<p className="story-status" role="status">
											{submissionStatus === "preparing" ? "Preparing your Crocs..." : "Sending your story..."}
										</p>
									) : null}
									{submissionError ? <p className="story-status story-status--error" role="alert">{submissionError}</p> : null}
									{submissionStatus === "success" ? <p className="story-status story-status--success" role="status">Story sent successfully!</p> : null}
								</div>
							</>
						)}
					</div>
				</div>
			</section>
		</div>,
		document.body,
	);
}

export default StorySubmission;
