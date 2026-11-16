import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../../../../config/routePaths.js";
import { ScrollTrigger } from "../../../../../utils/gsap.js";
import useGalleryScrubAnimation from "../animations/useGalleryScrubAnimation.js";
import useGallerySpotlight from "../animations/useGallerySpotlight.js";
import { GALLERY_COPY } from "../config/galleryContent.js";
import { GALLERY_LAYOUT } from "../config/galleryMotionConfig.js";
import { communityStories } from "../config/communityStories.js";
import { normalizeStories } from "../utils/normalizeStories.js";
import { getGalleryMode, getSplitLayout } from "../utils/galleryLayout.js";
import GalleryStack from "./GalleryStack.jsx";
import GallerySpotlight from "./GallerySpotlight.jsx";
import MagneticShapes from "./MagneticShapes.jsx";
import "../Gallery.css";

const MOTION_QUERY = `(min-width: ${GALLERY_LAYOUT.breakpoint}px) and (min-height: ${GALLERY_LAYOUT.shortHeight}px) and (prefers-reduced-motion: no-preference)`;
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify) => {
    const queries = [MOTION_QUERY, REDUCED_QUERY].map((query) => window.matchMedia(query));
    queries.forEach((media) => media.addEventListener("change", notify));
    return () => queries.forEach((media) => media.removeEventListener("change", notify));
};
const readMotion = () => `${window.matchMedia(MOTION_QUERY).matches}:${window.matchMedia(REDUCED_QUERY).matches}`;

function GalleryExperience({ items, canPosition, reducedMotion }) {
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const ctaRef = useRef(null);
    const finishRef = useRef(null);
    const lockRef = useRef(false);
    const [geometry, setGeometry] = useState(null);
    const [imageFailure, setImageFailure] = useState(false);
    const mode = getGalleryMode(items.length);
    const animated = canPosition && (mode === "adaptive" || mode === "full");
    const capacity = GALLERY_LAYOUT.initialStackCapacity;
    const stackItems = useMemo(() => canPosition ? items.slice(0, capacity) : items, [items, canPosition, capacity]);
    const handleImageError = useCallback(() => setImageFailure(true), []);

    // Use the existing Lenis event contract; a single owner avoids double unlocks.
    const lockScroll = useCallback(() => {
        if (lockRef.current) return;
        lockRef.current = true;
        window.dispatchEvent(new CustomEvent("gallery-animation-lock"));
    }, []);
    const unlockScroll = useCallback(() => {
        if (!lockRef.current) return;
        lockRef.current = false;
        window.dispatchEvent(new CustomEvent("gallery-animation-unlock"));
    }, []);

    useLayoutEffect(() => {
        if (!canPosition || !items.length) return undefined;
        const panel = panelRef.current;
        const cta = ctaRef.current;
        let previous;
        let alive = true;
        const measure = () => {
            if (!alive || rootRef.current?.dataset.galleryLocked === "true"
                || rootRef.current?.dataset.gallerySpotlight !== "closed") return;
            // Layout coordinates are unaffected by the reveal's transforms.
            const dimensions = [panel.clientWidth, panel.clientHeight,
                cta.offsetLeft, cta.offsetTop, cta.offsetWidth, cta.offsetHeight];
            if (previous?.every((value, index) => value === dimensions[index])) return;
            previous = dimensions;
            const [width, height, x, y, ctaWidth, ctaHeight] = dimensions;
            const next = { width, height, cta: { x, y, width: ctaWidth, height: ctaHeight } };
            setGeometry({ ...next, placements: getSplitLayout(Math.min(items.length, capacity), next) });
            ScrollTrigger.refresh(true);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(panel);
        observer.observe(cta);
        document.fonts?.ready.then(measure);
        return () => { alive = false; observer.disconnect(); };
    }, [items.length, canPosition, capacity]);

    useGalleryScrubAnimation({ rootRef, finishRef, geometry, animated, items, reducedMotion });
    const { selection, spotlightRef, open, close, navigate } = useGallerySpotlight({
        rootRef, panelRef, ctaRef, items, animated, reducedMotion, lockScroll, unlockScroll,
    });

    const splitStyle = {};
    geometry?.placements.forEach((p, i) => {
        splitStyle[`--card-${i}-x`] = `${p.x}px`;
        splitStyle[`--card-${i}-y`] = `${p.y}px`;
        splitStyle[`--card-${i}-rotation`] = `${p.rotation}deg`;
    });
    if (geometry?.placements[0]) {
        splitStyle["--gallery-card-width"] = `${geometry.placements[0].width}px`;
        splitStyle["--gallery-card-height"] = `${geometry.placements[0].height}px`;
    }

    return (
        <section ref={rootRef} id="gallery" aria-labelledby="gallery-title"
            data-gallery-mode={mode} data-gallery-count={items.length}
            data-gallery-spotlight={selection?.phase ?? "closed"}
            className={`gallery-transition-track${animated ? " gallery--animated" : " gallery--static"}${!canPosition ? " gallery--flow" : ""}${reducedMotion ? " gallery--reduced" : ""}`}
            style={splitStyle}>
            <div className="gallery-intro-track">
                <div className="gallery-sticky-viewport">
                    <div ref={panelRef} className="gallery-panel">
                        <MagneticShapes containerRef={panelRef} exclusionRef={ctaRef}
                            hasSubmissions={items.length > 0} active={!selection} />
                        <div ref={ctaRef} className="gallery-center" inert={!!selection}>
                            <div data-gallery-title="">
                                <p className="gallery-eyebrow">{GALLERY_COPY.eyebrow}</p>
                                <h2 id="gallery-title">{mode === "empty" ? GALLERY_COPY.emptyHeadline : GALLERY_COPY.headline}</h2>
                                {items.some((item) => item.isDemo) && <p className="gallery-demo-label">Demo stories</p>}
                            </div>
                            <div data-gallery-action="">
                                <Link to={ROUTE_PATHS.customize} className="gallery-cta"
                                    onFocus={() => finishRef.current?.()}>
                                    {GALLERY_COPY.button} <span aria-hidden="true">↗</span>
                                </Link>
                            </div>
                        </div>
                        {items.length > 0 && <GalleryStack items={stackItems} positioned={canPosition} interactive={!animated && !selection}
                            onSelect={open} onImageError={handleImageError} />}
                        {selection && <GallerySpotlight spotlightRef={spotlightRef} item={items[selection.index]}
                            index={selection.index} count={items.length} phase={selection.phase} onClose={close} onNavigate={navigate} />}
                        <p className="gallery-availability" role="status" aria-live="polite">
                            {imageFailure ? "Some gallery images are unavailable. Their stories are still here." : ""}
                        </p>
                        {animated && <button type="button" className="gallery-skip" data-gallery-skip=""
                            onClick={() => finishRef.current?.()}>Skip animation ↓</button>}
                    </div>
                </div>
            </div>
            {items.length > capacity && canPosition && <div className="gallery-feed">
                <GalleryStack items={items.slice(capacity)} interactive={!animated && !selection} onSelect={open}
                    onImageError={handleImageError} />
            </div>}
        </section>
    );
}

function GallerySection({ stories = communityStories }) {
    const motionAllowed = useSyncExternalStore(subscribeMotion, readMotion, () => "false:true");
    const items = useMemo(() => normalizeStories(stories), [stories]);
    const canPosition = motionAllowed.startsWith("true:");
    const reducedMotion = motionAllowed.endsWith(":true");
    // Remount the experience on source/media changes: spotlight and animation cleanup
    // happens before the next experience can acquire a scroll lock.
    const experienceKey = JSON.stringify([items, motionAllowed]);

    return <GalleryExperience key={experienceKey} items={items} canPosition={canPosition} reducedMotion={reducedMotion} />;
}

export default GallerySection;
