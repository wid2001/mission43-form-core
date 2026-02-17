

# Changelog

All notable changes to **Mission43 Form Core** will be documented in this file.

This project adheres to Semantic Versioning (SemVer).

---

## [2.1.0] - 2026-02-16

### Added
- Hybrid validation engine (enterprise-grade core with per-form override support)
- Configurable selectors via `window.M43_FORM_CONFIG`
- Configurable validation messages via `window.M43_FORM_CONFIG.messages`
- Inline error rendering with container-level error styling
- Accessible error summary block with:
  - Scroll-to-first-error behavior
  - Clickable summary links that focus associated fields
  - ARIA live region (`aria-live="assertive"`)
- Subtle shake animation for first invalid container
- Smooth scroll and focus behavior
- Value-state styling via `.m43-has-value`
- Phone input mask (US 10-digit formatting) with idempotent guard
- Salesforce-parity Contact Lookup Identifier calculation
  - Diacritic normalization map aligned to Apex service
  - First initial + normalized last name + digits-only phone
- Read-only enforcement for identifier field
- Automatic form name population (`.wFormTitle` → `input.calc-formName`)
- Performance profiling system (optional)
  - `window.M43_PROFILE = true`
  - Micro-timing for:
    - validateForm
    - validateField
    - handleSubmit
    - Navigation gate
- Engine-level paging gate (wFORMS wrapper)
- Defensive late-load paging attach with retry loop
- Deep config merge utility
- CSS design token comments to prevent future brand drift

### Improved
- Mobile layout stacking behavior
- Mobile vertical rhythm and spacing
- Radio and checkbox touch targets
- Error summary spacing and visual clarity
- Focus ring styling and animation
- Error summary animated collapse
- ARIA wiring for `aria-invalid` and `aria-describedby`
- Memory safety improvements
  - Reduced redundant DOM queries
  - Single-form reference resolution
- Reflow/layout thrash reduction
- Event delegation optimization
- Performance instrumentation hooks

### Fixed
- Navigation gate double-fire issues
- Error rendering race conditions
- Summary duplication edge cases
- Inline error stacking bugs
- CSP-safe script loading handling
- Mask re-application duplication bug

---

## [2.0.0] - 2026-02-15

### Added
- Enterprise hybrid architecture
- Configurable validation selectors
- Configurable message system
- Reusable cross-form validation core
- Summary block generation
- Field-level validation on input and blur

### Changed
- Removed hard-coded ID targeting
- Replaced injection-specific logic with reusable engine
- Converted validation to class-based targeting (`calc-*`)

---

## [1.2.0] - 2026-02-14

### Added
- Error summary block (basic)
- Scroll-to-first-error behavior
- Inline validation improvements
- Improved mobile stacking

### Improved
- Styling alignment with Mission43 brand
- Checkbox and radio faux rendering polish
- Required asterisk normalization

---

## [1.1.0] - 2026-02-13

### Added
- Inline error rendering system
- Capture-phase submit blocking
- Email + confirm email validation
- Phone validation (10-digit enforcement)

---

## [1.0.0] - 2026-02-12

### Initial Release
- Mission43 Event Registration baseline injection
- Email match validation
- Phone validation
- Paging gate
- Faux checkbox and radio rendering
- Contact lookup identifier (initial injection version)

---

## Notes

- Use `m43-core.min.js` in production.
- Enable profiling via `window.M43_PROFILE = true`.
- Override configuration per form using:

```javascript
window.M43_FORM_CONFIG = {
  selectors: {
    email: 'input.calc-email'
  },
  messages: {
    emailInvalid: 'Custom message'
  }
}
```

- Identifier logic can be disabled via feature flag:

```javascript
window.M43_DISABLE_IDENTIFIER = true
```

- Form name auto-population can be disabled via:

```javascript
window.M43_DISABLE_FORMNAME = true
```

---

End of file.
