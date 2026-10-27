/* ====== VMNI Urgencias · espirograma animado ======
   Trazado en vivo de los volúmenes y capacidades pulmonares (adulto ~70 kg).
   El usuario respira «en corriente» y puede pedir una inspiración o espiración
   máximas para ver cómo se acotan VRI, VRE, VR y las capacidades. */
const Espiro = (() => {
  "use strict";

  // niveles en litros — por defecto el adulto tipo; setValores() los recalcula
  // a partir de los volúmenes teóricos por sexo, edad y talla.
  let N = { vr: 1.2, vre: 1.1, vt: 0.5, vri: 3.0 };
  let VR, CRF, VT_SUP, CPT, MAX, BANDAS, LLAVES;
  const lit = v => (Math.round(v * 20) / 20).toLocaleString("es-ES") + " L";
  function calcularNiveles() {
    VR = N.vr; CRF = N.vr + N.vre; VT_SUP = CRF + N.vt; CPT = VT_SUP + N.vri;
    MAX = CPT * 1.08;
    BANDAS = [
      { de: 0, a: VR, color: "#E3E8EC", nombre: "VR", detalle: "Volumen residual", v: N.vr },
      { de: VR, a: CRF, color: "#D5E8EE", nombre: "VRE", detalle: "Reserva espiratoria", v: N.vre },
      { de: CRF, a: VT_SUP, color: "#BFE5CC", nombre: "VT", detalle: "Volumen corriente", v: N.vt },
      { de: VT_SUP, a: CPT, color: "#E8F2F5", nombre: "VRI", detalle: "Reserva inspiratoria", v: N.vri },
    ];
    LLAVES = [ // capacidades (llaves a la derecha)
      { de: 0, a: CRF, nombre: "CRF", off: 12, v: CRF },
      { de: VR, a: CPT, nombre: "CV", off: 52, v: CPT - VR },
      { de: 0, a: CPT, nombre: "CPT", off: 92, v: CPT },
    ];
  }
  calcularNiveles();

  let cv = null, ctx = null, dpr = 1;
  let W = 760, H = 360, X0 = 46, X1 = 600;
  const PXS = 60;

  let activo = false, raf = null;
  let t = 0, x = X0, prev = null;
  let maniobra = null; // {tipo:"insp"|"esp", t0}
  let resalte = null;
  let puntos = [];            // trazo del barrido actual, para redibujar sin cortes
  let pedirRedibujo = false;  // la maniobra terminó: refrescar resaltes sin perder el trazo

  const yDe = v => H - 24 - (v / MAX) * (H - 44);

  function volumen(tt) {
    const base = CRF + (VT_SUP - CRF) * 0.5 * (1 - Math.cos(2 * Math.PI * tt / 4)); // corriente, periodo 4 s
    if (!maniobra) return base;
    const tm = tt - maniobra.t0;
    const objetivo = maniobra.tipo === "insp" ? CPT : VR;
    const suave = p => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, p)));
    if (tm < 1.6) return base + (objetivo - base) * suave(tm / 1.6);
    if (tm < 2.2) return objetivo;
    if (tm < 3.8) return objetivo + (base - objetivo) * suave((tm - 2.2) / 1.6);
    maniobra = null; resalte = null; pedirRedibujo = true;
    return base;
  }

  function fondo() {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    pintarBandas(0, W);
    // eje de litros
    ctx.fillStyle = "#5A6B70"; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "right";
    for (let l = 0; l <= Math.floor(MAX); l++) ctx.fillText(l, X0 - 7, yDe(l) + 4);
    ctx.save(); ctx.translate(13, H / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center";
    ctx.fillText("Volumen (L)", 0, 0); ctx.restore();
    // llaves de capacidades a la derecha
    LLAVES.forEach(c => {
      const xx = X1 + c.off, y1 = yDe(c.de), y2 = yDe(c.a);
      const activa = resalte === c.nombre;
      ctx.strokeStyle = activa ? "#B3541E" : "#2A7F8E"; ctx.lineWidth = activa ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(xx - 5, y2); ctx.lineTo(xx, y2); ctx.lineTo(xx, y1); ctx.lineTo(xx - 5, y1);
      ctx.stroke();
      ctx.fillStyle = activa ? "#B3541E" : "#16697A"; ctx.font = "800 12px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(c.nombre, xx + 5, (y1 + y2) / 2 - 2);
      ctx.font = "600 10px -apple-system, sans-serif";
      ctx.fillStyle = activa ? "#B3541E" : "rgba(22,105,122,.75)";
      ctx.fillText(lit(c.v), xx + 5, (y1 + y2) / 2 + 11);
    });
    ctx.textAlign = "left";
  }

  function pintarBandas(desdeX, anchoX) {
    ctx.save();
    ctx.beginPath(); ctx.rect(desdeX, 0, anchoX, H); ctx.clip();
    BANDAS.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(X0, yDe(b.a), X1 - X0, yDe(b.de) - yDe(b.a));
    });
    // separadores y rejilla vertical
    ctx.setLineDash([3, 5]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(15,76,92,.25)";
    [VR, CRF, VT_SUP, CPT].forEach(l => { ctx.beginPath(); ctx.moveTo(X0, yDe(l)); ctx.lineTo(X1, yDe(l)); ctx.stroke(); });
    ctx.strokeStyle = "rgba(15,76,92,.08)";
    for (let gx = X0; gx <= X1; gx += PXS * 2) { ctx.beginPath(); ctx.moveTo(gx, yDe(MAX)); ctx.lineTo(gx, yDe(0)); ctx.stroke(); }
    ctx.setLineDash([]);
    // etiquetas de volúmenes dentro de su banda
    BANDAS.forEach(b => {
      const activa = resalte === b.nombre;
      ctx.fillStyle = activa ? "#B3541E" : "rgba(15,76,92,.75)";
      ctx.font = `800 ${activa ? 14 : 12.5}px -apple-system, sans-serif`;
      ctx.fillText(b.nombre, X0 + 8, (yDe(b.de) + yDe(b.a)) / 2 + 4);
      ctx.font = "500 10px -apple-system, sans-serif";
      ctx.fillStyle = "rgba(15,76,92,.5)";
      ctx.fillText(`${b.detalle} · ${lit(b.v)}`, X0 + 44, (yDe(b.de) + yDe(b.a)) / 2 + 4);
    });
    ctx.restore();
  }

  function bucle(ahora) {
    if (!activo) return;
    if (!bucle.t0) bucle.t0 = ahora;
    const dt = Math.min(0.05, (ahora - bucle.t0) / 1000); bucle.t0 = ahora;
    const pasos = Math.max(1, Math.round(dt * PXS));
    for (let k = 0; k < pasos; k++) {
      const sub = dt / pasos;
      t += sub; x += sub * PXS;
      if (x >= X1) { x = X0; prev = null; puntos = []; }
      const v = volumen(t);
      // barra de barrido: restaura las bandas bajo ella
      pintarBandas(x + 1, 12);
      if (prev) {
        ctx.strokeStyle = "#0F4C5C"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(prev.x, yDe(prev.v)); ctx.lineTo(x, yDe(v)); ctx.stroke();
      }
      prev = { x, v };
      puntos.push(prev);
    }
    if (pedirRedibujo) { pedirRedibujo = false; redibujar(); }
    raf = requestAnimationFrame(bucle);
  }

  function maniobrar(tipo) {
    if (maniobra) return;
    maniobra = { tipo, t0: t };
    resalte = tipo === "insp" ? "VRI" : "VRE";
    setTimeout(() => {
      if (resalte) { resalte = tipo === "insp" ? "CPT" : "CRF"; redibujar(); }
    }, 1700);
    redibujar();
  }
  // Repinta fondo + resaltes y VUELVE A TRAZAR la curva ya dibujada: la
  // animación continúa donde estaba, sin el corte que reiniciaba el barrido.
  function redibujar() {
    if (!ctx) return;
    fondo();
    if (puntos.length > 1) {
      ctx.strokeStyle = "#0F4C5C"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      puntos.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, yDe(p.v)) : ctx.lineTo(p.x, yDe(p.v)));
      ctx.stroke();
    }
  }
  // Reescala el gráfico a los volúmenes teóricos (L) de la persona elegida.
  function setValores(v) {
    if (!v) return;
    N = { vr: v.vr, vre: v.vre, vt: v.vt, vri: v.vri };
    calcularNiveles();
    t = 0; x = X0; prev = null; puntos = []; maniobra = null; resalte = null;
    if (ctx) fondo();
  }

  function montar() {
    cv = document.getElementById("espiroCanvas");
    if (!cv) return;
    ctx = cv.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(560, Math.min(1100, cv.parentElement.clientWidth - 8));
    H = 360; X1 = W - 140;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    t = 0; x = X0; prev = null; puntos = []; maniobra = null; resalte = null; pedirRedibujo = false;
    fondo();
    activo = true; bucle.t0 = null;
    raf = requestAnimationFrame(bucle);
  }
  function pausar() { activo = false; if (raf) cancelAnimationFrame(raf); }

  return { montar, pausar, maniobrar, setValores };
})();

/* ====== Curva flujo-volumen animada (tema «Flujos») ======
   Bucle normal, obstructivo (espiración excavada) y restrictivo (miniatura),
   con un «lápiz» recorriendo el asa en tiempo real. */
const FlujoVol = (() => {
  "use strict";
  const TIPOS = {
    normal: { nombre: "Normal", cpt: 5.8, rv: 1.2, pef: 8, insp: 5, curva: 1.0, color: "#0F4C5C" },
    obstructivo: { nombre: "Obstructivo", cpt: 6.3, rv: 2.8, pef: 5, insp: 4, curva: 2.4, color: "#B3541E" },
    restrictivo: { nombre: "Restrictivo", cpt: 3.4, rv: 0.9, pef: 6, insp: 4, curva: 1.0, color: "#2A7F8E" },
  };
  let cv = null, ctx = null, dpr = 1, W = 720, H = 360;
  let tipo = "normal", activo = false, raf = null, t = 0;

  const X0 = 52, Y0 = 26;
  const xDe = v => X0 + ((7 - v) / 7) * (W - X0 - 20);          // CPT a la izquierda, 0 a la derecha
  const yDe = f => Y0 + ((10 - f) / 18) * (H - Y0 - 34);        // flujo +10 arriba … −8 abajo

  function flujoEsp(T, v) { // v entre rv y cpt
    const pico = T.cpt - 0.25 * (T.cpt - T.rv);
    if (v >= pico) return T.pef * (T.cpt - v) / (T.cpt - pico);
    return T.pef * Math.pow((v - T.rv) / (pico - T.rv), T.curva);
  }
  function punto(T, fase) { // fase 0..1 (0-0.5 espiración, 0.5-1 inspiración)
    if (fase < 0.5) {
      const p = fase / 0.5;
      const v = T.cpt - p * (T.cpt - T.rv);
      return [v, flujoEsp(T, v)];
    }
    const p = (fase - 0.5) / 0.5;
    const v = T.rv + p * (T.cpt - T.rv);
    return [v, -T.insp * Math.sin(Math.PI * p)];
  }

  function fondo() {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    // ejes
    ctx.strokeStyle = "rgba(15,76,92,.35)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X0, yDe(0)); ctx.lineTo(W - 14, yDe(0)); ctx.stroke(); // eje V (flujo 0)
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, H - 30); ctx.stroke();
    ctx.fillStyle = "#5A6B70"; ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "right";
    [8, 4, 0, -4].forEach(f => ctx.fillText(f, X0 - 6, yDe(f) + 4));
    ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center";
    ctx.fillText("Flujo (L/s)  — esp. ↑ / insp. ↓", 0, 0); ctx.restore();
    ctx.textAlign = "center";
    [6, 4, 2, 0].forEach(v => ctx.fillText(v, xDe(v), H - 12));
    ctx.fillText("Volumen pulmonar (L) — CPT a la izquierda, RV a la derecha", (X0 + W) / 2, H - 0.5);
    // asas guía (las tres, tenues) + la activa marcada
    Object.entries(TIPOS).forEach(([k, T]) => {
      ctx.strokeStyle = k === tipo ? T.color : "rgba(120,140,148,.25)";
      ctx.lineWidth = k === tipo ? 2.6 : 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const [v, f] = punto(T, i / 200);
        i === 0 ? ctx.moveTo(xDe(v), yDe(f)) : ctx.lineTo(xDe(v), yDe(f));
      }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = "700 12px -apple-system, sans-serif";
      const [ve, fe] = punto(T, 0.18);
      ctx.fillText(T.nombre, xDe(ve), yDe(fe) - 8);
    });
    // nota del patrón activo
    ctx.fillStyle = "#5A6B70"; ctx.font = "500 11.5px -apple-system, sans-serif"; ctx.textAlign = "left";
    const notas = {
      normal: "Espiración casi lineal hasta el volumen residual; asa amplia.",
      obstructivo: "Rama espiratoria CÓNCAVA («excavada»): limitación al flujo; RV alto (atrapamiento).",
      restrictivo: "Asa en miniatura: volúmenes pequeños con flujos proporcionalmente conservados.",
    };
    ctx.fillText(notas[tipo], X0 + 6, Y0 + 4);
  }

  function bucle(ahora) {
    if (!activo) return;
    if (!bucle.t0) bucle.t0 = ahora;
    const dt = Math.min(0.05, (ahora - bucle.t0) / 1000); bucle.t0 = ahora;
    t += dt;
    fondo();
    const T = TIPOS[tipo];
    const fase = (t % 4) / 4;
    // estela reciente
    ctx.strokeStyle = T.color; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 24; i >= 0; i--) {
      const f2 = ((t - i * 0.02) % 4) / 4;
      const [v, f] = punto(T, f2);
      i === 24 ? ctx.moveTo(xDe(v), yDe(f)) : ctx.lineTo(xDe(v), yDe(f));
    }
    ctx.stroke();
    const [v, f] = punto(T, fase);
    ctx.fillStyle = T.color;
    ctx.beginPath(); ctx.arc(xDe(v), yDe(f), 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(xDe(v), yDe(f), 2.6, 0, Math.PI * 2); ctx.fill();
    raf = requestAnimationFrame(bucle);
  }

  function setTipo(k) {
    tipo = k;
    document.querySelectorAll("#fvTipos .chip").forEach(c => c.classList.toggle("sel", c.dataset.v === k));
  }
  function montar() {
    cv = document.getElementById("flujovolCanvas");
    if (!cv) return;
    ctx = cv.getContext("2d");
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(540, Math.min(1000, cv.parentElement.clientWidth - 8));
    H = 360;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    activo = true; bucle.t0 = null; t = 0;
    raf = requestAnimationFrame(bucle);
  }
  function pausar() { activo = false; if (raf) cancelAnimationFrame(raf); }
  return { montar, pausar, setTipo };
})();
