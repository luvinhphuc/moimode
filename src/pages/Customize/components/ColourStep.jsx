import CustomizerScene from "../three/CustomizerScene.jsx";
import { COLOUR_GROUPS } from "../config/customizerConfig.js";
import { StepHeading, ViewControls, FlowFooter } from "./FlowComponents.jsx";

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
										<span
											style={{
												backgroundColor: item.value,
											}}
										/>
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

export default ColourStep;
