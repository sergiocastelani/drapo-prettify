# Copilot Instructions

## Build, lint, and test commands

- Requires Node.js 18+ and npm.
- Install dependencies: `npm install`
- Start the dev server: `npm run dev`
- Build for production: `npm run build`
- Preview the production build locally: `npm run preview`
- Run lint: `npm run lint`

### Tests

- Full prettifier regression check: `npx tsx src/tests/testPrettifier.ts`
- Single-case parser check: `npx tsx --eval "import { Prettifier } from './src/services/Prettifier'; console.log(new Prettifier().parse('IF({{condition}},Execute(action1);ShowWindow(window1),Execute(action2))'))"`

There is no dedicated test framework config or npm test script. The existing test harness is an ad-hoc TypeScript script that reads `src/tests/testExpressions.txt`.

## High-level architecture

This repository is a small Vite + React SPA for converting Drapo code between compact and formatted forms.

- `src/main.tsx` mounts the single-page app.
- `src/App.tsx` owns the UI and the workspace model. Each tab stores both:
  - `originalCode`: compact Drapo input
  - `prettyCode`: formatted output

The two main actions are intentionally asymmetric:

- **Prettify**: `Prettifier.parse(activeTab.originalCode)` writes into `prettyCode`
- **Compress**: `Compressor.compress(activeTab.prettyCode)` writes back into `originalCode`

Keep that tab-local dual-buffer flow intact when changing the UI.

### Formatting engine

`src/services/Prettifier.ts` is the core of the app. It is a stack-driven parser/state machine, not a simple regex formatter.

Key mechanics:

- `stepStack` drives parsing and formatting steps.
- `parserPosition` walks the input string.
- `inputLineStartMarker` and `outputIdentation` control line emission.
- `wrapSimbolInSpaces` mutates the input while parsing so operators are normalized before output is dumped.

`functionCallStep()` is the main extension point for Drapo formatting rules. It has special handling for specific commands, including:

- `IF`
- `ExecuteDataItem`
- `Execute`
- `AcceptDataChanges`
- `UpdateSector`
- `ShowWindow`

Those special cases decide whether parameters stay inline or become multi-line blocks, and whether an argument should be parsed as a `Block`, `Expression`, `Parameter`, or `GeneralTextParameter`.

`src/services/Compressor.ts` is the inverse path, but much simpler: it removes newlines and trims spaces around a limited set of operators. If parser formatting changes around operators, compressor regexes may need corresponding updates.

### Syntax highlighting and styling

The formatted editor uses `@uiw/react-textarea-code-editor` in `src/App.tsx`.

Highlighting is split across two places:

- `src/assets/custom_highlights.css` defines extra colors
- `App.tsx` runs a `useEffect` that post-processes `.token punctuation` elements and adds custom classes for braces and parentheses

That DOM/class-name coupling is intentional.

### Deployment shape

Production deploy targets GitHub Pages:

- `vite.config.ts` sets `base: '/drapo-prettify/'`
- `.github/workflows/deploy.yml` builds `dist` on pushes to `main` and publishes it

Do not change the Vite base path unless the GitHub Pages repository path changes.

## Key conventions

- New workspaces are created through `createWorkspaceTab(id)` in `App.tsx`; tabs are isolated and do not share buffers.
- The prettifier treats Drapo identifiers as characters from `_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:`, so `.` and `:` are valid inside variable/function names.
- Mustache expressions like `{{...}}` are treated as opaque tokens by the parser; the parser does not inspect their inner structure.
- `src/tests/testExpressions.txt` is a corpus file, not a snapshot file:
  - lines starting with `\` are source-file labels
  - every other line is a single Drapo expression to parse
- `src/tests/testPrettifier.ts` changes the process working directory to `src/tests`, so its relative file reads assume that location.
- The existing “tests” only check that parsing does not throw; they do not assert formatted output text.
- `ShowWindow`, `UpdateSector`, `Execute`, and similar Drapo commands have formatting behavior encoded directly in `Prettifier.functionCallStep()`. Follow that pattern instead of adding UI-level formatting rules.
