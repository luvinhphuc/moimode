import { useCallback, useMemo, useReducer, useState } from "react";

import Header from "../../../components/layout/Header/Header.jsx";
import PersonalityWrapped from "./PersonalityWrapped.jsx";
import StyleStep from "./StyleStep.jsx";
import ColourStep from "./ColourStep.jsx";
import CharmsStep from "./CharmsStep.jsx";
import PreviewStep from "./PreviewStep.jsx";
import { createInitialState, customizerReducer } from "./customizerReducer.js";
import { scorePersonality } from "../utils/scorePersonality.js";
import {
	CHARM_CATALOG,
	CHARM_SLOT_NAMES,
	COLOUR_BY_ID,
} from "../config/customizerConfig.js";

function CustomizerFlow({ onExit }) {
	const [state, dispatch] = useReducer(
		customizerReducer,
		undefined,
		createInitialState,
	);
	const [view, setView] = useState("side");
	const colour = COLOUR_BY_ID[state.colourId];
	const personalityResult = useMemo(
		() =>
			scorePersonality({
				colourId: state.colourId,
				placements: state.placements,
			}),
		[state.colourId, state.placements],
	);

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
				<PersonalityWrapped
					colour={colour}
					onCustomizeAgain={() => dispatch({ type: "BACK_TO_PREVIEW" })}
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
						colour={colour}
						onExit={onExit}
						onNext={() => goToStep(2)}
						rotations={state.rotations}
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
							dispatch({
								type: "REMOVE_CHARM",
								slotName: state.editingSlot,
							})
						}
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
		personalityResult,
		state,
		view,
	]);

	return (
		<div className="customizer-shell">
			<div className="customizer-paper-texture" aria-hidden="true" />
			<Header onAction={onExit} />
			{currentContent}
			<p className="customizer-shell__status" aria-live="polite">
				{state.phase === "share"
					? `Personality Wrapped. Your style is ${personalityResult.primaryPersonality}.`
					: `Step ${state.step} of 4. ${Object.keys(state.placements).length} charms placed.`}
			</p>
		</div>
	);
}

export default CustomizerFlow;
