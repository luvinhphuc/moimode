import { Component } from "react";
import { useProgress } from "@react-three/drei";

export function SceneLoadingStatus({ isContextLost = false, modelPending }) {
	const { active, errors, progress } = useProgress();
	const useLocalStatus = modelPending !== undefined;
	const hasError = !useLocalStatus && errors.length > 0;
	const isLoading = modelPending ?? active;
	const loadingLabel = `LOADING ${Math.round(progress)}%`;

	if (!isContextLost && (!isLoading || useLocalStatus) && !hasError) return null;
	return (
		<div className={`customizer-scene-status${hasError ? " is-error" : ""}`} role={useLocalStatus ? "status" : undefined}>
			<span className="customizer-scene-status__dot" />
			{hasError
				? "MODEL UNAVAILABLE"
				: isContextLost
					? "RESTORING 3D PREVIEW"
					: loadingLabel}
		</div>
	);
}

export class SceneErrorBoundary extends Component {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error) {
		this.props.onError?.(error);
	}

	render() {
		return this.state.hasError ? (
			<div className="customizer-scene-status is-error">MODEL UNAVAILABLE</div>
		) : (
			this.props.children
		);
	}
}
