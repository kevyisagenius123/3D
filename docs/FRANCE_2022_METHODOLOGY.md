# France 2022 data and replay methodology

This document describes the France Atlas result views and its reconstructed
2022 election-night replay. It distinguishes official vote totals from modeled
timing and ordering.

## Official inputs

The Atlas uses final first-round and second-round presidential results published
by the French Ministry of the Interior. Commune totals and individual polling-
bureau totals are retained as integers and reconciled to the official national
endpoint.

- [Official 2022 presidential results](https://www.data.gouv.fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour)
- [Official 2017 polling-bureau results](https://www.data.gouv.fr/datasets/election-presidentielle-des-23-avril-et-7-mai-2017-resultats-definitifs-du-1er-tour-par-bureaux-de-vote)
- [Administrative geometry](https://www.data.gouv.fr/datasets/contours-administratifs)
- [Ministry explanation of voting-day procedure](https://www.elections.interieur.gouv.fr/comprendre-elections/comment-je-vote/lelecteur-jour-du-vote)

The public artifact contains 69,682 source polling-bureau records for each
round. Very small administrative rows may be coalesced into a neighboring
return packet, but no votes are discarded or synthesized.

## Geographic coverage

The national view contains 96 metropolitan departments and 10 clickable
overseas insets:

- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Saint-Pierre-et-Miquelon
- Mayotte
- Saint-Martin and Saint-Barthélemy
- Wallis and Futuna
- French Polynesia
- New Caledonia

The vote of French citizens abroad is included in national totals. It is not
drawn as a geographic territory. The public geometry maps 35,035 commune or
territory features. Simplified boundaries are intended for interactive
visualization, not legal or cadastral use.

## What the replay reconstructs

There is no complete public archive containing the exact arrival time and order
of every polling-bureau return. The Atlas therefore reconstructs a plausible,
deterministic count while preserving all official vote totals.

The replay begins at 18:45 Paris time and represents three phases:

1. Polling stations remain open.
2. Most modeled 19:00 stations count under the national publication embargo.
3. At 20:00 the embargo lifts, modeled urban 20:00 stations close, and
   departmental publication begins in staggered waves.

The 19:00 and 20:00 assignments are modeled from commune size, polling-bureau
count, and urban department context. They are not a claim about the official
closing order of every individual station. No return is published in the replay
before 20:00.

## Return order and historical lean

Within each commune, official 2022 polling-bureau batches are ordered using a
deterministic model informed by:

- polling-bureau size;
- commune size;
- the commune's 2017 voting profile where a historical match exists;
- seeded variation that is identical for every visitor.

Historical lean influences order only. It never changes a 2022 vote. The model
allows early bureau returns to move a commune away from its final margin before
later batches bring it back to the published endpoint.

## Overseas timing

Overseas jurisdictions follow different local voting calendars and time zones.
Their exact public reporting sequence is not represented as an archived live
feed. The Atlas holds their reconstructed publication until the national replay
window and gives each territory an independent deterministic release gate.

## Visual encoding

- Color identifies the candidate currently leading.
- Color intensity represents the lead over the second-place candidate.
- Solid height represents ballots already counted in replay mode.
- Translucent continuation represents official ballots not yet revealed by the
  replay.
- A short gold pulse identifies the most recent polling-bureau return.

Height uses a square-root scale. Exact values in the interface should be used
for numerical comparison.

## Reproducibility checks

The publication gate verifies both rounds on every release. It rejects the
artifact if:

- return timestamps are out of order;
- any batch appears before the 20:00 embargo;
- a jurisdiction index is invalid;
- a batch contains a negative or non-integer vote;
- replay totals fail to match the official final endpoint;
- overseas inset or commune geometry is missing.

## Limitations and corrections

The replay is an explanatory reconstruction, not an official minute-by-minute
record. Candidate totals, turnout, blank ballots, invalid ballots, and final
geographic results are official inputs. Poll-closing groups, return order,
publication gates, and intermediate timestamps are modeled.

If a displayed result differs from an authoritative source, submit a
[result correction](https://github.com/kevyisagenius123/3D/issues/new?template=result_correction.yml)
with the round, jurisdiction code, displayed value, expected value, and source.
