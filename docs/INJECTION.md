# Mission43 Form Core – Builder Injection Guide

Version: v2.1.0 (Production)
Last Updated: 2026-02-16
Audience: FormAssembly Builders, Admins, and Maintainers
Status: Production Locked

---

# Quick Start (Production Injection)

Paste this block into:
Form Settings → Custom Code → Header (recommended) OR top HTML block

```html
<!-- ======================================================
     Mission43 Form Core – Production Injection (v2.1)
     DO NOT MODIFY BELOW UNLESS DIRECTED
     ====================================================== -->
<script>
  /* REQUIRED: Brand Declaration */
  window.M43_FORM_BRAND = "mission43";

  /* OPTIONAL: Enable profiling (debug only – never leave on in prod) */
  // window.M43_PROFILE = true;

  /* OPTIONAL: Per-form overrides */
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

  /* OPTIONAL: Feature Flags (default = enabled) */
  // window.M43_DISABLE_IDENTIFIER = true;
  // window.M43_DISABLE_FORMNAME = true;
</script>

<link rel="stylesheet" href="https://mission43-form-core.pages.dev/m43-core.css">
<script src="https://mission43-form-core.pages.dev/m43-core.min.js" defer></script>
```

---

# Field Class Contracts (Required for Automation)

These CSS classes MUST be applied in the FormAssembly builder.

Email Field
```
calc-email
```

Confirm Email Field
```
calc-confirmEmail
```

Phone Field
```
calc-phone
```

Hidden Contact Identifier Field
```
calc-contactLookupIdentifier
```

Hidden Form Name Field
```
calc-formName
```

If these class contracts are missing, validation and automation will not execute.

---

# Engine Capabilities (Automatic Behavior)

Validation Engine
- Email required + format validation
- Confirm email match enforcement
- Phone required + 10-digit validation
- Inline field validation
- Error summary block with jump links
- Smooth scroll-to-first-error
- Subtle shake animation on invalid submit
- Paging gate (Next button blocked if invalid)
- ARIA wiring for accessibility

Salesforce Parity Logic
- Identifier generated as:
  firstInitial + normalizedLastName + digitsOnlyPhone
- Diacritic normalization matches Apex service
- Identifier field auto-populated and set to readOnly
- Form title auto-populated into calc-formName

UX Layer
- Has-value styling
- Phone masking
- Mobile stacking
- Accessible summary block
- Design-token controlled styling

---

# Deployment Rules (Critical)

ALWAYS use production URLs:

CSS
https://mission43-form-core.pages.dev/m43-core.css

JS
https://mission43-form-core.pages.dev/m43-core.min.js

NEVER:
- Mix localhost and production URLs
- Duplicate injection blocks
- Add additional submit blockers
- Modify design tokens inside a form

---

# Testing Checklist (Pre-Publish)

Validation
- Email mismatch blocks submission
- Phone blocks if not 10 digits
- Inline errors appear immediately
- Summary renders on invalid submit
- Summary links scroll correctly

Automation
- Identifier populates correctly
- Identifier is readOnly (not disabled)
- Form name populates correctly

UX
- Mobile layout stacks properly
- No hidden fields unexpectedly visible
- No console errors
- No duplicate injection

---

# Troubleshooting Commands

Verify email selector:
```
document.querySelectorAll('input.calc-email')
```

Verify confirm selector:
```
document.querySelectorAll('input.calc-confirmEmail')
```

Verify phone selector:
```
document.querySelectorAll('input.calc-phone')
```

Verify identifier exists:
```
document.querySelector('input.calc-contactLookupIdentifier')
```

Verify phone mask applied:
```
document.querySelector('input.calc-phone')?.dataset.m43MaskApplied
```
Should return "true".

---

# Feature Flags Reference

Disable identifier logic
```
window.M43_DISABLE_IDENTIFIER = true;
```

Disable form name auto-population
```
window.M43_DISABLE_FORMNAME = true;
```

Enable profiling (development only)
```
window.M43_PROFILE = true;
```

---

# Governance

This injection is governed by:
- PRODUCTION.md
- CHANGELOG.md
- README.md

Version v2.1 is production locked.
Future modifications must increment version and update CHANGELOG.

---

End of File.
