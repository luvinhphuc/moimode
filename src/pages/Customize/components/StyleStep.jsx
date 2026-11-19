import { Check } from "lucide-react";
import CustomizerScene from "../three/CustomizerScene.jsx";
import { StepHeading, FlowFooter } from "./FlowComponents.jsx";

function StyleStep({ colour, onExit, onModelReady, onNext, rotations }) {
	return (
		<main className="customizer-main customizer-main--style">
			<StepHeading
				step={1}
				title={<>Choose a Crocs<br className="style-heading-break" /> Style</>}
				description="Pick the style that fits your vibe. You can always change this later!"
			/>

			<section className="style-grid" aria-label="Available Crocs styles">
				<article className="style-card style-card--selected">
					<span className="style-card__radio">
						<Check size={13} />
					</span>
					<div className="style-card__scene">
						<CustomizerScene
							compactPreview
							controlsEnabled={false}
							onModelReady={onModelReady}
							onError={onModelReady}
							bodyColour={colour.value}
							onSlotSelect={() => {}}
							placements={{}}
							rotations={rotations}
							view="style"
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
				nextLabel="Start customizing"
				onBack={onExit}
				onNext={onNext}
				step={1}
			/>
		</main>
	);
}

export default StyleStep;
