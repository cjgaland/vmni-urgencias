/* ====== VMNI Urgencias · boceto v0.2 — navegación + simulador demo ====== */

/* ---------- navegación ---------- */
function irA(id) {
  document.querySelectorAll(".pantalla").forEach(s => s.classList.remove("visible"));
  document.getElementById(id).classList.add("visible");
  document.querySelectorAll("[data-s]").forEach(b => b.classList.toggle("activo", b.dataset.s === id));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (id === "simulador") Sim.activar(); else Sim.pausar();
}

function pasoWizard(n) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById("paso" + i).classList.toggle("oculto", i !== n);
    const p = document.querySelector(`.paso[data-p="${i}"]`);
    p.classList.toggle("activo", i === n);
    p.classList.toggle("hecho", i < n);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function inicioRapido(tipo) {
  irA("evaluacion");
  pasoWizard(3); // en el inicio rápido solo pedimos gasometría mínima
}

function verAsincronia(a) {
  irA("simulador");
  document.querySelectorAll(".asincronias .chip").forEach(c => {
    c.classList.toggle("sel", c.dataset.a === a);
  });
  Sim.setAsincronia(a);
}

/* chips seleccionables (demo) */
document.querySelectorAll(".chip").forEach(ch => {
  ch.addEventListener("click", () => {
    if (ch.closest(".asincronias")) {
      ch.parentElement.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
      ch.classList.add("sel");
      Sim.setAsincronia(ch.dataset.a);
    } else {
      ch.classList.toggle("sel");
    }
  });
});
document.querySelectorAll(".sel-btn").forEach(b => {
  b.addEventListener("click", () => {
    b.parentElement.querySelectorAll(".sel-btn").forEach(x => x.classList.remove("activo"));
    b.classList.add("activo");
  });
});

/* ---------- simulador de ondas ---------- */
const Sim = (() => {
  const cv = document.getElementById("ondas");
  const ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 860, H = 430;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.maxWidth = "100%";
  ctx.scale(dpr, dpr);

  const PXS = 86;            // píxeles por segundo
  const bandas = [
    { nombre: "Presión",  unidad: "cmH₂O", y0: 18,  alto: 118, min: 0,   max: 32,  color: "#FFD97D" },
    { nombre: "Flujo",    unidad: "L/min", y0: 158, alto: 118, min: -70, max: 70,  color: "#5BD1E8" },
    { nombre: "Volumen",  unidad: "ml",    y0: 298, alto: 112, min: 0,   max: 750, color: "#8BE8A2" },
  ];

  // estado
  let ipap = 15, epap = 5, fr = 18, rampa = 2, asinc = "normal";
  let activo = false, raf = null;
  let t = 0, x = 0, prev = null, vol = 0;
  let ciclo = null;

  const RT = { 1: 0.08, 2: 0.2, 3: 0.4 }; // rampa en s

  function nuevoCiclo(tInicio) {
    const T = 60 / fr;
    let Ti = Math.min(1.1, T * 0.33), tipo = "normal", trigger = true;
    if (asinc === "autociclado" && Math.random() < 0.45) { tipo = "auto"; trigger = false; }
    if (asinc === "doble" && Math.random() < 0.6) tipo = "doble";
    if (asinc === "tardio") { tipo = "tardio"; Ti = Math.min(1.7, Ti * 1.7); }
    const dur = tipo === "auto" ? T * 0.5 : (tipo === "doble" ? T * 1.25 : T);
    return { t0: tInicio, T: dur, Ti, tipo, trigger, blip: 0.45 + Math.random() * 0.2 };
  }

  function ondas(tc) {
    // valores de presión y flujo en el instante tc del ciclo actual
    const PS = ipap - epap, rt = RT[rampa];
    const c = ciclo;
    let p = epap, f = 0;
    const subida = te => 1 - Math.exp(-te / (rt / 2.2));
    const fpico = PS * 3.1 + 14;

    const insp = (te, Ti, conTrigger) => {
      let pp = epap + PS * subida(te);
      let ff = fpico * subida(te) * Math.exp(-te / (Ti / 1.9));
      if (conTrigger && te < 0.1) pp -= 1.4 * (1 - te / 0.1);            // deflexión del disparo
      if (c.tipo === "tardio" && te > Ti * 0.8) {
        pp += 2.6 * ((te - Ti * 0.8) / (Ti * 0.2));                      // sobrepresión final
        ff = Math.min(ff, fpico * 0.07 - 6 * ((te - Ti * 0.8) / (Ti * 0.2)));
      }
      return [pp, ff];
    };
    const esp = (tex) => {
      const pp = epap + PS * Math.exp(-tex / 0.11);
      const ff = -(fpico * 0.82) * Math.exp(-tex / 0.38);
      return [pp, ff];
    };

    if (c.tipo === "doble") {
      const Ti2 = c.Ti * 0.62;
      if (tc < c.Ti) [p, f] = insp(tc, c.Ti, c.trigger);
      else if (tc < c.Ti + Ti2) { const r = insp(tc - c.Ti, Ti2, false); p = r[0]; f = r[1]; }
      else { const r = esp(tc - c.Ti - Ti2); p = r[0]; f = r[1]; }
    } else if (tc < c.Ti) {
      [p, f] = insp(tc, c.Ti, c.trigger && c.tipo !== "auto");
    } else {
      [p, f] = esp(tc - c.Ti);
      if (asinc === "inefectivo") { // esfuerzo del paciente sin respuesta del ventilador
        const tb = c.Ti + c.blip, s = 0.07;
        const g = Math.exp(-((tc - tb) ** 2) / (2 * s * s));
        f += 14 * g; p -= 1.8 * g;
      }
    }
    if (asinc === "fuga") { f += 9; p += (Math.random() - 0.5) * 0.7; }
    return [p, f];
  }

  function yDe(b, v) {
    const r = (v - b.min) / (b.max - b.min);
    return b.y0 + b.alto - r * b.alto;
  }

  function fondo() {
    ctx.fillStyle = "#0B1E24";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += PXS) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    bandas.forEach(b => {
      ctx.strokeStyle = "rgba(255,255,255,.10)";
      ctx.beginPath(); ctx.moveTo(0, b.y0 + b.alto); ctx.lineTo(W, b.y0 + b.alto); ctx.stroke();
      if (b.min < 0) { // línea de cero del flujo
        ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(0, yDe(b, 0)); ctx.lineTo(W, yDe(b, 0)); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.fillText(`${b.nombre} (${b.unidad})`, 10, b.y0 + 4);
    });
  }

  function bucle(ahora) {
    if (!activo) return;
    if (!bucle.t0) bucle.t0 = ahora;
    const dt = Math.min(0.05, (ahora - bucle.t0) / 1000); bucle.t0 = ahora;

    let tc = t - ciclo.t0;
    if (tc >= ciclo.T) { ciclo = nuevoCiclo(t); tc = 0; vol = (asinc === "fuga") ? Math.min(vol, 90) : 0; }

    const pasos = Math.max(1, Math.round(dt * PXS)); // ~1 muestra por píxel
    for (let k = 0; k < pasos; k++) {
      const sub = dt / pasos;
      t += sub; x += sub * PXS;
      if (x >= W) { x = 0; prev = null; }
      let tcc = t - ciclo.t0;
      if (tcc >= ciclo.T) { ciclo = nuevoCiclo(t); tcc = 0; vol = (asinc === "fuga") ? Math.min(vol, 90) : 0; }
      const [p, f] = ondas(tcc);
      vol = Math.max(0, vol + (f / 60) * sub * 1000 * 0.82); // integración aproximada

      // barra de barrido
      ctx.fillStyle = "#0B1E24";
      ctx.fillRect(x + 1, 0, 14, H);
      if (Math.floor(x) % PXS < 1) { ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.moveTo(x + 1, 0); ctx.lineTo(x + 1, H); ctx.stroke(); }

      const vals = [p, f, Math.min(vol, 740)];
      if (prev) {
        bandas.forEach((b, bi) => {
          ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prev.x, yDe(b, prev.v[bi]));
          ctx.lineTo(x, yDe(b, Math.max(b.min, Math.min(b.max, vals[bi]))));
          ctx.stroke();
        });
      }
      prev = { x, v: vals };
    }
    raf = requestAnimationFrame(bucle);
  }

  function datos() {
    const PS = ipap - epap, T = 60 / fr, Ti = Math.min(1.1, T * 0.33);
    const ie = ((T - Ti) / Ti).toFixed(1).replace(".", ",");
    const vte = Math.round((PS * 42 + 160) / 10) * 10;
    document.getElementById("simDatos").textContent =
      `PS ${PS} · I:E 1:${ie} · Vte ~${vte} ml` + (asinc === "fuga" ? " · FUGA 28 L/min" : "");
  }

  const pistas = {
    normal: "Curvas normales: deflexión de disparo, presión en meseta, flujo desacelerado y volumen estable ciclo a ciclo.",
    fuga: "FUGA: línea de flujo desplazada (no vuelve a cero), volumen que no cierra, presión inestable. → Reajusta la interfaz antes de tocar parámetros.",
    inefectivo: "ESFUERZO INEFECTIVO: muesca en el flujo espiratorio con pequeña caída de presión, sin ciclo del ventilador. → Sube EPAP (autoPEEP) y sensibiliza el trigger.",
    autociclado: "AUTOCICLADO: ciclos extra sin deflexión de disparo previa, ritmo irregular. → Reduce la fuga y baja la sensibilidad del trigger.",
    doble: "DOBLE DISPARO: dos insuflaciones seguidas sin espiración completa. → Alarga el Ti o revisa la presión de soporte.",
    tardio: "CICLADO TARDÍO: sobrepresión al final de la inspiración y caída brusca del flujo (espiración activa). → Sube el criterio de ciclado (>25–50%) o baja la PS.",
  };

  function setAsincronia(a) { asinc = a; document.getElementById("pista").textContent = pistas[a]; datos(); }

  // controles
  const liga = (idR, idO, fn) => {
    const r = document.getElementById(idR), o = document.getElementById(idO);
    r.addEventListener("input", () => { fn(+r.value); o.textContent = idR === "rRampa" ? ["", "rápida", "media", "lenta"][+r.value] : r.value; datos(); });
  };
  liga("rIpap", "oIpap", v => { ipap = v; if (epap >= ipap - 2) { epap = ipap - 2; document.getElementById("rEpap").value = epap; document.getElementById("oEpap").textContent = epap; } });
  liga("rEpap", "oEpap", v => { epap = Math.min(v, ipap - 2); });
  liga("rFr", "oFr", v => { fr = v; });
  liga("rRampa", "oRampa", v => { rampa = v; });

  function activar() {
    if (activo) return;
    activo = true; bucle.t0 = null;
    if (!ciclo) { fondo(); ciclo = nuevoCiclo(0); datos(); }
    raf = requestAnimationFrame(bucle);
  }
  function pausar() { activo = false; if (raf) cancelAnimationFrame(raf); }

  return { activar, pausar, setAsincronia };
})();
