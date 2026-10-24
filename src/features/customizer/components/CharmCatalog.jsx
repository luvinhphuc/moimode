import {
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, View } from "@react-three/drei";
import { Check, Search } from "lucide-react";

import {
	ACESFilmicToneMapping,
	SRGBColorSpace,
	Vector3,
} from "../../../utils/three.js";
import { CHARM_CATALOG, CHARM_CATEGORIES } from "../config/customizerConfig.js";
import {
	getCharmOrientationQuaternion,
	normalizeCharmScene,
} from "../utils/charmModel.js";

const THUMBNAIL_FRONT_AXIS = new Vector3(0, 0, 1);
const THUMBNAIL_UP_AXIS = new Vector3(0, 1, 0);
const THUMBNAIL_TARGET_SIZE = 1.35;

function CharmThumbnail({ charm }) {
	const { scene } = useGLTF(charm.url);
	const { object, quaternion, scale } = useMemo(() => {
		const normalized = normalizeCharmScene(scene, charm.orientation);
		return {
			object: normalized.object,
			quaternion: getCharmOrientationQuaternion(
				normalized.frontAxis,
				normalized.upAxis,
				THUMBNAIL_FRONT_AXIS,
				THUMBNAIL_UP_AXIS,
			),
			scale:
				(THUMBNAIL_TARGET_SIZE / normalized.maxSize) * charm.previewScale,
		};
	}, [charm, scene]);

	return (
		<>
			<ambientLight intensity={2.1} />
			<directionalLight intensity={3.1} position={[3, 4, 5]} />
			<directionalLight color="#f7b4d0" intensity={1.1} position={[-3, 1, 2]} />
			<group quaternion={quaternion} scale={scale}>
				<primitive object={object} dispose={null} />
			</group>
		</>
	);
}

function CharmCardPreview({ charm }) {
	return (
		<View className="charm-card__view" frames={Infinity}>
			<Suspense fallback={null}>
				<CharmThumbnail charm={charm} />
			</Suspense>
		</View>
	);
}

function CharmCatalogCanvas({ contentHeight, onReady }) {
	const canvasHeight = contentHeight > 0 ? `${contentHeight}px` : "100%";

	return (
		<Canvas
			className="charm-catalog__canvas"
			style={{ "--charm-catalog-height": canvasHeight }}
			camera={{ position: [0, 0, 3], fov: 34 }}
			dpr={[1, 1.5]}
			frameloop="demand"
			gl={{ alpha: true, antialias: true }}
			onCreated={({ gl, invalidate }) => {
				gl.outputColorSpace = SRGBColorSpace;
				gl.toneMapping = ACESFilmicToneMapping;
				gl.toneMappingExposure = 1;
				onReady(invalidate);
				invalidate();
			}}
		>
			<View.Port />
		</Canvas>
	);
}

function CharmCatalog({ onSelect, selectedCharmId }) {
	const [activeCategory, setActiveCategory] = useState("all");
	const [query, setQuery] = useState("");
	const [contentHeight, setContentHeight] = useState(0);
	const gridRef = useRef(null);
	const invalidateRef = useRef(null);
	const refreshPreviews = useCallback(() => {
		invalidateRef.current?.();
	}, []);
	const handleCanvasReady = useCallback((invalidate) => {
		invalidateRef.current = invalidate;
	}, []);

	const filteredCharms = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase("vi");
		return CHARM_CATALOG.filter((item) => {
			const matchesCategory =
				activeCategory === "all" || item.categories.includes(activeCategory);
			const matchesQuery =
				!normalizedQuery ||
				item.label.toLocaleLowerCase("vi").includes(normalizedQuery) ||
				item.id.includes(normalizedQuery);
			return matchesCategory && matchesQuery;
		});
	}, [activeCategory, query]);

	const updateContentHeight = useCallback(() => {
		const grid = gridRef.current;
		if (!grid) return;
		const nextHeight = grid.scrollHeight;
		setContentHeight((currentHeight) =>
			currentHeight === nextHeight ? currentHeight : nextHeight,
		);
	}, []);

	useLayoutEffect(() => {
		let frame = 0;
		const measure = () => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				updateContentHeight();
				refreshPreviews();
			});
		};

		measure();
		const observer = new ResizeObserver(measure);
		if (gridRef.current) observer.observe(gridRef.current);
		window.addEventListener("resize", measure, { passive: true });
		window.visualViewport?.addEventListener("resize", measure, {
			passive: true,
		});

		return () => {
			window.cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", measure);
			window.visualViewport?.removeEventListener("resize", measure);
		};
	}, [filteredCharms, refreshPreviews, updateContentHeight]);

	useEffect(() => {
		refreshPreviews();
	}, [contentHeight, filteredCharms, refreshPreviews]);

	useEffect(() => {
		const grid = gridRef.current;
		if (!grid) return undefined;

		grid.addEventListener("scroll", refreshPreviews, { passive: true });
		window.addEventListener("scroll", refreshPreviews, { passive: true });

		return () => {
			grid.removeEventListener("scroll", refreshPreviews);
			window.removeEventListener("scroll", refreshPreviews);
		};
	}, [refreshPreviews]);

	useEffect(() => {
		return () => {
			invalidateRef.current = null;
		};
	}, []);

	return (
		<aside className="charm-catalog" aria-label="Charm catalogue">
			<div className="charm-catalog__content">
				<div className="charm-catalog__heading">
					<p>Make it yours</p>
					<h2>Add Charms / Jibbitz</h2>
				</div>

				<label className="charm-search">
					<Search aria-hidden="true" size={15} strokeWidth={2} />
					<span className="sr-only">Search charms</span>
					<input
						type="search"
						value={query}
						placeholder="Search charms..."
						onChange={(event) => setQuery(event.target.value)}
					/>
				</label>

				<div className="charm-filters" aria-label="Filter charms">
					{CHARM_CATEGORIES.map((category) => (
						<button
							key={category.id}
							type="button"
							className={activeCategory === category.id ? "is-active" : ""}
							aria-pressed={activeCategory === category.id}
							onClick={() => setActiveCategory(category.id)}
						>
							{category.label}
						</button>
					))}
				</div>

				<div
					ref={gridRef}
					className="charm-grid"
					role="listbox"
					aria-label="Available charms"
				>
					<CharmCatalogCanvas
						contentHeight={contentHeight}
						onReady={handleCanvasReady}
					/>
					{filteredCharms.map((item) => {
						const isSelected = item.id === selectedCharmId;
						return (
							<button
								key={item.id}
								type="button"
								className={`charm-card${isSelected ? " is-selected" : ""}`}
								role="option"
								aria-label={`Select ${item.label} charm`}
								aria-selected={isSelected}
								title={item.label}
								onClick={() => onSelect(item.id)}
							>
								<CharmCardPreview charm={item} />
								<span className="charm-card__selected" aria-hidden="true">
									<Check size={12} strokeWidth={3} />
								</span>
							</button>
						);
					})}
				</div>

				{filteredCharms.length === 0 ? (
					<p className="charm-empty">No charms match that search.</p>
				) : null}
			</div>
		</aside>
	);
}

CHARM_CATALOG.forEach((item) => useGLTF.preload(item.url));

export default CharmCatalog;
