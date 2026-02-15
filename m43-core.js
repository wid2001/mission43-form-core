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

    const maskInstance = IMaskLib(input, MASK_CONFIG);
    input._m43Mask = maskInstance;
    input.dataset.m43MaskApplied = "true";
  }

  function validatePhones() {
    let valid = true;
    const phones = document.querySelectorAll(PHONE_SELECTOR);

    phones.forEach((input) => {
      delete input.dataset.m43Error;

      const digits = input._m43Mask
        ? input._m43Mask.unmaskedValue
        : digitsOnly(input.value);
      const isRequired =
        input.classList.contains("required") ||
        input.getAttribute("aria-required") === "true";

      if (
        (isRequired && !digits.length) ||
        (digits.length > 0 && digits.length !== 10)
      ) {
        input.dataset.m43Error = "Please enter a valid 10-digit phone number.";
        valid = false;
      }
    });

    return valid;
  }

  function validateEmailFormat(input) {
    delete input.dataset.m43Error;

    const value = input.value.trim();
    const isRequired =
      input.classList.contains("required") ||
      input.getAttribute("aria-required") === "true";

    if (isRequired && !value) {
      input.dataset.m43Error = "This field is required.";
      return false;
    }

    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        input.dataset.m43Error = "Please enter a valid email address.";
        return false;
      }
    }

    return true;
  }

  function validateEmailMatching() {
    let valid = true;

    const groups = Array.from(document.querySelectorAll(".section.group"));

    groups.forEach((group) => {
      const nestedGroup = group.querySelector(".section.group");
      if (nestedGroup) return;

      const emails = group.querySelectorAll(EMAIL_SELECTOR);
      if (emails.length !== 2) return;

      const [email1, email2] = emails;

      delete email2.dataset.m43Error;

      const v1 = (email1.value || "").trim().toLowerCase();
      const v2 = (email2.value || "").trim().toLowerCase();

      if (!v1 || !v2) return;

      if (v1 !== v2) {
        email2.dataset.m43Error = "Email addresses must match.";
        valid = false;
      }
    });

    return valid;
  }

  function validateEmails() {
    let valid = true;

    const emails = document.querySelectorAll(EMAIL_SELECTOR);

    emails.forEach((input) => {
      if (!validateEmailFormat(input)) valid = false;
    });

    if (!validateEmailMatching()) valid = false;

    return valid;
  }

  function renderBrandErrors(form) {
    const oldSummary = form.querySelector(".m43-error-summary");
    if (oldSummary) oldSummary.remove();

    const invalidFields = Array.from(
      form.querySelectorAll("[data-m43-error]")
    );
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
      if (!field || !(field instanceof HTMLElement)) return;

      const label =
        form.querySelector(`label[for="${field.id}"]`) ||
        field.closest(".oneField")?.querySelector("label");

      const message =
        field.dataset.m43Error || "This field is required.";

      const li = document.createElement("li");
      li.textContent = label
        ? `${label.textContent.trim()} — ${message}`
        : message;
      list.appendChild(li);

      field.classList.add("m43-field-error");
      field.setAttribute("aria-invalid", "true");

      const fieldContainer =
        field.closest(".oneField") || field.parentElement;

      const existingInline =
        fieldContainer.querySelector(".m43-inline-error");
      if (existingInline) existingInline.remove();

      const inline = document.createElement("div");
      inline.className = "m43-inline-error";
      inline.textContent = message;

      const inlineId = `m43-error-${field.name || field.id || "field"}`;
      inline.id = inlineId;

      field.setAttribute("aria-describedby", inlineId);
      fieldContainer.appendChild(inline);
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
    let form;

    if (event.type === "submit") {
      form = event.target;
    } else {
      form = event.target.closest("form");
    }

    if (!form) return;

    clearBrandErrors(form);

    let hasErrors = false;

    if (!validatePhones()) hasErrors = true;
    if (!validateEmails()) hasErrors = true;

    if (hasErrors) {
      event.preventDefault();
      event.stopPropagation();
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
