import { Component } from "react";
import { useProgress } from "@react-three/drei";

export function SceneLoadingStatus({ isContextLost = false }) {
	const { active, errors, progress } = useProgress();

	if (!isContextLost && !active && errors.length === 0) return null;
	return (
		<div className={`customizer-scene-status${errors.length ? " is-error" : ""}`}>
			<span className="customizer-scene-status__dot" />
			{errors.length
				? "MODEL UNAVAILABLE"
				: isContextLost
					? "RESTORING 3D PREVIEW"
					: `LOADING ${Math.round(progress)}%`}
		</div>
	);
}

export class SceneErrorBoundary extends Component {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		return this.state.hasError ? (
			<div className="customizer-scene-status is-error">MODEL UNAVAILABLE</div>
		) : (
			this.props.children
		);
	}
}
