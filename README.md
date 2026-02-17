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

# Mission43 Form Core

Enterprise‑grade reusable CSS + JS validation and UX layer for FormAssembly forms (Mission43 + Fieldhouse).

Status: **Production Declared**
Version: **v2.1**
Stability Tier: **Locked Core – Production Approved**

---

# 🚀 PRODUCTION INJECTION (COPY / PASTE)

This is the official production injection block for all Mission43 forms.

Place this in the FormAssembly **Custom Code** section (before closing `</head>`).

<!-- Mission43 Form Core (Production) -->
<script>
  // REQUIRED — brand switch
  window.M43_FORM_BRAND = "mission43"; // or "fieldhouse"

  // Optional: profiling (development only)
  // window.M43_PROFILE = true;

  // Optional: per-form overrides
  // window.M43_FORM_CONFIG = {
  //   selectors: {
  //     form: "form",
  //     email: "input.calc-email",
  //     confirmEmail: "input.calc-confirmEmail",
  //     phone: "input.calc-phone",
  //     identifier: "input.calc-contactLookupIdentifier",
  //     formName: "input.calc-formName"
  //   },
  //   messages: {
  //     emailMismatch: "Email addresses must match."
  //   }
  // };

  // Optional feature flags (default = enabled)
  // window.M43_DISABLE_IDENTIFIER = true;
  // window.M43_DISABLE_FORMNAME = true;
  // window.M43_DISABLE_MASK = true;
</script>

<link rel="stylesheet" href="https://mission43-form-core.pages.dev/m43-core.css">
<script src="https://mission43-form-core.pages.dev/m43-core.min.js" defer></script>

⚠️ Do NOT load both minified and non‑minified JS.
⚠️ Always use the `.min.js` file in production.

---

# 📘 What This Core Provides

This is not a simple script.

This is a reusable enterprise validation + UX system designed specifically for FormAssembly.

Core capabilities:

• Brand‑consistent UI system
• Hybrid validation engine
• Email + confirm matching
• Phone mask (10‑digit enforcement)
• Navigation gating (submit + paging)
• Inline + summary errors
• Smooth scroll + focus management
• Salesforce identifier parity logic
• Form name auto‑population
• Accessibility wiring (ARIA compliant)
• Performance profiling hooks
• Feature‑flag safety controls
• Mobile UX optimization

---

# 🏗 Architecture Overview

The engine follows a hybrid model:

1. Configuration resolution (defaults + overrides)
2. Field discovery via class selectors (no hardcoded IDs)
3. Event‑delegated validation
4. Submit capture enforcement
5. wFORMS paging override
6. Identifier + mask application
7. Error rendering (inline + summary)
8. Accessibility wiring
9. Optional profiling instrumentation

Performance design principles:

• No global MutationObservers
• No per‑keystroke DOM rescans
• No layout thrash loops
• No unnecessary reflows
• Mask applied once
• Identifier computed only when relevant fields change

Bundle size (minified + gzipped): ~3–4 KB

---

# 🧩 Required FormAssembly Builder Setup

Fields must include these classes:

Email
`validate-email calc-email`

Confirm Email
`validate-email calc-confirmEmail`

Phone
`calc-phone`

Contact Lookup Identifier (Hidden or Read‑Only Recommended)
`calc-contactLookupIdentifier`

Form Name Field (Hidden Recommended)
`calc-formName`

These classes are how the engine discovers fields.

No IDs are required.

---

# 🔧 Configuration System

Default configuration:

Selectors:
form
email
confirmEmail
phone

Messages:
emailRequired
emailInvalid
confirmRequired
emailMismatch
phoneRequired
phoneInvalid

Override example:

<script>
window.M43_FORM_CONFIG = {
  messages: {
    emailMismatch: "Custom mismatch message."
  }
};
</script>

Overrides merge deeply into defaults.

---

# 🏷 Feature Flags

Must be set BEFORE script loads.

window.M43_PROFILE = true
→ Enables performance logs in console

window.M43_DEBUG = true
→ Enables debug logging

window.M43_DISABLE_IDENTIFIER = true
→ Disables Salesforce identifier logic

window.M43_DISABLE_FORMNAME = true
→ Disables form name auto‑population

window.M43_DISABLE_MASK = true
→ Disables phone mask

---

# 🧠 Validation Rules

Email:
• Required
• Valid format
• Must match confirm (case insensitive)

Phone:
• Required
• 10 digits
• Masked input `(###) ###‑####`

Errors:
• Inline under field
• Summary at top
• Smooth scroll
• ARIA attributes wired
• Focus directed to first invalid field

Navigation:
• Submit capture enforcement
• wFORMS paging override
• Prevents next page if invalid

---

# 🔐 Salesforce Identifier Logic

Matches Apex service:

firstInitial + normalizedLastName + digitsOnlyPhone

Normalization rules:

• Lowercase
• Diacritics stripped
• Last name non‑alphanumeric removed
• Phone digits only

Auto‑updates when:
• First name changes
• Last name changes
• Phone changes

Identifier field should be:
Hidden OR read‑only (recommended)

---

# 📝 Form Name Auto‑Population

Reads:

`.wFormTitle`

Populates:

`calc-formName` field

Safe for hidden fields.

---

# 🎨 Styling System

Includes:

• Design tokens (frozen v1.2-final)
• White empty input state
• Filled state via `.m43-has-value`
• Error container styling
• Red card selection styling
• Dropdown + multi-select alignment
• Mobile stacking (<768px)
• Touch target optimization
• Shake animation (subtle)
• Smooth summary collapse

Design tokens are locked.
Changes must follow versioning protocol.

---

# 📱 Mobile Behavior

Below 768px:

• Fields stack vertically
• Improved spacing rhythm
• Larger tap targets
• Error containers adjusted
• Touch‑safe selection cards

---

# 📊 Performance + Lighthouse

Validated production metrics (FormAssembly constraints):

Accessibility: 98–100
Best Practices: 100
SEO: 90+
Performance: limited by FormAssembly + GTM, not core

Core does NOT introduce:

• Long tasks
• TBT issues
• Layout thrash
• Main thread blocking

---

# 🛠 Development Workflow

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

# 🔄 Release Protocol (Production)

1. Update CHANGELOG.md
2. Commit changes
3. Tag release (git tag vX.X.X)
4. Push tags (git push --tags)
5. Merge to main
6. Cloudflare auto‑deploy

Never merge without tagging.

---

# 🧪 Stability Checklist

Before production merge:

✓ Email mismatch tested
✓ Phone invalid tested
✓ Summary scroll verified
✓ Paging gate verified
✓ Identifier matches Apex output
✓ Mask not double‑applied
✓ Mobile layout verified
✓ Profiling under 15ms validateForm

---

# 🧱 Safe Extension Rules

When modifying:

• Do not add global querySelectorAll loops per keystroke
• Do not hardcode field IDs
• Maintain Salesforce parity
• Use feature flags for optional logic
• Avoid touching FormAssembly structural classes
• Preserve accessibility attributes

---

# 🧭 Architecture Positioning

This is a reusable UX + validation layer.

It is:

Configurable
Builder‑safe
Performance‑aware
Salesforce‑aligned
Accessibility‑compliant
Enterprise stable

---

# 📁 File Structure

m43-core.css
m43-core.js
m43-core.min.js

Production uses minified file only.

---

# 🏁 Production Declaration

Mission43 Form Core v2.1 is formally declared:

Production Stable
Enterprise Approved
Performance Reviewed
Accessibility Reviewed
Token Locked

---

# 📜 Changelog

All changes are documented in CHANGELOG.md.

Semantic Versioning:

MAJOR → Breaking changes
MINOR → New features
PATCH → Fixes

Example format:

## [2.1.0] - YYYY-MM-DD
### Added
### Changed
### Fixed

---

End of README.

# Mission43 Form Core

Enterprise-grade reusable CSS + JS validation and UX layer for FormAssembly forms (Mission43 + Fieldhouse).

Status: Production Declared
Current Stable Version: v2.1
Stability Tier: Locked Core – Production Approved
Deployment: Cloudflare Pages (auto-deploy from `main`)

---

## 🚀 Quick Start (Production)

Place this in the FormAssembly **Custom Code → Head** section:

<!-- Mission43 Form Core (Production) -->
<script>
  window.M43_FORM_BRAND = "mission43"; // or "fieldhouse"

  // Optional: profiling (development only)
  // window.M43_PROFILE = true;

  // Optional: per-form overrides
  // window.M43_FORM_CONFIG = {
  //   selectors: {
  //     form: "form",
  //     email: "input.calc-email",
  //     confirmEmail: "input.calc-confirmEmail",
  //     phone: "input.calc-phone",
  //     identifier: "input.calc-contactLookupIdentifier",
  //     formName: "input.calc-formName"
  //   },
  //   messages: {
  //     emailMismatch: "Email addresses must match."
  //   }
  // };

  // Optional feature flags
  // window.M43_DISABLE_IDENTIFIER = true;
  // window.M43_DISABLE_FORMNAME = true;
  // window.M43_DISABLE_MASK = true;
</script>

<link rel="stylesheet" href="https://mission43-form-core.pages.dev/m43-core.css">
<script src="https://mission43-form-core.pages.dev/m43-core.min.js" defer></script>

⚠️ Always use the `.min.js` file in production.
⚠️ Do NOT load both minified and non-minified versions.

---

## 📌 What This Core Is (And Is Not)

This is a reusable enterprise validation + UX layer built specifically for FormAssembly.

It is:

• Builder-safe
• Performance-aware
• Salesforce-aligned
• Accessibility-compliant
• Feature-flag controlled
• Production governed

It is NOT:

• A form builder replacement
• A global DOM mutation engine
• A heavy front-end framework
• Dependent on hardcoded field IDs

The system relies on class-based field targeting only.

---

## 📁 File Structure

m43-core.css      → Brand styling + layout system
m43-core.js       → Full readable source (development)
m43-core.min.js   → Production bundle (minified)


Production deployments must use `m43-core.min.js`.

---

## 🏷 Versioning Strategy (CSS vs JS)

Mission43 Form Core uses **independent versioning** for CSS and JS layers.

This is intentional and enterprise-aligned.

### CSS Layer
File: `m43-core.css`
Current Version: **v1.2-final**
Responsibility:
• Design tokens
• Layout system
• Input styling
• Error UI
• Mobile stacking
• Visual system consistency

The CSS layer evolves only when visual system or token changes are required.
Design tokens are currently **frozen under v1.2-final**.

---

### JS Layer
File: `m43-core.js` / `m43-core.min.js`
Current Version: **v2.1**
Responsibility:
• Validation engine
• Email/confirm logic
• Phone masking
• Navigation gating
• Salesforce identifier parity
• Form name auto-population
• Accessibility wiring
• Feature flags
• Profiling instrumentation

The JS layer may evolve independently of CSS.

---

### Why Versions Are Independent

CSS and JS represent two different subsystems:

• CSS → Visual Design System
• JS → Behavioral Validation Engine

They evolve at different speeds and have different stability constraints.

Keeping them independently versioned:

• Prevents unnecessary CSS churn
• Prevents forced JS re-versioning for UI-only changes
• Preserves architectural clarity
• Reduces regression risk

---

### Compatibility Guarantee

Current compatibility contract:

CSS **v1.2-final**
JS **v2.1**

JS v2.x is fully compatible with CSS v1.2-final.

If a future CSS change requires JS support (or vice versa), that will be documented explicitly in the CHANGELOG.

---

Do not artificially synchronize CSS and JS versions unless a breaking architectural change requires it.

---

---

## 🧩 Required FormAssembly Builder Setup

Fields must include these classes:

Email
`validate-email calc-email`

Confirm Email
`validate-email calc-confirmEmail`

Phone
`calc-phone`

Contact Lookup Identifier (Hidden or Read-Only Recommended)
`calc-contactLookupIdentifier`

Form Name Field (Hidden Recommended)
`calc-formName`

These classes are how the engine discovers fields dynamically.

No IDs are required.

---

## 🔧 Configuration System

Default configuration includes:

Selectors:
- form
- email
- confirmEmail
- phone
- identifier
- formName

Messages:
- emailRequired
- emailInvalid
- confirmRequired
- emailMismatch
- phoneRequired
- phoneInvalid

Override example:

<script>
window.M43_FORM_CONFIG = {
  messages: {
    emailMismatch: "Custom mismatch message."
  }
};
</script>

Overrides merge deeply into defaults.

---

## 🏷 Feature Flags

Must be set BEFORE script loads.

window.M43_PROFILE = true
→ Enables performance logs

window.M43_DEBUG = true
→ Enables debug logs

window.M43_DISABLE_IDENTIFIER = true
→ Disables Salesforce identifier logic

window.M43_DISABLE_FORMNAME = true
→ Disables form name auto-population

window.M43_DISABLE_MASK = true
→ Disables phone mask

---

## 🧠 Validation Rules

Email:
• Required
• Valid format
• Must match confirm (case insensitive)

Phone:
• Required
• 10 digits
• Masked input `(###) ###-####`

Errors:
• Inline under field
• Summary at top
• Smooth scroll
• ARIA attributes wired
• Focus directed to first invalid field

Navigation:
• Submit capture enforcement
• wFORMS paging override
• Prevents next page if invalid

---

## 🔐 Salesforce Identifier Logic

Matches Apex service:

firstInitial + normalizedLastName + digitsOnlyPhone

Normalization rules:

• Lowercase
• Diacritics stripped
• Last name non-alphanumeric removed
• Phone digits only

Auto-updates when:
• First name changes
• Last name changes
• Phone changes


---

## 📞 Salesforce Phone Normalization Behavior

Mission43 Form Core enforces **canonical phone submission** to guarantee Salesforce lookup parity.

Behavior:

• Users see a masked format: `(###) ###-####`
• Before submit, the value is normalized to **digits-only**
• Example: `(208) 954-3891` → `2089543891`

Why this matters:

Salesforce Phone fields visually format numbers based on locale, but internally store digits.
SOQL equality comparisons succeed most reliably when matching against digits-only values.

The core therefore:

• Preserves masked UX for users
• Submits canonical digits-only value
• Ensures FormAssembly connector lookups succeed
• Prevents mismatches caused by parentheses or dashes

No Salesforce schema changes are required.
No additional normalization Flow or Apex logic is required.

This behavior is enforced during submit capture phase and does not interfere with validation or navigation gating.

---

---

## 📝 Form Name Auto-Population

Reads `.wFormTitle`

Populates `calc-formName` field

Safe for hidden fields.

---

## 🎨 Styling System

Includes:

• Design tokens (frozen v1.2-final)
• White empty input state
• Filled state via `.m43-has-value`
• Error container styling
• Dropdown + multi-select alignment
• Mobile stacking (<768px)
• Touch target optimization
• Shake animation (subtle)
• Smooth summary collapse

Design tokens are locked. Changes must follow versioning protocol.

---

## 📱 Mobile Behavior

Below 768px:

• Fields stack vertically
• Improved spacing rhythm
• Larger tap targets
• Error containers adjusted
• Touch-safe selection cards

---

## 📊 Performance & Lighthouse

Core does NOT introduce:

• Long tasks
• Layout thrash
• Main thread blocking

Profiling example:
[M43 PROFILE] validateForm: 8.5ms

Bundle size (minified + gzipped): ~3–4 KB

---

## 🔒 Governance & Change Control

This repository follows strict production governance.

Modification Rules:

• All behavior changes require CHANGELOG entry
• All releases must be tagged before merging to `main`
• Core selectors must remain class-driven
• Salesforce identifier logic must remain parity-accurate
• Design tokens frozen under v1.2-final

Release Flow:

1. Update CHANGELOG.md
2. Commit
3. Tag release (`git tag vX.X.X`)
4. Push tags (`git push --tags`)
5. Merge to main
6. Cloudflare auto-deploy

Never merge without tagging.

---

## 🧪 Stability Checklist

Before production merge:

✓ Email mismatch tested
✓ Phone invalid tested
✓ Summary scroll verified
✓ Paging gate verified
✓ Identifier matches Apex output
✓ Mask not double-applied
✓ Mobile layout verified
✓ Profiling under 15ms validateForm

---

Mission43 Form Core v2.1
Production Stable
Enterprise Approved
Token Locked
