

# Mission43 Form Core — Production Governance

This document defines what “production” means for this repository, how releases are created, how builders should consume the assets, and how to roll back safely.

## What is “Production”

A version is considered **Production** when:

- `m43-core.min.js` and `m43-core.css` have been validated on at least one real FormAssembly form in **tfaforms.com**.
- All required behaviors pass the acceptance checklist below.
- A Git tag has been created for the release (see “Release Process”).
- CDN (Cloudflare Pages) is serving the updated artifacts from the production URLs.

Production URLs (do not change without a deprecation plan):

- CSS: `https://mission43-form-core.pages.dev/m43-core.css`
- JS (minified): `https://mission43-form-core.pages.dev/m43-core.min.js`
- Optional layout helper: `https://mission43-form-core.pages.dev/m43-layout.css`

## Builder Contract

Builders should only inject the canonical snippet from `docs/INJECTION.md`.

Rules:

- Do not inline-copy the JS/CSS into FormAssembly for production.
- Do not pin querystring versions unless explicitly instructed.
- Do not modify the snippet except for `window.M43_FORM_BRAND` and optional overrides.

## Release Process

### Branching

- `main` is protected and auto-deploys to Cloudflare Pages when merged.
- All work happens on feature branches and lands via PR.

### Versioning

- Use semantic-ish tags: `vX.Y` (e.g., `v2.1`).
- Patch-only releases may use `vX.Y.Z` when warranted.

### Required release artifacts

A production release MUST include:

- `m43-core.css`
- `m43-core.min.js`
- `README.md` updated (if behaviors/config changed)
- `CHANGELOG.md` updated
- `docs/INJECTION.md` updated (if injection or builder guidance changed)

### Step-by-step: create a production release

1) Create/refresh feature branch

- `git checkout main`
- `git pull`
- `git checkout -b feat/<short-name>`

2) Make changes and validate locally

- Run local server for quick testing (see “Local Testing”).
- Validate on a FormAssembly test form.

3) Update docs

- Add an entry to `CHANGELOG.md` for the release.
- Update `docs/INJECTION.md` only if the injection snippet or builder contract changed.

4) PR to main

- Ensure checks pass.
- Merge PR (Cloudflare auto-deploy occurs from `main`).

5) Tag the release

After merge to `main`:

- `git checkout main`
- `git pull`
- `git tag -a vX.Y -m "Mission43 Form Core vX.Y (Production)"`
- `git push origin vX.Y`

6) Post-deploy verification

- Confirm Cloudflare Pages serves the new artifacts.
- Confirm the production injection works on at least one FormAssembly form.

## Acceptance Checklist

A release is not production until ALL items below pass.

### Core behavior

- Email + Confirm Email mismatch:
  - Inline error appears under the confirm field.
  - Summary block appears at top.
  - Submission is blocked.
  - Summary links focus+scroll to the invalid field.

- Phone:
  - IMask formatting works (mask applied once, stable under typing/paste/autofill).
  - Validation blocks submit when phone is not 10 digits.

- Navigation gate (paging forms):
  - “Next” is blocked when required errors exist.
  - Scroll-to-first-error occurs.
  - No double-navigation or second-click navigation.

### UI/UX

- Error styling is readable on mobile and desktop.
- Inputs stack properly on mobile.
- Conditional/offstate elements remain hidden.

### Accessibility

- Invalid inputs have `aria-invalid="true"`.
- Inline errors are connected via `aria-describedby`.
- Summary uses `role="alert"` and `aria-live`.


### Safety

- No console errors introduced.
- No global namespace pollution beyond the documented `window.*` flags.

## Salesforce Connector Parity Guarantees

The production build guarantees canonical phone normalization for Salesforce connector parity.

Behavioral contract:

- Phone inputs may be masked for UX (IMask) during entry.
- On submit, phone values are normalized to **digits-only** (e.g., `2089543891`).
- Normalization occurs before FormAssembly submission and before connector execution.
- This ensures parity with Salesforce SOQL lookups that compare raw stored values.

Important notes:

- Salesforce may display formatted values (e.g., `(208) 954-3891` or `208-954-3891`) but internally stores the canonical digits.
- Connector fallback logic using MobilePhone must assume canonical numeric comparison.
- UX masking must never alter the canonical value sent to Salesforce.

Any change to phone masking, normalization timing, or connector behavior requires:

1) README update (Salesforce Phone Normalization section)
2) CHANGELOG entry
3) Production validation against a real connector lookup

This section defines the connector parity contract and must remain accurate for all future releases.

## Local Testing

### Recommended local server

Serve the repo root so the browser can load the files:

- `cd /Users/spencerwidman/mission43-form-core`
- `npx serve . -l 3000`

In FormAssembly, temporarily point the injection to localhost:

- `http://localhost:3000/m43-core.css`
- `http://localhost:3000/m43-core.min.js`

Notes:

- FormAssembly may show CSP/CORS warnings for localhost in the console.
- Script/style loading is typically still allowed for testing; treat warnings as expected.

### Quick verification commands (browser console)

- Confirm script is loaded:
  - `document.querySelector('script[src*="m43-core"]').src`

- Confirm CSS is loaded:
  - `Array.from(document.styleSheets).map(s => s.href).filter(Boolean)`

- Confirm errors render:
  - `document.querySelectorAll('.m43-inline-error').length`
  - `document.querySelectorAll('.m43-error-summary').length`

## Rollback Procedure

Rollback is always done by reverting `main` and redeploying.

1) Identify the last known-good tag (example: `v2.1`).

2) Create a rollback branch:

- `git checkout main`
- `git pull`
- `git checkout -b rollback/v2.1`

3) Revert the bad merge commit(s) OR reset to the tag (prefer revert for auditability):

- `git revert <bad_merge_commit_sha>`

4) Open PR and merge to `main`.

5) Verify production URLs serve the rolled-back artifacts.

## Deprecation Policy

If production URLs must change:

- Keep the old URLs serving the last stable assets for at least 30 days.
- Update `docs/INJECTION.md` and notify builders.
- Provide a migration window and a clearly marked cutover date.

## Ownership

- Code owners: Mission43 engineering (repository maintainers)
- Builders: follow `docs/INJECTION.md`
- Production status is declared only via `CHANGELOG.md` entry + Git tag.
