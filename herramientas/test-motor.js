// Tests del motor clínico con viñetas — ejecutar: node herramientas/test-motor.js
const fs = require("fs");
const path = require("path");
const Motor = require("../motor.js");
Motor.init(JSON.parse(fs.readFileSync(path.join(__dirname, "../datos/reglas.json"), "utf8")));

let ok = 0, fallos = 0;
function caso(nombre, fn) {
  try { fn(); ok++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos++; console.error(`  ✗ ${nombre}\n    ${e.message}`); }
}
function esperar(cond, msg) { if (!cond) throw new Error(msg); }

const base = (extra) => Object.assign({
  antecedentes: { respiratorios: [], otros: [], circunstancias: [] },
  clinica: { fr: 28, fc: 105, tas: 140, gcs: 15, spo2: 90 },
  gasometria: { tipo: "arterial", ph: 7.38, pco2: 40, po2: 70, hco3: 24, lactato: 12 },
  fio2: { dispositivo: "gafas", valor: 2 },
  sospecha: null,
}, extra);

console.log("— Cálculos —");
caso("FiO2 gafas 3 L/min = 0,33 (D-2, errata corregida)", () => {
  esperar(Motor.fio2Estimada("gafas", 3).fio2 === 0.33, "esperaba 0,33");
});
caso("FiO2 reservorio 10 L/min = 0,9; Ventimask 35% = 0,35", () => {
  esperar(Motor.fio2Estimada("reservorio", 10).fio2 === 0.9, "reservorio");
  esperar(Motor.fio2Estimada("vk", 35).fio2 === 0.35, "vk");
});
caso("SaFi: SpO2 90 / FiO2 0,33 → SaFi 273 → PaFi ≈ 248; con SpO2 98 avisa de invalidez", () => {
  const c = Motor.calculos({ tipo: "arterial", ph: 7.4, pco2: 40 }, { spo2: 90 }, 0.33);
  esperar(c.safi === 273 && c.pafiDeSafi === 249 || c.pafiDeSafi === 248, `safi ${c.safi}, pafi ${c.pafiDeSafi}`);
  const c2 = Motor.calculos({ tipo: "arterial", ph: 7.4, pco2: 40 }, { spo2: 98 }, 0.33);
  esperar(!c2.safi && c2.avisos.some(a => a.includes("97")), "debería avisar SpO2>97");
});
caso("pH esperado: pCO2 68 → agudo 7,18, crónico 7,32", () => {
  const c = Motor.calculos({ tipo: "arterial", ph: 7.27, pco2: 68, hco3: 31.5 }, { spo2: 90 }, 0.33);
  esperar(c.phEsperadoAgudo === 7.18 && c.phEsperadoCronico === 7.32, `${c.phEsperadoAgudo}/${c.phEsperadoCronico}`);
});
caso("Venosa: pH 7,30 → arterial estimado 7,33; pCO2 42 descarta hipercapnia", () => {
  const c = Motor.calculos({ tipo: "venosa", ph: 7.30, pco2: 42 }, { spo2: 93 }, 0.28);
  esperar(c.phArterialEstimado === 7.33, "corrección pH");
  esperar(c.hipercapniaDescartada === true, "descarte pCO2<45");
});
caso("HACOR: FC 125, pH 7,28, GCS 13, PaFi 140, FR 38 = 1+3+2+4+2 = 12 (>5)", () => {
  const h = Motor.hacor({ fc: 125, ph: 7.28, gcs: 13, pafi: 140, fr: 38 });
  esperar(h.total === 12 && h.altoRiesgo, `total ${h.total}`);
});

console.log("— Clasificación y recomendación —");
caso("EPOC agudizado (pH 7,27, pCO2 68, HCO3 31,5) → C2, binivel, EPAP 5 / IPAP 12", () => {
  const r = Motor.evaluar(base({
    antecedentes: { respiratorios: ["epoc"], otros: [], circunstancias: [] },
    gasometria: { tipo: "arterial", ph: 7.27, pco2: 68, po2: 54, hco3: 31.5, lactato: 14 },
    fio2: { dispositivo: "gafas", valor: 3 },
  }));
  esperar(r.clasificacion.rama === "hipercapnico" && r.clasificacion.subtipo === "C2", `rama ${r.clasificacion.rama}/${r.clasificacion.subtipo}`);
  esperar(r.recomendacion.tipo === "binivel", r.recomendacion.tipo);
  esperar(r.recomendacion.parametros.epap.inicial === 5 && r.recomendacion.parametros.ipap.inicial === 12, "parámetros");
});
caso("pH 7,22 → gravedad grave (entorno IOT); pH 7,12 → crítica (IOT salvo LET) y pauta BTS rápida", () => {
  const g = (ph) => Motor.evaluar(base({ gasometria: { tipo: "arterial", ph, pco2: 70, po2: 55, hco3: 26, lactato: 12 }, antecedentes: { respiratorios: ["epoc"], otros: [], circunstancias: [] } }));
  const r1 = g(7.22), r2 = g(7.12);
  esperar(r1.clasificacion.gravedad.nivel === "grave", r1.clasificacion.gravedad.nivel);
  esperar(r1.recomendacion.parametros.ipap.inicial === 15, "pauta rápida BTS");
  esperar(r2.clasificacion.gravedad.nivel === "critica" && r2.recomendacion.tipo === "binivel_critico", r2.clasificacion.gravedad.nivel);
});
caso("C3 mixta: lactato 30 mg/dL marca componente metabólico", () => {
  const r = Motor.evaluar(base({ gasometria: { tipo: "arterial", ph: 7.2, pco2: 60, po2: 60, hco3: 20, lactato: 30 } }));
  esperar(r.clasificacion.subtipo === "C3", r.clasificacion.subtipo);
  esperar(r.recomendacion.alertas.some(a => a.includes("metabólico")), "alerta metabólica");
});
caso("EAP sin hipercapnia → CPAP; con pCO2 50 → binivel", () => {
  const r1 = Motor.evaluar(base({ sospecha: "eap", gasometria: { tipo: "arterial", ph: 7.38, pco2: 38, po2: 55, hco3: 23, lactato: 15 }, fio2: { dispositivo: "reservorio", valor: 10 } }));
  esperar(r1.clasificacion.rama === "eap" && r1.recomendacion.tipo === "cpap", `${r1.clasificacion.rama}/${r1.recomendacion.tipo}`);
  const r2 = Motor.evaluar(base({ sospecha: "eap", gasometria: { tipo: "arterial", ph: 7.36, pco2: 50, po2: 55, hco3: 25, lactato: 15 }, fio2: { dispositivo: "reservorio", valor: 10 } }));
  esperar(r2.recomendacion.tipo === "binivel", r2.recomendacion.tipo);
});
caso("Hipoxémico PaFi 120 → aviso UCI (<150); PaFi 85 → VMI; con LET → paliativo", () => {
  const g = (po2, circunstancias = []) => Motor.evaluar(base({
    antecedentes: { respiratorios: [], otros: [], circunstancias },
    gasometria: { tipo: "arterial", ph: 7.42, pco2: 35, po2, hco3: 24, lactato: 12 },
    fio2: { dispositivo: "vk", valor: 50 },
  }));
  const r1 = g(60); // PaFi 120
  esperar(r1.clasificacion.rama === "hipoxemico" && r1.clasificacion.pafi === 120, `pafi ${r1.clasificacion.pafi}`);
  esperar(r1.recomendacion.alertas.some(a => a.includes("UCI")), "aviso UCI");
  const r2 = g(42); // PaFi 84
  esperar(r2.recomendacion.tipo === "vmi", r2.recomendacion.tipo);
  const r3 = g(42, ["let"]);
  esperar(r3.recomendacion.tipo === "paliativo", r3.recomendacion.tipo);
});
caso("Hipercapnia sin acidosis (pH 7,38, pCO2 60) → no VNI (ERS/ATS Q1a)", () => {
  const r = Motor.evaluar(base({ gasometria: { tipo: "arterial", ph: 7.38, pco2: 60, po2: 60, hco3: 33, lactato: 12 } }));
  esperar(r.recomendacion.tipo === "no_vni", r.recomendacion.tipo);
});
caso("GCS 6 sin hipercapnia → IOT; con LET → paliativo", () => {
  const r = Motor.evaluar(base({ clinica: { fr: 30, fc: 110, tas: 130, gcs: 6, spo2: 88 } }));
  esperar(r.clasificacion.rama === "iot" && r.recomendacion.tipo === "iot", r.recomendacion.tipo);
  const r2 = Motor.evaluar(base({ clinica: { fr: 30, fc: 110, tas: 130, gcs: 6, spo2: 88 }, antecedentes: { respiratorios: [], otros: [], circunstancias: ["let"] } }));
  esperar(r2.recomendacion.tipo === "paliativo", r2.recomendacion.tipo);
});
caso("GCS 7 CON hipercapnia (encefalopatía) NO dispara IOT automática", () => {
  const r = Motor.evaluar(base({ clinica: { fr: 28, fc: 100, tas: 135, gcs: 7, spo2: 90 }, gasometria: { tipo: "arterial", ph: 7.24, pco2: 80, po2: 60, hco3: 32, lactato: 14 } }));
  esperar(r.clasificacion.rama === "hipercapnico", r.clasificacion.rama);
});
caso("Sobredosis sospechada con pH 7,25 y pCO2 60 → revertir", () => {
  const r = Motor.evaluar(base({ sospecha: "sobredosis", gasometria: { tipo: "arterial", ph: 7.25, pco2: 60, po2: 65, hco3: 25, lactato: 12 } }));
  esperar(r.recomendacion.tipo === "revertir", r.recomendacion.tipo);
});
caso("ENM hipercápnico → escenario neuromuscular con 'no retrasar IOT'", () => {
  const r = Motor.evaluar(base({ antecedentes: { respiratorios: ["neuromuscular"], otros: [], circunstancias: [] }, gasometria: { tipo: "arterial", ph: 7.31, pco2: 55, po2: 60, hco3: 27, lactato: 12 } }));
  esperar(r.recomendacion.escenario === "neuromuscular", r.recomendacion.escenario);
  esperar(r.recomendacion.titulacion.some(t => t.includes("NO retrasar")), "aviso IOT");
});

caso("Peso ideal y Vt objetivo: varón 170 cm → 66 kg → 396–528 ml (y la mujer pesa 4,5 kg menos)", () => {
  const c = Motor.calculos({ tipo: "arterial", ph: 7.35, pco2: 42 }, { spo2: 94, talla: 170, sexo: "v" }, 0.21);
  esperar(c.pesoIdeal === 66 && c.vtObjetivo[0] === 396 && c.vtObjetivo[1] === 528, `${c.pesoIdeal} kg, ${c.vtObjetivo}`);
  const m = Motor.calculos({ tipo: "arterial", ph: 7.35, pco2: 42 }, { spo2: 94, talla: 170, sexo: "m" }, 0.21);
  esperar(m.pesoIdeal === 61.5, `mujer ${m.pesoIdeal} kg`);
});

console.log("— SpO2 simulada (modelo del simulador) —");
const PERFILES_SIM = {
  normal: { paco2: 40, shunt: 0.03, recluta: 0.5 },
  epoc: { paco2: 60, shunt: 0.07, recluta: 0.25 },
  eap: { paco2: 35, shunt: 0.22, recluta: 0.6 },
};
caso("EAP con EPAP 5 y aire ambiente: hipoxemia grave (SpO2 <80, alarma)", () => {
  const s = Motor.spo2Simulada(PERFILES_SIM.eap, 0.21, 5, 0).spo2;
  esperar(s < 80, `SpO2 ${s.toFixed(1)}`);
});
caso("EAP: la EPAP recluta (11 vs 5 con FiO2 0,28 sube la SpO2 ≥5 puntos)", () => {
  const bajo = Motor.spo2Simulada(PERFILES_SIM.eap, 0.28, 5, 0).spo2;
  const alto = Motor.spo2Simulada(PERFILES_SIM.eap, 0.28, 11, 0).spo2;
  esperar(alto > bajo + 5 && alto > 93, `de ${bajo.toFixed(1)} a ${alto.toFixed(1)}`);
});
caso("EPOC con aire ambiente: SpO2 ~88-92 (retenedor típico)", () => {
  const s = Motor.spo2Simulada(PERFILES_SIM.epoc, 0.21, 5, 0).spo2;
  esperar(s >= 87 && s <= 93, `SpO2 ${s.toFixed(1)}`);
});
caso("Pulmón normal con aire: SpO2 ≥95; y la fuga de 30 L/min desatura con FiO2 alta", () => {
  const s = Motor.spo2Simulada(PERFILES_SIM.normal, 0.21, 5, 0).spo2;
  esperar(s >= 95, `normal ${s.toFixed(1)}`);
  const sinFuga = Motor.spo2Simulada(PERFILES_SIM.eap, 0.6, 5, 0).spo2;
  const conFuga = Motor.spo2Simulada(PERFILES_SIM.eap, 0.6, 5, 30).spo2;
  esperar(conFuga < sinFuga - 2, `fuga: de ${sinFuga.toFixed(1)} a ${conFuga.toFixed(1)}`);
});

console.log("— Seguimiento —");
caso("Respuesta favorable: pH 7,27→7,33 y FR 32→24", () => {
  const r = Motor.evaluarRespuesta({ ph: 7.27, fr: 32, pco2: 68, gcs: 14 }, { ph: 7.33, fr: 24, pco2: 60, gcs: 15, fc: 95, pafi: 210 });
  esperar(r.veredicto === "favorable", r.veredicto);
});
caso("Fracaso: pH 7,27→7,24 y FR 32→38 (2 criterios menores)", () => {
  const r = Motor.evaluarRespuesta({ ph: 7.27, fr: 32, pco2: 68, gcs: 14 }, { ph: 7.24, fr: 38, pco2: 74, gcs: 14, fc: 120, pafi: 160 });
  esperar(r.veredicto === "fracaso" && r.menores.length >= 2, `${r.veredicto}/${r.menores.length}`);
});
caso("Respuesta incompleta → vigilar", () => {
  const r = Motor.evaluarRespuesta({ ph: 7.27, fr: 32, pco2: 68, gcs: 15 }, { ph: 7.28, fr: 31, pco2: 66, gcs: 15, fc: 105, pafi: 190 });
  esperar(r.veredicto === "vigilar", r.veredicto);
});

console.log(`\n${ok} correctos, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
