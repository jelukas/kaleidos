// Timeline principal data-driven, compartida por los shells vertical y horizontal.
//
// Lee los tiempos directamente del DOM (data-start / data-duration de cada clip)
// y construye el movimiento por CLASE, así que ambos formatos usan exactamente
// el mismo código y basta con tocar los data-* del shell para recortar.
//
// Determinista: sin Date.now(), sin Math.random(), sin fetch.
//
// Expone un constructor en vez de auto-registrarse: el registro en
// window.__timelines debe estar INLINE en el shell o el lint estático no lo ve
// (regla missing_timeline_registry).
window.buildVoxTimeline = () => {
  const tl = gsap.timeline({ paused: true });

  const num = (el, attr, fallback = 0) => {
    const v = Number.parseFloat(el.getAttribute(attr));
    return Number.isFinite(v) ? v : fallback;
  };

  // Separador de millares español (1.500, 48.300). Sin Intl para que el
  // resultado no dependa de la locale del entorno de render.
  const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // ── B-roll: Ken Burns lento durante toda la ventana del plano ─────────────
  // Alterna zoom in / zoom out para que dos planos seguidos no se sientan igual.
  // data-kb="in|out" en el <img> fuerza la dirección.
  document.querySelectorAll("img.shot").forEach((shot, i) => {
    const start = num(shot, "data-start");
    const duration = num(shot, "data-duration", 2);
    const explicit = shot.getAttribute("data-kb");
    const out = explicit ? explicit === "out" : i % 2 === 1;

    tl.fromTo(
      shot,
      { scale: out ? 1.16 : 1.02, xPercent: out ? -1 : 1 },
      { scale: out ? 1.02 : 1.16, xPercent: out ? 1 : -1, duration, ease: "none" },
      start,
    );
  });

  // ── Rótulos sobre imagen ──────────────────────────────────────────────────
  document.querySelectorAll(".caption").forEach((caption) => {
    tl.fromTo(
      caption,
      { opacity: 0, y: "2.4vmin" },
      { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" },
      num(caption, "data-start") + 0.06,
    );
  });

  // ── Barra de acento: barrido horizontal ───────────────────────────────────
  document.querySelectorAll(".bar").forEach((bar) => {
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power4.out" }, num(bar, "data-start") + 0.02);
  });

  // ── Atribución de fuente: entra discreta y tarde ──────────────────────────
  document.querySelectorAll(".source").forEach((src) => {
    tl.fromTo(src, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, num(src, "data-start") + 0.35);
  });

  // ── Tarjetas tipográficas ─────────────────────────────────────────────────
  // Los hijos no son clips: heredan el arranque de la tarjeta que los contiene.
  document.querySelectorAll(".card").forEach((card) => {
    const start = num(card, "data-start");

    const reveal = (sel, offset, from) => {
      card.querySelectorAll(sel).forEach((el, i) => {
        tl.fromTo(
          el,
          { opacity: 0, ...from },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.34, ease: "power3.out" },
          start + offset + i * 0.07,
        );
      });
    };

    reveal(".kicker", 0.04, { x: "-2.6vmin" });
    reveal(".headline", 0.11, { y: "2.6vmin", scale: 0.96 });
    reveal(".deck", 0.2, { y: "1.8vmin" });
    reveal(".statunit", 0.22, { y: "1.6vmin" });
    reveal(".statlabel", 0.28, { y: "1.4vmin" });
    reveal(".quotetext", 0.06, { x: "-2.2vmin" });
    reveal(".quoteattr", 0.24, { x: "-1.4vmin" });
    reveal(".cmplabel", 0.3, { y: "1.2vmin" });

    // Reglas de la comparativa: barrido escalonado.
    card.querySelectorAll(".cmprule").forEach((rule, i) => {
      tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.42, ease: "power4.out" }, start + 0.18 + i * 0.12);
    });

    // Cifras que cuentan hacia arriba. El valor se recalcula en cada onUpdate,
    // así que el seek del render cae siempre en el número correcto.
    card.querySelectorAll("[data-count-to]").forEach((el, i) => {
      const to = num(el, "data-count-to");
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      const dur = num(el, "data-count-duration", 1.1);
      const proxy = { v: 0 };
      tl.fromTo(
        proxy,
        { v: 0 },
        {
          v: to,
          duration: dur,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = `${prefix}${miles(proxy.v)}${suffix}`;
          },
        },
        start + 0.1 + i * 0.1,
      );
      // Entrada del propio bloque numérico, en paralelo al conteo.
      tl.fromTo(
        el,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" },
        start + 0.06 + i * 0.1,
      );
    });

    // Cifras sin conteo (texto libre: "1.500-2.000", "×30", "menos de 2.000").
    card.querySelectorAll(".statnum:not([data-count-to]), .cmpnum:not([data-count-to])").forEach((el, i) => {
      tl.fromTo(
        el,
        { opacity: 0, scale: 0.92, y: "1.6vmin" },
        { opacity: 1, scale: 1, y: 0, duration: 0.34, ease: "back.out(1.6)" },
        start + 0.08 + i * 0.1,
      );
    });
  });

  return tl;
};
