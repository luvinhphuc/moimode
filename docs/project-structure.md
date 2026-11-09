# Project Structure

This document is the architecture contract for Moi Mode. Follow it for all
new code and refactors.

```text
src/
├── App.jsx
├── main.jsx
├── assets/                    # Shared fonts, icons and images
├── components/                # Shared components
│   └── layout/
│       ├── Header/
│       └── Preloader/
├── config/                    # Shared application configuration
├── features/                  # Feature-specific modules
│   ├── hero/
│   │   ├── animations/
│   │   ├── components/
│   │   ├── config/
│   │   └── three/
│   └── customizer/
│       ├── components/
│       ├── config/
│       ├── three/
│       └── utils/
├── pages/                     # Route-level compositions
├── routes/                    # Route definitions and paths
├── styles/                    # Global CSS and design tokens
└── utils/                     # Shared utilities and library wrappers
```

## Rules

- React components use `PascalCase.jsx`; helpers and configuration use
  `camelCase.js`; folder names use lowercase.
- Put code that is used only by one feature inside that feature. Create only
  the subfolders a feature needs.
- Shared code can be imported by features and pages. Features must not import
  from one another; pages and routes compose them instead.
- Import files directly. Do not add barrel (`index.js`) exports.
- Keep Three.js scene code in a feature's `three/` folder, animation code in
  its `animations/` folder, and configuration in its `config/` folder.

## Styling

This is a Tailwind CSS v4 project. Tailwind is loaded in
`src/styles/globals.css` through the Vite plugin, and design tokens are defined
in `src/styles/theme.css` with `@theme`.

- Build new UI and make routine layout, spacing, typography, color, and
  responsive changes with Tailwind utility classes in JSX `className`.
- Reuse the tokens from `src/styles/theme.css` (for example, `text-moi-ink`
  and `bg-moi-bg`) instead of repeating brand values in component styles.
- Use a CSS file only when utilities cannot reasonably express the behavior,
  such as keyframes, complex visual effects, or selectors required by a library.
  Keep that CSS scoped to its component or feature.
- Do not add plain CSS rules or `@apply` wrappers for styling that can be
  written directly with Tailwind utilities. Existing CSS does not need a
  wholesale rewrite; follow this convention when touching a component.
