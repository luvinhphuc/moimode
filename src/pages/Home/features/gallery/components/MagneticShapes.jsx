import { useEffect, useLayoutEffect, useRef } from "react";
import { Shape } from "../../../../../components/Shapes.jsx";
import { gsap } from "../../../../../utils/gsap.js";
import { MAGNETIC_LIMIT, MAGNETIC_SHAPES } from "../config/magneticShapes.js";
import { getMagneticOffset, getShapePosition } from "../utils/magneticShapes.js";
import "../MagneticShapes.css";

/** A non-interactive decorative layer. The container owns the pointer events. */
export default function MagneticShapes({ containerRef, exclusionRef, hasSubmissions = false, active = true }) {
    const layerRef = useRef(null);
    const updateLayoutRef = useRef(null);
    const populatedRef = useRef(hasSubmissions);

    // The parent's DOM refs are attached after child layout effects on mount.
    useEffect(() => {
        const layer = layerRef.current;
        const container = containerRef.current;
        if (!layer || !container) return undefined;
        const media = gsap.matchMedia();
        media.add({
            desktop: "(min-width: 1024px)",
            tablet: "(min-width: 768px) and (max-width: 1023px)",
            mobile: "(max-width: 767px)",
            finePointer: "(hover: hover) and (pointer: fine)",
            reduced: "(prefers-reduced-motion: reduce)",
        }, (context) => {
            const { desktop, tablet, mobile, finePointer, reduced } = context.conditions;
            const layoutKey = mobile ? "mobile" : tablet ? "tablet" : "desktop";
            const intensity = desktop ? 1 : mobile ? 0.3 : 0.6;
            const magnetism = !mobile && finePointer && !reduced;
            const anchors = [...layer.querySelectorAll("[data-shape-anchor]")].filter((_, i) => !mobile || i < 4);
            const entries = anchors.map((node) => node.querySelector("[data-shape-entry]"));
            const floats = anchors.map((node) => node.querySelector("[data-shape-float]"));
            const magnets = anchors.map((node) => node.querySelector("[data-shape-magnet]"));
            const floatTweens = [];
            let entered = reduced || mobile;
            let visible = false;
            let disposed = false;
            let frame = 0;
            let pointer = null;

            gsap.set(anchors, { xPercent: -50, yPercent: -50 });
            gsap.set(entries, { autoAlpha: reduced || mobile ? 1 : 0, scale: reduced || mobile ? 1 : 0.7,
                y: reduced || mobile ? 0 : 14, rotation: reduced || mobile ? 0 : -6 });
            const entrance = reduced || mobile ? null : gsap.to(entries, { paused: true, autoAlpha: 1, scale: 1, y: 0, rotation: 0,
                duration: 1, stagger: 0.08, ease: "power3.out" });
            if (!reduced && !mobile) floats.forEach((node, index) => {
                const shape = MAGNETIC_SHAPES[index];
                floatTweens.push(gsap.to(node, { paused: true, x: shape.dx * intensity, y: shape.dy * intensity,
                    rotation: (index % 2 ? -8 : 8) * intensity, duration: shape.duration,
                    delay: index * 0.17, repeat: -1, yoyo: true, ease: "sine.inOut" }));
            });
            const setters = magnetism ? magnets.map((node) => ({
                x: gsap.quickTo(node, "x", { duration: 0.55, ease: "power3.out" }),
                y: gsap.quickTo(node, "y", { duration: 0.55, ease: "power3.out" }),
            })) : [];
            const reset = () => setters.forEach(({ x, y }) => { x(0); y(0); });
            // All geometry reads precede quickTo writes; use the floating center,
            // subtracting the magnetic transform to avoid attraction feedback.
            const move = () => {
                frame = 0;
                if (!pointer || !visible) return;
                const offsets = magnets.map((node, index) => {
                    if (anchors[index].style.visibility === "hidden") return { x: 0, y: 0 };
                    const rect = node.getBoundingClientRect();
                    const scale = Number(gsap.getProperty(anchors[index], "scaleX"));
                    const entryScale = Number(gsap.getProperty(entries[index], "scaleX"));
                    const actualScale = scale * entryScale;
                    const x = rect.left + rect.width / 2 - Number(gsap.getProperty(node, "x")) * actualScale;
                    const y = rect.top + rect.height / 2 - Number(gsap.getProperty(node, "y")) * actualScale;
                    return getMagneticOffset(pointer.x - x, pointer.y - y, MAGNETIC_LIMIT * intensity);
                });
                offsets.forEach((offset, index) => { setters[index].x(offset.x); setters[index].y(offset.y); });
            };
            const onMove = (event) => {
                if (event.pointerType === "touch") return;
                pointer = { x: event.clientX, y: event.clientY };
                if (!frame) frame = requestAnimationFrame(move);
            };
            const onLeave = () => {
                pointer = null;
                cancelAnimationFrame(frame);
                frame = 0;
                reset();
            };

            context.add("layout", (populated, immediate = false) => {
                const exclusion = exclusionRef.current;
                // offset geometry stays stable during the existing CTA reveal.
                const box = exclusion ? { x: exclusion.offsetLeft, y: exclusion.offsetTop,
                    width: exclusion.offsetWidth, height: exclusion.offsetHeight } : null;
                const width = layer.clientWidth;
                const height = layer.clientHeight;
                const scale = populated ? 0.62 : 1;
                const placements = anchors.map((node, index) => {
                    const shape = MAGNETIC_SHAPES[index];
                    const coordinates = shape.responsivePositions?.[layoutKey] ?? shape;
                    const radius = Math.hypot(node.offsetWidth, node.offsetHeight) * scale / 2
                        + (reduced ? 0 : 20 * intensity + (magnetism ? MAGNETIC_LIMIT * intensity * scale : 0)) + 14;
                    const spread = populated ? (mobile ? 1.5 : 1.2) : 1;
                    return getShapePosition({ x: width * (0.5 + (coordinates.x - 0.5) * spread),
                        y: height * (0.5 + (coordinates.y - 0.5) * spread), radius, width, height, exclusion: box,
                        edge: populated ? -radius * 0.6 : 8 });
                });
                onLeave();
                anchors.forEach((node, index) => {
                    const position = placements[index];
                    node.style.visibility = position ? "visible" : "hidden";
                    if (!position) return;
                    gsap.to(node, { ...position, scale, opacity: populated ? 0.48 : 1,
                        duration: reduced || mobile || immediate ? 0 : 0.7, ease: "power3.out", overwrite: "auto" });
                });
            });
            const updateLayout = (populated) => context.layout(populated);
            updateLayoutRef.current = updateLayout;
            context.layout(populatedRef.current, true);
            const onResize = () => context.layout(populatedRef.current, true);
            const resize = new ResizeObserver(onResize);
            resize.observe(layer);
            if (exclusionRef.current) resize.observe(exclusionRef.current);
            document.fonts?.ready.then(() => { if (!disposed) onResize(); });

            const observer = new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting && !document.hidden;
                if (visible && !entered) { entered = true; entrance?.play(); }
                floatTweens.forEach((tween) => tween.paused(!visible));
                if (visible) entrance?.resume();
                else { entrance?.pause(); onLeave(); }
            });
            const onVisibility = () => {
                if (document.hidden) {
                    visible = false;
                    entrance?.pause();
                    floatTweens.forEach((tween) => tween.pause());
                    onLeave();
                } else { observer.unobserve(layer); observer.observe(layer); }
            };
            observer.observe(layer);
            document.addEventListener("visibilitychange", onVisibility);
            if (magnetism) {
                container.addEventListener("pointermove", onMove, { passive: true });
                container.addEventListener("pointerleave", onLeave);
                window.addEventListener("scroll", onLeave, { passive: true });
            }
            return () => {
                disposed = true;
                cancelAnimationFrame(frame);
                observer.disconnect();
                resize.disconnect();
                document.removeEventListener("visibilitychange", onVisibility);
                container.removeEventListener("pointermove", onMove);
                container.removeEventListener("pointerleave", onLeave);
                window.removeEventListener("scroll", onLeave);
                if (updateLayoutRef.current === updateLayout) updateLayoutRef.current = null;
                setters.forEach(({ x, y }) => { x.tween.kill(); y.tween.kill(); });
            };
        });
        return () => media.revert();
    }, [containerRef, exclusionRef]);

    useLayoutEffect(() => {
        populatedRef.current = hasSubmissions;
        updateLayoutRef.current?.(hasSubmissions);
    }, [hasSubmissions]);

    return (
        <div ref={layerRef} className="magnetic-shapes" aria-hidden="true" inert hidden={!active}>
            {MAGNETIC_SHAPES.map((shape, index) => (
                <div key={`${shape.type}-${index}`} className="magnetic-shapes__anchor" data-shape-anchor=""
                    data-shape-color={shape.color}
                    style={{ "--shape-size": `${shape.size}px` }}>
                    <div className="magnetic-shapes__entry" data-shape-entry="">
                        <div className="magnetic-shapes__float" data-shape-float="">
                            <div data-shape-magnet="">
                                <Shape type={shape.type} width="100%" color="currentColor" rotate={shape.rotation} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
