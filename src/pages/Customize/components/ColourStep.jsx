import { useEffect, useRef, useState } from "react";
import CustomizerScene from "../three/CustomizerScene.jsx";
import { gsap } from "../../../utils/gsap.js";
import { COLOUR_GROUPS } from "../config/customizerConfig.js";
import { StepHeading, ViewControls, FlowFooter } from "./FlowComponents.jsx";

function ColourStep({
	colour,
	colourId,
	onBack,
	onModelReady,
	onNext,
	onSelectColour,
	placements,
	rotations,
	view,
	onViewChange,
}) {
	const rootRef = useRef(null);
	const previousColour = useRef(colourId);
	const [rippleKey, setRippleKey] = useState(0);
	useEffect(() => {
		if (previousColour.current === colourId) return;
		previousColour.current = colourId;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const selected = rootRef.current?.querySelector(".colour-swatches button.colour-swatches__option--selected > span");
		const name = rootRef.current?.querySelector(".selected-colour strong");
		const tweens = [
			selected && gsap.fromTo(selected, { scale: 0.84 }, { scale: 1, duration: 0.28, ease: "back.out(2)", overwrite: true }),
			name && gsap.fromTo(name, { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out", overwrite: true }),
		].filter(Boolean);
		return () => tweens.forEach((tween) => tween.kill());
	}, [colourId]);
	return (
		<main ref={rootRef} className="customizer-main customizer-main--colour">
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
										className={`colour-swatches__option${item.id === colourId ? " colour-swatches__option--selected" : ""}`}
										aria-label={`Choose ${item.label}`}
										aria-pressed={item.id === colourId}
										onClick={() => {
											if (item.id === colourId) return;
											setRippleKey((value) => value + 1);
											onSelectColour(item.id);
										}}
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
					{rippleKey ? <span key={rippleKey} className="colour-ripple" style={{ borderColor: colour.value }} aria-hidden="true" /> : null}
					<ViewControls view={view} onChange={onViewChange} />
					<div className="product-paper__scene">
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
