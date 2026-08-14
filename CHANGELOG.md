# Changelog

All notable public Atlas releases are documented here.

## [1.2.0] - 2026-08-14

### Added

- Canada 2025 federal election result view across all 343 ridings
- Lazy polling-division drill-down using official Elections Canada boundaries
- Deterministic national election-night reconstruction with 74,988 official result buckets
- 154,969 modeled partial return packets that fluctuate within polling stations and reconcile exactly to their official endpoints
- Official staggered poll-close phases across Canada's time zones
- Live riding leaders, seat standings, and the 172-seat majority threshold
- English and French interface controls
- Dedicated Canada methodology and end-to-end publication reconciliation

### Fixed

- Turnout now includes rejected ballots, matching Elections Canada's definition
- Canadian KML geometry is fitted from vertices so Arctic ring winding cannot collapse the projection
- Mission–Matsqui–Abbotsford is documented as an official polling-boundary exception instead of receiving fabricated geometry
- Suffixed, source-code, and combined polling identifiers now resolve to the correct official result buckets without duplicating votes
- Official void, no-poll, and zero-result polygons remain neutral and explain their status when selected

## [1.1.1] - 2026-08-09

### Added

- United States election-night and France overview imagery to the repository presentation

## [1.1.0] - 2026-08-09

### Added

- France 2022 election-night replay for both rounds
- Modeled 19:00 and 20:00 poll-closing groups
- National publication embargo and staggered departmental release waves
- Ten clickable overseas territory insets with commune drill-downs
- Automated France replay reconciliation in the publication gate
- Dedicated France methodology and structured result-correction reporting

### Changed

- Corrected overseas commune identifiers to match public geometry
- Improved France route language, title, and description metadata
- Split the United States and France experiences into route-level production bundles
- Expanded pull-request validation for the compiled publication artifact

## [1.0.0] - 2026-08-07

### Added

- United States presidential atlas for 2016, 2020, and 2024
- State and county result and swing views
- Reconstructed 2020 national and state election-night timelines
- France 2022 department and commune result views
- Curated compiled-only GitHub Pages distribution

[1.2.0]: https://github.com/kevyisagenius123/3D/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/kevyisagenius123/3D/tree/v1.1.1
[1.1.0]: https://github.com/kevyisagenius123/3D/tree/v1.1.0
[1.0.0]: https://github.com/kevyisagenius123/3D/commits/main
