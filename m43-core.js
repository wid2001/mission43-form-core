// =========================================================
// M43 Core v1.3.7
// Enterprise Hybrid Validation Engine
// Status: Production Locked
// Locked: 2026-02 (Brand Architecture Update)
// =========================================================
;(function M43CoreStable() {
  // ---------------------------------------------------------
  // BRAND INITIALIZATION
  // Applies data-m43-brand attribute to <html>
  // Enables brand-specific CSS token overrides
  // ---------------------------------------------------------
  if (window.M43_FORM_BRAND && document && document.documentElement) {
    document.documentElement.dataset.m43Brand = window.M43_FORM_BRAND;
  }
  // ---------------------------------------------------------
  // DEBUG MODE (optional per-form)
  // Enable by setting: window.M43_DEBUG = true
  // ---------------------------------------------------------
  const DEBUG = !!window.M43_DEBUG

  function debugLog() {
    if (!DEBUG) return
    console.log.apply(console, ['[M43]', ...arguments])
  }

    // ---------------------------------------------------------
    // MICRO PROFILING (lightweight, debug-only)
    // Enable via: window.M43_PROFILE = true
    // ---------------------------------------------------------
    function isProfileEnabled() {
      return !!window.M43_PROFILE
    }

    function profileStart(label) {
      if (!isProfileEnabled() || !window.performance || !performance.now) return null
      return { label, start: performance.now() }
    }

    function profileEnd(token) {
      if (!isProfileEnabled() || !token || !window.performance || !performance.now) return
      const duration = performance.now() - token.start
      console.log('[M43 PROFILE]', token.label + ':', duration.toFixed(2) + 'ms')
    }

  // =========================================================
  // PHONE MASKING (IMask)
  // - Uses IMask if available, otherwise loads from CDN
  // - Applies to inputs matching cfg.selectors.phone (default: input.calc-phone)
  // - Idempotent: never double-applies
  // =========================================================
  const IMASK_CDN = 'https://cdn.jsdelivr.net/npm/imask@7.6.1/dist/imask.min.js'

  const MASK_CONFIG = {
    mask: '(000) 000-0000',
    lazy: true,
    placeholderChar: '_',
  }

  const __m43MaskLoad = {
    promise: null,
  }

  function loadIMaskOnce() {
    if (window.IMask) return Promise.resolve(window.IMask)
    if (__m43MaskLoad.promise) return __m43MaskLoad.promise

    __m43MaskLoad.promise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-m43-imask]')
      if (existing) {
        existing.addEventListener('load', () => resolve(window.IMask))
        existing.addEventListener('error', reject)
        return
      }

      const s = document.createElement('script')
      s.src = IMASK_CDN
      s.async = true
      s.defer = true
      s.setAttribute('data-m43-imask', 'true')
      s.onload = () => resolve(window.IMask)
      s.onerror = reject
      document.head.appendChild(s)
    })

    return __m43MaskLoad.promise
  }

  function applyPhoneMaskToInput(input) {
    if (!input || input.dataset.m43MaskApplied === 'true') return

    // Do not mask disabled/hidden inputs
    if (input.disabled) return
    const type = (input.getAttribute('type') || '').toLowerCase()
    if (type && type !== 'tel' && type !== 'text') return

    loadIMaskOnce()
      .then((IMask) => {
        if (!IMask || input.dataset.m43MaskApplied === 'true') return

        // Memory-safety: if a mask instance is already attached (unexpected), destroy it
        try {
        if (input.__m43IMask && typeof input.__m43IMask.destroy === 'function') {
        input.__m43IMask.destroy()
        }
        } catch (_) {}
        input.__m43IMask = null

        // Apply IMask
        const mask = IMask(input, MASK_CONFIG)
        input.__m43IMask = mask
        input.dataset.m43MaskApplied = 'true'

        // Keep UI polish + validation in sync with mask changes
        mask.on('accept', () => {
          updateHasValueClass(input)
          if (input.classList.contains('calc-phone')) {
            validateField(input)
          }
        })
        mask.on('complete', () => {
          updateHasValueClass(input)
          if (input.classList.contains('calc-phone')) {
            validateField(input)
          }
        })

        // Initial sync (covers autofill / prefilled)
        try {
          mask.updateValue()
        } catch (_) {}
        updateHasValueClass(input)
      })
      .catch(() => {
        // Mask load failed; validation will still work
      })
  }

  function initPhoneMaskForForm(form) {
    if (!form) return
    const phoneInputs = form.querySelectorAll(RESOLVED_CONFIG.selectors.phone)
    phoneInputs.forEach((inp) => applyPhoneMaskToInput(inp))
  }
  // =========================================================
  // M43 HYBRID CONFIG
  // - Internal defaults
  // - Optional per-form override via window.M43_FORM_CONFIG
  // =========================================================
  const DEFAULT_CONFIG = {
    selectors: {
      form: 'form',
      email: 'input.calc-email',
      confirmEmail: 'input.calc-confirmEmail',
      phone: 'input.calc-phone',
      contactLookupIdentifier: 'input.calc-contactLookupIdentifier',
      formName: 'input.calc-formName',
      formTitle: '.wFormTitle',
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

  function mergeDeep(base, override) {
    const out = Array.isArray(base) ? base.slice() : { ...base }
    if (!override || typeof override !== 'object') return out
    Object.keys(override).forEach((k) => {
      const bv = base ? base[k] : undefined
      const ov = override[k]
      if (ov && typeof ov === 'object' && !Array.isArray(ov)) {
        out[k] = mergeDeep(bv || {}, ov)
      } else {
        out[k] = ov
      }
    })
    return out
  }

  function getConfig() {
    // Optional external override:
    // window.M43_FORM_CONFIG = { selectors: {...}, messages: {...} }
    const override = window.M43_FORM_CONFIG
    return mergeDeep(DEFAULT_CONFIG, override)
  }
  // ---------------------------------------------------------
// RESOLVED CONFIG (single-form per page assumption)
// Prevent repeated deep merges during runtime
// ---------------------------------------------------------
const RESOLVED_CONFIG = getConfig()

  function clearInlineErrors(scope) {
    // Remove inline error messages
    scope.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

    // Remove container-level error styling
    scope.querySelectorAll('.oneField.m43-field-container-error')
      .forEach((el) => el.classList.remove('m43-field-container-error'))

    // Animate summary collapse if present
    const summary = scope.querySelector('.m43-error-summary')
    if (summary) {
      summary.classList.add('m43-summary-resolving')
      setTimeout(() => {
        summary.remove()
      }, 300)
    }

    scope.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid')

      const describedBy = el.getAttribute('aria-describedby')
      if (!describedBy) return

      const remaining = describedBy
        .split(' ')
        .filter((id) => !id.endsWith('-error'))
        .join(' ')
        .trim()

      if (remaining) {
        el.setAttribute('aria-describedby', remaining)
      } else {
        el.removeAttribute('aria-describedby')
      }
    })
  }

  function renderError(container, message) {
    if (!container) return

    container.classList.add('m43-field-container-error')

    const input = container.querySelector('input, textarea, select')

    const div = document.createElement('div')
    div.className = 'm43-inline-error'
    div.textContent = message

    // Generate stable error id
    const errorId = (input && input.id ? input.id : 'm43') + '-error'
    div.id = errorId

    // Accessibility wiring
    if (input) {
      input.setAttribute('aria-invalid', 'true')

      const existing = input.getAttribute('aria-describedby')
      if (existing) {
        if (!existing.split(' ').includes(errorId)) {
          input.setAttribute('aria-describedby', existing + ' ' + errorId)
        }
      } else {
        input.setAttribute('aria-describedby', errorId)
      }
    }

    container.appendChild(div)
  }

  function renderSummary(form, messages) {
    if (!form || !messages || !messages.length) return

    const existing = form.querySelector('.m43-error-summary')
    if (existing) existing.remove()

    const summary = document.createElement('div')
    summary.className = 'm43-error-summary'
    summary.setAttribute('role', 'alert')
    summary.setAttribute('aria-live', 'assertive')

    const heading = document.createElement('div')
    heading.className = 'm43-error-summary-heading'
    heading.textContent = 'Please correct the following:'
    summary.appendChild(heading)

    const ul = document.createElement('ul')

    messages.forEach((item) => {
      const msg = typeof item === 'string' ? item : item.message
      const fieldId = typeof item === 'string' ? null : item.fieldId

      const li = document.createElement('li')
      const link = document.createElement('a')
      link.href = '#'
      link.textContent = msg

      link.addEventListener('click', function (e) {
        e.preventDefault()

        let targetField = null

        if (fieldId) {
          targetField = form.querySelector('#' + CSS.escape(fieldId))
        }

        if (!targetField) {
          targetField = form.querySelector('[aria-invalid="true"]')
        }

        if (targetField) {
          targetField.focus({ preventScroll: false })
          targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })

      li.appendChild(link)
      ul.appendChild(li)
    })

    summary.appendChild(ul)

    form.prepend(summary)

    // Scroll to summary
    summary.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function isValidEmailFormat(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function digitsOnly(value) {
    return (value || '').replace(/\D/g, '')
  }

  function getPhoneDigits(input) {
    if (!input) return ''
    // Prefer IMask unmasked value when available (source of truth)
    const m = input.__m43IMask
    if (m && typeof m.unmaskedValue === 'string') return m.unmaskedValue
    return digitsOnly(input.value)
  }
// NOTE: Do NOT return early here.
// ENABLE_IDENTIFIER must only gate identifier logic, not the entire M43 core.

  // Feature flag (can be overridden per form)
// window.M43_ENABLE_IDENTIFIER = false to disable
const ENABLE_IDENTIFIER =
  typeof window.M43_ENABLE_IDENTIFIER === 'boolean'
    ? window.M43_ENABLE_IDENTIFIER
    : true

  // =========================================================
  // CONTACT LOOKUP IDENTIFIER (Salesforce Parity)
  // Mirrors NVT_Mission43IdentifierService.generate(Contact)
  // =========================================================
  const DIACRITIC_MAP = {
    'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','ā':'a','ă':'a','ą':'a',
    'æ':'ae','ç':'c','ć':'c','ĉ':'c','ċ':'c','č':'c',
    'ď':'d','đ':'d',
    'è':'e','é':'e','ê':'e','ë':'e','ē':'e','ĕ':'e','ė':'e','ę':'e','ě':'e',
    'ğ':'g','ġ':'g','ģ':'g','ĥ':'h',
    'ì':'i','í':'i','î':'i','ï':'i','ĩ':'i','ī':'i','ĭ':'i','į':'i','ı':'i',
    'ñ':'n','ń':'n','ņ':'n','ň':'n',
    'ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o','ō':'o','ŏ':'o','ő':'o',
    'œ':'oe','ŕ':'r','ŗ':'r','ř':'r',
    'ś':'s','ŝ':'s','ş':'s','š':'s','ß':'ss',
    'ţ':'t','ť':'t','ț':'t',
    'ù':'u','ú':'u','û':'u','ü':'u','ũ':'u','ū':'u','ŭ':'u','ů':'u','ű':'u','ų':'u',
    'ý':'y','ÿ':'y',
    'ź':'z','ż':'z','ž':'z',
    'þ':'th'
  }

  function stripDiacritics(value) {
    let result = ''
    for (let i = 0; i < value.length; i++) {
      const ch = value.charAt(i)
      result += DIACRITIC_MAP[ch] || ch
    }
    return result
  }

  function normalizeName(value) {
    if (!value) return null
    const normalized = stripDiacritics(value.trim().toLowerCase())
    return normalized.length ? normalized : null
  }

  function normalizeLastName(value) {
    const normalized = normalizeName(value)
    if (!normalized) return null
    const cleaned = normalized.replace(/[^a-z0-9]/g, '')
    return cleaned.length ? cleaned : null
  }

  function normalizePhoneForIdentifier(input) {
    const digits = getPhoneDigits(input)
    return digits && digits.length ? digits : null
  }

  function buildContactLookupIdentifier(form) {
    if (!form) return

    const first = form.querySelector('input.calc-fname')
      const last = form.querySelector('input.calc-lname')
      const phone = form.querySelector(RESOLVED_CONFIG.selectors.phone)
      const lookup = form.querySelector(RESOLVED_CONFIG.selectors.contactLookupIdentifier)

    if (!first || !last || !phone || !lookup) return

    // Ensure lookup field is readonly (prevents user tampering, still submits)
    if (!lookup.hasAttribute('readonly')) {
      lookup.setAttribute('readonly', 'readonly')
    }

    const normalizedFirst = normalizeName(first.value)
    const normalizedLast = normalizeLastName(last.value)
    const normalizedPhone = normalizePhoneForIdentifier(phone)

    if (!normalizedFirst || !normalizedLast || !normalizedPhone) {
      lookup.value = ''
      return
    }

    const firstInitial = normalizedFirst.substring(0, 1)
    lookup.value = firstInitial + normalizedLast + normalizedPhone
  }

  // =========================================================
  // FORM NAME AUTO-POPULATION (Builder-Safe)
  // Populates hidden calc-formName field from .wFormTitle
  // =========================================================
  function populateFormName(form) {
    if (!form) return

    const field = form.querySelector(RESOLVED_CONFIG.selectors.formName)
    if (!field) return

    const titleEl = document.querySelector(RESOLVED_CONFIG.selectors.formTitle)
    const title = titleEl ? titleEl.textContent.trim() : ''
    if (!title) return

    // Prevent user edits but still allow submission
    if (!field.hasAttribute('readonly')) {
      field.setAttribute('readonly', 'readonly')
    }

    field.value = title
  }

  // =========================================================
  // VALUE STATE (UI POLISH)
  // Adds .m43-has-value to inputs/selects/textarea when non-empty
  // - Initializes on load (supports autofill)
  // - Updates on input/change/blur
  // =========================================================
  function updateHasValueClass(el) {
    if (!el || !el.classList) return

    // Skip buttons, radios, checkboxes, hidden fields
    const type = (el.getAttribute && el.getAttribute('type')) || ''
    if (type === 'button' || type === 'submit' || type === 'reset') return
    if (type === 'radio' || type === 'checkbox' || type === 'hidden') return

    const v = (el.value || '').toString().trim()
    el.classList.toggle('m43-has-value', v.length > 0)
  }

  function wireHasValueState(form) {
    if (!form) return

    const els = form.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="password"], textarea, select'
    )

    els.forEach((el) => {
      // init (covers prefilled + browser autofill)
      updateHasValueClass(el)

      // keep fresh
      el.addEventListener('input', () => updateHasValueClass(el))
      el.addEventListener('change', () => updateHasValueClass(el))
      el.addEventListener('blur', () => updateHasValueClass(el), true)
    })
  }

  // =========================================================
  // VISIBILITY / PAGING AWARE VALIDATION
  // - Only validate fields on the active wForms page (.wfCurrentPage)
  // - Prevents blocking Next when required fields are on later pages
  // - Falls back to visibility if paging wrappers are not present
  // =========================================================
  function isElementVisible(el) {
    if (!el) return false
    if (el.disabled) return false

    const type = (el.getAttribute && (el.getAttribute('type') || '').toLowerCase()) || ''
    if (type === 'hidden') return false

    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false

    // Covers display:none parents and detached nodes
    if (el.offsetParent === null && style.position !== 'fixed') return false

    // Covers elements with no rendered boxes
    if (el.getClientRects && el.getClientRects().length === 0) return false

    return true
  }

  function getActivePageScope(form) {
    if (!form) return null
    const current = form.querySelector('.wfPage.wfCurrentPage')
    return current || form
  }

  function isFieldOnActivePage(el, form) {
    if (!el) return false

    const page = el.closest && el.closest('.wfPage')
    if (!page) {
      // Not a paged form (or no wfPage wrappers)
      return true
    }

    // If wForms marks the active page, require it
    if (page.classList && page.classList.contains('wfCurrentPage')) return true

    // If wfPage exists but wfCurrentPage is missing (edge cases),
    // fall back to visibility to avoid over-blocking.
    const active = getActivePageScope(form)
    if (active === form) return true

    return false
  }

  function shouldValidateField(el, form) {
    return isElementVisible(el) && isFieldOnActivePage(el, form)
  }

  function validateForm(form) {
    const __profile = profileStart('validateForm')
    let isValid = true

    clearInlineErrors(form)

    const summaryMessages = []

    const cfg = RESOLVED_CONFIG
    debugLog('validateForm called')

    const activeScope = getActivePageScope(form)

    const email = activeScope.querySelector(cfg.selectors.email)
    const confirm = activeScope.querySelector(cfg.selectors.confirmEmail)
    const phone = activeScope.querySelector(cfg.selectors.phone)

    // ---- EMAIL VALIDATION ----
    if (email && shouldValidateField(email, form)) {
      const emailContainer = email.closest('.oneField')
      const value = (email.value || '').trim()

      if (!value) {
        renderError(emailContainer, cfg.messages.emailRequired)
        summaryMessages.push({ message: cfg.messages.emailRequired, fieldId: email.id })
        isValid = false
      } else if (!isValidEmailFormat(value)) {
        renderError(emailContainer, cfg.messages.emailInvalid)
        summaryMessages.push({ message: cfg.messages.emailInvalid, fieldId: email.id })
        isValid = false
      }
    }

    if (confirm && shouldValidateField(confirm, form)) {
      const confirmContainer = confirm.closest('.oneField')
      const v1 = email ? (email.value || '').trim().toLowerCase() : ''
      const v2 = (confirm.value || '').trim().toLowerCase()

      if (!v2) {
        renderError(confirmContainer, cfg.messages.confirmRequired)
        summaryMessages.push({ message: cfg.messages.confirmRequired, fieldId: confirm.id })
        isValid = false
      } else if (v1 && v2 && v1 !== v2) {
        renderError(confirmContainer, cfg.messages.emailMismatch)
        summaryMessages.push({ message: cfg.messages.emailMismatch, fieldId: confirm.id })
        isValid = false
      }
    }

    // ---- PHONE VALIDATION ----
    if (phone && shouldValidateField(phone, form)) {
      const phoneContainer = phone.closest('.oneField')
      const digits = getPhoneDigits(phone)

      if (!digits) {
        renderError(phoneContainer, cfg.messages.phoneRequired)
        summaryMessages.push({ message: cfg.messages.phoneRequired, fieldId: phone.id })
        isValid = false
      } else if (digits.length !== 10) {
        renderError(phoneContainer, cfg.messages.phoneInvalid)
        summaryMessages.push({ message: cfg.messages.phoneInvalid, fieldId: phone.id })
        isValid = false
      }
    }

    // ---- DATE VALIDATION ----
    // FormAssembly often uses input[type="text"].validate-date rather than input[type="date"]
    const dateInputs = activeScope.querySelectorAll('input[type="date"], input.validate-date')
    dateInputs.forEach((input) => {
      if (!shouldValidateField(input, form)) return

      const container = input.closest('.oneField')
      const value = (input.value || '').trim()

      if (input.hasAttribute('required') && !value) {
        renderError(container, 'Date is required.')
        summaryMessages.push({ message: 'Date is required.', fieldId: input.id })
        isValid = false
        return
      }

      // Validate only when there is a value
      if (value && !isValidISODate(value)) {
        renderError(container, 'Enter a valid calendar date (format: YYYY-MM-DD).')
        summaryMessages.push({ message: 'Enter a valid calendar date (format: YYYY-MM-DD).', fieldId: input.id })
        isValid = false
      }
    })

    if (!isValid) {
      renderSummary(form, summaryMessages)

      const firstErrorContainer = form.querySelector('.m43-field-container-error')
      if (firstErrorContainer) {
        const firstInput = firstErrorContainer.querySelector('input, textarea, select')
        if (firstInput) {
          firstInput.focus({ preventScroll: false })
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // Subtle shake animation
          if (!firstErrorContainer.classList.contains('m43-shake')) {
            firstErrorContainer.classList.add('m43-shake')
            setTimeout(() => {
              firstErrorContainer.classList.remove('m43-shake')
            }, 400)
          }
        }
      }
    }
    profileEnd(__profile)
    return isValid
  }

  function validateField(input) {
    if (!input) return true

    const form = input.closest('form')
    if (!form) return true

    // Do not validate fields on non-active pages (prevents blocking Next)
    if (!shouldValidateField(input, form)) {
      return true
    }

    const cfg = RESOLVED_CONFIG
    const email = form.querySelector(cfg.selectors.email)
    const confirm = form.querySelector(cfg.selectors.confirmEmail)

    const container = input.closest('.oneField')
    if (!container) return true

    const __profile = profileStart('validateField')

    // Only clear this field's container
    container.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

    let isValid = true

    // ----- EMAIL FIELD -----
    if (input.classList.contains('calc-email')) {
      const value = (input.value || '').trim()

      if (value && !isValidEmailFormat(value)) {
        renderError(container, cfg.messages.emailInvalid)
        isValid = false
      }

      // If confirm exists, revalidate it too
      if (confirm) {
        const confirmContainer = confirm.closest('.oneField')
        confirmContainer?.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

        const v1 = value.toLowerCase()
        const v2 = (confirm.value || '').trim().toLowerCase()

        if (v2 && v1 !== v2) {
          renderError(confirmContainer, cfg.messages.emailMismatch)
        }
      }
    }

    // ----- CONFIRM FIELD -----
    if (input.classList.contains('calc-confirmEmail')) {
      const v1 = email ? (email.value || '').trim().toLowerCase() : ''
      const v2 = (input.value || '').trim().toLowerCase()

      if (v2 && v1 && v1 !== v2) {
        renderError(container, cfg.messages.emailMismatch)
        isValid = false
      }
    }

    // ----- PHONE FIELD -----
    if (input.classList.contains('calc-phone')) {
      const digits = getPhoneDigits(input)

      if (digits && digits.length !== 10) {
        renderError(container, cfg.messages.phoneInvalid)
        isValid = false
      }
    }

    // ----- DATE FIELD -----
    if (input.type === 'date' || input.classList.contains('validate-date')) {
      const value = (input.value || '').trim()
      if (value && !isValidISODate(value)) {
        renderError(container, 'Enter a valid calendar date (format: YYYY-MM-DD).')
        isValid = false
      }
    }

    profileEnd(__profile)
    return isValid
  }

  // =========================================================
  // EARLY PHONE NORMALIZATION (Architectural)
  // Ensures DOM value is canonical digits BEFORE any FA serialization
  // Safe to call multiple times (idempotent)
  // =========================================================
  function normalizePhoneForSubmission(form) {
    if (!form) return
    const phone = form.querySelector(RESOLVED_CONFIG.selectors.phone)
    if (!phone) return

    const digits = getPhoneDigits(phone)
    if (digits && phone.value !== digits) {
      phone.value = digits
    }
  }

    // =========================================================
  // DATE STANDARDIZATION (Neutral, Salesforce-Safe)
  // - Applies to all input[type="date"]
  // - Enforces ISO format (YYYY-MM-DD)
  // - Sets sane default minimum (1900-01-01) if not defined
  // - No future/past restrictions (declarative expansion later)
  // =========================================================
  function standardizeDateInputs(form) {
    if (!form) return
    const dateInputs = form.querySelectorAll('input[type="date"], input.validate-date')

    dateInputs.forEach((input) => {
      // Only applies to native date inputs
      if (input.type === 'date' && !input.min) {
        input.min = '1900-01-01'
      }

      // Normalize existing value
      if (input.value) {
        const parts = input.value.split('-')
        if (parts.length === 3) {
          const [y, m, d] = parts
          if (y && m && d) {
            input.value = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
          }
        }
      }
    })
  }

  function normalizeDatesForSubmission(form) {
    if (!form) return
    const dateInputs = form.querySelectorAll('input[type="date"], input.validate-date')

    dateInputs.forEach((input) => {
      if (!input.value) return
      const parts = input.value.split('-')
      if (parts.length === 3) {
        const [y, m, d] = parts
        if (y && m && d) {
          input.value = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
        }
      }
    })
  }

  // =========================================================
// STRICT ISO DATE VALIDATION
// - Ensures YYYY-MM-DD format
// - Ensures true calendar validity (no Feb 31, etc.)
// =========================================================
function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const parts = value.split('-')
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)

  const dt = new Date(y, m - 1, d)

  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  )
}

  function handleSubmit(event) {
    const __profile = profileStart('handleSubmit')

    const form = event.target
    if (!form || form.tagName !== 'FORM') {
      profileEnd(__profile)
      return
    }

    const valid = validateForm(form)
    normalizePhoneForSubmission(form)
    normalizeDatesForSubmission(form)
    debugLog('submit validation result:', valid)

    if (!valid) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      profileEnd(__profile)
      return false
    }

    profileEnd(__profile)
  }

  document.addEventListener('submit', handleSubmit, true)

  // Initialize value-state styling for all forms on the page
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll(RESOLVED_CONFIG.selectors.form).forEach((f) => {
      wireHasValueState(f)
      initPhoneMaskForForm(f)
      standardizeDateInputs(f)
      if (ENABLE_IDENTIFIER) {
  buildContactLookupIdentifier(f)
}
      populateFormName(f)
    })
  })

  document.addEventListener('input', function (event) {
    const target = event.target
    if (!target || target.tagName !== 'INPUT') return

    updateHasValueClass(target)

    if (target.classList.contains('calc-phone')) {
      // In case this phone input was injected dynamically (repeat/conditional)
      applyPhoneMaskToInput(target)
    }

    if (
      target.classList.contains('calc-email') ||
      target.classList.contains('calc-confirmEmail') ||
      target.classList.contains('calc-phone') ||
      target.type === 'date' ||
      target.classList.contains('validate-date')
    ) {
      validateField(target)
    }

    if (
      target.classList.contains('calc-fname') ||
      target.classList.contains('calc-lname') ||
      target.classList.contains('calc-phone')
    ) {
      const form = target.closest('form')
      if (form && ENABLE_IDENTIFIER) {
        buildContactLookupIdentifier(form)
      }
    }
  })

  document.addEventListener('blur', function (event) {
    const target = event.target
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT')) return

    updateHasValueClass(target)

    if (
      target.classList.contains('calc-email') ||
      target.classList.contains('calc-confirmEmail') ||
      target.classList.contains('calc-phone') ||
      target.type === 'date' ||
      target.classList.contains('validate-date')
    ) {
      validateField(target)
    }
  }, true)
  /* ===============================
     PHASE C — NAVIGATION GATE
     Blocks Next button if validation fails
     =============================== */

  function handleNavClick(event) {
    const __profile = profileStart('handleNavClick')
    const btn = event.target.closest('.wfPageNextButton')
    if (!btn) {
      profileEnd(__profile)
      return
    }

    const form = btn.closest('form')
    if (!form) {
      profileEnd(__profile)
      return
    }

    normalizePhoneForSubmission(form)
    normalizeDatesForSubmission(form)

    const valid = validateForm(form)
    debugLog('nav validation result:', valid)

    if (!valid) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      profileEnd(__profile)
      return false
    }
    profileEnd(__profile)
  }

  // Capture-phase interception (prevents FA from advancing)
  document.addEventListener('mousedown', handleNavClick, true)
  document.addEventListener('click', handleNavClick, true)

  // Engine-level safety wrap (if wFORMS paging exists)
  function attachPagingGate() {
    if (!window.wFORMS || !wFORMS.behaviors || !wFORMS.behaviors.paging || !wFORMS.behaviors.paging.run) {
      return false
    }

    if (wFORMS.behaviors.paging.run.__m43Wrapped) {
      return true
    }

    const originalRun = wFORMS.behaviors.paging.run

    function wrappedPagingRun() {
      const __profile = profileStart('wrappedPagingRun')
      const form = document.querySelector(RESOLVED_CONFIG.selectors.form)
      if (form) normalizePhoneForSubmission(form)
      if (form) normalizeDatesForSubmission(form)
      if (form && !validateForm(form)) {
        profileEnd(__profile)
        return false
      }

      const result = originalRun.apply(this, arguments)
      profileEnd(__profile)
      return result
    }

    wrappedPagingRun.__m43Wrapped = true
    wFORMS.behaviors.paging.run = wrappedPagingRun

    return true
  }

  // Attempt immediate attach, retry briefly if FA loads late
  if (!attachPagingGate()) {
    let tries = 0
    const interval = setInterval(function () {
      tries++
      if (attachPagingGate() || tries > 50) {
        clearInterval(interval)
      }
    }, 100)
  }
})()
