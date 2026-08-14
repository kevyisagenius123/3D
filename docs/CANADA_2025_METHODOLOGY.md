# Canada 2025 data and replay methodology

This document describes the Canada Atlas result view and its reconstructed
2025 federal election-night replay. Official final votes and seats are kept
separate from modeled reporting order and timestamps.

## Official inputs

The Atlas uses final 45th general election results and electoral geography
published by Elections Canada.

- [Official poll-by-poll results](https://www.elections.ca/content.aspx?dir=rep/off/45gedata&document=byed&lang=e&section=res)
- [Official national summary tables](https://www.elections.ca/content.aspx?dir=rep/off/45gedata&document=summary&lang=e&section=res)
- [2025 electoral district and polling-division boundaries](https://www.elections.ca/content.aspx?dir=cir/mapsCorner/vector&document=index&lang=e&section=res)
- [Official election-day voting hours](https://www.elections.ca/content.aspx?dir=guide&document=p13&lang=e&section=med)

The public artifact contains all 343 ridings, 19,641,663 valid votes, 169,857
rejected ballots, and 74,988 official polling-station result buckets. The
reconstruction distributes those endpoints across 154,969 modeled return
packets. Candidate totals are grouped
into Liberal, Conservative, Bloc Québécois, NDP, Green, People's Party, and
other or independent candidates for the national replay.

## How Canadian results aggregate

Polling divisions and non-geographic reporting buckets contribute votes to a
federal riding. The candidate with the most votes wins that riding and its one
seat in the House of Commons. The national government context comes from the
number of seats won, not from a direct national presidential vote. The 2025
House has 343 seats, so 172 seats form a majority.

Provinces and territories are summaries only. Their totals do not determine a
separate winner or award blocks of seats.

## Geographic coverage

The national map contains all 343 federal ridings, including Yukon, the
Northwest Territories, and Nunavut. A selected riding loads its polling-
division geometry only when requested.

Elections Canada's published polling-boundary package does not contain a
matching polling polygon for riding 59018, Mission–Matsqui–Abbotsford. The
Atlas keeps its official result and replay totals but displays a documented
geometry-unavailable notice. No boundary is fabricated.

Some advance, mobile, special-voting, and combined results do not correspond
to a unique public polygon. They remain in the riding, provincial, and national
totals and in the election-night replay.

### Boundary-to-result reconciliation

Elections Canada's boundary identifiers and result identifiers are not always
one-to-one. A boundary numbered `182`, for example, can be reported as `182A`
and `182B`; a mobile or special poll can also be officially combined into a
different reporting poll. The Atlas normalizes source identifiers, resolves
suffixed records, follows official combined-with references, and merges
overlapping boundary groups before attaching vote totals. Each official result
bucket can therefore contribute to only one displayed geometry feature.

The resulting artifact contains 65,447 mapped polling-area features. All of
their party votes, valid votes, and rejected ballots reconcile to the referenced
official result buckets. No reportable polling boundary remains unmatched.
Another 171 official polygons are marked void, no-poll, or zero-result in the
source data. They remain neutral and show an explanation when selected. The
Atlas does not invent votes for them.

## What the replay reconstructs

The official files publish final poll totals, not a complete archived stream of
the time at which every poll reported. The Atlas therefore creates a
deterministic reporting sequence while preserving each official endpoint.

The replay begins at 18:30 Eastern time and follows Elections Canada's
staggered poll closing schedule:

1. Newfoundland polls close at 20:30 Newfoundland Daylight Time.
2. Atlantic polls close at 20:30 Atlantic Daylight Time.
3. Eastern, Central, Mountain, Saskatchewan, and most territorial polls close
   together at approximately 21:30 Eastern time.
4. Pacific and Yukon polls close at approximately 22:00 Eastern time.

Within those legal closing groups, the modeled return order uses ballot type,
poll size, riding context, and seeded variation. Most larger polling stations
arrive in two to six partial packets with uneven sizes and an early partisan
lean. The variation weakens as counting progresses, and every station
reconciles exactly to its official result. The seed is fixed, so every visitor
sees the same replay. Early packets can move both a polling station and its
riding away from their final margins before later returns bring them back.

The replay does not claim that Elections Canada or a media decision desk
published a poll at the displayed minute. Elections Canada administers and
tabulates the vote; it does not make media race calls.

## Visual encoding

- Colour identifies the party currently leading.
- Colour intensity represents the lead over the runner-up.
- Height uses a square-root scale of ballots cast.
- In Night mode, solid height is vote already represented in the replay.
- Translucent continuation is the official final vote still to be revealed.
- A short gold outline marks the latest polling-division return.

Exact numerical labels should be used when comparing ridings or polling
divisions. The 3D terrain is an explanatory encoding, not a literal population
or geographic elevation surface.

## Reproducibility checks

The publication gate verifies the Canada artifact on every release. It rejects
the publication if:

- the riding inventory is not exactly 343 unique codes;
- seat totals do not add to 343;
- riding votes, ballots, turnout, or party totals do not reconcile nationally;
- a polling-division file is missing;
- an empty geometry file is not the documented official exception;
- a mapped boundary lacks an official result alias or reuses one already
  assigned to another displayed feature;
- mapped geometry totals fail to reconcile to their official result buckets;
- a reportable boundary remains unmatched, or a void or no-poll count differs
  from the generation audit;
- replay timestamps are unordered or reference an unknown polling station;
- a polling station has missing, duplicated, or inconsistent packet numbers;
- the station and return-packet audit counts do not reconcile; or
- the reconstructed replay fails to end at the official vote totals.

## Limitations and corrections

Final candidates, votes, ballots, seats, riding results, and published
boundaries are official inputs. Partial packets, intermediate leaders,
reporting order, and exact replay timestamps are modeled.

If a displayed result differs from an authoritative source, submit a
[result correction](https://github.com/kevyisagenius123/3D/issues/new?template=result_correction.yml)
with the riding code, poll number when relevant, displayed value, expected
value, and source.
