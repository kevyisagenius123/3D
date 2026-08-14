# Contributing

This repository publishes the compiled Presidential Atlas and its public data.
The private application and data-generation source are intentionally maintained
outside this repository.

## Reporting an incorrect result

Use the [result correction form](https://github.com/kevyisagenius123/3D/issues/new?template=result_correction.yml).
Include:

- election, year, and round;
- state, county, department, commune, territory, Canadian riding, or polling division;
- the value displayed by the Atlas;
- the expected value;
- a direct link to an authoritative source;
- a screenshot and replay time when relevant.

Official election authorities are preferred over secondary aggregators. A
correction can be evaluated much faster when the jurisdiction code and exact
candidate or turnout field are supplied.

## Reporting an interface problem

Use the general bug report form and provide reproducible steps, browser, device,
screen size, active view, and replay time.

## Pull requests

Pull requests to the compiled distribution are reviewed for publication safety,
but application-source changes cannot be accepted here. Every pull request must
pass the repository publication validator. Do not submit source maps, package
manifests, private generators, credentials, or uncompiled application files.
