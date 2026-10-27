/* ====== VMNI Urgencias · espirograma animado ======
   Trazado en vivo de los volúmenes y capacidades pulmonares (adulto ~70 kg).
   El usuario respira «en corriente» y puede pedir una inspiración o espiración
   máximas para ver cómo se acotan VRI, VRE, VR y las capacidades. */
const Espiro = (() => {
  "use strict";

  // niveles en litros (adulto tipo)
  const VR = 1.2, CRF = 2.3, VT_SUP = 2.8, CPT = 5.8, MAX = 6.2;
  const BANDAS = [
    { de: 0, a: VR, color: "#E3E8EC", nombre: "VR", detalle: "Volumen residual" },
    { de: VR, a: CRF, color: "#D5E8EE", nombre: "VRE", detalle: "Reserva espiratoria" },
    { de: CRF, a: VT_SUP, color: "#BFE5CC", nombre: "VT", detalle: "Volumen corriente" },
    { de: VT_SUP, a: CPT, color: "#E8F2F5", nombre: "VRI", detalle: "Reserva inspiratoria" },
  ];
  const LLAVES = [ // capacidades (llaves a la derecha)
    { de: 0, a: CRF, nombre: "CRF", off: 12 },
    { de: VR, a: CPT, nombre: "CV", off: 52 },
    { de: 0, a: CPT, nombre: "CPT", off: 92 },
  ];

  let cv = null, ctx = null, dpr = 1;
  let W = 760, H = 360, X0 = 46, X1 = 600;
  const PXS = 60;

  let activo = false, raf = null;
  let t = 0, x = X0, prev = null;
  let maniobra = null; // {tipo:"insp"|"esp", t0}
  let resalte = null;

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
    maniobra = null; resalte = null;
    return base;
  }

  function fondo() {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    pintarBandas(0, W);
    // eje de litros
    ctx.fillStyle = "#5A6B70"; ctx.font = "600 11px -apple-system, sans-serif"; ctx.textAlign = "right";
    [0, 1, 2, 3, 4, 5, 6].forEach(l => ctx.fillText(l, X0 - 7, yDe(l) + 4));
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
      ctx.fillText(c.nombre, xx + 5, (y1 + y2) / 2 + 4);
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
      ctx.fillText(b.detalle, X0 + 44, (yDe(b.de) + yDe(b.a)) / 2 + 4);
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
      if (x >= X1) { x = X0; prev = null; }
      const v = volumen(t);
      // barra de barrido: restaura las bandas bajo ella
      pintarBandas(x + 1, 12);
      if (prev) {
        ctx.strokeStyle = "#0F4C5C"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(prev.x, yDe(prev.v)); ctx.lineTo(x, yDe(v)); ctx.stroke();
      }
      prev = { x, v };
    }
    raf = requestAnimationFrame(bucle);
  }

  function maniobrar(tipo) {
    if (maniobra) return;
    maniobra = { tipo, t0: t };
    resalte = tipo === "insp" ? "VRI" : "VRE";
    setTimeout(() => { if (resalte) resalte = tipo === "insp" ? "CPT" : "CRF"; fondoEtiquetas(); }, 1700);
    fondoEtiquetas();
  }
  function fondoEtiquetas() { if (ctx) fondo(); prev = null; x = X0; }

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
    t = 0; x = X0; prev = null; maniobra = null; resalte = null;
    fondo();
    activo = true; bucle.t0 = null;
    raf = requestAnimationFrame(bucle);
  }
  function pausar() { activo = false; if (raf) cancelAnimationFrame(raf); }

  return { montar, pausar, maniobrar };
})();
