import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../../../../config/routePaths.js";
import { GALLERY_COPY } from "../config/galleryContent.js";

function StoryImage({ item }) {
    const [failed, setFailed] = useState(false);
    return failed ? <span className="gallery-image-fallback">Image unavailable</span> : (
        <img src={item.image} alt={`Personal style by ${item.nickname}`} width="440" height="600"
            className="h-full w-full object-cover" decoding="async" onError={() => setFailed(true)} />
    );
}

const controlClass = "gallery-spotlight__control inline-flex min-h-11 min-w-11 items-center justify-center gap-3 px-4 text-sm font-bold aria-disabled:cursor-default aria-disabled:opacity-35";

export default function GallerySpotlight({ spotlightRef, item, index, count, phase, onClose, onNavigate }) {
    const busy = phase !== "open";
    const position = `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    return (
        <div ref={spotlightRef} id="gallery-spotlight" data-spotlight-index={index} role="region" aria-labelledby="gallery-spotlight-title"
            tabIndex={-1} className="relative z-20 mx-auto w-full max-w-6xl px-6 pt-24 pb-10 outline-none md:px-12 md:py-14"
            onKeyDown={(event) => {
                if (event.altKey || event.ctrlKey || event.metaKey) return;
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    onNavigate(event.key === "ArrowLeft" ? -1 : 1);
                }
            }}>
            <div data-spotlight-chrome="" className="mb-8 flex items-center justify-between gap-6 md:mb-10">
                <p className="m-0 text-xs font-bold tracking-[0.18em] text-moi-muted">COMMUNITY STORIES</p>
                <button type="button" className={controlClass} onClick={onClose} aria-label="Close story">
                    <span>Close</span><span aria-hidden="true" className="text-xl leading-none">×</span>
                </button>
            </div>
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] md:gap-12 lg:gap-20">
                <div className="min-w-0">
                    <figure data-spotlight-photo="" className="relative mx-auto m-0 aspect-[220/300] w-[min(80%,260px)] origin-top-left bg-moi-surface shadow-xl md:w-full md:max-w-[360px]">
                        <StoryImage key={item.id + item.image} item={item} />
                    </figure>
                </div>
                <div data-spotlight-editorial="" className="relative min-w-0 bg-moi-bg/95 py-2 md:py-6">
                    <div data-spotlight-copy="">
                        <p data-spotlight-reveal="" className="m-0 mb-3 text-sm font-bold tracking-wide text-moi-accent [overflow-wrap:anywhere]">{item.nickname}</p>
                        <p data-spotlight-reveal="" className="m-0 mb-6 text-xs font-bold uppercase tracking-[0.12em] text-moi-muted [overflow-wrap:anywhere]">{item.personality}</p>
                        <h3 id="gallery-spotlight-title" data-spotlight-reveal=""
                            className="m-0 max-w-[18ch] font-serif text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.08] tracking-[-0.04em] text-balance [overflow-wrap:anywhere]">
                            {item.title || item.personality}
                        </h3>
                        <p data-spotlight-reveal="" className="mt-7 mb-0 max-w-[55ch] whitespace-pre-line text-base leading-[1.75] [overflow-wrap:anywhere]">{item.story}</p>
                        {item.isDemo && <p data-spotlight-reveal="" className="mt-5 mb-0 text-xs text-moi-muted">Demo story · Fictional sample</p>}
                        <div data-spotlight-reveal="" className="mt-7">
                            <Link to={ROUTE_PATHS.customize} className="gallery-cta !mt-0">
                                {GALLERY_COPY.button} <span aria-hidden="true">↗</span>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-moi-line pt-6">
                        <span aria-hidden="true" className="text-sm font-bold tracking-[0.12em] tabular-nums">{position}</span>
                        <div className="flex gap-2" aria-label="Story navigation">
                            <button type="button" className={controlClass} disabled={count < 2} aria-disabled={busy || count < 2}
                                aria-label="Previous story" onClick={() => onNavigate(-1)}><span aria-hidden="true">←</span> Prev</button>
                            <button type="button" className={controlClass} disabled={count < 2} aria-disabled={busy || count < 2}
                                aria-label="Next story" onClick={() => onNavigate(1)}>Next <span aria-hidden="true">→</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {phase === "open" ? `Story ${index + 1} of ${count}, ${item.nickname}: ${item.title || item.personality}` : ""}
            </p>
        </div>
    );
}
