# Data and methodology

Presidential Atlas is designed to make election geography and the movement of
a count legible. It separates published results from historical reconstruction
and labels modeled material inside the interface.

## United States results

The result and swing views use county-level presidential returns joined to
state and county geometry. State totals are checked against the published
state-total audit included with the distribution. Alaska is represented with
election-specific legislative-district geometry where county-equivalent
reporting is unavailable.

Color represents the winning party and margin. Height represents the quantity
named by the active view—electoral votes at the national level and ballots cast
or counted vote within a selected state. Height is scaled for visual comparison
and should be read with the displayed values rather than as a literal physical
measurement.

## 2020 election-night reconstruction

The replay is deterministic: every visitor receives the same canonical
sequence. It contains a national timeline and 51 state or District of Columbia
timelines, which are loaded independently.

- County endpoints are published final returns.
- Intermediate return packets are an explicit Atlas reconstruction.
- Documented race-call timestamps are used where available.
- Competitive-state calls are constrained by outstanding-vote plausibility so
  a historical call is not presented before the remaining vote can support it.
- The replay continues counting underneath a call until the final county
  endpoints are reached.

The reconstruction is intended to explain how geography, vote type, and
outstanding ballots changed the apparent race. It is not an official archive of
every intermediate county update.

### Public replay artifact policy

The canonical state-split replay output is intentionally distributed as part of
the browser-delivered Atlas and its reproducibility record. Visitors can inspect
and download those generated timelines because the browser must receive them to
render the experience. The private generator, reconstruction implementation,
and application source are not included in this repository. Public access to a
generated replay file does not grant an open-source license to the application.

## France results

The France Atlas presents the 2022 presidential election by department and
commune for both rounds. Candidate color identifies the local leader; intensity
represents the leader's margin over the second-place candidate. Department
selection reveals the underlying commune geography.

## Geometry and presentation

United States boundaries are based on Census and US Atlas geometry. France
department and commune geometry is distributed with the public atlas data.
Geometries may be simplified for interactive rendering, so the Atlas should not
be used as a cadastral or legal-boundary reference.

## Limitations

- Historical result revisions can differ slightly between publishers.
- Reconstructed return packets model a plausible count sequence; they are not
  represented as documented timestamps.
- Three-dimensional height improves comparison but can introduce perspective
  distortion. The interface therefore supplies exact values, legends, and a
  resettable camera.
- Race calls describe the documented historical outcome, not a reusable
  forecasting guarantee.

Presidential Atlas is an independent visualization and is not affiliated with
an election authority or decision desk.
