# 3D Presidential Election Atlases

This repository publishes the compiled GitHub Pages build. The TypeScript and
React source is intentionally kept out of the public repository.

- US atlas: `/3D/election-atlas`
- France atlas: `/3D/france-atlas`

The US election-night experience runs from versioned, state-split replay data
under `site/data/election-night/`. State timelines are loaded on demand so the
full national archive is not part of the initial page load.
