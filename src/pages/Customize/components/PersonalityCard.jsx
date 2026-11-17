import { useEffect, useRef, useState } from "react";
import { gsap } from "../../../utils/gsap.js";
import { PERSONALITIES } from "../config/personalityConfig.js";

function PersonalityCard({ personalityId }) {
	const [flipped, setFlipped] = useState(false);
	const tiltRef = useRef(null);
	const flipRef = useRef(null);
	const personality = PERSONALITIES[personalityId];

	useEffect(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		gsap.to(flipRef.current, {
			rotationY: flipped ? 180 : 0,
			duration: reduced ? 0 : 0.7,
			ease: "power3.inOut",
			overwrite: "auto",
		});
	}, [flipped]);

	useEffect(() => () => {
		gsap.killTweensOf([tiltRef.current, flipRef.current]);
	}, []);

	function handlePointerMove(event) {
		if (event.pointerType === "touch" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - bounds.left) / bounds.width - 0.5;
		const y = (event.clientY - bounds.top) / bounds.height - 0.5;
		gsap.to(tiltRef.current, {
			rotationX: -y * 20,
			rotationY: x * 20,
			scale: 1.03,
			duration: 0.25,
			ease: "power3.out",
			overwrite: "auto",
		});
	}

	function handlePointerLeave() {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		gsap.to(tiltRef.current, {
			rotationX: 0,
			rotationY: 0,
			scale: 1,
			duration: reduced ? 0 : 0.5,
			ease: "power3.out",
			overwrite: "auto",
		});
	}

	return (
		<button
			type="button"
			className="wrapped-card"
			aria-label={`${personality.name} card. ${flipped ? "Show front" : "Show back"}`}
			aria-pressed={flipped}
			onClick={() => setFlipped((value) => !value)}
			onPointerMove={handlePointerMove}
			onPointerLeave={handlePointerLeave}
		>
			<span className="wrapped-card__tilt" ref={tiltRef}>
				<span className="wrapped-card__flip" ref={flipRef}>
					<img className="wrapped-card__face" src={personality.front} alt={`${personality.name} front artwork`} draggable="false" />
					<img className="wrapped-card__face wrapped-card__face--back" src={personality.back} alt={`${personality.name} back artwork`} draggable="false" />
				</span>
			</span>
		</button>
	);
}

export default PersonalityCard;
