import { ArrowLeft, ArrowRight, Pencil, RefreshCcw, Shuffle } from "lucide-react";
import CustomizerScene from "../three/CustomizerScene.jsx";
import { CHARM_BY_ID } from "../config/customizerConfig.js";
import { StepHeading, StepRail, ViewControls } from "./FlowComponents.jsx";

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
	onModelReady,
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
			<StepHeading
				step={4}
				title="Preview Your Design"
				description="Take a final look at your customized Crocs. Make changes anytime!"
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
							onModelReady={onModelReady}
							onError={onModelReady}
							onSlotSelect={() => {}}
							onViewChange={onViewChange}
							placements={placements}
							rotations={rotations}
							view={view}
						/>
					</div>
				</section>

				<aside className="customization-recap">
					<div className="customization-recap__title">
						<h2>Your Customization</h2>
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
					<div className="customization-recap__charms">
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

export default PreviewStep;
