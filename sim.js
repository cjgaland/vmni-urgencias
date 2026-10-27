/* ====== VMNI Urgencias · simulador fisiológico ======
   Modelo monocompartimental R/C: el flujo y el volumen salen de la mecánica
   (no son dibujos), así los parámetros y los perfiles cambian las curvas de
   forma coherente. Vistas inspiradas en los equipos del área (recreación
   docente aproximada, no reproducen la pantalla real). */
const Sim = (() => {
  "use strict";

  /* ---------- lienzo ---------- */
  const cv = document.getElementById("ondas");
  const ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // dimensiones adaptables: el lienzo ocupa el espacio disponible (ajustarLienzo)
  let W = 720, H = 430, X1 = W - 34, HB = H - 26;
  const PXS = 76;  // píxeles por segundo
  const X0 = 58;   // margen izquierdo (escala)

  /* ---------- vistas (temas) ---------- */
  const TEMAS = {
    generico: { nombre: "VMNI · Genérico", bg: "#0B1E24", grid: "rgba(255,255,255,.07)", cero: "rgba(255,255,255,.16)",
      rotulo: "rgba(255,255,255,.5)", colores: ["#FFD97D", "#5BD1E8", "#8BE8A2"], cabecera: "#9FD4DE", panel: "#0E2730", numTxt: "#EAF6F8" },
    vivo: { nombre: "Estilo Vivo 50/60", bg: "#F4F6F8", grid: "rgba(27,79,114,.10)", cero: "rgba(27,79,114,.28)",
      rotulo: "rgba(27,79,114,.65)", colores: ["#C0392B", "#1F618D", "#1E8449"], cabecera: "#1B4F72", panel: "#E4EBF0", numTxt: "#15405D", claro: true },
    v60: { nombre: "Estilo V60", bg: "#000000", grid: "rgba(255,255,255,.09)", cero: "rgba(255,255,255,.2)",
      rotulo: "rgba(255,255,255,.55)", colores: ["#F4D03F", "#FDFEFE", "#58D68D"], cabecera: "#F4D03F", panel: "#101010", numTxt: "#F7F9F9" },
    vitae: { nombre: "Estilo VITAE 40", bg: "#12161B", grid: "rgba(240,160,48,.08)", cero: "rgba(240,160,48,.25)",
      rotulo: "rgba(240,160,48,.7)", colores: ["#F0A030", "#58C4DD"], cabecera: "#F0A030", panel: "#181D23", numTxt: "#F5E7D0", trazas: 2 },
  };

  /* ---------- perfiles de paciente (R en cmH2O/L/s, C en ml/cmH2O) ---------- */
  const PERFILES = {
    normal: { R: 10, C: 42, pmus: 5, frPac: 15, tEsfuerzo: 0.9, carga: 1, paco2: 40, shunt: 0.03, recluta: 0.5 },
    epoc: { R: 17, C: 48, pmus: 6, frPac: 22, tEsfuerzo: 0.9, carga: 5, paco2: 60, shunt: 0.07, recluta: 0.25 },
    eap: { R: 9, C: 26, pmus: 8, frPac: 28, tEsfuerzo: 0.8, carga: 1.5, paco2: 35, shunt: 0.22, recluta: 0.6 },
  };

  /* ---------- estado ---------- */
  let tema = "generico", perfil = "epoc", asinc = "normal";
  let docente = true, examen = false, revelado = false;
  let ipap = 15, epap = 5, frResp = 14, rampa = 2, ciclado = 25;
  let fio2 = 0.30, trigger = 2, ti = 1.5, spo2Act = 96;
  const RT = { 1: 0.07, 2: 0.18, 3: 0.38 };

  let activo = false, raf = null;
  let t = 0, x = X0, prev = null;
  let bandas = [];

  // modelo
  let V = 0;                 // L por encima de FRC
  let fase = "exp", tFase = 0, tUltimoInsp = -9;
  let flujoPico = 0, pawAct = 5, pplvEnd = 0;
  let esfuerzoT0 = -9, esfuerzoFalla = false, dobleHecho = false;
  let Vinsp = 0, VdispBase = 0, picoCiclo = 0, fugaMedia = 0, tiReal = 0;
  let frMedida = 0, ieTxt = "—", ciclos = 0;

  /* ---------- alarmas: beep por Web Audio + numéricos en rojo ---------- */
  let sonidoOn = true, audioCtx = null, ultimoBeepParam = -9, ultimoBeepEvt = -9;
  // Los navegadores móviles bloquean el audio hasta un gesto del usuario:
  // desbloqueamos el contexto en la primera interacción con la página.
  function desbloquearAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { /* sin audio disponible */ }
  }
  ["pointerdown", "touchstart", "keydown"].forEach(ev =>
    document.addEventListener(ev, desbloquearAudio, { once: true, passive: true }));
  function beep(doble) {
    if (!sonidoOn) return;
    try {
      desbloquearAudio();
      if (!audioCtx || audioCtx.state !== "running") return; // aún sin gesto del usuario
      const tono = (t, f) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = f;
        o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.start(t); o.stop(t + 0.17);
      };
      const t0 = audioCtx.currentTime;
      tono(t0, 880);
      if (doble) tono(t0 + 0.19, 660);
    } catch (e) { /* sin audio disponible */ }
  }
  // evento puntual (asincronía detectada): beep corto + anotación docente
  function alarma(bandaIdx, texto) {
    if (t - ultimoBeepEvt > 2.4) { ultimoBeepEvt = t; beep(false); }
    anotar(bandaIdx, texto);
  }
  let ultimaAnot = -9;

  /* ---------- geometría de bandas ---------- */
  function calcBandas() {
    const T = TEMAS[tema];
    const n = T.trazas || 3;
    const defs = [
      { nombre: "Presión", unidad: "cmH₂O", min: -2, max: 34, ticks: [0, 10, 20, 30] },
      { nombre: "Flujo", unidad: "L/min", min: -75, max: 75, ticks: [-60, 0, 60] },
      { nombre: "Volumen", unidad: "ml", min: 0, max: 800, ticks: [0, 400, 800] },
    ].slice(0, n);
    const alto = Math.floor((HB - 22 - n * 26) / n);
    bandas = defs.map((d, i) => Object.assign({}, d, { y0: 22 + i * (alto + 26), alto }));
  }

  const yDe = (b, v) => b.y0 + b.alto - ((Math.max(b.min, Math.min(b.max, v)) - b.min) / (b.max - b.min)) * b.alto;

  // rejilla del área de trazado (se redibuja también bajo la barra de barrido)
  function rejilla() {
    const T = TEMAS[tema];
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    for (let gx = X0; gx <= X1; gx += PXS) {
      ctx.strokeStyle = T.grid; ctx.beginPath(); ctx.moveTo(gx, 16); ctx.lineTo(gx, HB); ctx.stroke();
    }
    bandas.forEach(b => {
      b.ticks.forEach(v => {
        ctx.strokeStyle = v === 0 && b.min < 0 ? T.cero : T.grid;
        ctx.beginPath(); ctx.moveTo(X0, yDe(b, v)); ctx.lineTo(X1, yDe(b, v)); ctx.stroke();
      });
    });
    ctx.setLineDash([]);
  }

  // nombres de las curvas (viven dentro del área de barrido: se redibujan bajo él)
  function nombres() {
    const T = TEMAS[tema];
    ctx.font = "700 14px -apple-system, sans-serif";
    ctx.textAlign = "left";
    bandas.forEach((b, bi) => {
      ctx.fillStyle = T.colores[bi];
      ctx.fillText(b.nombre, X0 + 2, b.y0 - 7);
    });
  }

  function fondo() {
    const T = TEMAS[tema];
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    rejilla();
    nombres();
    bandas.forEach((b, bi) => {
      // escala numérica (izquierda)
      ctx.fillStyle = T.rotulo;
      ctx.font = "600 12px -apple-system, sans-serif";
      ctx.textAlign = "right";
      b.ticks.forEach(v => ctx.fillText(String(v), X0 - 7, yDe(b, v) + 4));
      // unidades (derecha, en vertical)
      ctx.save();
      ctx.translate(W - 10, b.y0 + b.alto / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.font = "700 12px -apple-system, sans-serif";
      ctx.fillText(b.unidad, 0, 0);
      ctx.restore();
    });
    // eje de tiempo
    ctx.fillStyle = T.rotulo;
    ctx.font = "600 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    for (let s = 0; s * PXS <= X1 - X0 - 96; s += 2) ctx.fillText(String(s), X0 + s * PXS, H - 8);
    ctx.textAlign = "right";
    ctx.font = "700 12px -apple-system, sans-serif";
    ctx.fillText("Tiempo (s)", X1, H - 8);
    ctx.textAlign = "left";
  }

  /* ---------- paciente: esfuerzos ---------- */
  function pmusEn(tAbs) {
    const P = PERFILES[perfil];
    const dur = asinc === "doble" ? 1.5 : P.tEsfuerzo;
    const te = tAbs - esfuerzoT0;
    if (te < 0 || te > dur) return 0;
    let amp = P.pmus;
    if (asinc === "inefectivo" && esfuerzoFalla) amp *= 0.45;
    return amp * Math.sin(Math.PI * te / dur);
  }

  function programarEsfuerzo(tAbs) {
    const P = PERFILES[perfil];
    esfuerzoT0 = tAbs + 60 / P.frPac * (0.9 + Math.random() * 0.2) - P.tEsfuerzo;
    esfuerzoFalla = asinc === "inefectivo" && Math.random() < 0.6;
  }

  function puedeDisparar() {
    const P = PERFILES[perfil];
    if (asinc === "inefectivo" && esfuerzoFalla) {
      // carga umbral (autoPEEP) compensable subiendo la EPAP — docente
      const carga = Math.max(0, P.carga - 1.0 * (epap - 4));
      return P.pmus * 0.45 > carga + 0.9 + 0.15 * trigger;
    }
    return true;
  }

  /* ---------- ciclo del ventilador ---------- */
  function iniciarInsp(tAbs, disparadoPorPaciente) {
    fase = "insp"; tFase = 0; flujoPico = 0; Vinsp = 0;
    if (tUltimoInsp > 0 && tAbs > tUltimoInsp + 0.4) {
      frMedida = Math.round(60 / (tAbs - tUltimoInsp));
      const texp = tAbs - tUltimoInsp - tiReal;
      if (tiReal > 0.2 && texp > 0.1) ieTxt = `1:${(texp / tiReal).toFixed(1).replace(".", ",")}`;
    }
    tUltimoInsp = tAbs; dobleHecho = false;
    ciclos++;
    VdispBase = V;
    if (!disparadoPorPaciente && asinc === "autociclado" && t - ultimaAnot > 2.5) alarma(0, "Autociclado: sin esfuerzo previo");
  }

  function paso(dt) {
    const P = PERFILES[perfil];
    const T = 60 / Math.max(frResp, 6);
    const PS = ipap - epap;
    const tiMax = ti;
    const cicl = ciclado / 100;
    const Palv = (V * 1000) / P.C;
    const pmus = pmusEn(t);
    tFase += dt;

    // programación de esfuerzos
    if (t >= esfuerzoT0 + (asinc === "doble" ? 1.5 : P.tEsfuerzo)) programarEsfuerzo(t);

    let flujoLs = 0; // L/s del paciente

    if (fase === "insp") {
      const rt = RT[rampa];
      pawAct = epap + PS * (1 - Math.exp(-tFase / rt));
      // deflexión de disparo al inicio si lo inició el paciente
      if (tFase < 0.09 && pmus > 0) pawAct -= 1.2 * (1 - tFase / 0.09);
      // espiración activa al final (ciclado tardío)
      if (asinc === "tardio" && tFase > 1.35) {
        pawAct += 2.8 * Math.min(1, (tFase - 1.35) / 0.8);
      }
      flujoLs = (pawAct + pmus - Palv) / P.R;
      if (flujoLs < 0) flujoLs = 0;
      const f = flujoLs * 60;
      if (f > flujoPico) flujoPico = f;
      Vinsp += flujoLs * dt;

      const cicladoOk = tFase > 0.3 && f < flujoPico * cicl;
      if (cicladoOk || tFase >= tiMax) {
        tiReal = tFase; picoCiclo = pawAct;
        if (asinc === "tardio" && tFase >= tiMax && t - ultimaAnot > 2.5) alarma(0, "Ciclado tardío: sobrepresión y espiración activa");
        fase = "exp"; tFase = 0;
        // doble disparo: el esfuerzo continúa tras el ciclado
        if (asinc === "doble" && !dobleHecho && pmus > 1.5 && tiReal < 1.05 && Math.random() < 0.8) {
          dobleHecho = true;
          iniciarInsp(t, true); fase = "insp";
          if (t - ultimaAnot > 2.5) alarma(0, "Doble disparo: dos ciclos sin espiración");
        }
      }
    } else {
      // espiración
      pawAct = epap + (pawAct - epap) * Math.exp(-dt / 0.07);
      flujoLs = (pawAct + pmus - Palv) / P.R;
      if (flujoLs > 0 && pmus <= 0.1) flujoLs = 0;
      // disparo
      const hayEsfuerzo = pmus > 0.4;
      const backup = (t - tUltimoInsp) >= T;
      const auto = asinc === "autociclado" && Math.random() < dt * Math.max(0, 5 - trigger) * 0.18;
      if ((hayEsfuerzo && puedeDisparar() && tFase > 0.35) || backup || auto) {
        iniciarInsp(t, hayEsfuerzo && !backup && !auto);
      } else if (hayEsfuerzo && !puedeDisparar() && tFase > 0.3 && t - ultimaAnot > 2.5) {
        alarma(1, "Esfuerzo inefectivo: muesca sin ciclo");
        ultimaAnot = t; // la anotación ya actualiza, pero evitamos repetir en el mismo esfuerzo
      }
    }

    V = Math.max(0, V + flujoLs * dt);

    // fuga medida (sale por la interfaz, el sensor la ve como flujo positivo)
    let fuga = 0;
    if (asinc === "fuga") { fuga = 1.3 * pawAct; pawAct += (Math.random() - 0.5) * 0.5; }
    fugaMedia = fugaMedia * 0.98 + fuga * 0.02;

    const flujoMedido = flujoLs * 60 + fuga;
    const volMedido = Math.max(0, (V - VdispBase)) * 1000 + (asinc === "fuga" ? 40 : 0);
    return [pawAct, flujoMedido, volMedido];
  }

  /* ---------- anotaciones docentes ---------- */
  let anots = [];
  function anotar(bandaIdx, texto) {
    if (!docente || (examen && !revelado)) return;
    ultimaAnot = t;
    const b = bandas[Math.min(bandaIdx, bandas.length - 1)];
    anots.push({ x: Math.min(x + 6, X1 - 12), y: b.y0 + b.alto / 2, texto, hasta: t + 3.2 });
    if (anots.length > 4) anots.shift();
  }
  function pintarAnots() {
    anots = anots.filter(a => a.hasta > t);
    if (!anots.length) return;
    const T = TEMAS[tema];
    const color = T.claro ? "#C0392B" : "#FF8A80";
    anots.forEach(a => {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(a.x, a.y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "700 11px -apple-system, sans-serif";
      const ancho = ctx.measureText(a.texto).width;
      const tx = a.x + 22 + ancho > X1 - 8 ? a.x - ancho - 26 : a.x + 22;
      ctx.fillStyle = T.claro ? "rgba(255,255,255,.88)" : "rgba(0,0,0,.6)";
      ctx.fillRect(tx - 4, a.y - 16, ancho + 8, 16);
      ctx.fillStyle = color;
      ctx.fillText(a.texto, tx, a.y - 4);
    });
  }

  /* ---------- numéricos ---------- */
  let ultimoNum = 0;
  function pintarNumericos() {
    const vte = Math.round(Vinsp * 1000 / 10) * 10;
    // SpO2 simulada (modelo puro en Motor.spo2Simulada, testeado en Node)
    const spo2Obj = Motor.spo2Simulada(PERFILES[perfil], fio2, epap, fugaMedia).spo2;
    spo2Act += (spo2Obj - spo2Act) * 0.15;
    // alarmas de parámetro (tras el transitorio inicial)
    const al = {
      Vte: ciclos > 4 && vte > 0 && vte < 200,
      FR: ciclos > 4 && frMedida > 0 && (frMedida > 30 || frMedida < 8),
      "SpO₂": ciclos > 4 && spo2Act < 88,
      Fuga: fugaMedia > 20,
    };
    const hayAlarma = al.Vte || al.FR || al.Fuga || al["SpO₂"];
    if (hayAlarma && t - ultimoBeepParam > 2.2) { ultimoBeepParam = t; beep(true); }
    const datos = [
      ["Ppico", picoCiclo ? picoCiclo.toFixed(0) : "—", "cmH₂O"],
      ["PEEP", epap, "cmH₂O"],
      ["Vte", vte || "—", "ml"],
      ["FR", frMedida || "—", "rpm"],
      ["SpO₂", Math.round(spo2Act), "%"],
      ["I:E", ieTxt, ""],
      ["Fuga", Math.round(fugaMedia), "L/min"],
    ];
    const T = TEMAS[tema];
    const rojo = T.claro ? "#C62828" : "#FF5252";
    document.getElementById("numericos").innerHTML = datos.map(d => {
      const enAlarma = al[d[0]];
      return `<div class="num${enAlarma ? " alarma" : ""}" style="color:${enAlarma ? rojo : T.numTxt}">
        <label style="color:${enAlarma ? rojo : T.cabecera}">${d[0]}${enAlarma ? " ⚠" : ""}</label>
        <strong>${d[1]}</strong><small>${d[2]}</small></div>`;
    }).join("");
    document.getElementById("numericos").style.background = T.panel;
    const led = document.querySelector("#monitor .led");
    if (led) {
      led.style.background = hayAlarma ? "#FF5252" : "#44E07E";
      led.style.boxShadow = hayAlarma ? "0 0 10px #FF5252" : "0 0 8px #44E07E";
    }
  }

  /* ---------- bucle ---------- */
  function bucle(ahora) {
    if (!activo) return;
    if (!bucle.t0) bucle.t0 = ahora;
    const dtReal = Math.min(0.05, (ahora - bucle.t0) / 1000); bucle.t0 = ahora;
    const pasos = Math.max(1, Math.round(dtReal * PXS));
    const T = TEMAS[tema];

    for (let k = 0; k < pasos; k++) {
      const sub = dtReal / pasos;
      t += sub; x += sub * PXS;
      if (x >= X1) { x = X0; prev = null; }
      const vals = paso(sub);

      ctx.fillStyle = T.bg;
      ctx.fillRect(x + 1, 0, 14, HB);
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 1, 0, 14, HB); ctx.clip();
      rejilla(); nombres();
      ctx.restore();

      if (prev) {
        bandas.forEach((b, bi) => {
          ctx.strokeStyle = T.colores[bi]; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prev.x, yDe(b, prev.v[bi]));
          ctx.lineTo(x, yDe(b, vals[bi]));
          ctx.stroke();
        });
      }
      prev = { x, v: vals };
    }
    pintarAnots();
    if (t - ultimoNum > 0.8) { ultimoNum = t; pintarNumericos(); datosCabecera(); }
    raf = requestAnimationFrame(bucle);
  }

  function datosCabecera() {
    document.getElementById("simDatos").textContent =
      `IPAP ${ipap} · EPAP ${epap} · FiO₂ ${Math.round(fio2 * 100)}% · Ciclado ${ciclado}% · Ti ${String(ti).replace(".", ",")}s`;
  }

  /* ---------- textos docentes ---------- */
  const DOCENCIA = {
    normal: { ves: "Deflexión de disparo, presión en meseta, flujo desacelerado que cae hasta el criterio de ciclado y volumen que vuelve a cero.", porque: "Paciente y ventilador están sincronizados: cada esfuerzo dispara un ciclo y la espiración es pasiva y completa.", tocar: "Nada. Juega con el perfil de paciente: en EPOC la espiración es lenta (constante de tiempo larga); en EAP el volumen es pequeño con presiones normales (compliance baja)." },
    fuga: { ves: "La línea de flujo no vuelve a cero (queda desplazada hacia arriba), el volumen no cierra el ciclo y la presión se vuelve inestable.", porque: "Parte del flujo se escapa por la interfaz: el sensor lo mide como flujo inspiratorio continuo y el trigger y el ciclado se vuelven erráticos.", tocar: "Primero la interfaz: reajustar, cambiar talla o tipo, parches. Después, bajar presiones a lo mínimo eficaz. La fuga es la causa nº1 de asincronía." },
    inefectivo: { ves: "Muescas en el flujo espiratorio (pequeñas ondas positivas) con ligera caída de presión, SIN ciclo del ventilador detrás.", porque: "El esfuerzo del paciente no vence la carga (autoPEEP en el EPOC) o el trigger es poco sensible: el músculo trabaja pero el ventilador no lo ve.", tocar: "SUBE LA EPAP de 1–2 en 1–2 (contrarresta la autoPEEP; pruébalo con el deslizador y verás desaparecer las muescas), sensibiliza el trigger y evita la sobreasistencia (IPAP excesiva)." },
    autociclado: { ves: "Ciclos extra sin deflexión de disparo previa y a ritmo irregular, no precedidos de esfuerzo en el flujo.", porque: "El ventilador confunde artefactos (fugas, agua en la tubuladura, oscilaciones cardiacas) con esfuerzos del paciente.", tocar: "Reduce la fuga, revisa la tubuladura y baja la sensibilidad del trigger un punto. Evita sedar para «frenar» un autociclado." },
    doble: { ves: "Dos insuflaciones seguidas sin espiración completa entre ellas: la segunda monta sobre la primera y el volumen se apila.", porque: "El tiempo inspiratorio del ventilador es más corto que el esfuerzo neural del paciente: al ciclar, el esfuerzo sigue y vuelve a disparar.", tocar: "Alarga el Ti (o baja el criterio de ciclado), valora subir la presión de soporte si la demanda es alta, y trata la causa de la demanda (dolor, acidosis)." },
    tardio: { ves: "Sobrepresión al final de la inspiración (joroba por encima de la IPAP) y caída brusca del flujo: el paciente «empuja» para espirar.", porque: "El ciclado espiratorio está demasiado bajo para un obstructivo: el ventilador sigue insuflando cuando el paciente ya quiere espirar.", tocar: "Sube el criterio de ciclado (>25–50% en obstructivos; muévelo con el deslizador), baja la presión de soporte y vigila las fugas, que también retrasan el ciclado." },
  };

  function pintarDocente() {
    const p = document.getElementById("pista");
    const panel = document.getElementById("docentePanel");
    if (examen && !revelado) {
      p.innerHTML = `🎓 <strong>Modo examen:</strong> observa las curvas… ¿qué asincronía es? <button class="btn-sec btn-mini" onclick="Sim.revelar()">Revelar</button>`;
      panel.innerHTML = "";
      return;
    }
    const d = DOCENCIA[asinc];
    const nombre = { normal: "Curvas normales", fuga: "Fuga", inefectivo: "Esfuerzo inefectivo", autociclado: "Autociclado", doble: "Doble disparo", tardio: "Ciclado tardío" }[asinc];
    p.innerHTML = `${examen ? "🎓 Era: " : ""}<strong>${nombre}.</strong> ${docente ? "" : d.ves}`;
    panel.innerHTML = docente ? `
      <div class="doc-bloque"><label>👁 Qué ves</label><p>${d.ves}</p></div>
      <div class="doc-bloque"><label>⚙️ Por qué ocurre</label><p>${d.porque}</p></div>
      <div class="doc-bloque"><label>🛠 Qué tocar</label><p>${d.tocar}</p></div>` : "";
    if (examen && revelado) {
      panel.innerHTML += `<button class="btn-sec btn-mini" onclick="Sim.otroExamen()">Otra pregunta →</button>`;
      document.querySelectorAll(".asincronias .chip").forEach(c => c.classList.toggle("sel", c.dataset.a === asinc));
    }
  }

  /* ---------- guías interactivas: el deslizador que corrige la asincronía ---------- */
  const GUIAS = {
    inefectivo: {
      control: "rEpap",
      texto: "💡 Sube la <strong>EPAP hasta 8</strong> cmH₂O y mira cómo desaparecen las muescas",
      ok: () => epap >= 8,
      logrado: "✅ EPAP 8: los esfuerzos vuelven a disparar — has compensado la autoPEEP.",
    },
    tardio: {
      control: "rCiclado",
      texto: "💡 Sube el <strong>ciclado a ≥35%</strong> y el ventilador cortará cuando el paciente quiere espirar",
      ok: () => ciclado >= 35,
      logrado: "✅ Ciclado ≥35%: fin de la sobrepresión — cicla a tiempo.",
    },
    doble: {
      control: "rTi",
      texto: "💡 El Ti máximo se ha quedado corto: <strong>súbelo a ≥1,2 s</strong> y el esfuerzo dejará de «sobrar»",
      ok: () => ti >= 1.2,
      logrado: "✅ Ti más largo que el esfuerzo neural: se acabó el doble disparo.",
    },
    autociclado: {
      control: "rTrigger",
      texto: "💡 El trigger está hipersensible: <strong>baja la sensibilidad a ≥5 L/min</strong> (y reduce la fuga)",
      ok: () => trigger >= 5,
      logrado: "✅ Trigger menos sensible: los artefactos ya no disparan ciclos fantasma.",
    },
  };
  // cada asincronía «estropea» el mando que la causa; normal restaura los ajustes
  const PRESETS = {
    normal: { rCiclado: 25, rTi: 1.5, rTrigger: 2 },
    fuga: {},
    inefectivo: { rEpap: 4 },
    autociclado: { rTrigger: 1 },
    doble: { rTi: 0.7 },
    tardio: { rCiclado: 10, rTi: 2.4 },
  };
  function aplicarPreset(a) {
    const p = PRESETS[a] || {};
    for (const [id, v] of Object.entries(p)) {
      const r = document.getElementById(id);
      if (!r) continue;
      r.value = v;
      if (id === "rEpap") epap = Math.min(v, ipap - 2);
      if (id === "rCiclado") ciclado = v;
      if (id === "rTi") ti = v;
      if (id === "rTrigger") trigger = v;
      const o = document.getElementById(id.replace("r", "o"));
      if (o) o.textContent = String(v).replace(".", ",");
    }
    datosCabecera();
  }
  function aplicarGuia() {
    document.querySelectorAll(".control").forEach(c => c.classList.remove("guiado"));
    document.querySelectorAll(".guia").forEach(g => g.remove());
    const g = GUIAS[asinc];
    if (!g || !docente || (examen && !revelado)) return;
    const ctrl = document.getElementById(g.control).closest(".control");
    ctrl.classList.add("guiado");
    const div = document.createElement("div");
    div.className = "guia";
    ctrl.appendChild(div);
    refrescarGuia();
  }
  function refrescarGuia() {
    const g = GUIAS[asinc]; if (!g) return;
    const div = document.querySelector(".guia"); if (!div) return;
    const ok = g.ok();
    div.innerHTML = ok ? g.logrado : g.texto;
    div.classList.toggle("lograda", ok);
  }

  /* ---------- API y controles ---------- */
  function setAsincronia(a) {
    asinc = a; examen = false; revelado = false;
    fugaMedia = 0;
    aplicarPreset(a);
    pintarDocente();
    aplicarGuia();
    datosCabecera();
  }

  function setTema(tm) {
    tema = tm;
    const T = TEMAS[tm];
    calcBandas(); prev = null; x = X0; fondo();
    document.getElementById("temaNombre").textContent = T.nombre;
    const mon = document.getElementById("monitor");
    mon.style.background = T.panel; mon.style.borderColor = T.panel;
    mon.querySelector(".monitor-head").style.color = T.cabecera;
    document.getElementById("simDisclaimer").style.color = T.claro ? "#6b7f8a" : "#5f7881";
    pintarNumericos();
  }

  function setPerfil(p) { perfil = p; V = 0; }

  function examenNuevo() {
    const opciones = ["fuga", "inefectivo", "autociclado", "doble", "tardio"];
    asinc = opciones[Math.floor(Math.random() * opciones.length)];
    examen = true; revelado = false; fugaMedia = 0;
    aplicarPreset(asinc);
    document.querySelectorAll(".asincronias .chip").forEach(c => c.classList.remove("sel"));
    pintarDocente();
    aplicarGuia();
  }
  function revelar() { revelado = true; pintarDocente(); aplicarGuia(); }

  function ajustarLienzo() {
    const cont = cv.parentElement; // .sim-cuerpo
    const anchoNum = document.getElementById("numericos").offsetWidth || 112;
    W = Math.max(600, Math.min(1500, (cont.clientWidth || 760) - anchoNum));
    H = Math.max(360, Math.min(540, window.innerHeight - 475)); // deja sitio a las fichas docentes sin scroll
    X1 = W - 34; HB = H - 26;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    calcBandas(); x = X0; prev = null; fondo(); pintarNumericos();
    const mon = document.getElementById("monitor");
    mon.style.background = TEMAS[tema].panel; mon.style.borderColor = TEMAS[tema].panel;
  }
  let tResize;
  window.addEventListener("resize", () => {
    if (!activo) return;
    clearTimeout(tResize); tResize = setTimeout(ajustarLienzo, 200);
  });

  let iniciado = false;
  function activar() {
    if (activo) return;
    activo = true; bucle.t0 = null;
    ajustarLienzo();
    if (!iniciado) { iniciado = true; setTema(tema); programarEsfuerzo(0); datosCabecera(); pintarDocente(); aplicarGuia(); }
    raf = requestAnimationFrame(bucle);
  }
  function pausar() { activo = false; if (raf) cancelAnimationFrame(raf); }

  // deslizadores
  const liga = (idR, idO, fn, fmtOut) => {
    const r = document.getElementById(idR), o = document.getElementById(idO);
    if (!r) return;
    r.addEventListener("input", () => { fn(+r.value); o.textContent = fmtOut ? fmtOut(+r.value) : r.value; datosCabecera(); refrescarGuia(); });
  };
  liga("rIpap", "oIpap", v => { ipap = v; if (epap >= ipap - 2) { epap = ipap - 2; document.getElementById("rEpap").value = epap; document.getElementById("oEpap").textContent = epap; } });
  liga("rEpap", "oEpap", v => { epap = Math.min(v, ipap - 2); });
  liga("rFr", "oFr", v => { frResp = v; });
  liga("rRampa", "oRampa", v => { rampa = v; }, v => ["", "rápida", "media", "lenta"][v]);
  liga("rCiclado", "oCiclado", v => { ciclado = v; });
  liga("rFio2", "oFio2Sim", v => { fio2 = v / 100; });
  liga("rTrigger", "oTrigger", v => { trigger = v; });
  liga("rTi", "oTi", v => { ti = v; }, v => v.toFixed(1).replace(".", ","));

  // chips de tema y perfil
  document.querySelectorAll('[data-grupo="tema"] .chip').forEach(c =>
    c.addEventListener("click", () => {
      c.parentElement.querySelectorAll(".chip").forEach(z => z.classList.remove("sel"));
      c.classList.add("sel"); setTema(c.dataset.v);
    }));
  document.querySelectorAll('[data-grupo="perfil"] .chip').forEach(c =>
    c.addEventListener("click", () => {
      c.parentElement.querySelectorAll(".chip").forEach(z => z.classList.remove("sel"));
      c.classList.add("sel"); setPerfil(c.dataset.v);
    }));
  const btnSon = document.getElementById("btnSonido");
  if (btnSon) btnSon.addEventListener("click", () => {
    sonidoOn = !sonidoOn;
    btnSon.textContent = sonidoOn ? "🔔" : "🔕";
    if (sonidoOn) beep(false); // confirmación audible
  });
  const tgl = document.getElementById("tglDocente");
  if (tgl) tgl.addEventListener("change", () => { docente = tgl.checked; pintarDocente(); aplicarGuia(); });

  return { activar, pausar, setAsincronia, examenNuevo, revelar, otroExamen: examenNuevo };
})();
