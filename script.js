/* ====== VMNI Urgencias · boceto v0.2 — navegación + simulador demo ====== */

/* ---------- navegación ---------- */
function irA(id) {
  document.querySelectorAll(".pantalla").forEach(s => s.classList.remove("visible"));
  document.getElementById(id).classList.add("visible");
  document.querySelectorAll("[data-s]").forEach(b => b.classList.toggle("activo", b.dataset.s === id));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (id === "simulador") Sim.activar(); else Sim.pausar();
  if (id === "seguimiento") prefillSeguimiento();
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
      <button class="btn-primario" onclick="irA('seguimiento')">Iniciar seguimiento ⏱</button>
    </div>
    <p class="provisional">Reglas clínicas v${r.reglasVersion} — ${r.estado}</p>
  </div>`;
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

