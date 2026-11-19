import { DEFAULT_COLOR_ID } from "../config/customizerConfig.js";

function createInitialState() {
	return {
		modelId: "classic-clog",
		colorId: DEFAULT_COLOR_ID,
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
		case "SELECT_COLOR":
			return { ...state, colorId: action.colorId };
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
			return {
				...state,
				placements: {},
				rotations: {},
				editingSlot: null,
			};
		case "RESET_DESIGN":
			return {
				...state,
				colorId: DEFAULT_COLOR_ID,
				placements: {},
				rotations: {},
				selectedCharmId: null,
				editingSlot: null,
			};
		case "SET_RANDOM_DESIGN":
			return {
				...state,
				colorId: action.colorId,
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

export { createInitialState, customizerReducer };
