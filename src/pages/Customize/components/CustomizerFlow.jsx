import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import Header from "../../../components/layout/Header/Header.jsx";
import CustomizerDecor from "./CustomizerDecor.jsx";
import { usePageTransition } from "../../../components/PageTransition/PageTransitionContext.js";
import useStepEntrance from "../animations/useStepEntrance.js";
import { gsap } from "../../../utils/gsap.js";
import PersonalityWrapped from "./PersonalityWrapped.jsx";
import StyleStep from "./StyleStep.jsx";
import ColorStep from "./ColorStep.jsx";
import CharmsStep from "./CharmsStep.jsx";
import PreviewStep from "./PreviewStep.jsx";
import { createInitialState, customizerReducer } from "./customizerReducer.js";
import { scorePersonality } from "../utils/scorePersonality.js";
import {
	CHARM_CATALOG,
	CHARM_SLOT_NAMES,
	COLOR_BY_ID,
} from "../config/customizerConfig.js";

function CustomizerFlow({ onExit }) {
	const { runTransition } = usePageTransition();
	const contentRef = useRef(null);
	const pendingReadyRef = useRef(null);
	const randomTimelineRef = useRef(null);
	const removeTweenRef = useRef(null);
	const removingRef = useRef(false);
	const [state, dispatch] = useReducer(
		customizerReducer,
		undefined,
		createInitialState,
	);
	const [view, setView] = useState("side");
	const [sparkleKey, setSparkleKey] = useState(0);
	const color = COLOR_BY_ID[state.colorId];
	const personalityResult = useMemo(
		() =>
			scorePersonality({
				colorId: state.colorId,
				placements: state.placements,
			}),
		[state.colorId, state.placements],
	);
	useStepEntrance(contentRef, state.step, state.phase);

	const handleDestinationReady = useCallback(() => {
		pendingReadyRef.current?.();
	}, []);

	const changeView = useCallback((direction, update) => {
		const onCovered = () => {
			update();
			window.scrollTo({ top: 0, behavior: "instant" });
		};
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
			runTransition({ direction, onCovered });
			return;
		}
		let finish;
		const destinationReady = new Promise((resolve) => { finish = resolve; });
		const started = runTransition({
			direction,
			onCovered,
			ready: () => destinationReady,
		});
		if (!started) return;
		const timeout = window.setTimeout(() => pendingReadyRef.current?.(), 10000);
		pendingReadyRef.current = () => {
			window.clearTimeout(timeout);
			pendingReadyRef.current = null;
			finish();
		};
	}, [runTransition]);
	useEffect(() => () => pendingReadyRef.current?.(), []);

	const goToStep = useCallback((step) => {
		if (state.phase === "customize" && step === state.step) return;
		changeView(step < state.step ? "back" : "forward", () => {
			dispatch({ type: "GO_TO_STEP", step });
			setView("side");
		});
	}, [changeView, state.phase, state.step]);
	const showShare = useCallback(() => {
		changeView("forward", () => dispatch({ type: "SHOW_SHARE" }));
	}, [changeView]);
	const customizeAgain = useCallback(() => {
		changeView("back", () => dispatch({ type: "BACK_TO_PREVIEW" }));
	}, [changeView]);

	const handleSlotSelect = useCallback(
		(slotName) => {
			if (state.placements[slotName]) {
				dispatch({ type: "OPEN_SLOT_EDITOR", slotName });
				return;
			}
			if (!state.selectedCharmId) return;
			dispatch({ type: "PLACE_CHARM", slotName });
			setSparkleKey((value) => value + 1);
		},
		[state.placements, state.selectedCharmId],
	);
	const removeCharm = useCallback((slotName) => {
		if (removingRef.current) return;
		const editor = contentRef.current?.querySelector('.slot-editor');
		if (!editor || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			dispatch({ type: 'REMOVE_CHARM', slotName });
			return;
		}
		removingRef.current = true;
		removeTweenRef.current = gsap.to(editor, { scale: 0.9, autoAlpha: 0, duration: 0.18, ease: 'power2.in', onComplete: () => {
			removingRef.current = false;
			removeTweenRef.current = null;
			dispatch({ type: 'REMOVE_CHARM', slotName });
		} });
	}, []);

	const randomizeDesign = useCallback(() => {
		if (randomTimelineRef.current?.isActive()) return;
		const colorIds = Object.keys(COLOR_BY_ID);
		const colorId = colorIds[Math.floor(Math.random() * colorIds.length)];
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
		const apply = () => dispatch({ type: "SET_RANDOM_DESIGN", colorId, placements });
		const scene = contentRef.current?.querySelector('.preview-stage__scene');
		const recap = contentRef.current?.querySelector('.customization-recap');
		if (!scene || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
		randomTimelineRef.current = gsap.timeline({ onComplete: () => { randomTimelineRef.current = null; } })
			.to(scene, { scale: 0.96, rotation: -2, duration: 0.16, ease: 'power2.in' })
			.call(apply)
			.to(scene, { scale: 1, rotation: 0, duration: 0.32, ease: 'back.out(1.6)' })
			.fromTo(recap, { x: 8 }, { x: 0, duration: 0.3, ease: 'power2.out' }, 0.18);
	}, []);
	useEffect(() => () => {
		randomTimelineRef.current?.kill();
		removeTweenRef.current?.kill();
	}, []);

	const currentContent = useMemo(() => {
		if (state.phase === "share") {
			return (
				<PersonalityWrapped
					color={color}
					onCustomizeAgain={customizeAgain}
					onEditCharms={() => goToStep(3)}
					onReady={handleDestinationReady}
					placements={state.placements}
					rotations={state.rotations}
					result={personalityResult}
				/>
			);
		}

		switch (state.step) {
			case 1:
				return (
					<StyleStep
						color={color}
						onModelReady={handleDestinationReady}
						onExit={onExit}
						onNext={() => goToStep(2)}
						rotations={state.rotations}
					/>
				);
			case 2:
				return (
					<ColorStep
						color={color}
						onModelReady={handleDestinationReady}
						colorId={state.colorId}
						onBack={() => goToStep(1)}
						onNext={() => goToStep(3)}
						onSelectColor={(colorId) =>
							dispatch({ type: "SELECT_COLOR", colorId })
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
						color={color}
						onModelReady={handleDestinationReady}
						editingSlot={state.editingSlot}
						onBack={() => goToStep(2)}
						onClear={() => dispatch({ type: "CLEAR_CHARMS" })}
						onCloseEditor={() => dispatch({ type: "CLOSE_SLOT_EDITOR" })}
						onNext={() => goToStep(4)}
						onRemove={() => removeCharm(state.editingSlot)}
						onRotate={() =>
							dispatch({
								type: "ROTATE_CHARM",
								slotName: state.editingSlot,
							})
						}
						onRotationChange={(rotation) =>
							dispatch({
								type: "SET_CHARM_ROTATION",
								slotName: state.editingSlot,
								rotation,
							})
						}
						onReplace={() =>
							dispatch({
								type: "REPLACE_CHARM",
								slotName: state.editingSlot,
							})
						}
						onSelectCharm={(charmId) =>
							dispatch({ type: "SELECT_CHARM", charmId })
						}
						onSlotSelect={handleSlotSelect}
						placements={state.placements}
						rotations={state.rotations}
						selectedCharmId={state.selectedCharmId}
						sparkleKey={sparkleKey}
						view={view}
						onViewChange={setView}
					/>
				);
			default:
				return (
					<PreviewStep
						color={color}
						onModelReady={handleDestinationReady}
						onEdit={goToStep}
						onRandomize={randomizeDesign}
						onReset={() => dispatch({ type: "RESET_DESIGN" })}
						onShare={showShare}
						placements={state.placements}
						rotations={state.rotations}
						view={view}
						onViewChange={setView}
					/>
				);
		}
	}, [
		color,
		goToStep,
		handleSlotSelect,
		handleDestinationReady,
		onExit,
		customizeAgain,
		randomizeDesign,
		removeCharm,
		showShare,
		personalityResult,
		state,
		sparkleKey,
		view,
	]);

	return (
		<div className="customizer-shell">
			<div className="customizer-paper-texture" aria-hidden="true" />
			{state.phase === "customize" && <CustomizerDecor />}
			<Header onAction={onExit} />
			<div ref={contentRef} className="customizer-content">{currentContent}</div>
			<p className="customizer-shell__status" aria-live="polite">
				{state.phase === "share"
					? `Personality Wrapped. Your style is ${personalityResult.primaryPersonality}.`
					: `Step ${state.step} of 4. ${Object.keys(state.placements).length} charms placed.`}
			</p>
		</div>
	);
}

export default CustomizerFlow;
