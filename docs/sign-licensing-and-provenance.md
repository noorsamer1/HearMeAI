# Sign Dataset Licensing And Provenance

This document defines minimum controls for ingesting and training on Arabic sign
language datasets.

## Source Tracking Requirements

Every sample in schema-normalized output must include:

- `license.source_dataset`
- `license.source_subset`
- `license.license_name`
- `license.attribution_required`
- `license.commercial_use_allowed` (nullable until legal review)

## Operational Rules

- Do not merge untracked data into training sets.
- Keep raw dataset archives read-only and immutable.
- Preserve original file path metadata (`relative_path`) during ingestion.
- Require manual legal review before setting `commercial_use_allowed=true`.

## Current Dataset Notes

### KArSL

- Treated as external research data source.
- Must preserve attribution and dataset identity in metadata.

### ArabSign

- Treated as external research data source.
- Validate access terms from provider/publication before redistribution.

## Saudi-First Policy

- Default variant tag is `arsl_sa`.
- Any non-Saudi source is either mapped to `arsl_gulf` or `arsl_mixed`.
- A sample cannot be promoted to `arsl_sa` without explicit review.

## Release Checklist

- [ ] Validation report exists under `docs/sign-data-reports/`
- [ ] Duplicate IDs checked and resolved
- [ ] Split leakage check passed
- [ ] License metadata complete for all rows
- [ ] Artifact build run is reproducible with fixed seed

