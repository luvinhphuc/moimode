# Moi Mode

React application built with Vite.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Charm previews

After adding charm models and entries to
`src/pages/Customize/config/customizerConfig.js`, generate missing preview PNGs
with:

```bash
npm run generate:charm-previews
```

The command writes images to `public/model/charms/previews/` and skips previews
that already exist. Use `npm run generate:charm-previews -- --force` to regenerate
all previews, or `npm run generate:charm-previews -- --id=animals-cat --force` for
one charm. Chrome must be installed; set `CHROME_PATH` if it is not in the
standard Windows location. If headless Chrome cannot render WebGL, run
`$env:PREVIEW_BROWSER='external'; npm run generate:charm-previews` in PowerShell
and open the printed URL in a WebGL-enabled browser.

## Architecture

The project follows the feature-first conventions in
[docs/project-structure.md](docs/project-structure.md). Keep shared code in
the shared folders, feature-specific code inside its feature, and compose
features from pages and routes. Use direct imports instead of barrel files.

Model URLs are served from `/model/<filename>.glb`.
