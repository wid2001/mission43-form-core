/**
 * Mission43 Core Behavior Layer
 * Phone Masking + Validation
 * Uses IMask 7.6.1 (lazy-loaded)
 */

(function M43CorePhone() {
  const IMASK_CDN = "https://esm.sh/imask@7.6.1";

  const PHONE_SELECTOR =
    'input[type="tel"], input[name*="phone" i], input[id*="phone" i]';

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
      script.type = "module";
      script.onload = () => {
        if (window.IMask) {
          resolve(window.IMask);
        } else {
          reject(new Error("IMask failed to attach to window."));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function applyMaskToInput(IMaskLib, input) {
    if (input.dataset.m43MaskApplied) return;

    const mask = IMaskLib(input, MASK_CONFIG);

    input.dataset.m43MaskApplied = "true";

    input.addEventListener("blur", () => {
      const digits = digitsOnly(input.value);
      if (digits.length === 0) return; // allow empty if optional
      if (digits.length !== 10) {
        input.setCustomValidity("Please enter a valid 10-digit phone number.");
      } else {
        input.setCustomValidity("");
      }
    });
  }

  function renderBrandErrors(form) {
    // Remove old summary
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

      // --- SUMMARY ENTRY ---
      const li = document.createElement("li");
      li.textContent = label
        ? `${label.textContent.trim()} — ${message}`
        : message;
      list.appendChild(li);

      // --- INLINE ERROR ---
      field.classList.add("m43-field-error");
      field.setAttribute("aria-invalid", "true");

      // Remove existing inline error if present
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
      event.stopPropagation();
      renderBrandErrors(form);
    }
  }

  async function init() {
    const phoneInputs = document.querySelectorAll(PHONE_SELECTOR);
    if (!phoneInputs.length) return;

    try {
      const IMaskLib = await loadIMask();
      phoneInputs.forEach((input) => applyMaskToInput(IMaskLib, input));
    } catch (err) {
      console.error("M43 Phone Mask failed to load IMask:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
