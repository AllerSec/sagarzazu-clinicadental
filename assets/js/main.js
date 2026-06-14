/* ===========================================================================
   Clínica Dental Mª Cristina Sagarzazu — main.js
   Vanilla + GSAP (loaded via CDN with local-friendly init). No build step.
   Everything degrades gracefully and respects prefers-reduced-motion.
   ========================================================================= */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------------------- *
   * 1. PAGE LOADER — first visit of the session only
   * ---------------------------------------------------------------------- */
  function initLoader() {
    const loader = $(".loader");
    if (!loader) return;
    const seen = sessionStorage.getItem("sgz_loaded");
    if (seen) { loader.remove(); return; }

    const bar = $(".loader__bar span");
    let p = 0;
    const finish = () => {
      sessionStorage.setItem("sgz_loaded", "1");
      loader.classList.add("is-done");
      loader.addEventListener("transitionend", () => loader.remove(), { once: true });
      document.dispatchEvent(new CustomEvent("loader:done"));
    };
    if (prefersReduced) {
      if (bar) bar.style.setProperty("--p", "1");
      setTimeout(finish, 300);
      return;
    }
    const tick = () => {
      p = Math.min(1, p + Math.random() * 0.16 + 0.04);
      if (bar) bar.style.setProperty("--p", p.toFixed(3));
      if (p < 1) {
        setTimeout(tick, 90 + Math.random() * 90);
      } else {
        setTimeout(finish, 280);
      }
    };
    setTimeout(tick, 120);
    // safety timeout
    setTimeout(finish, 3600);
  }

  /* ---------------------------------------------------------------------- *
   * 2. HEADER + MOBILE MENU
   * ---------------------------------------------------------------------- */
  function initHeader() {
    const header = $(".header");
    if (header) {
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      // Fija la altura real del header en --header-h para que el hero
      // sea fullscreen exacto (viewport menos header). Se actualiza al
      // redimensionar/rotar. Usa ResizeObserver si está disponible.
      const setHeaderH = () => {
        const h = header.getBoundingClientRect().height;
        root.style.setProperty("--header-h", `${Math.round(h)}px`);
      };
      setHeaderH();
      window.addEventListener("resize", setHeaderH, { passive: true });
      window.addEventListener("orientationchange", setHeaderH);
      if ("ResizeObserver" in window) new ResizeObserver(setHeaderH).observe(header);
      // recalcular cuando las fuentes terminen de cargar (puede cambiar el alto)
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderH);
    }
    const burger = $(".burger");
    const close = () => root.classList.remove("is-menu-open");
    if (burger) {
      burger.addEventListener("click", () => {
        const open = root.classList.toggle("is-menu-open");
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    $(".nav__backdrop")?.addEventListener("click", close);
    $$(".nav__links a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* ---------------------------------------------------------------------- *
   * 3. LANGUAGE — auto-detect + switcher
   * ---------------------------------------------------------------------- */
  function initLanguage() {
    const lang = $(".lang");
    if (lang) {
      const btn = $(".lang__btn", lang);
      btn?.addEventListener("click", e => {
        e.stopPropagation();
        lang.classList.toggle("is-open");
      });
      document.addEventListener("click", () => lang.classList.remove("is-open"));
    }
    // Auto-redirect on first visit based on browser language (never EU by default).
    // Only runs on the ES root and only once, never forcing euskara.
    try {
      const current = root.getAttribute("data-lang") || "es";
      const isHome = /(^\/(index\.html)?$)|(\/$)/.test(location.pathname.replace(/\/[a-z]{2}\//, "/"));
      const redirected = localStorage.getItem("sgz_lang_redirect");
      if (current === "es" && !redirected && isHome) {
        const nav = (navigator.language || navigator.userLanguage || "es").toLowerCase();
        const map = { en: "en", fr: "fr", eu: null }; // eu intentionally never auto
        const code = nav.slice(0, 2);
        const target = map[code];
        if (target && document.querySelector(`link[hreflang="${target}"]`)) {
          localStorage.setItem("sgz_lang_redirect", "1");
          const href = document.querySelector(`link[hreflang="${target}"]`).getAttribute("href");
          if (href && !location.href.includes(`/${target}/`)) location.replace(href);
        } else {
          localStorage.setItem("sgz_lang_redirect", "1");
        }
      }
    } catch (_) { /* no-op */ }
  }

  /* ---------------------------------------------------------------------- *
   * 4. LIVE OPEN / CLOSED  (real hours)
   *    L, J, V: 09:00–17:00 · M, X: 12:00–20:00 · Sáb/Dom: cerrado
   *    JS getDay(): 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
   * ---------------------------------------------------------------------- */
  const HOURS = {
    1: [[9, 17]],   // Lunes
    2: [[12, 20]],  // Martes
    3: [[12, 20]],  // Miércoles
    4: [[9, 17]],   // Jueves
    5: [[9, 17]],   // Viernes
    6: [],          // Sábado
    0: [],          // Domingo
  };
  const DAY_NAMES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  function computeOpen(now = new Date()) {
    const d = now.getDay();
    const h = now.getHours() + now.getMinutes() / 60;
    const ranges = HOURS[d] || [];
    for (const [a, b] of ranges) if (h >= a && h < b) {
      return { open: true, until: b };
    }
    // find next opening
    for (let i = 0; i <= 7; i++) {
      const dd = (d + i) % 7;
      const ranges2 = HOURS[dd] || [];
      for (const [a] of ranges2) {
        if (i === 0 && h >= a) continue;
        return { open: false, nextDay: i === 0 ? "hoy" : (i === 1 ? "mañana" : `el ${DAY_NAMES[dd]}`), nextHour: a };
      }
    }
    return { open: false };
  }
  function initLivePill() {
    const pill = $("[data-open-pill]");
    if (!pill) return;
    const st = computeOpen();
    const label = $(".pill__label", pill) || pill;
    if (st.open) {
      pill.classList.add("is-open"); pill.classList.remove("is-closed");
      label.textContent = `Abierto ahora · hasta las ${String(st.until).padStart(2,"0")}:00`;
    } else {
      pill.classList.add("is-closed"); pill.classList.remove("is-open");
      label.textContent = st.nextHour != null
        ? `Cerrado · abre ${st.nextDay} a las ${String(st.nextHour).padStart(2,"0")}:00`
        : "Cerrado ahora";
    }
    // highlight today's row in hours table
    const today = new Date().getDay();
    $(`[data-day="${today}"]`)?.classList.add("is-today");
  }

  /* ---------------------------------------------------------------------- *
   * 5. COPY TO CLIPBOARD + TOAST
   * ---------------------------------------------------------------------- */
  let toastEl, toastText;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      // build once with safe DOM nodes; never inject text via innerHTML
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.5");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", "M20 6 9 17l-5-5");
      svg.appendChild(path);
      toastText = document.createElement("span");
      toastEl.append(svg, toastText);
      document.body.appendChild(toastEl);
    }
    toastText.textContent = msg; // safe: plain text only
    toastEl.classList.add("is-visible");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }
  function initCopy() {
    $$("[data-copy]").forEach(el => {
      el.addEventListener("click", async e => {
        const val = el.getAttribute("data-copy");
        try {
          await navigator.clipboard.writeText(val);
          toast(`Copiado: ${val}`);
        } catch { /* allow default tel: link */ }
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * 6. REVIEW FILTER (keyword chips)
   * ---------------------------------------------------------------------- */
  function initReviewFilter() {
    const chips = $$("[data-filter]");
    if (!chips.length) return;
    const reviews = $$(".review");
    chips.forEach(chip => chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const key = chip.getAttribute("data-filter");
      reviews.forEach(r => {
        const tags = (r.getAttribute("data-tags") || "");
        const show = key === "all" || tags.includes(key);
        r.classList.toggle("is-hidden", !show);
      });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }));
  }

  /* ---------------------------------------------------------------------- *
   * 7. "VER MÁS" expanders (mobile-friendly, avoids saturation)
   * ---------------------------------------------------------------------- */
  function initShowMore() {
    $$("[data-showmore]").forEach(btn => {
      const target = $(btn.getAttribute("data-showmore"));
      if (!target) return;
      btn.addEventListener("click", () => {
        const expanded = target.classList.toggle("is-expanded");
        btn.textContent = expanded ? btn.dataset.less || "Ver menos" : btn.dataset.more || "Ver más";
        btn.setAttribute("aria-expanded", String(expanded));
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * 8. FORM (no backend: builds a mailto/whatsapp friendly confirmation)
   * ---------------------------------------------------------------------- */
  function initForm() {
    const form = $("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = new FormData(form);
      const nombre = (data.get("nombre") || "").toString();
      const tel = (data.get("telefono") || "").toString();
      const msg = (data.get("mensaje") || "").toString();
      const body = encodeURIComponent(`Hola, soy ${nombre} (${tel}).\n\n${msg}`);
      const subject = encodeURIComponent("Solicitud de cita — web");
      // open the user's mail client with the prefilled message
      window.location.href = `mailto:info@clinicasagarzazu.es?subject=${subject}&body=${body}`;
      toast("Abriendo tu correo para enviar la solicitud…");
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------- *
   * 9. GSAP — reveals, hero, count-up, marquee, magnetic, cursor glow
   * ---------------------------------------------------------------------- */
  function initGSAP() {
    const gsap = window.gsap;
    if (!gsap) { revealFallback(); return; }
    const ScrollTrigger = window.ScrollTrigger;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (prefersReduced) {
      // show everything, no motion
      gsap.set("[data-reveal]", { autoAlpha: 1, y: 0 });
      countUpAll(true);
      drawStars(true);
      initLivePillAndProgress(false);
      return;
    }

    // Scroll progress (GPU transform via --p)
    initLivePillAndProgress(true);

    // Generic reveals
    $$("[data-reveal]").forEach((el, i) => {
      gsap.to(el, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
        delay: (el.dataset.delay ? parseFloat(el.dataset.delay) : 0),
      });
    });

    // Staggered groups
    $$("[data-reveal-group]").forEach(group => {
      const items = $$(":scope > *", group);
      gsap.set(items, { autoAlpha: 0, y: 24 });
      gsap.to(items, {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08,
        scrollTrigger: { trigger: group, start: "top 82%" },
      });
    });

    // Hero entrance timeline
    const heroPlay = () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero h1 .reveal-line", { yPercent: 110, opacity: 0, duration: 1, stagger: 0.12 })
        .from(".hero__lead", { y: 20, autoAlpha: 0, duration: 0.8 }, "-=0.6")
        .from(".hero__actions > *", { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
        .from(".hero__rating", { y: 14, autoAlpha: 0, duration: 0.7 }, "-=0.5")
        .from(".hero__pill-wrap", { y: 14, autoAlpha: 0, duration: 0.6 }, "-=0.6");
      // draw underline
      const uPath = $(".hero .underline-draw path");
      if (uPath) {
        const len = uPath.getTotalLength();
        gsap.set(uPath, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(uPath, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "-=0.8");
      }
      // floaters drift
      $$(".hero__floaters svg").forEach((f, i) => {
        gsap.to(f, { y: "+=18", x: `+=${i % 2 ? 12 : -12}`, rotation: i % 2 ? 8 : -8,
          duration: 6 + i, repeat: -1, yoyo: true, ease: "sine.inOut" });
      });
    };
    if (sessionStorage.getItem("sgz_loaded")) heroPlay();
    else document.addEventListener("loader:done", heroPlay, { once: true });

    // Count-up
    countUpAll(false);
    // Stars draw
    drawStars(false);

    // Hero parallax media
    const media = $(".hero__media");
    if (media && ScrollTrigger) {
      gsap.to(media, { yPercent: 14, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // Service SVG draw-on
    $$(".service__icon path, .service__icon circle, .service__icon line").forEach(p => {
      if (typeof p.getTotalLength !== "function") return;
      try {
        const len = p.getTotalLength();
        if (!len) return;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out",
          scrollTrigger: { trigger: p.closest(".service"), start: "top 85%" } });
      } catch (_) {}
    });

    // Marquee
    $$(".marquee").forEach(m => {
      const track = $(".marquee__track", m);
      if (!track) return;
      // duplicate for seamless loop
      track.innerHTML += track.innerHTML;
      const total = track.scrollWidth / 2;
      const anim = gsap.to(track, { x: -total, duration: total / 40, ease: "none", repeat: -1 });
      m.addEventListener("mouseenter", () => anim.timeScale(0.15));
      m.addEventListener("mouseleave", () => anim.timeScale(1));
    });

    // Magnetic buttons
    $$("[data-magnetic]").forEach(btn => {
      const strength = 18;
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: mx / r.width * strength, y: my / r.height * strength, duration: 0.4, ease: "power3.out" });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.5)" }));
    });

    // Cursor glow on hero (desktop only)
    const hero = $(".hero");
    if (hero && window.matchMedia("(pointer:fine)").matches) {
      const glow = document.createElement("div");
      glow.className = "hero__glow";
      hero.appendChild(glow);
      hero.addEventListener("mousemove", e => {
        const r = hero.getBoundingClientRect();
        gsap.to(glow, { x: e.clientX - r.left, y: e.clientY - r.top, duration: 0.6, ease: "power2.out" });
      });
    }

    // Section headers settle
    $$("[data-settle]").forEach(el => {
      gsap.from(el, { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  }

  function initLivePillAndProgress(animate) {
    const prog = $(".scroll-progress");
    if (prog) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        prog.style.setProperty("--p", p.toFixed(4));
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  function countUpAll(instant) {
    const gsap = window.gsap;
    $$("[data-count]").forEach(el => {
      const target = parseFloat(el.getAttribute("data-count"));
      const dec = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals")) : 0;
      const render = v => { el.textContent = dec ? v.toFixed(dec).replace(".", ",") : Math.round(v).toString(); };
      if (instant || !gsap || !window.ScrollTrigger) { render(target); return; }
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => render(obj.v) });
    });
  }

  function drawStars(instant) {
    const gsap = window.gsap;
    $$("[data-draw-stars] .star-fill").forEach((s, i) => {
      if (instant || !gsap) { gsap && gsap.set(s, { scale: 1, autoAlpha: 1 }); return; }
      gsap.from(s, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)",
        delay: i * 0.08,
        scrollTrigger: { trigger: s.closest("[data-draw-stars]"), start: "top 90%" } });
    });
  }

  // Fallback if GSAP failed to load: just show content.
  function revealFallback() {
    $$("[data-reveal]").forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; });
    $$("[data-reveal-group] > *").forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; });
    countUpAll(true);
    initLivePillAndProgress(false);
  }

  /* ---------------------------------------------------------------------- *
   * 10. ACTIVE NAV (current page already set server-side; this adds in-page)
   * ---------------------------------------------------------------------- */
  function initSmoothAnchors() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", e => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        const top = t.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * BOOT
   * ---------------------------------------------------------------------- */
  function boot() {
    initLoader();
    initHeader();
    initLanguage();
    initLivePill();
    initCopy();
    initReviewFilter();
    initShowMore();
    initForm();
    initSmoothAnchors();
    initGSAP();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
