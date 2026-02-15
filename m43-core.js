/**
 * Mission43 Core Behavior Layer
 * Phone Masking
 * Email Validation + Confirm Matching
 * Navigation Gate Enforcement
 * Uses IMask 7.6.1 (UMD build)
 */

(function M43Core() {

  const IMASK_CDN =
    "https://cdn.jsdelivr.net/npm/imask@7.6.1/dist/imask.min.js";

  const PHONE_SELECTOR =
    'input[autocomplete="tel"]';

  const EMAIL_SELECTOR =
    'input[autocomplete="email"]';

  const MASK_CONFIG = {
    mask: "(000) 000-0000",
    lazy: true,
    placeholderChar: "_",
  };

  function digitsOnly(value) {
    return (value || "").replace(/\D/g, "");
  }

  function loadIMask() {
    return new Promise((resolve, reject) => {
      if (window.IMask) {
        resolve(window.IMask);
        return;
      }

      const script = document.createElement("script");
      script.src = IMASK_CDN;
      script.onload = () => resolve(window.IMask);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function applyPhoneMask(IMaskLib, input) {
    if (input.dataset.m43MaskApplied) return;

    IMaskLib(input, MASK_CONFIG);
    input.dataset.m43MaskApplied = "true";
  }

  function validatePhones() {
    const phones = document.querySelectorAll(PHONE_SELECTOR);

    phones.forEach((input) => {
      const digits = digitsOnly(input.value);
      if (input.required && digits.length !== 10) {
        input.setCustomValidity(
          "Please enter a valid 10-digit phone number."
        );
      } else {
        input.setCustomValidity("");
      }
    });
  }

  function validateEmailFormat(input) {
    const value = input.value.trim();
    if (!value) {
      if (input.required) {
        input.setCustomValidity("This field is required.");
      }
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      input.setCustomValidity("Please enter a valid email address.");
    } else {
      input.setCustomValidity("");
    }
  }

  function validateEmailMatching() {
    const fieldsets = document.querySelectorAll("fieldset");

    fieldsets.forEach((fieldset) => {
      const emails = fieldset.querySelectorAll(EMAIL_SELECTOR);
      if (emails.length !== 2) return;

      const [email1, email2] = emails;

      if (!email1.value || !email2.value) return;

      if (email1.value.trim() !== email2.value.trim()) {
        email2.setCustomValidity("Email addresses must match.");
      } else {
        email2.setCustomValidity("");
      }
    });
  }

  function validateEmails() {
    const emails = document.querySelectorAll(EMAIL_SELECTOR);
    emails.forEach((input) => {
      validateEmailFormat(input);
    });
    validateEmailMatching();
  }

  function renderBrandErrors(form) {
    const oldSummary = form.querySelector(".m43-error-summary");
    if (oldSummary) oldSummary.remove();

    const invalidFields = Array.from(form.querySelectorAll(":invalid"));
    if (!invalidFields.length) return;

    const summary = document.createElement("div");
    summary.className = "m43-error-summary";
    summary.setAttribute("role", "alert");

    summary.innerHTML = `
      <div class="m43-error-summary-inner">
        <strong>Please correct the following:</strong>
        <ul></ul>
      </div>
    `;

    const list = summary.querySelector("ul");

    invalidFields.forEach((field) => {
      const label =
        form.querySelector(`label[for="${field.id}"]`) ||
        field.closest(".oneField")?.querySelector("label");

      const message =
        field.validationMessage || "This field is required.";

      const li = document.createElement("li");
      li.textContent = label
        ? `${label.textContent.trim()} — ${message}`
        : message;
      list.appendChild(li);

      field.classList.add("m43-field-error");
      field.setAttribute("aria-invalid", "true");

      const existingInline =
        field.parentElement.querySelector(".m43-inline-error");
      if (existingInline) existingInline.remove();

      const inline = document.createElement("div");
      inline.className = "m43-inline-error";
      inline.textContent = message;

      const inlineId = `m43-error-${field.name || field.id}`;
      inline.id = inlineId;

      field.setAttribute("aria-describedby", inlineId);
      field.parentElement.appendChild(inline);
    });

    form.prepend(summary);
  }

  function clearBrandErrors(form) {
    const summary = form.querySelector(".m43-error-summary");
    if (summary) summary.remove();

    form.querySelectorAll(".m43-field-error").forEach((field) => {
      field.classList.remove("m43-field-error");
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");

      const inline =
        field.parentElement.querySelector(".m43-inline-error");
      if (inline) inline.remove();
    });
  }

  function navGateHandler(event) {
    const form = event.target.closest("form");
    if (!form) return;

    validatePhones();
    validateEmails();

    clearBrandErrors(form);

    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderBrandErrors(form);
    }
  }

  async function init() {

    const phoneInputs = document.querySelectorAll(PHONE_SELECTOR);

    if (phoneInputs.length) {
      try {
        const IMaskLib = await loadIMask();
        phoneInputs.forEach((input) =>
          applyPhoneMask(IMaskLib, input)
        );
      } catch (err) {
        console.error("M43 IMask load failed:", err);
      }
    }

    document.addEventListener(
      "click",
      (e) => {
        const target = e.target;

        if (
          target.matches('button[type="submit"]') ||
          target.matches(".wFormNextButton") ||
          target.matches(".wFormBackButton") ||
          target.closest(".wfPagingButtons")
        ) {
          navGateHandler(e);
        }
      },
      true
    );

    document.addEventListener(
      "submit",
      navGateHandler,
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
