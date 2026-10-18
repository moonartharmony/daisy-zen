# Architecture rules

- Keep deterministic gameplay and rotation in the existing engine and game route; UI feedback must only project their state, so polish cannot change puzzle outcomes.
- Keep biome presentation colors and hard-shadow roles in the global CSS token system, so controls share the same theme.
- Keep flying completion rewards in a standalone presentation component using measured hub/counter positions, so reward animation never writes progress.
- Use the shared Button's neo variants for tactile game and navigation controls, so press states and touch sizing remain consistent.
- Keep petal motion driven by engine snapshots and memoized SVG feedback with motion values, so completion effects do not introduce a separate rotation simulation.
- Keep overlay motion in OverlayPresentation and completion visibility separate from win state, so reward timing never delays or changes progress awards.