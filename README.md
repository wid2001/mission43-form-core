# Mission43 Form Core

Reusable CSS/JS core for FormAssembly forms (Mission43 + Fieldhouse).

# Mission43 Form Core


Enterprise-grade reusable CSS/JS core for FormAssembly forms (Mission43 + Fieldhouse).

---

## 🚀 Quick Start

### 1️⃣ Include Core Files

```html
<script>
  window.M43_FORM_BRAND = "mission43"; // or "fieldhouse"
</script>

<link rel="stylesheet" href="https://your-cdn/m43-core.css">
<script src="https://your-cdn/m43-core.min.js" defer></script>
```

---

### 2️⃣ Configure Required Field Classes (FormAssembly Builder)

Add the following classes to fields:

| Purpose | Class |
|----------|--------|
| Email | `validate-email calc-email` |
| Confirm Email | `validate-email calc-confirmEmail` |
| Phone | `calc-phone` |
| Contact Identifier | `calc-contactLookupIdentifier` |
| Form Name | `calc-formName` |

---

### 3️⃣ Optional Feature Flags (Before Script Loads)

```html
<script>
  window.M43_PROFILE = true;              // Enable performance profiling
  window.M43_DEBUG = true;                // Enable debug logs
  window.M43_DISABLE_IDENTIFIER = true;   // Disable Salesforce identifier logic
  window.M43_DISABLE_MASK = true;         // Disable phone mask
</script>
```

---

### 4️⃣ Deploy

Use the minified bundle in production:

```
m43-core.min.js
```

Tag releases before merging to `main`.

---

This project provides:

- Brand-consistent styling (CSS core)
- Hybrid validation engine (JS core)
- Email + confirm matching
- Phone masking (IMask)
- Navigation gate enforcement
- Error summary + inline errors
- Salesforce identifier parity logic
- Form name auto-population
- Accessibility wiring (ARIA)
- Performance profiling hooks
- Feature flags for safe extensibility

This is designed to be safe, reusable, configurable, and stable across all Mission43 forms.

---

# Version

Current Stable: v2.1.x
Architecture: Hybrid Enterprise Core
Status: Production Ready

---

# File Structure

m43-core.css
m43-core.js
m43-core.min.js (production build)

Use the minified file for production deployments.

---

# How It Works

The core loads once per form and:

1. Resolves configuration (defaults + optional overrides)
2. Attaches validation listeners
3. Applies phone mask
4. Applies identifier logic
5. Applies form name auto-population
6. Enforces navigation gates
7. Renders inline + summary errors
8. Handles accessibility wiring
9. Supports profiling when enabled

The engine assumes:

- One form per page
- FormAssembly markup (.oneField containers)
- Variables configured in the builder (calc-email, calc-phone, etc.)

---

# Required Form Variables (Builder Setup)

These are configured in FormAssembly as Variables:

Email field:
class: validate-email calc-email

Confirm Email:
class: validate-email calc-confirmEmail

Phone:
class: calc-phone

Contact Lookup Identifier:
class: calc-contactLookupIdentifier

Form Name field:
class: calc-formName

These classes are how the JS identifies fields dynamically.

---

# Core Configuration

The engine uses a default configuration:

const DEFAULT_CONFIG = {
  selectors: {
    form: 'form',
    email: 'input.calc-email',
    confirmEmail: 'input.calc-confirmEmail',
    phone: 'input.calc-phone',
  },
  messages: {
    emailRequired: 'Email is required.',
    emailInvalid: 'Enter a valid email address.',
    confirmRequired: 'Please confirm your email.',
    emailMismatch: 'Email addresses must match.',
    phoneRequired: 'Phone number is required.',
    phoneInvalid: 'Enter a valid 10-digit phone number.',
  },
}

You can override per form:

window.M43_FORM_CONFIG = {
  messages: {
    emailRequired: "Custom message here"
  }
}

Overrides merge deeply into defaults.

---

# Feature Flags

Optional runtime flags:

Enable profiling:
window.M43_PROFILE = true

Enable debug logging:
window.M43_DEBUG = true

Disable identifier logic:
window.M43_DISABLE_IDENTIFIER = true

Disable phone mask:
window.M43_DISABLE_MASK = true

These must be set before the script loads.

---

# Validation Behavior

Email:
- Required
- Valid format
- Must match confirm field (case-insensitive)

Phone:
- Required
- 10 digits (digits only)
- Mask applied via IMask

Errors:
- Inline under field (.m43-inline-error)
- Summary at top (.m43-error-summary)
- Smooth scroll to first error
- Smooth scroll from summary link
- ARIA wiring for accessibility

Navigation:
- Submit capture phase enforcement
- wFORMS paging override
- Prevents next page if invalid

---

# Salesforce Identifier Logic

Matches Apex service:

firstInitial + normalizedLastName + digitsOnlyPhone

Normalization:
- Lowercase
- Diacritics stripped
- Last name non-alphanumeric removed
- Phone digits only

Auto-updates when:
- First name changes
- Last name changes
- Phone changes

Identifier field should be:
Hidden OR read-only (recommended)

---

# Form Name Auto-Population

Reads:

document.querySelector('.wFormTitle').textContent

Populates field with class:
calc-formName

Safe for hidden fields.

---

# Styling System (CSS Core)

Includes:

- Brand tokens
- Input styling
- Focus states
- Error container styling
- Mobile stacking behavior
- Touch target optimization
- Card styling for radios/checkboxes
- Shake animation
- Smooth error summary collapse

Mobile behavior:
- Fields stack below 768px
- Improved spacing
- Larger tap targets

---

# Performance Design

Engine is:

- Event delegated
- No MutationObservers
- No global DOM rescans
- No layout thrash loops
- Mask applied once
- Identifier computed on relevant input only

Bundle size (minified + gzipped):
~3.7 KB

Profiling output example:
[M43 PROFILE] validateForm: 8.5ms

---

# Production Deployment

Use:

m43-core.min.js

Example include:

<script>
window.M43_FORM_BRAND = "mission43";
</script>
<link href="https://your-cdn/m43-core.css" rel="stylesheet">
<script src="https://your-cdn/m43-core.min.js" defer></script>

Do not load both minified and non-minified files.

---

# Development Workflow

Local test:

npx serve .

Minify:

npx terser m43-core.js -c -m -o m43-core.min.js

Size check:

wc -c m43-core.js
gzip -c m43-core.js | wc -c
wc -c m43-core.min.js
gzip -c m43-core.min.js | wc -c

---

# Safe Extension Guidelines

When adding features:

- Do not add global querySelectorAll loops per keystroke
- Use feature flags for optional logic
- Keep selectors variable-driven (no hardcoded IDs)
- Maintain Salesforce parity for identifier logic
- Never override FormAssembly structural classes

---

# Stability Checklist Before Release

- Email mismatch tested
- Phone invalid tested
- Summary scroll tested
- Paging gate tested
- Identifier matches Apex output
- Mask does not double-apply
- Mobile layout verified
- Profiling clean (<15ms validateForm)

---

# Architecture Summary

This is not a form script.

This is a reusable validation + UX layer for Mission43 forms.

It is:

- Configurable
- Builder-safe
- Performance-aware
- Salesforce-aligned
- Accessibility-aware
- Enterprise stable

---

# Maintainer Notes

Owner: Mission43 Core
Versioning: Semantic
Deployment: Cloudflare Pages
Tag releases before production merge

Recommended release flow:

1. Commit
2. Tag (vX.X.X)
3. Merge to main
4. Deploy minified bundle

---

End of documentation.

---

# Changelog

All notable changes to this project are documented in `CHANGELOG.md`.

Changelog follows Semantic Versioning (SemVer):

- MAJOR → Breaking changes
- MINOR → New features (backwards compatible)
- PATCH → Fixes and refinements

Recommended format:

```
## [2.1.0] - 2026-02-XX
### Added
- Feature description

### Changed
- Behavior updates

### Fixed
- Bug fixes
```

Before each production merge:

1. Update CHANGELOG.md
2. Tag release (`git tag vX.X.X`)
3. Push tags (`git push --tags`)
4. Merge to main
5. Deploy

---
