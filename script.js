/* ====== VMNI Urgencias · boceto v0.2 — navegación + simulador demo ====== */

/* ---------- navegación ---------- */
function irA(id) {
  document.querySelectorAll(".pantalla").forEach(s => s.classList.remove("visible"));
  document.getElementById(id).classList.add("visible");
  document.querySelectorAll("[data-s]").forEach(b => b.classList.toggle("activo", b.dataset.s === id));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (id === "simulador") Sim.activar(); else Sim.pausar();
  if (id !== "docencia" && typeof Espiro !== "undefined") Espiro.pausar();
  if (id === "seguimiento") prefillSeguimiento();
  if (id === "casos" && typeof Casos !== "undefined") Casos.pintar();
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

function verAsincronia(a) {
  irA("simulador");
  document.querySelectorAll(".asincronias .chip").forEach(c => {
    c.classList.toggle("sel", c.dataset.a === a);
  });
  Sim.setAsincronia(a);
}

/* ---------- chips ---------- */
document.querySelectorAll(".chip").forEach(ch => {
  ch.addEventListener("click", () => {
    if (ch.closest(".asincronias")) {
      ch.parentElement.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
      ch.classList.add("sel");
      Sim.setAsincronia(ch.dataset.a);
      return;
    }
    if (ch.closest("#simulador")) return; // los chips del simulador los gestiona sim.js
    const grupo = ch.closest("[data-grupo]");
    if (grupo && grupo.dataset.exclusivo) {
      const estaba = ch.classList.contains("sel");
      grupo.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
      if (!estaba) ch.classList.add("sel");
    } else {
      ch.classList.toggle("sel");
    }
  });
});
document.querySelectorAll(".sel-btn").forEach(b => {
  b.addEventListener("click", () => {
    b.parentElement.querySelectorAll(".sel-btn").forEach(x => x.classList.remove("activo"));
    b.classList.add("activo");
    const venosa = b.dataset.v === "venosa";
    const po2 = document.getElementById("iPo2");
    po2.disabled = venosa;
    document.getElementById("lPo2").textContent = venosa ? "pO₂ (no válida en venosa)" : "pO₂ (mmHg)";
    if (venosa) po2.value = "";
  });
});

function chipsDe(grupo) {
  return [...document.querySelectorAll(`[data-grupo="${grupo}"] .chip.sel`)].map(c => c.dataset.v);
}
function marcarChip(grupo, valor) {
  document.querySelectorAll(`[data-grupo="${grupo}"] .chip`).forEach(c => {
    const cont = c.closest("[data-grupo]");
    if (cont.dataset.exclusivo) c.classList.toggle("sel", c.dataset.v === valor);
    else if (c.dataset.v === valor) c.classList.add("sel");
  });
}

/* ---------- reglas y motor ---------- */
let REGLAS = null;
fetch("datos/reglas.json").then(r => r.json()).then(r => { REGLAS = r; Motor.init(r); fio2EnVivo(); });

const num = id => { const v = parseFloat(document.getElementById(id).value); return isFinite(v) ? v : undefined; };
const fmt = (n, d = 2) => (n === null || n === undefined) ? "—" : String(Math.round(n * 10 ** d) / 10 ** d).replace(".", ",");

const ETIQUETAS_FLUJO = { aire: "—", gafas: "Flujo (L/min)", vk: "Ventimask (%)", reservorio: "Flujo (L/min)", vivo: "O₂ (L/min)", mezclador: "FiO₂ (%)", tafcn: "FiO₂ (%)" };
function fio2EnVivo() {
  if (!REGLAS) return;
  const d = document.getElementById("iDisp").value;
  document.getElementById("lFlujo").textContent = ETIQUETAS_FLUJO[d];
  document.getElementById("iFlujo").disabled = d === "aire";
  const r = Motor.fio2Estimada(d, num("iFlujo"));
  document.getElementById("oFio2").textContent = fmt(r.fio2);
}
document.getElementById("iDisp").addEventListener("change", fio2EnVivo);
document.getElementById("iFlujo").addEventListener("input", fio2EnVivo);

function inicioRapido(tipo) {
  irA("evaluacion");
  if (tipo === "eap") {
    marcarChip("sospecha", "eap");
  } else {
    marcarChip("sospecha", "epoc");
    marcarChip("resp", "epoc");
  }
  pasoWizard(3); // inicio rápido: directo a la gasometría
}

/* ---------- evaluación ---------- */
function leerEntradas() {
  const tipoGas = document.querySelector("#selAV .sel-btn.activo").dataset.v;
  return {
    antecedentes: { respiratorios: chipsDe("resp"), otros: chipsDe("otros"), circunstancias: chipsDe("circ") },
    clinica: {
      fr: num("iFr"), fc: num("iFc"), tas: num("iTas"), gcs: num("iGcs"), spo2: num("iSpo2"),
      sexo: document.getElementById("iSexo").value, talla: num("iTalla"),
      trabajo: chipsDe("signos").includes("trabajo") || chipsDe("signos").includes("musculatura"),
      criteriosIot: chipsDe("iot"),
    },
    gasometria: { tipo: tipoGas, ph: num("iPh"), pco2: num("iPco2"), po2: num("iPo2"), hco3: num("iHco3"), lactato: num("iLact") },
    fio2: { dispositivo: document.getElementById("iDisp").value, valor: num("iFlujo") },
    sospecha: chipsDe("sospecha")[0] || null,
  };
}

let BASAL = null;

function calcular() {
  if (!REGLAS) return;
  const e = leerEntradas();
  if (e.gasometria.ph === undefined || e.gasometria.pco2 === undefined) {
    alert("Faltan pH y pCO₂ para clasificar."); return;
  }
  const r = Motor.evaluar(e);
  BASAL = { ph: r.calculos.ph, pco2: r.calculos.pco2, fr: e.clinica.fr, gcs: e.clinica.gcs, fc: e.clinica.fc, pafi: r.calculos.pafiEfectiva };
  const cls = r.clasificacion;
  const clasifTexto =
    cls.rama === "hipercapnico" ? `Fallo hipercápnico — ${cls.subtexto}` :
    cls.rama === "hipoxemico" ? `Fallo hipoxémico — ${cls.banda.texto}` :
    cls.rama === "eap" ? "EAP / IC aguda" :
    cls.rama === "iot" ? "Criterios de IOT/UCI inmediata" :
    cls.rama === "sobredosis" ? "Sospecha de sobredosis de depresores" :
    cls.rama === "hipercapnia_compensada" ? "Hipercapnia compensada (sin acidosis)" : "Clasificación incompleta";
  window.ULTIMA_EVAL = {
    entradas: e,
    resumen: {
      rama: cls.rama, subtipo: cls.subtipo || "", clasif: clasifTexto,
      escenarioId: r.recomendacion.escenario || (cls.rama === "sobredosis" ? "sobredosis" : null),
      gravedad: cls.gravedad ? cls.gravedad.texto : "",
      titulo: r.recomendacion.titulo, tipo: r.recomendacion.tipo,
      ph: r.calculos.ph, pco2: r.calculos.pco2, fr: e.clinica.fr, gcs: e.clinica.gcs,
      fc: e.clinica.fc, pafi: r.calculos.pafiEfectiva ?? null, safi: r.calculos.safi ?? null,
      hacor: r.hacor ? r.hacor.total : null,
    },
  };
  document.getElementById("resultadoDinamico").innerHTML = htmlResultado(r);
  pasoWizard(4);
}

const FICHAS = {
  epap: ["EPAP", "cmH₂O"], ipap: ["IPAP", "cmH₂O"], cpap: ["CPAP", "cmH₂O"], epapBinivel: ["EPAP biniv.", "cmH₂O"],
  frRespaldo: ["FR resp.", "rpm"], ti: ["Ti", ""], ie: ["I:E", ""], ciclado: ["Ciclado", ""],
  rampa: ["Rampa", ""], spo2: ["SpO₂ obj.", ""], fio2: ["FiO₂", ""], tafcn: ["Alto flujo", ""],
};
function valorFicha(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (v.inicial !== undefined) return v.objetivo ? `${v.inicial}→${v.objetivo}` : (v.rango ? `${v.inicial} (${v.rango})` : String(v.inicial));
  if (v.valor !== undefined) return String(v.valor);
  if (v.rango !== undefined) return v.rango;
  if (v.objetivo !== undefined) return v.objetivo;
  if (v.flujo !== undefined) return v.flujo;
  return null;
}

function htmlResultado(r) {
  const c = r.calculos, cls = r.clasificacion, rec = r.recomendacion;
  const esc = rec.escenario && REGLAS.escenarios[rec.escenario];

  // --- tarjeta de clasificación ---
  let clase = "hipercapnico", titulo = "", explica = [];
  if (cls.rama === "hipercapnico") {
    titulo = `Fallo hipercápnico — ${cls.subtexto} <span class="ref">${cls.subtipo}</span>`;
    explica.push(`pH ${fmt(c.ph)} con pCO₂ ${fmt(c.pco2, 0)}${c.hco3 ? ` y HCO₃ ${fmt(c.hco3, 1)}` : ""} → pH esperado agudo ${fmt(c.phEsperadoAgudo)}, crónico ${fmt(c.phEsperadoCronico)}.`);
    explica.push(`Gravedad: <strong>${cls.gravedad.texto}</strong>.`);
  } else if (cls.rama === "hipoxemico") {
    clase = "hipoxemico"; titulo = `Fallo hipoxémico — ${cls.banda.texto} <span class="ref">PaFi ${cls.pafi}</span>`;
    explica.push(`pH ${fmt(c.ph)} sin hipercapnia significativa; oxigenación por ${c.pafi ? "PaFi" : "SaFi→PaFi estimada"}.`);
  } else if (cls.rama === "eap") {
    clase = "eap"; titulo = `EAP / IC aguda <span class="ref">D</span>`;
    explica.push(`Sospecha clínica de EAP${cls.hipercapnia ? " con hipercapnia asociada" : ""}${cls.acidosis ? " y acidosis" : ""}.`);
  } else if (cls.rama === "iot") {
    clase = "rojo"; titulo = cls.let ? "Criterios de gravedad extrema con LET" : "Criterios de IOT / UCI inmediata";
    explica.push(cls.criterios.join(" · "));
  } else if (cls.rama === "sobredosis") {
    clase = "rojo"; titulo = `Sospecha de sobredosis de depresores <span class="ref">A</span>`;
    explica.push(`pH ${fmt(c.ph)} con pCO₂ ${fmt(c.pco2, 0)}: hipoventilación compatible con tóxicos.`);
  } else if (cls.rama === "hipercapnia_compensada") {
    clase = "hipoxemico"; titulo = "Hipercapnia compensada (sin acidosis)";
    explica.push(`pH ${fmt(c.ph)} ≥7,35 con pCO₂ ${fmt(c.pco2, 0)}.`);
  } else {
    titulo = "Clasificación incompleta";
  }
  if (c.lactato !== undefined) explica.push(`Láctico ${fmt(c.lactato, 0)} mg/dL${c.lactatoAlto ? " (ALTO: componente metabólico/hipoperfusión)" : " (normal)"}.`);

  const datos = [];
  if (c.pafi) datos.push(`<span class="dato">PaFi <strong>${c.pafi}</strong></span>`);
  if (c.safi) datos.push(`<span class="dato">SaFi <strong>${c.safi}</strong>${c.pafi ? "" : ` ≈PaFi <strong>${c.pafiDeSafi}</strong>`}</span>`);
  if (c.phEsperadoCronico) datos.push(`<span class="dato">pH esp. <strong>${fmt(c.phEsperadoCronico)}</strong></span>`);
  if (c.lactato !== undefined) datos.push(`<span class="dato ${c.lactatoAlto ? "" : "ok"}">Láctico <strong>${c.lactatoAlto ? "alto" : "normal"}</strong></span>`);
  if (r.hacor) datos.push(`<span class="dato ${r.hacor.altoRiesgo ? "" : "ok"}">HACOR <strong>${r.hacor.total}</strong>${r.hacor.altoRiesgo ? " ⚠" : ""}</span>`);
  if (c.vtObjetivo) datos.push(`<span class="dato">Vt obj. <strong>${c.vtObjetivo[0]}–${c.vtObjetivo[1]} ml</strong> <small>(ideal ${fmt(c.pesoIdeal, 1)} kg)</small></span>`);

  const avisos = (c.avisos || []).map(a => `<div class="pista" style="margin-top:8px">${a}</div>`).join("");

  // --- tarjeta de recomendación ---
  let fichas = "";
  if (rec.parametros) {
    const tiles = [];
    if (esc) tiles.push(`<div class="param"><label>Modo</label><strong style="font-size:1rem">${esc.modo}</strong></div>`);
    for (const [k, v] of Object.entries(rec.parametros)) {
      if (!FICHAS[k]) continue;
      const val = valorFicha(v);
      if (!val || val.length > 14) continue; // los textos largos van a la lista, no a fichas
      tiles.push(`<div class="param"><label>${FICHAS[k][0]}</label><strong style="font-size:${val.length > 7 ? ".95rem" : "1.35rem"}">${val}</strong><small>${FICHAS[k][1]}</small></div>`);
      if (tiles.length >= 7) break;
    }
    fichas = `<div class="parametros">${tiles.join("")}</div>`;
  }
  const claves = (rec.titulacion || rec.detalle || []).map(t => `<li>${t}</li>`).join("");
  const alertas = (rec.alertas || []).map(a => `<div class="alerta-item">⚠️ ${a}</div>`).join("");

  return `
  <div class="card resultado-principal ${clase}">
    <p class="etiqueta">Clasificación</p>
    <h3>${titulo}</h3>
    <p class="explica">${explica.join(" ")}</p>
    <div class="chips-datos">${datos.join("")}</div>
    ${avisos}
  </div>
  <div class="card recomendacion">
    <p class="etiqueta acc">Recomendación</p>
    <h3>${rec.titulo}${rec.evidencia ? `<small>${rec.evidencia}</small>` : ""}</h3>
    ${fichas}
    ${alertas}
    ${claves ? `<ul class="claves">${claves}</ul>` : ""}
    <div class="botonera">
      <button class="btn-sec" onclick="irA('simulador')">Ver en el simulador</button>
      <button class="btn-sec" onclick="irA('casos'); Casos.nuevo()">🗂 Iniciar caso</button>
      <button class="btn-primario" onclick="irA('seguimiento')">Iniciar seguimiento ⏱</button>
    </div>
    <p class="provisional">Reglas clínicas v${r.reglasVersion} — ${r.estado}</p>
  </div>
  ${htmlFarmacos(rec, cls)}`;
}

function htmlFarmacos(rec, cls) {
  const escId = rec.escenario || (cls.rama === "sobredosis" ? "sobredosis" : null);
  const f = escId && FARMACOS.escenarios[escId];
  if (!f) return "";
  return `
  <details class="card farmacos-card">
    <summary>💊 Tratamiento médico recomendado <small>(recomendaciones generales — individualizar siempre)</small></summary>
    <div class="farmacos-cuerpo">
      <p class="farmacos-descargo">⚠️ ${FARMACOS.descargo}</p>
      ${f.items.map(it => `
        <div class="farmaco-item">
          <strong>${it.nombre}</strong> — ${it.dosis}
          <small>${it.nota} · <em>${it.ref}</em></small>
        </div>`).join("")}
      ${f.noHacer.length ? `<div class="farmaco-no"><strong>🚫 Evitar:</strong> ${f.noHacer.join(" · ")}</div>` : ""}
    </div>
  </details>`;
}

/* ---------- seguimiento ---------- */
function valorarRespuesta() {
  if (!REGLAS) return;
  const basal = { ph: num("sPh0"), pco2: num("sPco20"), fr: num("sFr0"), gcs: num("sGcs0") };
  let pafi1;
  const spo2 = num("sSpo21"), fio2 = num("sFio21");
  if (spo2 !== undefined && fio2) {
    const cc = Motor.calculos({ tipo: "arterial" }, { spo2 }, fio2);
    pafi1 = cc.pafiDeSafi;
  }
  const h1 = { ph: num("sPh1"), pco2: num("sPco21"), fr: num("sFr1"), gcs: num("sGcs1"), fc: num("sFc1"), pafi: pafi1 };
  if (h1.ph === undefined || h1.fr === undefined) { alert("Faltan al menos pH y FR a la hora."); return; }
  const r = Motor.evaluarRespuesta(basal, h1);

  const kpi = (lbl, v0, v1, mejor) => `
    <div class="card kpi ${mejor === true ? "mejora" : mejor === false ? "peor" : "neutro"}">
      <label>${lbl}</label><strong>${v0 ?? "—"} → ${v1 ?? "—"}</strong>
      <span>${mejor === true ? "↗ mejorando" : mejor === false ? "↘ empeorando" : "→ sin cambio claro"}</span>
    </div>`;
  const clasesV = { favorable: "ok", vigilar: "alerta-suave", fracaso: "alerta-suave" };
  const titulosV = { favorable: "✅ Respuesta favorable", vigilar: "🕐 Vigilancia estrecha", fracaso: "🚨 Criterios de fracaso: escalada IOT/UCI" };
  document.getElementById("respuestaDinamica").innerHTML = `
    <div class="grid-seguimiento" style="margin-top:14px">
      ${kpi("pH", fmt(basal.ph), fmt(h1.ph), basal.ph !== undefined && h1.ph !== undefined ? h1.ph > basal.ph : null)}
      ${kpi("FR", basal.fr, h1.fr, basal.fr !== undefined && h1.fr !== undefined ? h1.fr < basal.fr : null)}
      ${kpi("pCO₂", basal.pco2, h1.pco2, basal.pco2 !== undefined && h1.pco2 !== undefined ? h1.pco2 < basal.pco2 : null)}
      ${r.hacor ? kpi("HACOR", "", r.hacor.total, !r.hacor.altoRiesgo) : ""}
    </div>
    <div class="card veredicto ${clasesV[r.veredicto]}">
      <h3>${titulosV[r.veredicto]}</h3>
      <p>${r.texto}</p>
      ${r.menores.length ? `<p style="margin-top:8px"><strong>Criterios menores presentes:</strong> ${r.menores.join(" · ")}</p>` : ""}
    </div>`;
}

function prefillSeguimiento() {
  if (!BASAL) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el && !el.value && v !== undefined && v !== null) el.value = v; };
  set("sPh0", BASAL.ph); set("sPco20", BASAL.pco2); set("sFr0", BASAL.fr); set("sGcs0", BASAL.gcs);
}

/* ==================== DOCENCIA ==================== */
const D = DOCENCIA_DATA;

/* --- pestañas --- */
document.querySelectorAll("#docTabs .chip").forEach(ch => {
  ch.addEventListener("click", () => {
    document.querySelectorAll("#docTabs .chip").forEach(c => c.classList.remove("sel"));
    ch.classList.add("sel");
    ["temas", "glosario", "quiz", "biblio"].forEach(tb => {
      document.getElementById("doc" + tb[0].toUpperCase() + tb.slice(1)).classList.toggle("oculto", tb !== ch.dataset.t);
    });
  });
});

/* --- temas --- */
function pintarTemas() {
  if (typeof Espiro !== "undefined") Espiro.pausar();
  document.getElementById("docTemas").innerHTML = `<div class="grid-modulos">` + D.temas.map(tm => `
    <article class="card modulo" onclick="abrirTema('${tm.id}')">
      <div class="icono doc">${tm.icono}</div><h3>${tm.titulo}</h3><p>${tm.resumen}</p>
    </article>`).join("") + `</div>`;
}
function abrirTema(id) {
  if (typeof Espiro !== "undefined") Espiro.pausar();
  const idx = D.temas.findIndex(x => x.id === id);
  const tm = D.temas[idx];
  const ant = D.temas[idx - 1], sig = D.temas[idx + 1];
  const bloqueHtml = b => `<div class="doc-bloque ancho"><label>${b.t}</label><p>${b.p}</p>
    ${(b.cajas || []).map(c => `<div class="caja-ayuda"><label>${c.titulo}</label><ul>${c.items.map(i => `<li>${i.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</li>`).join("")}</ul></div>`).join("")}</div>`;
  const nav = `
    <div class="tema-nav">
      ${ant ? `<button class="btn-sec btn-mini" onclick="abrirTema('${ant.id}')">← ${ant.titulo}</button>` : "<span></span>"}
      <span class="tema-indice">${idx + 1} de ${D.temas.length}</span>
      ${sig ? `<button class="btn-sec btn-mini" onclick="abrirTema('${sig.id}')">${sig.titulo} →</button>` : "<span></span>"}
    </div>`;
  document.getElementById("docTemas").innerHTML = `
    <div class="card tema-detalle">
      <div class="tema-cab"><button class="btn-sec btn-mini" onclick="pintarTemas()">⌂ Todos los temas</button>
      <span class="tema-indice">${idx + 1} de ${D.temas.length}</span></div>
      <h3 class="tema-titulo">${tm.icono} ${tm.titulo}</h3>
      ${tm.bloques.map(bloqueHtml).join("")}
      ${tm.espirograma ? `
        <div class="espiro-marco">
          <p class="sub">Espirograma interactivo</p>
          <canvas id="espiroCanvas"></canvas>
          <div class="botonera" style="justify-content:flex-start;gap:10px">
            <button class="btn-sec btn-mini" onclick="Espiro.maniobrar('insp')">⬆ Inspiración máxima</button>
            <button class="btn-sec btn-mini" onclick="Espiro.maniobrar('esp')">⬇ Espiración máxima</button>
          </div>
        </div>` : ""}
      ${nav}
    </div>`;
  window.scrollTo({ top: 0, behavior: "instant" });
  if (tm.espirograma) Espiro.montar();
}

/* --- glosario --- */
function pintarGlosario(filtro = "") {
  const f = filtro.trim().toLowerCase();
  const filas = D.glosario
    .filter(([s, d]) => !f || s.toLowerCase().includes(f) || d.toLowerCase().includes(f))
    .map(([s, d]) => `<div class="glos-fila"><strong>${s}</strong><span>${d}</span></div>`).join("");
  document.getElementById("listaGlosario").innerHTML = filas || `<p class="sin-resultados">Sin resultados para «${filtro}».</p>`;
}
document.getElementById("busGlosario").addEventListener("input", e => pintarGlosario(e.target.value));

/* --- ponte a prueba --- */
const QUIZ_N = 10;
let quiz = null;
function quizInicio() {
  document.getElementById("docQuiz").innerHTML = `
    <div class="card quiz-portada">
      <h3>🎯 Ponte a prueba</h3>
      <p>${QUIZ_N} preguntas aleatorias de un banco de ${D.preguntas.length}, basadas en la Base Científica del proyecto. Cada respuesta se corrige al momento con su explicación y su referencia.</p>
      <div class="botonera"><span></span><button class="btn-primario" onclick="quizEmpezar()">Empezar →</button></div>
    </div>`;
}
function quizEmpezar() {
  const idx = [...D.preguntas.keys()];
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  quiz = { orden: idx.slice(0, QUIZ_N), i: 0, aciertos: 0 };
  quizPregunta();
}
function quizPregunta() {
  const p = D.preguntas[quiz.orden[quiz.i]];
  document.getElementById("docQuiz").innerHTML = `
    <div class="card">
      <div class="quiz-progreso">Pregunta ${quiz.i + 1} de ${QUIZ_N} · Aciertos: ${quiz.aciertos}</div>
      <h3 class="quiz-q">${p.q}</h3>
      <div class="quiz-opciones">
        ${p.o.map((op, i) => `<button class="opcion" onclick="quizResponder(${i})">${"ABCD"[i]}. ${op}</button>`).join("")}
      </div>
      <div id="quizFeedback"></div>
    </div>`;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function quizResponder(i) {
  const p = D.preguntas[quiz.orden[quiz.i]];
  const ok = i === p.c;
  if (ok) quiz.aciertos++;
  document.querySelectorAll("#docQuiz .opcion").forEach((b, bi) => {
    b.disabled = true;
    if (bi === p.c) b.classList.add("correcta");
    else if (bi === i) b.classList.add("incorrecta");
  });
  document.getElementById("quizFeedback").innerHTML = `
    <div class="explica-quiz ${ok ? "bien" : "mal"}">
      <strong>${ok ? "✅ Correcto." : "❌ No es esa."}</strong> ${p.e}
    </div>
    <div class="botonera"><span></span><button class="btn-primario" onclick="quizSiguiente()">${quiz.i + 1 < QUIZ_N ? "Siguiente →" : "Ver resultado →"}</button></div>`;
}
function quizSiguiente() {
  quiz.i++;
  if (quiz.i < QUIZ_N) return quizPregunta();
  const pct = Math.round(quiz.aciertos / QUIZ_N * 100);
  const msg = pct >= 90 ? "Nivel experto: listo para enseñar VMNI." :
    pct >= 70 ? "Muy bien: dominas lo esencial; repasa las que fallaste." :
    pct >= 50 ? "Vas en camino: revisa los temas y el simulador, y repite." :
    "Empieza por los Temas y el simulador de asincronías, y vuelve a intentarlo.";
  document.getElementById("docQuiz").innerHTML = `
    <div class="card quiz-portada">
      <h3>Resultado: ${quiz.aciertos} / ${QUIZ_N} (${pct}%)</h3>
      <p>${msg}</p>
      <div class="botonera">
        <button class="btn-sec" onclick="irA('simulador')">Ir al simulador</button>
        <button class="btn-primario" onclick="quizEmpezar()">Repetir con otras preguntas ↻</button>
      </div>
    </div>`;
}

/* --- bibliografía comentada --- */
function pintarBiblio() {
  document.getElementById("docBiblio").innerHTML = `
    <div class="card biblio-descarga">
      <div>
        <h3>📖 La base científica, completa y descargable</h3>
        <p>Toda la evidencia y los umbrales que fundamentan la app, con sus referencias — transparencia del proyecto.</p>
      </div>
      <a class="btn-primario" href="base-cientifica.pdf" target="_blank" rel="noopener">📥 Ver / descargar PDF</a>
    </div>` + D.biblio.map(b => `
    <div class="card biblio-item">
      <span class="tipo-badge">${b.tipo}</span>
      <p class="biblio-ref">${b.ref}</p>
      <p class="biblio-com">${b.com}</p>
    </div>`).join("");
}

pintarTemas(); pintarGlosario(); quizInicio(); pintarBiblio();

/* ==================== AYUDA (patrón de la casa: Manual / Versiones / FAQ) ==================== */
const negrita = t => t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

document.querySelectorAll("#ayudaTabs .chip").forEach(ch => {
  ch.addEventListener("click", () => {
    document.querySelectorAll("#ayudaTabs .chip").forEach(c => c.classList.remove("sel"));
    ch.classList.add("sel");
    ["Manual", "Versiones", "Faq"].forEach(tb => {
      document.getElementById("ayuda" + tb).classList.toggle("oculto", tb !== ch.dataset.t);
    });
  });
});
function abrirAyuda(tab) {
  irA("ayuda");
  const chip = document.querySelector(`#ayudaTabs .chip[data-t="${tab}"]`);
  if (chip) chip.click();
}

function pintarVersiones() {
  document.getElementById("ayudaVersiones").innerHTML = `<div class="version-lista">` +
    CAMBIOS_AYUDA.map((c, i) => `
      <div class="version-tarjeta${i === 0 ? " actual" : ""}">
        <div class="version-num"><small>Versión</small><b>${c.version}</b></div>
        <div class="version-cuerpo">
          <h4>${i === 0 ? "Última actualización — " : ""}${c.titulo}</h4>
          <p>${negrita(c.texto)}</p>
        </div>
      </div>`).join("") + `</div>`;
}

function pintarManual() {
  document.getElementById("ayudaManual").innerHTML = `
    <div class="card manual-cabecera"><h3>📘 Guía de uso de la aplicación</h3>
    <p>Toca cada bloque para desplegarlo. La letra pequeña clínica está en <strong>Docencia</strong>; esto es el «cómo se usa».</p></div>` +
    MANUAL_AYUDA.map((b, i) => `
      <details class="manual-bloque"${i === 0 ? " open" : ""}>
        <summary>${b.icono} ${b.titulo}</summary>
        <div class="manual-cuerpo">
          ${b.secciones.map(s => `
            <h4>${s.titulo}</h4>
            <p>${negrita(s.texto)}</p>
            ${(s.cajas || []).map(c => `
              <div class="caja-ayuda"><label>${c.titulo}</label>
                <ul>${c.items.map(it => `<li>${negrita(it)}</li>`).join("")}</ul>
              </div>`).join("")}
          `).join("")}
        </div>
      </details>`).join("");
}

function pintarFaq() {
  document.getElementById("ayudaFaq").innerHTML = FAQ_AYUDA.map(f => `
    <details class="manual-bloque faq">
      <summary>💬 ${f.p}</summary>
      <div class="manual-cuerpo"><p>${negrita(f.r)}</p></div>
    </details>`).join("");
}

pintarManual(); pintarVersiones(); pintarFaq();

/* ==================== HERRAMIENTAS RÁPIDAS ==================== */
function calcOxi() {
  const po2 = num("cPo2"), spo2 = num("cSpo2"), fio2 = num("cFio2");
  const r = document.getElementById("rOxi");
  if (!fio2 || fio2 < 0.21 || (!po2 && !spo2)) { r.innerHTML = "Introduce pO₂ o SpO₂ y la FiO₂ (≥0,21)."; return; }
  const partes = [];
  if (po2) partes.push(`<strong>PaFi ${Math.round(po2 / fio2)}</strong>`);
  if (spo2 !== undefined) {
    if (spo2 > 97) partes.push(`SaFi no válida (SpO₂ >97%: baja la FiO₂ y reevalúa)`);
    else {
      const safi = Math.round(spo2 / fio2);
      partes.push(`<strong>SaFi ${safi}</strong> ≈ PaFi ${Math.round((safi - 64) / 0.84)}`);
    }
  }
  partes.push(`<small>Bandas: >300 normal · 200–300 leve · 100–200 moderada (<150 avisa a UCI) · <100 grave</small>`);
  r.innerHTML = partes.join(" · ");
}
function calcPeso() {
  const talla = num("cTalla");
  const r = document.getElementById("rPeso");
  if (!talla || talla < 120) { r.textContent = "Introduce la talla (cm)."; return; }
  const base = document.getElementById("cSexo").value === "v" ? 50 : 45.5;
  const pi = base + 0.91 * (talla - 152.4);
  r.innerHTML = `<strong>Peso ideal ≈ ${pi.toFixed(1).replace(".", ",")} kg</strong> · Vt objetivo (6–8 ml/kg): <strong>${Math.round(pi * 6)}–${Math.round(pi * 8)} ml</strong>`;
}
function calcPh() {
  const pco2 = num("cPco2"), hco3 = num("cHco3"), ph = num("cPh");
  const r = document.getElementById("rPh");
  if (!pco2) { r.textContent = "Introduce la pCO₂."; return; }
  const agudo = 7.4 - 0.008 * (pco2 - 40), cronico = 7.4 - 0.003 * (pco2 - 40);
  const partes = [`pH esperado — agudo <strong>${agudo.toFixed(2).replace(".", ",")}</strong> · crónico <strong>${cronico.toFixed(2).replace(".", ",")}</strong>`];
  if (hco3 !== undefined && hco3 < 22) partes.push(`Winter (acidosis metabólica): pCO₂ esperada <strong>${Math.round(1.5 * hco3 + 8)} ±2</strong>`);
  if (ph !== undefined && pco2 > 45) {
    if (ph >= cronico - 0.02) partes.push("Patrón: <strong>crónico compensado</strong>");
    else if (ph <= agudo - 0.03) partes.push("Patrón: <strong>componente metabólico añadido</strong> (C3: busca hipoperfusión)");
    else if (ph <= agudo + 0.02) partes.push("Patrón: <strong>agudo puro</strong> (C1)");
    else partes.push("Patrón: <strong>crónico agudizado</strong> (C2)");
  }
  r.innerHTML = partes.join("<br>");
}
function calcHacor() {
  const d = { fc: num("hFc"), ph: num("hPh"), gcs: num("hGcs"), pafi: num("hPafi"), fr: num("hFr") };
  const r = document.getElementById("rHacor");
  if (!REGLAS || Object.values(d).some(v => v === undefined)) { r.textContent = "Rellena los cinco campos (a 1–2 h de VNI)."; return; }
  const h = Motor.hacor(d);
  r.innerHTML = `<strong>HACOR ${h.total}</strong> — ${h.altoRiesgo
    ? "⚠ >5: riesgo ALTO de fracaso (~78%): reevaluación muy precoz y avisar a UCI"
    : "≤5: riesgo bajo de fracaso (~18%): continuar y reevaluar"}`;
}
function calcFio2() {
  if (!REGLAS) return;
  const d = document.getElementById("cDisp").value;
  document.getElementById("cEtiqueta").textContent = ETIQUETAS_FLUJO[d] === "—" ? "Flujo" : ETIQUETAS_FLUJO[d];
  document.getElementById("cFlujo").disabled = d === "aire";
  const res = Motor.fio2Estimada(d, num("cFlujo"));
  document.getElementById("rFio2").innerHTML = `<strong>FiO₂ ≈ ${fmt(res.fio2)}</strong>${res.aviso ? `<br><small>${res.aviso}</small>` : ""}`;
}
const seccionHerr = document.getElementById("herramientas");
if (seccionHerr) {
  seccionHerr.addEventListener("input", () => { calcOxi(); calcPeso(); calcPh(); calcHacor(); calcFio2(); });
  seccionHerr.addEventListener("change", () => { calcOxi(); calcPeso(); calcPh(); calcHacor(); calcFio2(); });
}

/* ==================== MODO OSCURO ==================== */
const btnTema = document.getElementById("btnTema");
function aplicarTemaApp(oscuro) {
  document.documentElement.dataset.tema = oscuro ? "oscuro" : "";
  if (btnTema) btnTema.textContent = oscuro ? "☀️" : "🌙";
  try { localStorage.setItem("vmni-tema", oscuro ? "oscuro" : "claro"); } catch (e) {}
}
if (btnTema) {
  btnTema.addEventListener("click", () => aplicarTemaApp(document.documentElement.dataset.tema !== "oscuro"));
  if (document.documentElement.dataset.tema === "oscuro") btnTema.textContent = "☀️";
}

/* ==================== PWA: registro y aviso de actualización ==================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      if (reg.waiting) avisarActualizacion(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) avisarActualizacion(nuevo);
        });
      });
    }).catch(() => {});
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargando) return;
      recargando = true;
      location.reload();
    });
  });
}
function avisarActualizacion(sw) {
  if (document.querySelector(".banner-actualizacion")) return;
  const b = document.createElement("div");
  b.className = "banner-actualizacion";
  b.innerHTML = `<span>🔄 Hay una <strong>nueva versión</strong> de la app disponible.</span>
    <button class="btn-actualizar">Actualizar ahora</button>`;
  b.querySelector("button").addEventListener("click", () => {
    sw.postMessage("SALTAR_ESPERA");
    b.querySelector("button").textContent = "Actualizando…";
  });
  document.body.appendChild(b);
}

