// =========================================================
// M43 Core v2.0
// Enterprise Hybrid Validation Engine
// Status: Stable
// Locked: 2026-02
// =========================================================
;(function M43CoreStable() {
  // ---------------------------------------------------------
  // DEBUG MODE (optional per-form)
  // Enable by setting: window.M43_DEBUG = true
  // ---------------------------------------------------------
  const DEBUG = !!window.M43_DEBUG

  function debugLog() {
    if (!DEBUG) return
    console.log.apply(console, ['[M43]', ...arguments])
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

  function validateForm(form) {
    let isValid = true

    clearInlineErrors(form)

    const summaryMessages = []

    const cfg = getConfig()
    debugLog('validateForm called')

    const email = form.querySelector(cfg.selectors.email)
    const confirm = form.querySelector(cfg.selectors.confirmEmail)
    const phone = form.querySelector(cfg.selectors.phone)

    // ---- EMAIL VALIDATION ----
    if (email) {
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

    if (confirm) {
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
    if (phone) {
      const phoneContainer = phone.closest('.oneField')
      const digits = digitsOnly(phone.value)

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

    return isValid
  }

  function validateField(input) {
    if (!input) return true

    const form = input.closest('form')
    if (!form) return true

    const cfg = getConfig()
    const email = form.querySelector(cfg.selectors.email)
    const confirm = form.querySelector(cfg.selectors.confirmEmail)

    const container = input.closest('.oneField')
    if (!container) return true

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
      const digits = digitsOnly(input.value)

      if (digits && digits.length !== 10) {
        renderError(container, cfg.messages.phoneInvalid)
        isValid = false
      }
    }

    return isValid
  }

  function handleSubmit(event) {
    const form = event.target
    if (!form || form.tagName !== 'FORM') return

    const valid = validateForm(form)
    debugLog('submit validation result:', valid)

    if (!valid) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return false
    }
  }

  document.addEventListener('submit', handleSubmit, true)

  // Initialize value-state styling for all forms on the page
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll(getConfig().selectors.form).forEach((f) => {
      wireHasValueState(f)
    })
  })

  document.addEventListener('input', function (event) {
    const target = event.target
    if (!target || target.tagName !== 'INPUT') return

    updateHasValueClass(target)

    if (
      target.classList.contains('calc-email') ||
      target.classList.contains('calc-confirmEmail') ||
      target.classList.contains('calc-phone')
    ) {
      validateField(target)
    }
  })

  document.addEventListener('blur', function (event) {
    const target = event.target
    if (!target || target.tagName !== 'INPUT') return

    updateHasValueClass(target)

    if (
      target.classList.contains('calc-email') ||
      target.classList.contains('calc-confirmEmail') ||
      target.classList.contains('calc-phone')
    ) {
      validateField(target)
    }
  }, true)
  /* ===============================
     PHASE C — NAVIGATION GATE
     Blocks Next button if validation fails
     =============================== */

  function handleNavClick(event) {
    const btn = event.target.closest('.wfPageNextButton')
    if (!btn) return

    const form = btn.closest('form')
    if (!form) return

    const valid = validateForm(form)
    debugLog('nav validation result:', valid)

    if (!valid) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return false
    }
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
      const cfg = getConfig()
      const form = document.querySelector(cfg.selectors.form)
      if (form && !validateForm(form)) {
        return false
      }
      return originalRun.apply(this, arguments)
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
