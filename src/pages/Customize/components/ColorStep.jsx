import { useEffect, useRef, useState } from "react";
import CustomizerScene from "../three/CustomizerScene.jsx";
import { gsap } from "../../../utils/gsap.js";
import { COLOR_GROUPS } from "../config/customizerConfig.js";
import { StepHeading, ViewControls, FlowFooter } from "./FlowComponents.jsx";

function ColorStep({
	color,
	colorId,
	onBack,
	onModelReady,
	onNext,
	onSelectColor,
	placements,
	rotations,
	view,
	onViewChange,
}) {
	const rootRef = useRef(null);
	const previousColor = useRef(colorId);
	const [rippleKey, setRippleKey] = useState(0);
	useEffect(() => {
		if (previousColor.current === colorId) return;
		previousColor.current = colorId;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const selected = rootRef.current?.querySelector(".color-swatches button.color-swatches__option--selected > span");
		const name = rootRef.current?.querySelector(".selected-color strong");
		const tweens = [
			selected && gsap.fromTo(selected, { scale: 0.84 }, { scale: 1, duration: 0.28, ease: "back.out(2)", overwrite: true }),
			name && gsap.fromTo(name, { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out", overwrite: true }),
		].filter(Boolean);
		return () => tweens.forEach((tween) => tween.kill());
	}, [colorId]);
	return (
		<main ref={rootRef} className="customizer-main customizer-main--color">
			<div className="color-step-content">
				<StepHeading
					step={2}
					title="Choose a Color"
					description="Pick the color that matches your vibe. You can always change this later!"
				/>

				<div className="color-layout">
					<section className="color-palette" aria-label="Crocs colors">
						{COLOR_GROUPS.map((group) => (
							<div key={group.id} className="color-group">
								<h2>{group.label}</h2>
								<div className="color-swatches">
									{group.colors.map((item) => (
										<button
											key={item.id}
											type="button"
											className={`color-swatches__option${item.id === colorId ? " color-swatches__option--selected" : ""}`}
											aria-label={`Choose ${item.label}`}
											aria-pressed={item.id === colorId}
											onClick={() => {
												if (item.id === colorId) return;
												setRippleKey((value) => value + 1);
												onSelectColor(item.id);
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
						aria-label="Selected Crocs color preview"
					>
						{rippleKey ? <span key={rippleKey} className="color-ripple" style={{ borderColor: color.value }} aria-hidden="true" /> : null}
						<ViewControls view={view} onChange={onViewChange} />
						<div className="product-paper__scene">
							<CustomizerScene
								bodyColor={color.value}
								onModelReady={onModelReady}
								onError={onModelReady}
								onSlotSelect={() => {}}
								onViewChange={onViewChange}
								placements={placements}
								rotations={rotations}
								view={view}
							/>
						</div>
						<p className="selected-color">
							Selected color: <strong>{color.label}</strong>
						</p>
						<span className="paper-doodle" aria-hidden="true">
							♡
						</span>
					</section>
				</div>
			</div>

			<FlowFooter
				nextLabel="Next"
				onBack={onBack}
				onNext={onNext}
				step={2}
			/>
		</main>
	);
}

export default ColorStep;
