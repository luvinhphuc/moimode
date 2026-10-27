import { useCallback, useMemo, useReducer, useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Pencil,
	RefreshCcw,
	RotateCw,
	Shuffle,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";

import Header from "../../../components/layout/Header/Header.jsx";
import CharmCatalog from "./CharmCatalog.jsx";
import CustomizerScene from "../three/CustomizerScene.jsx";
import {
	CHARM_BY_ID,
	CHARM_CATALOG,
	CHARM_SLOT_NAMES,
	COLOUR_BY_ID,
	COLOUR_GROUPS,
	CUSTOMIZER_STEPS,
	DEFAULT_COLOUR_ID,
} from "../config/customizerConfig.js";

function createInitialState() {
	return {
		modelId: "classic-clog",
		colourId: DEFAULT_COLOUR_ID,
		placements: {},
		rotations: {},
		selectedCharmId: null,
		editingSlot: null,
		step: 1,
		phase: "customize",
	};
}

function customizerReducer(state, action) {
	switch (action.type) {
		case "GO_TO_STEP":
			return {
				...state,
				step: Math.min(4, Math.max(1, action.step)),
				phase: "customize",
				editingSlot: null,
			};
		case "SELECT_COLOUR":
			return { ...state, colourId: action.colourId };
		case "SELECT_CHARM":
			return { ...state, selectedCharmId: action.charmId };
		case "PLACE_CHARM":
			if (!state.selectedCharmId) return state;
			return {
				...state,
				placements: {
					...state.placements,
					[action.slotName]: state.selectedCharmId,
				},
				rotations: { ...state.rotations, [action.slotName]: 0 },
				editingSlot: null,
			};
		case "OPEN_SLOT_EDITOR":
			return { ...state, editingSlot: action.slotName };
		case "CLOSE_SLOT_EDITOR":
			return { ...state, editingSlot: null };
		case "REPLACE_CHARM":
			if (!state.selectedCharmId) return state;
			return {
				...state,
				placements: {
					...state.placements,
					[action.slotName]: state.selectedCharmId,
				},
				rotations: { ...state.rotations, [action.slotName]: 0 },
				editingSlot: null,
			};
		case "ROTATE_CHARM":
			return {
				...state,
				rotations: {
					...state.rotations,
					[action.slotName]:
						(state.rotations[action.slotName] ?? 0) + Math.PI / 2,
				},
			};
		case "SET_CHARM_ROTATION":
			return {
				...state,
				rotations: {
					...state.rotations,
					[action.slotName]: action.rotation,
				},
			};
		case "REMOVE_CHARM": {
			const placements = { ...state.placements };
			const rotations = { ...state.rotations };
			delete placements[action.slotName];
			delete rotations[action.slotName];
			return { ...state, placements, rotations, editingSlot: null };
		}
		case "CLEAR_CHARMS":
			return { ...state, placements: {}, rotations: {}, editingSlot: null };
		case "RESET_DESIGN":
			return {
				...state,
				colourId: DEFAULT_COLOUR_ID,
				placements: {},
				rotations: {},
				selectedCharmId: null,
				editingSlot: null,
			};
		case "SET_RANDOM_DESIGN":
			return {
				...state,
				colourId: action.colourId,
				placements: action.placements,
				rotations: {},
				editingSlot: null,
			};
		case "SHOW_SHARE":
			return { ...state, phase: "share", editingSlot: null };
		case "BACK_TO_PREVIEW":
			return { ...state, phase: "customize", step: 4 };
		default:
			return state;
	}
}

function StepHeading({ step, title, description, accent = "ink" }) {
	return (
		<div className={`customizer-heading customizer-heading--${accent}`}>
			<p>Step {step}/4</p>
			<h1>{title}</h1>
			<span>{description}</span>
		</div>
	);
}

function ProgressDots({ step }) {
	return (
		<div className="customizer-progress" aria-label={`Step ${step} of 4`}>
			{CUSTOMIZER_STEPS.map((item) => (
				<span
					key={item.id}
					className={
						item.id === step ? "is-active" : item.id < step ? "is-done" : ""
					}
				/>
			))}
		</div>
	);
}

function StepRail({ currentStep, onEdit }) {
	return (
		<ol className="step-rail" aria-label="Customization steps">
			{CUSTOMIZER_STEPS.map((item) => (
				<li
					key={item.id}
					className={item.id === currentStep ? "is-active" : ""}
				>
					<button type="button" onClick={() => onEdit(item.id)}>
						<span>{item.id}</span>
						{item.label}
					</button>
				</li>
			))}
		</ol>
	);
}

function ViewControls({ view, onChange }) {
	return (
		<div className="view-controls" aria-label="Model view">
			{[
				["side", "Side view"],
				["top", "Top view"],
				["back", "Back view"],
			].map(([id, label]) => (
				<button
					key={id}
					type="button"
					className={view === id ? "is-active" : ""}
					aria-pressed={view === id}
					onClick={() => onChange(id)}
				>
					{label}
				</button>
			))}
		</div>
	);
}

function FlowFooter({ backLabel = "Back", nextLabel, onBack, onNext, step }) {
	return (
		<footer className="customizer-footer">
			<button
				className="paper-button paper-button--back"
				type="button"
				onClick={onBack}
			>
				<ArrowLeft aria-hidden="true" size={17} />
				{backLabel}
			</button>
			<ProgressDots step={step} />
			<button
				className="paper-button paper-button--primary"
				type="button"
				onClick={onNext}
			>
				{nextLabel}
				<ArrowRight aria-hidden="true" size={18} />
			</button>
		</footer>
	);
}

function StyleStep({
	colour,
	onExit,
	onNext,
	placements,
	rotations,
	view,
	onViewChange,
}) {
	return (
		<main className="customizer-main customizer-main--style">
			<div className="tape-note tape-note--blue" aria-hidden="true">
				Same canvas.
				<br />
				Different vibes.
			</div>
			<StepHeading
				step={1}
				title="Choose a Crocs Style"
				description="Pick the style that fits your vibe. You can always change this later!"
			/>

			<section className="style-grid" aria-label="Available Crocs styles">
				<article className="style-card is-selected">
					<span className="style-card__radio">
						<Check size={13} />
					</span>
					<span className="style-card__tag">Classic & timeless ♡</span>
					<div className="style-card__scene">
						<CustomizerScene
							controlsEnabled={false}
							bodyColour={colour.value}
							onSlotSelect={() => {}}
							onViewChange={onViewChange}
							placements={{}}
							rotations={rotations}
							view={view}
						/>
					</div>
					<div className="style-card__copy">
						<h2>Classic Clog</h2>
						<p>
							The original icon. Versatile, comfortable and ready for your own
							twist.
						</p>
					</div>
				</article>
			</section>

			<FlowFooter
				backLabel="Back home"
				nextLabel="Start customising"
				onBack={onExit}
				onNext={onNext}
				step={1}
			/>
		</main>
	);
}

function ColourStep({
	colour,
	colourId,
	onBack,
	onNext,
	onSelectColour,
	placements,
	rotations,
	view,
	onViewChange,
}) {
	return (
		<main className="customizer-main customizer-main--colour">
			<div className="tape-note tape-note--blue" aria-hidden="true">
				Same shoe.
				<br />
				Different you.
			</div>
			<StepHeading
				step={2}
				title="Choose a Colour"
				description="Pick the colour that matches your vibe. You can always change this later!"
			/>

			<div className="colour-layout">
				<section className="colour-palette" aria-label="Crocs colours">
					{COLOUR_GROUPS.map((group) => (
						<div key={group.id} className="colour-group">
							<h2>{group.label}</h2>
							<div className="colour-swatches">
								{group.colours.map((item) => (
									<button
										key={item.id}
										type="button"
										className={item.id === colourId ? "is-selected" : ""}
										aria-label={`Choose ${item.label}`}
										aria-pressed={item.id === colourId}
										onClick={() => onSelectColour(item.id)}
									>
										<span style={{ backgroundColor: item.value }} />
										<small>{item.label}</small>
									</button>
								))}
							</div>
						</div>
					))}
				</section>

				<section
					className="product-paper"
					aria-label="Selected Crocs colour preview"
				>
					<ViewControls view={view} onChange={onViewChange} />
					<div className="product-paper__scene">
						<CustomizerScene
							bodyColour={colour.value}
							onSlotSelect={() => {}}
							onViewChange={onViewChange}
							placements={placements}
							rotations={rotations}
							view={view}
						/>
					</div>
					<p className="selected-colour">
						Selected colour: <strong>{colour.label}</strong>
					</p>
					<span className="paper-doodle" aria-hidden="true">
						♡
					</span>
				</section>
			</div>

			<FlowFooter
				nextLabel="Next: Add charms"
				onBack={onBack}
				onNext={onNext}
				step={2}
			/>
		</main>
	);
}

function DesignSummary({ colour }) {
	return (
		<aside className="design-summary">
			<div>
				<p>Your style</p>
				<strong>Classic Clog</strong>
				<span>›</span>
			</div>
			<div>
				<p>Your colour</p>
				<strong>
					<i style={{ backgroundColor: colour.value }} />
					{colour.label}
				</strong>
				<span>›</span>
			</div>
		</aside>
	);
}

function SlotEditor({
	currentCharmId,
	onClose,
	onRemove,
	onRotate,
	onRotationChange,
	onReplace,
	rotation = 0,
	selectedCharmId,
}) {
	const currentCharm = CHARM_BY_ID[currentCharmId];
	const selectedCharm = CHARM_BY_ID[selectedCharmId];
	const rotationDegrees = Math.round(
		((((rotation * 180) / Math.PI) % 360) + 360) % 360,
	);

	return (
		<div className="slot-editor" role="dialog" aria-label="Edit placed charm">
			<button
				className="slot-editor__close"
				type="button"
				onClick={onClose}
				aria-label="Close"
			>
				<X size={15} />
			</button>
			<p>Placed charm</p>
			<strong>{currentCharm.label}</strong>
			<div className="slot-editor__rotation">
				<label htmlFor="charm-rotation">
					<span>Rotation</span>
					<output>{rotationDegrees}°</output>
				</label>
				<input
					id="charm-rotation"
					max="359"
					min="0"
					onChange={(event) =>
						onRotationChange((Number(event.target.value) * Math.PI) / 180)
					}
					step="1"
					type="range"
					value={rotationDegrees}
				/>
			</div>
			<div className="slot-editor__actions">
				<button type="button" onClick={onRotate}>
					<RotateCw size={14} />
					Rotate
				</button>
				<button
					type="button"
					onClick={onReplace}
					disabled={!selectedCharm || currentCharmId === selectedCharmId}
				>
					<RefreshCcw size={14} />
					{selectedCharm
						? `Replace with ${selectedCharm.label}`
						: "Select a charm to replace"}
				</button>
				<button type="button" className="is-danger" onClick={onRemove}>
					<Trash2 size={14} />
					Remove
				</button>
			</div>
		</div>
	);
}

function CharmsStep({
	colour,
	editingSlot,
	onBack,
	onClear,
	onCloseEditor,
	onNext,
	onRemove,
	onRotate,
	onRotationChange,
	onReplace,
	onSelectCharm,
	onSlotSelect,
	placements,
	rotations,
	selectedCharmId,
	view,
	onViewChange,
}) {
	const placementCount = Object.keys(placements).length;

	return (
		<main className="customizer-main customizer-main--charms">
			<div className="tape-note tape-note--pink" aria-hidden="true">
				Small charms.
				<br />
				Big personality.
			</div>
			<StepHeading
				step={3}
				title="Add Charms"
				description="Pick a favourite, then tap a pink spot on your clog."
				accent="pink"
			/>

			<div className="charms-layout">
				<DesignSummary colour={colour} />
				<section
					className="charms-stage"
					aria-label="Place charms on your Crocs"
				>
					<div className="charms-stage__topbar">
						<span>{placementCount}/13 slots filled</span>
						<button
							type="button"
							onClick={onClear}
							disabled={placementCount === 0}
						>
							<Trash2 size={14} /> Clear all
						</button>
					</div>
					<div className="charms-stage__scene">
						<CustomizerScene
							bodyColour={colour.value}
							interactiveSlots
							onSlotSelect={onSlotSelect}
							onViewChange={onViewChange}
							placements={placements}
							selectedSlot={editingSlot}
							rotations={rotations}
							view={view}
						/>
					</div>
					{editingSlot ? (
						<SlotEditor
							currentCharmId={placements[editingSlot]}
							onClose={onCloseEditor}
							onRemove={onRemove}
							onRotate={onRotate}
							onRotationChange={onRotationChange}
							onReplace={onReplace}
							rotation={rotations?.[editingSlot] ?? 0}
							selectedCharmId={selectedCharmId}
						/>
					) : null}
					<ViewControls view={view} onChange={onViewChange} />
					<p className="placement-hint">
						<Sparkles size={14} /> Select a charm, then tap a pink marker.
					</p>
				</section>
				<CharmCatalog
					onSelect={onSelectCharm}
					selectedCharmId={selectedCharmId}
				/>
			</div>

			<FlowFooter
				nextLabel="Next: Preview your design"
				onBack={onBack}
				onNext={onNext}
				step={3}
			/>
		</main>
	);
}

function CharmRecap({ placements }) {
	const charmIds = Object.values(placements);
	return (
		<div className="recap-charms">
			{charmIds.length ? (
				charmIds.slice(0, 8).map((charmId, index) => (
					<span key={`${charmId}-${index}`} title={CHARM_BY_ID[charmId].label}>
						{CHARM_BY_ID[charmId].label.slice(0, 1)}
					</span>
				))
			) : (
				<small>No charms yet</small>
			)}
		</div>
	);
}

function PreviewStep({
	colour,
	onEdit,
	onRandomise,
	onReset,
	onShare,
	placements,
	rotations,
	view,
	onViewChange,
}) {
	return (
		<main className="customizer-main customizer-main--preview">
			<div className="tape-note tape-note--blue" aria-hidden="true">
				Your style.
				<br />
				Your story.
			</div>
			<StepHeading
				step={4}
				title="Preview Your Design"
				description="Take a final look at your customised Crocs. Make changes anytime!"
			/>

			<div className="preview-layout">
				<StepRail currentStep={4} onEdit={onEdit} />
				<section className="preview-stage">
					<div className="preview-stage__toolbar">
						<ViewControls view={view} onChange={onViewChange} />
						<div>
							<button type="button" onClick={onReset}>
								<RefreshCcw size={14} /> Reset
							</button>
							<button type="button" onClick={onRandomise}>
								<Shuffle size={14} /> Randomise
							</button>
						</div>
					</div>
					<div className="preview-stage__scene">
						<CustomizerScene
							bodyColour={colour.value}
							onSlotSelect={() => {}}
							onViewChange={onViewChange}
							placements={placements}
							rotations={rotations}
							view={view}
						/>
					</div>
				</section>

				<aside className="customisation-recap">
					<div className="customisation-recap__title">
						<h2>Your Customisation</h2>
						<button type="button" onClick={() => onEdit(3)}>
							<Pencil size={14} /> Edit
						</button>
					</div>
					<button type="button" onClick={() => onEdit(1)}>
						<span>Style</span>
						<strong>Classic Clog</strong>
						<ArrowRight size={16} />
					</button>
					<button type="button" onClick={() => onEdit(2)}>
						<span>Colour</span>
						<strong>
							<i style={{ backgroundColor: colour.value }} />
							{colour.label}
						</strong>
						<ArrowRight size={16} />
					</button>
					<div className="customisation-recap__charms">
						<span>Charms / Jibbitz ({Object.keys(placements).length})</span>
						<CharmRecap placements={placements} />
					</div>
				</aside>
			</div>

			<footer className="preview-footer">
				<button
					className="paper-button paper-button--back"
					type="button"
					onClick={() => onEdit(3)}
				>
					<ArrowLeft size={17} /> Back to edit
				</button>
				<button
					className="paper-button paper-button--primary"
					type="button"
					onClick={onShare}
				>
					Save & share my design <ArrowRight size={18} />
				</button>
			</footer>
		</main>
	);
}

function SkeletonBlock({ className = "" }) {
	return <span className={`skeleton-block ${className}`} />;
}

function SaveShareSkeleton({ colour, onBack, placements, rotations }) {
	return (
		<main
			className="share-skeleton"
			aria-busy="true"
			aria-label="Save and share coming soon"
		>
			<section className="share-skeleton__hero">
				<div className="tape-note tape-note--blue" aria-hidden="true">
					Your personality is...
				</div>
				<p className="share-skeleton__eyebrow">Coming next</p>
				<h1>
					Save & Share
					<br />
					Your Crocs Style
				</h1>
				<SkeletonBlock className="is-copy" />
				<SkeletonBlock className="is-copy is-short" />
				<div className="share-skeleton__shoe">
					<CustomizerScene
						bodyColour={colour.value}
						onSlotSelect={() => {}}
						onViewChange={() => {}}
						placements={placements}
						rotations={rotations}
						view="side"
					/>
				</div>
			</section>

			<section className="share-skeleton__panel">
				<div>
					<SkeletonBlock className="is-title" />
					<SkeletonBlock className="is-copy" />
					<SkeletonBlock className="is-copy is-short" />
				</div>
				<div className="share-skeleton__platforms">
					{Array.from({ length: 4 }, (_, index) => (
						<span key={index}>
							<SkeletonBlock className="is-circle" />
							<SkeletonBlock className="is-label" />
						</span>
					))}
				</div>
				<div className="share-skeleton__socials">
					<SkeletonBlock className="is-social" />
					<SkeletonBlock className="is-social" />
				</div>
			</section>

			<section className="share-skeleton__recap">
				<h2>Your customisation recap</h2>
				<div>
					<SkeletonBlock />
					<SkeletonBlock />
					<SkeletonBlock />
				</div>
			</section>
			<button
				className="paper-button paper-button--back share-skeleton__back"
				type="button"
				onClick={onBack}
			>
				<ArrowLeft size={17} /> Back to preview
			</button>
		</main>
	);
}

function CustomizerFlow({ onExit }) {
	const [state, dispatch] = useReducer(
		customizerReducer,
		undefined,
		createInitialState,
	);
	const [view, setView] = useState("side");
	const colour = COLOUR_BY_ID[state.colourId];

	const goToStep = useCallback((step) => {
		dispatch({ type: "GO_TO_STEP", step });
		setView("side");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	const handleSlotSelect = useCallback(
		(slotName) => {
			if (state.placements[slotName]) {
				dispatch({ type: "OPEN_SLOT_EDITOR", slotName });
				return;
			}
			dispatch({ type: "PLACE_CHARM", slotName });
		},
		[state.placements],
	);

	const randomiseDesign = useCallback(() => {
		const colourIds = Object.keys(COLOUR_BY_ID);
		const colourId = colourIds[Math.floor(Math.random() * colourIds.length)];
		const shuffledCharms = [...CHARM_CATALOG].sort(() => Math.random() - 0.5);
		const shuffledSlots = [...CHARM_SLOT_NAMES].sort(() => Math.random() - 0.5);
		const count = 3 + Math.floor(Math.random() * 4);
		const placements = Object.fromEntries(
			shuffledSlots
				.slice(0, count)
				.map((slotName, index) => [
					slotName,
					shuffledCharms[index % shuffledCharms.length].id,
				]),
		);
		dispatch({ type: "SET_RANDOM_DESIGN", colourId, placements });
	}, []);

	const currentContent = useMemo(() => {
		if (state.phase === "share") {
			return (
				<SaveShareSkeleton
					colour={colour}
					onBack={() => dispatch({ type: "BACK_TO_PREVIEW" })}
					placements={state.placements}
					rotations={state.rotations}
				/>
			);
		}

		switch (state.step) {
			case 1:
				return (
					<StyleStep
						colour={colour}
						onExit={onExit}
						onNext={() => goToStep(2)}
						placements={state.placements}
						rotations={state.rotations}
						view={view}
						onViewChange={setView}
					/>
				);
			case 2:
				return (
					<ColourStep
						colour={colour}
						colourId={state.colourId}
						onBack={() => goToStep(1)}
						onNext={() => goToStep(3)}
						onSelectColour={(colourId) =>
							dispatch({ type: "SELECT_COLOUR", colourId })
						}
						placements={state.placements}
						rotations={state.rotations}
						view={view}
						onViewChange={setView}
					/>
				);
			case 3:
				return (
					<CharmsStep
						colour={colour}
						editingSlot={state.editingSlot}
						onBack={() => goToStep(2)}
						onClear={() => dispatch({ type: "CLEAR_CHARMS" })}
						onCloseEditor={() => dispatch({ type: "CLOSE_SLOT_EDITOR" })}
						onNext={() => goToStep(4)}
						onRemove={() =>
							dispatch({ type: "REMOVE_CHARM", slotName: state.editingSlot })
						}
						onRotate={() =>
							dispatch({ type: "ROTATE_CHARM", slotName: state.editingSlot })
						}
						onRotationChange={(rotation) =>
							dispatch({
								type: "SET_CHARM_ROTATION",
								slotName: state.editingSlot,
								rotation,
							})
						}
						onReplace={() =>
							dispatch({ type: "REPLACE_CHARM", slotName: state.editingSlot })
						}
						onSelectCharm={(charmId) =>
							dispatch({ type: "SELECT_CHARM", charmId })
						}
						onSlotSelect={handleSlotSelect}
						placements={state.placements}
						rotations={state.rotations}
						selectedCharmId={state.selectedCharmId}
						view={view}
						onViewChange={setView}
					/>
				);
			default:
				return (
					<PreviewStep
						colour={colour}
						onEdit={goToStep}
						onRandomise={randomiseDesign}
						onReset={() => dispatch({ type: "RESET_DESIGN" })}
						onShare={() => dispatch({ type: "SHOW_SHARE" })}
						placements={state.placements}
						rotations={state.rotations}
						view={view}
						onViewChange={setView}
					/>
				);
		}
	}, [
		colour,
		goToStep,
		handleSlotSelect,
		onExit,
		randomiseDesign,
		state,
		view,
	]);

	return (
		<div className="customizer-shell">
			<div className="customizer-paper-texture" aria-hidden="true" />
			<Header onAction={onExit} />
			{currentContent}
			<p className="sr-only" aria-live="polite">
				Step {state.step} of 4. {Object.keys(state.placements).length} charms
				placed.
			</p>
		</div>
	);
}

export default CustomizerFlow;
