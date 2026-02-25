

/* mission43-form-core: centralized FormAssembly layout (header/footer + base styles)
   - Requires: window.M43_FORM_BRAND = "mission43" | "fieldhouse"
   - Optional: window.M43_FORM_BASE_URL = "https://www.mission43.org" (defaults per brand)
   - Behavior: If brand missing/unknown -> render nothing.
*/

(function () {
  "use strict";

  // Prevent double-insertion if script is loaded twice.
  if (window.__M43_LAYOUT_LOADED__) return;
  window.__M43_LAYOUT_LOADED__ = true;

  const BRAND = (window.M43_FORM_BRAND || "").toString().trim().toLowerCase();
  if (BRAND !== "mission43" && BRAND !== "fieldhouse") {
    // No brand specified (or invalid) -> intentionally render nothing.
    return;
  }

  const BRAND_CONFIG = {
    mission43: {
      baseUrl: "https://www.mission43.org",
      accent: "#f02f4e",
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    },
    fieldhouse: {
      baseUrl: "https://www.idahofieldhouse.org",
      accent: "#0E2F22",
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }
  };

  const ACTIVE_BRAND = BRAND_CONFIG[BRAND];

  if (!ACTIVE_BRAND) return;

  const BASE_URL = (window.M43_FORM_BASE_URL || ACTIVE_BRAND.baseUrl)
    .toString()
    .trim()
    .replace(/\/$/, "");

  // ---- CSS (centralized) ----
  function injectCssOnce() {
    if (document.getElementById("m43-layout-css")) return;

    const css = `
/* ===== mission43-form-core (FormAssembly) ===== */
:root {
  --m43-font-family: ${ACTIVE_BRAND.fontFamily};
  --m43-text: #171717;
  --m43-muted: #666666;
  --m43-border: #e6e6e6;
  --m43-surface: #ffffff;
  --m43-accent: ${ACTIVE_BRAND.accent};
}

/* Space so the injected header doesn't feel glued to the form */
.wFormContainer { margin-top: 40px; }

.m43-global-header {
  background: var(--m43-surface);
  border-bottom: 1px solid var(--m43-border);
  padding: 24px 60px;
  font-family: var(--m43-font-family);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.m43-global-header a {
  text-decoration: none;
  margin-left: 40px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111111;
}

.m43-global-header a:hover { color: var(--m43-accent); }

.m43-global-footer {
  background: var(--m43-surface);
  padding: 60px 0;
  font-size: 14px;
  font-family: var(--m43-font-family);
  border-top: 1px solid var(--m43-border);
  margin-top: 80px;
}

.m43-global-footer a {
  color: #111111;
  text-decoration: none;
  margin: 0 12px;
  font-weight: 500;
}

.m43-global-footer a:hover { color: var(--m43-accent); }

/* Make header/footer padding less aggressive on mobile */
@media (max-width: 720px) {
  .m43-global-header { padding: 18px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
  .m43-global-header a { margin-left: 0; margin-right: 18px; display: inline-block; }
  .m43-global-footer { padding: 40px 0; }
}
`;

    const style = document.createElement("style");
    style.id = "m43-layout-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ---- DOM helpers ----
  function q(sel) { return document.querySelector(sel); }

  function ensureContainers() {
    const formContainer = q(".wFormContainer");
    if (!formContainer) return null;

    // If we already inserted, return existing nodes.
    let header = document.getElementById("m43-global-header");
    let footer = document.getElementById("m43-global-footer");

    if (!header) {
      header = document.createElement("div");
      header.id = "m43-global-header";
      formContainer.parentNode.insertBefore(header, formContainer);
    }

    if (!footer) {
      footer = document.createElement("div");
      footer.id = "m43-global-footer";
      formContainer.parentNode.insertBefore(footer, formContainer.nextSibling);
    }

    return { formContainer, header, footer };
  }

  function mission43HeaderHtml() {
    // NOTE: keep SVG inline to avoid extra fetch and ensure consistent rendering.
    return `
<div class="m43-global-header">
  <div>
    <a href="${BASE_URL}" aria-label="Mission43 Home" style="display:flex; align-items:center; margin-left:0;">
      <svg viewBox="0 0 137.6 50" xmlns="http://www.w3.org/2000/svg" style="height:48px; width:auto; display:block;">
        <g>
          <path d="M 0.1 0 L 137.6 0 L 137.6 50 L 0.1 50 Z" fill="transparent"></path>
          <path d="M 122.45 28.762 L 122.45 31.687 L 120.875 31.687 L 120.875 33.6 L 117.725 33.6 L 117.725 31.687 L 111.425 31.687 L 111.425 28.875 L 117.073 20.1 L 120.763 20.1 L 114.553 29.707 L 115.183 30.09 L 116.06 28.762 L 117.725 28.762 L 117.725 26.625 L 118.153 25.95 L 120.875 25.95 L 120.875 28.762 Z M 132.009 20.1 L 134.596 22.687 L 134.596 25.5 L 133.584 26.512 L 134.821 27.75 L 134.821 31.012 L 132.234 33.6 L 126.159 33.6 L 123.571 31.012 L 123.571 28.987 L 126.721 28.987 L 126.721 29.775 L 127.621 30.675 L 130.771 30.675 L 131.671 29.775 L 131.671 28.987 L 130.771 28.087 L 127.846 28.087 L 127.846 25.162 L 130.546 25.162 L 131.446 24.262 L 131.446 23.925 L 130.546 23.025 L 127.846 23.025 L 126.946 23.925 L 126.946 24.712 L 123.796 24.712 L 123.796 22.687 L 126.384 20.1 Z" fill="rgb(215,22,53)"></path>
          <g>
            <path d="M 25.031 28.1 L 20.464 32.65 L 0.846 14.125 C 0.338 13.637 0 12.987 0 12.175 L 0 4.05 Z M 19.824 33.137 L 5.458 19.359 L 0.429 24.181 L 14.796 37.96 Z M 8.1 0 L 8.1 10.9 L 7.931 10.9 L 0.827 3.905 C 0.488 3.579 0 2.993 0 2.505 L 0 0 Z M 0 25.2 L 20.45 44.489 L 14.698 50 L 0 35.922 Z" fill="rgb(215,22,53)"></path>
            <path d="M 29.45 25.05 L 29.45 35.905 L 14.698 50 L 9.266 44.734 Z M 0 25.2 L 7.95 32.821 L 7.95 47.9 L 0 47.9 Z" fill="rgb(215,22,53)"></path>
            <path d="M 29.45 25.05 L 21.45 32.821 L 21.45 47.9 L 29.45 47.9 Z" fill="rgb(215,22,53)"></path>
          </g>
          <path d="M 42.67 31.88 L 40.35 26.2 L 40.15 33.6 L 37.25 33.6 L 37.81 20.28 L 40.81 20.28 L 44.01 28.76 L 47.21 20.28 L 50.21 20.28 L 50.77 33.6 L 47.87 33.6 L 47.67 26.2 L 45.35 31.88 Z M 55.872 33.6 L 52.872 33.6 L 52.872 20.28 L 55.872 20.28 Z M 66.954 29.86 C 66.954 32.5 66.094 33.8 62.074 33.8 C 60.534 33.8 58.914 33.46 57.774 32.94 L 58.274 30.62 C 59.494 31 60.734 31.26 62.114 31.26 C 63.654 31.26 63.954 30.96 63.954 29.84 C 63.954 28.64 63.894 28.5 61.714 28.02 C 58.494 27.32 58.014 26.68 58.014 23.8 C 58.014 21.14 58.954 20.08 62.614 20.08 C 63.774 20.08 65.174 20.2 66.654 20.52 L 66.354 23.04 C 64.834 22.78 63.854 22.66 62.654 22.66 C 61.314 22.66 61.014 22.9 61.014 23.88 C 61.014 25.16 61.074 25.18 63.174 25.68 C 66.774 26.54 66.954 27.24 66.954 29.86 Z M 77.433 29.86 C 77.433 32.5 76.573 33.8 72.553 33.8 C 71.013 33.8 69.393 33.46 68.253 32.94 L 68.753 30.62 C 69.973 31 71.213 31.26 72.593 31.26 C 74.133 31.26 74.433 30.96 74.433 29.84 C 74.433 28.64 74.373 28.5 72.193 28.02 C 68.973 27.32 68.493 26.68 68.493 23.8 C 68.493 21.14 69.433 20.08 73.093 20.08 C 74.253 20.08 75.653 20.2 77.133 20.52 L 76.833 23.04 C 75.313 22.78 74.333 22.66 73.133 22.66 C 71.793 22.66 71.493 22.9 71.493 23.88 C 71.493 25.16 71.553 25.18 73.653 25.68 C 77.253 26.54 77.433 27.24 77.433 29.86 Z M 82.231 33.6 L 79.231 33.6 L 79.231 20.28 L 82.231 20.28 Z M 94.552 24.16 L 94.552 29.72 C 94.552 31.74 93.152 33.8 89.392 33.8 C 85.632 33.8 84.232 31.74 84.232 29.72 L 84.232 24.16 C 84.232 22.14 85.632 20.08 89.392 20.08 C 93.152 20.08 94.552 22.14 94.552 24.16 Z M 91.552 29.46 L 91.552 24.42 C 91.552 23.38 90.892 22.74 89.392 22.74 C 87.892 22.74 87.232 23.38 87.232 24.42 L 87.232 29.46 C 87.232 30.5 87.892 31.14 89.392 31.14 C 90.892 31.14 91.552 30.5 91.552 29.46 Z M 103.676 33.6 L 99.316 24.84 L 99.316 33.6 L 96.456 33.6 L 96.456 20.28 L 100.136 20.28 L 104.516 29.46 L 104.516 20.28 L 107.376 20.28 L 107.376 33.6 Z" fill="rgb(23, 23, 23)"></path>
        </g>
      </svg>
    </a>
  </div>
  <div>
    <a href="${BASE_URL}/events">Events</a>
    <a href="${BASE_URL}/about">About</a>
  </div>
</div>`;
  }

  function mission43FooterHtml() {
    return `
<div class="m43-global-footer">
  <div style="max-width:1200px; margin:0 auto; padding:0 60px; text-align:center;">
    <div style="font-size:15px; font-weight:500; margin-bottom:16px;">Mission43 – Empowering Idaho Veterans & Families</div>
    <div style="margin-bottom:16px;"><a href="${BASE_URL}/privacy-policy">Privacy Policy</a></div>
    <div style="color:#666;">© 2016–2026 Mission43. All rights reserved.</div>
  </div>
</div>`;
  }

  function fieldhouseHeaderHtml() {
    return `
<div class="m43-global-header">
  <div>
    <a href="${BASE_URL}/" aria-label="Idaho Outdoor Fieldhouse Home" style="display:flex; align-items:center; margin-left:0;">
      <img
        src="https://mission43-form-core.pages.dev/assets/fieldhouse/IOFH_Logo_Grn.png"
        alt="The Idaho Outdoor Fieldhouse"
        style="height:42px; width:auto; display:block;"
        loading="eager"
        decoding="async"
      />
    </a>
  </div>
  <div>
    <a href="${BASE_URL}/about">About</a>
    <a href="${BASE_URL}/fh-programs">Programs</a>
    <a href="${BASE_URL}/events">Events</a>
    <a href="${BASE_URL}/contact">Contact</a>
  </div>
</div>`;
  }

  function fieldhouseFooterHtml() {
    return `
<div class="m43-global-footer">
  <div style="max-width:1200px; margin:0 auto; padding:0 60px; text-align:center;">
    <div style="font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:18px;">Idaho Outdoor Fieldhouse</div>
    <div style="margin-bottom:12px; color:#333;">3179 E Barber Valley Drive, Boise, ID 83716</div>
    <div style="margin-bottom:18px;">
      <a href="${BASE_URL}/privacy-policy">Privacy Policy</a>
      <span style="margin:0 10px;">|</span>
      <a href="${BASE_URL}/terms-of-use">Terms of Use</a>
      <span style="margin:0 10px;">|</span>
      <a href="${BASE_URL}/incident-reporting">Incident Reporting</a>
    </div>
    <div style="color:#666;">© 2024 The Idaho Outdoor Fieldhouse. All Rights Reserved.</div>
  </div>
</div>`;
  }

  function render() {
    injectCssOnce();

    const containers = ensureContainers();
    if (!containers) return false;

    const { header, footer } = containers;

    if (BRAND === "mission43") {
      header.innerHTML = mission43HeaderHtml();
      footer.innerHTML = mission43FooterHtml();
    } else {
      header.innerHTML = fieldhouseHeaderHtml();
      footer.innerHTML = fieldhouseFooterHtml();
    }

    return true;
  }

  function boot() {
    // Attempt immediately, then retry briefly to handle edge timing.
    if (render()) return;

    let tries = 0;
    const maxTries = 80; // ~4s at 50ms
    const timer = setInterval(() => {
      tries += 1;
      if (render() || tries >= maxTries) {
        clearInterval(timer);
      }
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
