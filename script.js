/* ==========================================================================
   Dener Eduardo — Portfolio Interactions (Vanilla JS)
   - Instant PT/EN translation with localStorage persistence
   - ScrollSpy active navigation state
   - Accessible mobile drawer
   - Email copy-to-clipboard with fallback
   - Graceful profile image loading & scroll-reveal transitions
   ========================================================================== */

(function () {
  "use strict";

  // Update this single constant with your personal email address before deploying.
  const CONTACT_EMAIL = "dener.03@gmail.com";
  const STORAGE_KEY = "portfolio_lang";
  const DEFAULT_LANG = "pt";

  let currentLang = DEFAULT_LANG;
  let copyTimer = null;

  /**
   * Read saved language preference safely.
   */
  function getSavedLang() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "pt" || saved === "en") {
        return saved;
      }
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
    return DEFAULT_LANG;
  }

  /**
   * Persist language preference safely.
   */
  function saveLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
  }

  /**
   * Apply translations across all tagged DOM elements and update document metadata.
   */
  function applyLanguage(lang) {
    const dict =
      window.TRANSLATIONS && window.TRANSLATIONS[lang]
        ? window.TRANSLATIONS[lang]
        : window.TRANSLATIONS[DEFAULT_LANG];

    if (!dict) return;

    currentLang = lang;
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";

    if (dict["meta.title"]) {
      document.title = dict["meta.title"];
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict["meta.description"]) {
      metaDesc.setAttribute("content", dict["meta.description"]);
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.innerHTML = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.setAttribute("aria-label", dict[key]);
      }
    });

    // Sync all language buttons (sidebar + mobile top bar)
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const isSelected = btn.getAttribute("data-lang-btn") === lang;
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    saveLang(lang);
  }

  /**
   * Bind click listeners to language switcher buttons.
   */
  function initLanguageSwitcher() {
    applyLanguage(getSavedLang());

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextLang = btn.getAttribute("data-lang-btn");
        if (nextLang && nextLang !== currentLang) {
          applyLanguage(nextLang);
        }
      });
    });
  }

  /**
   * Mobile sidebar drawer behavior with backdrop, Escape key, and scroll lock.
   */
  function initMobileDrawer() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const openBtn = document.getElementById("mobile-menu-open");
    const closeBtn = document.getElementById("mobile-menu-close");

    if (!sidebar || !backdrop || !openBtn) return;

    function openDrawer() {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.add("translate-x-0");
      backdrop.classList.remove("hidden");
      requestAnimationFrame(() => {
        backdrop.classList.remove("opacity-0");
        backdrop.classList.add("opacity-100");
      });
      openBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("overflow-hidden", "lg:overflow-auto");
    }

    function closeDrawer() {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      backdrop.classList.add("opacity-0");
      backdrop.classList.remove("opacity-100");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("overflow-hidden", "lg:overflow-auto");
      window.setTimeout(() => {
        if (sidebar.classList.contains("-translate-x-full")) {
          backdrop.classList.add("hidden");
        }
      }, 220);
    }

    openBtn.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !sidebar.classList.contains("-translate-x-full")) {
        closeDrawer();
      }
    });

    sidebar.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 1024) {
          closeDrawer();
        }
      });
    });
  }

  /**
   * ScrollSpy: highlights the active section link in the sidebar navigation.
   */
  function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll(".nav-link[data-section]"));
    const sections = navLinks
      .map((link) => document.getElementById(link.getAttribute("data-section")))
      .filter(Boolean);

    if (!navLinks.length || !sections.length) return;

    function setActive(sectionId) {
      navLinks.forEach((link) => {
        const matches = link.getAttribute("data-section") === sectionId;
        link.classList.toggle("is-active", matches);
        if (matches) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function updateActiveFromScroll() {
      const scrollY = window.scrollY;
      const viewportBottom = scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Ensure the final section (#contato) becomes active at the bottom of the page
      if (viewportBottom >= docHeight - 24) {
        setActive(sections[sections.length - 1].id);
        return;
      }

      const offset = window.innerWidth < 1024 ? 140 : 180;
      let activeId = sections[0].id;

      for (const section of sections) {
        if (section.offsetTop - offset <= scrollY) {
          activeId = section.id;
        }
      }

      setActive(activeId);
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visible.length > 0) {
            setActive(visible[0].target.id);
          }
        },
        {
          rootMargin: "-22% 0px -60% 0px",
          threshold: [0, 0.15]
        }
      );

      sections.forEach((section) => observer.observe(section));
    }

    let scrollTicking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(() => {
            updateActiveFromScroll();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true }
    );

    updateActiveFromScroll();
  }

  /**
   * Sync contact email anchor & wire copy-to-clipboard button with fallback.
   */
  function initContactCopy() {
    const emailLink = document.getElementById("contact-email-link");
    const emailText = document.getElementById("contact-email-text");
    const copyBtn = document.getElementById("copy-email-btn");
    const copyLabel = document.getElementById("copy-email-label");
    const copyIconDefault = document.getElementById("copy-icon-default");
    const copyIconDone = document.getElementById("copy-icon-done");

    if (emailLink) {
      emailLink.href = `mailto:${CONTACT_EMAIL}`;
    }
    if (emailText) {
      emailText.textContent = CONTACT_EMAIL;
    }

    if (!copyBtn || !copyLabel) return;

    function fallbackCopy(text) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();
      let success = false;
      try {
        success = document.execCommand("copy");
      } catch (_) {
        success = false;
      }
      document.body.removeChild(helper);
      return success;
    }

    function showCopiedFeedback() {
      const dict =
        (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) ||
        window.TRANSLATIONS[DEFAULT_LANG];

      copyLabel.setAttribute("data-i18n", "contact.copiedBtn");
      copyLabel.textContent = dict["contact.copiedBtn"];
      copyBtn.classList.add("border-[#10B981]/60", "text-[#10B981]", "bg-[#10B981]/10");

      if (copyIconDefault && copyIconDone) {
        copyIconDefault.classList.add("hidden");
        copyIconDone.classList.remove("hidden");
      }

      if (copyTimer) window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        const latestDict =
          (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) ||
          window.TRANSLATIONS[DEFAULT_LANG];
        copyLabel.setAttribute("data-i18n", "contact.copyBtn");
        copyLabel.textContent = latestDict["contact.copyBtn"];
        copyBtn.classList.remove("border-[#10B981]/60", "text-[#10B981]", "bg-[#10B981]/10");

        if (copyIconDefault && copyIconDone) {
          copyIconDefault.classList.remove("hidden");
          copyIconDone.classList.add("hidden");
        }
      }, 2200);
    }

    copyBtn.addEventListener("click", async () => {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(CONTACT_EMAIL);
          copied = true;
        } catch (_) {
          copied = fallbackCopy(CONTACT_EMAIL);
        }
      } else {
        copied = fallbackCopy(CONTACT_EMAIL);
      }

      if (copied) {
        showCopiedFeedback();
      }
    });
  }

  /**
   * Show assets/perfil.jpg smoothly if available; keep crisp DE monogram fallback otherwise.
   */
  function initProfilePhoto() {
    const images = document.querySelectorAll("[data-profile-img]");
    images.forEach((img) => {
      const container = img.parentElement;
      const fallback = container ? container.querySelector("[data-profile-fallback]") : null;
      if (!fallback) return;

      function showPhoto() {
        img.classList.remove("hidden");
        fallback.classList.add("hidden");
      }

      function showFallback() {
        img.classList.add("hidden");
        fallback.classList.remove("hidden");
      }

      img.addEventListener("load", () => {
        if (img.naturalWidth > 0) {
          showPhoto();
        } else {
          showFallback();
        }
      });

      img.addEventListener("error", showFallback);

      if (img.complete) {
        if (img.naturalWidth > 0) {
          showPhoto();
        } else {
          showFallback();
        }
      }
    });
  }

  /**
   * Subtle reveal animation for sections and cards as they enter the viewport.
   */
  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08
      }
    );

    items.forEach((el) => observer.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initProfilePhoto();
    initLanguageSwitcher();
    initMobileDrawer();
    initScrollSpy();
    initContactCopy();
    initScrollReveal();
  });
})();
