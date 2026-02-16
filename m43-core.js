;(function M43CoreStable() {
  function clearInlineErrors(scope) {
    // Remove inline error messages
    scope.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

    // Remove container-level error styling
    scope.querySelectorAll('.oneField.m43-field-container-error')
      .forEach((el) => el.classList.remove('m43-field-container-error'))

    scope.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid')
      el.removeAttribute('aria-describedby')
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
      input.setAttribute('aria-describedby', errorId)
    }

    container.appendChild(div)
  }

  function renderSummary(form, messages) {
    if (!form || !messages.length) return

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

    messages.forEach((msg) => {
      const li = document.createElement('li')
      const link = document.createElement('a')
      link.href = '#'
      link.textContent = msg

      link.addEventListener('click', function (e) {
        e.preventDefault()
        const firstErrorField = form.querySelector('[aria-invalid="true"]')
        if (firstErrorField) {
          firstErrorField.focus({ preventScroll: false })
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

  function validateForm(form) {
    let isValid = true

    clearInlineErrors(form)
    const existingSummary = form.querySelector('.m43-error-summary')
    if (existingSummary) existingSummary.remove()

    const summaryMessages = []

    const email = form.querySelector('input.calc-email')
    const confirm = form.querySelector('input.calc-confirmEmail')
    const phone = form.querySelector('input.calc-phone')

    // ---- EMAIL VALIDATION ----
    if (email) {
      const emailContainer = email.closest('.oneField')
      const value = (email.value || '').trim()

      if (!value) {
        renderError(emailContainer, 'Email is required.')
        summaryMessages.push('Email is required.')
        isValid = false
      } else if (!isValidEmailFormat(value)) {
        renderError(emailContainer, 'Enter a valid email address.')
        summaryMessages.push('Enter a valid email address.')
        isValid = false
      }
    }

    if (confirm) {
      const confirmContainer = confirm.closest('.oneField')
      const v1 = email ? (email.value || '').trim().toLowerCase() : ''
      const v2 = (confirm.value || '').trim().toLowerCase()

      if (!v2) {
        renderError(confirmContainer, 'Please confirm your email.')
        summaryMessages.push('Please confirm your email.')
        isValid = false
      } else if (v1 && v2 && v1 !== v2) {
        renderError(confirmContainer, 'Email addresses must match.')
        summaryMessages.push('Email addresses must match.')
        isValid = false
      }
    }

    // ---- PHONE VALIDATION ----
    if (phone) {
      const phoneContainer = phone.closest('.oneField')
      const digits = digitsOnly(phone.value)

      if (!digits) {
        renderError(phoneContainer, 'Phone number is required.')
        summaryMessages.push('Phone number is required.')
        isValid = false
      } else if (digits.length !== 10) {
        renderError(phoneContainer, 'Enter a valid 10-digit phone number.')
        summaryMessages.push('Enter a valid 10-digit phone number.')
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

    const email = form.querySelector('input.calc-email')
    const confirm = form.querySelector('input.calc-confirmEmail')

    const container = input.closest('.oneField')
    if (!container) return true

    // Only clear this field's container
    container.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

    let isValid = true

    // ----- EMAIL FIELD -----
    if (input.classList.contains('calc-email')) {
      const value = (input.value || '').trim()

      if (value && !isValidEmailFormat(value)) {
        renderError(container, 'Enter a valid email address.')
        isValid = false
      }

      // If confirm exists, revalidate it too
      if (confirm) {
        const confirmContainer = confirm.closest('.oneField')
        confirmContainer?.querySelectorAll('.m43-inline-error').forEach((e) => e.remove())

        const v1 = value.toLowerCase()
        const v2 = (confirm.value || '').trim().toLowerCase()

        if (v2 && v1 !== v2) {
          renderError(confirmContainer, 'Email addresses must match.')
        }
      }
    }

    // ----- CONFIRM FIELD -----
    if (input.classList.contains('calc-confirmEmail')) {
      const v1 = email ? (email.value || '').trim().toLowerCase() : ''
      const v2 = (input.value || '').trim().toLowerCase()

      if (v2 && v1 && v1 !== v2) {
        renderError(container, 'Email addresses must match.')
        isValid = false
      }
    }

    // ----- PHONE FIELD -----
    if (input.classList.contains('calc-phone')) {
      const digits = digitsOnly(input.value)

      if (digits && digits.length !== 10) {
        renderError(container, 'Enter a valid 10-digit phone number.')
        isValid = false
      }
    }

    return isValid
  }

  function handleSubmit(event) {
    const form = event.target
    if (!form || form.tagName !== 'FORM') return

    const valid = validateForm(form)

    if (!valid) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return false
    }
  }

  document.addEventListener('submit', handleSubmit, true)

  document.addEventListener('input', function (event) {
    const target = event.target
    if (!target || target.tagName !== 'INPUT') return

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
      const form = document.querySelector('form')
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
