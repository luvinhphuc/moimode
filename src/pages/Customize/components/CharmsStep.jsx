import { RefreshCcw, RotateCw, Sparkles, Trash2, X } from "lucide-react";
import CharmCatalog from "./CharmCatalog.jsx";
import CustomizerScene from "../three/CustomizerScene.jsx";
import { CHARM_BY_ID } from "../config/customizerConfig.js";
import { StepHeading, ViewControls, FlowFooter } from "./FlowComponents.jsx";

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
				<button type="button" className="slot-editor__action" onClick={onRotate}>
					<RotateCw size={14} />
					Rotate
				</button>
				<button
					type="button"
					className="slot-editor__action"
					onClick={onReplace}
					disabled={!selectedCharm || currentCharmId === selectedCharmId}
				>
					<RefreshCcw size={14} />
					{selectedCharm
						? `Replace with ${selectedCharm.label}`
						: "Select a charm to replace"}
				</button>
				<button type="button" className="slot-editor__action slot-editor__action--danger" onClick={onRemove}>
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
	onModelReady,
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
	sparkleKey,
	view,
	onViewChange,
}) {
	const placementCount = Object.keys(placements).length;

	return (
		<main className="customizer-main customizer-main--charms">
			<StepHeading
				step={3}
				title="Add Charms"
				description="Pick a favourite, then tap a pink spot on your clog."
				accent="pink"
			/>

			<div className="charms-layout">
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
							onModelReady={onModelReady}
							onError={onModelReady}
							interactiveSlots
							onSlotSelect={onSlotSelect}
							onViewChange={onViewChange}
							placements={placements}
							selectedSlot={editingSlot}
							rotations={rotations}
							selectedCharmId={selectedCharmId}
							view={view}
						/>
					</div>
					{sparkleKey ? <span key={sparkleKey} className="charm-placement-sparkle" aria-hidden="true">✦</span> : null}
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

export default CharmsStep;
