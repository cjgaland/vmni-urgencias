/* ====== VMNI Urgencias · motor clínico (puro, sin DOM) ======
   Lee datos/reglas.json. Valores PROVISIONALES pendientes de validación (D-1..D-16).
   Funciona en navegador (window.Motor) y en Node (module.exports) para los tests. */
(function (global) {
  "use strict";

  let R = null; // reglas

  function init(reglas) { R = reglas; }

  /* ---------- utilidades ---------- */
  const red = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
  const esNum = v => typeof v === "number" && isFinite(v);

  /* ---------- FiO2 estimada ---------- */
  function fio2Estimada(dispositivo, valor) {
    const f = R.fio2;
    switch (dispositivo) {
      case "aire": return { fio2: f.aire };
      case "gafas": {
        const litros = Math.min(valor || 0, f.gafas.flujoMax);
        return { fio2: red(f.gafas.base + f.gafas.porLitro * litros), decision: "D-2" };
      }
      case "vk": return { fio2: red((valor || 21) / 100) };
      case "reservorio": {
        const fila = f.reservorio.find(r => (valor || 0) >= r.flujoMin);
        return { fio2: fila ? fila.fio2 : 0.6 };
      }
      case "vivo": {
        const v = f.vivoSinMezclador;
        return { fio2: red(Math.min(v.base + v.porLitro * (valor || 0), v.max)), decision: "D-12", aviso: "Estimación genérica (tabla Thys & Liistro): pendientes las fórmulas propias del Vivo (D-12)." };
      }
      case "mezclador": case "tafcn": return { fio2: red((valor || 21) / 100) };
      default: return { fio2: f.aire };
    }
  }

  /* ---------- cálculos gasométricos ---------- */
  function calculos(g, clinica, fio2) {
    const c = { fio2 };
    const venosa = g.tipo === "venosa";
    c.venosa = venosa;
    c.avisos = [];

    c.ph = g.ph;
    if (venosa && esNum(g.ph)) {
      c.phArterialEstimado = red(g.ph + R.gasometriaVenosa.correccionPh, 2);
      c.avisos.push(`pH venoso ${g.ph} → arterial estimado ≈ ${c.phArterialEstimado} (D-16).`);
      c.ph = c.phArterialEstimado;
    }

    c.pco2 = g.pco2;
    if (venosa && esNum(g.pco2)) {
      if (g.pco2 < R.gasometriaVenosa.pco2Descarta) {
        c.avisos.push(`pCO2 venosa ${g.pco2} <45: descarta hipercapnia significativa (D-16).`);
        c.hipercapniaDescartada = true;
      } else {
        c.avisos.push("pCO2 venosa ≥45: confirmar con gasometría arterial (no intercambiable, sesgo ≈ +5 mmHg).");
      }
    }

    // oxigenación
    if (!venosa && esNum(g.po2) && fio2 > 0) c.pafi = Math.round(g.po2 / fio2);
    if (esNum(clinica.spo2) && fio2 > 0) {
      if (clinica.spo2 > R.safi.spo2Max) {
        c.avisos.push(`SpO2 ${clinica.spo2}% >97%: la SaFi no es válida (curva aplanada); baja la FiO2 y reevalúa.`);
      } else {
        c.safi = Math.round(clinica.spo2 / fio2);
        c.pafiDeSafi = Math.round((c.safi - R.safi.ordenada) / R.safi.pendiente);
      }
    }
    c.pafiEfectiva = c.pafi ?? c.pafiDeSafi ?? null;

    // ácido-base
    if (esNum(c.pco2) && c.pco2 > 40) {
      c.phEsperadoAgudo = red(7.4 - R.acidoBase.phEsperadoAgudo.porMmHg * (c.pco2 - 40), 2);
      c.phEsperadoCronico = red(7.4 - R.acidoBase.phEsperadoCronico.porMmHg * (c.pco2 - 40), 2);
    }
    if (esNum(g.hco3)) {
      c.hco3 = g.hco3;
      c.winterPco2 = red(1.5 * g.hco3 + 8, 0);
    }
    if (esNum(g.lactato)) {
      c.lactato = g.lactato;
      c.lactatoAlto = g.lactato > R.acidoBase.lactatoAltoMgdl;
    }
    return c;
  }

  /* ---------- HACOR ---------- */
  function hacor({ fc, ph, gcs, pafi, fr }) {
    if (![fc, ph, gcs, pafi, fr].every(esNum)) return null;
    const pMax = (tabla, v) => { for (const t of tabla) if (v >= t.min) return t.p; return tabla[tabla.length - 1].p; };
    const pMin = (tabla, v) => { for (const t of tabla) if (v <= t.max) return t.p; return tabla[tabla.length - 1].p; };
    const h = R.hacor;
    const total = pMin(h.fc, fc) + pMax(h.ph, ph) + pMax(h.gcs, gcs) + pMax(h.pafi, pafi) + pMin(h.fr, fr);
    return { total, altoRiesgo: total > h.umbralFracaso };
  }

  /* ---------- clasificación ---------- */
  function clasificar(e, c) {
    const cl = R.clasificacion;
    const ap = e.antecedentes || {};
    const resp = ap.respiratorios || [];
    const circ = ap.circunstancias || [];
    const k = e.clinica || {};
    const let_ = circ.includes("let");

    // Paso 0
    const criteriosIot = (k.criteriosIot || []).slice();
    if (esNum(k.gcs) && k.gcs < 8 && !(esNum(c.pco2) && c.pco2 > cl.hipercapnia.pco2)) {
      criteriosIot.push("GCS <8 de causa no hipercápnica");
    }
    if (criteriosIot.length) {
      return { rama: "iot", let: let_, criterios: criteriosIot };
    }

    // Rama A — sobredosis
    if (e.sospecha === "sobredosis" && esNum(c.ph) && c.ph < 7.3 && esNum(c.pco2) && c.pco2 > 50) {
      return { rama: "sobredosis", let: let_ };
    }

    const hipercapnia = esNum(c.pco2) && c.pco2 > cl.hipercapnia.pco2 && !c.hipercapniaDescartada;
    const acidosis = esNum(c.ph) && c.ph < cl.hipercapnia.phAcidosis;

    // Rama D — EAP (la sospecha clínica manda; la hipercapnia asociada se maneja dentro)
    if (e.sospecha === "eap") {
      return { rama: "eap", let: let_, hipercapnia, acidosis };
    }

    // Rama C — hipercápnico
    if (hipercapnia && acidosis) {
      let subtipo = "C1", subtexto = "acidosis respiratoria aguda pura";
      if (esNum(c.hco3) && c.hco3 > R.acidoBase.hco3CronicoDesde) { subtipo = "C2"; subtexto = "acidosis crónica agudizada (IRC agudizada)"; }
      if (c.lactatoAlto || (esNum(c.phEsperadoCronico) && esNum(c.ph) && c.ph < c.phEsperadoAgudo - 0.03)) {
        subtipo = "C3"; subtexto = "acidosis mixta (componente metabólico añadido)";
      }
      const grav = cl.gravedadHipercapnica.find(g => c.ph < g.phMax) || cl.gravedadHipercapnica[cl.gravedadHipercapnica.length - 1];
      return { rama: "hipercapnico", subtipo, subtexto, gravedad: grav, let: let_, eap: e.sospecha === "eap" };
    }

    // Hipercapnia sin acidosis
    if (hipercapnia && !acidosis) {
      return { rama: "hipercapnia_compensada", let: let_ };
    }

    // Rama B — hipoxémico
    const pafi = c.pafiEfectiva;
    if (esNum(pafi)) {
      const banda = cl.pafi.find(b => pafi >= b.min);
      return { rama: "hipoxemico", banda, pafi, let: let_, frAlta: esNum(k.fr) && k.fr > cl.frDeNovo };
    }
    return { rama: "indeterminado", let: let_ };
  }

  /* ---------- escenario y recomendación ---------- */
  function escenarioPara(cls, e) {
    const resp = (e.antecedentes && e.antecedentes.respiratorios) || [];
    if (cls.rama === "hipercapnico") {
      if (e.sospecha === "asma" || (resp.includes("asma") && !resp.includes("epoc"))) return "asma";
      if (resp.includes("neuromuscular")) return "neuromuscular";
      if (resp.includes("sho") || resp.includes("restrictivo")) return "sho_restrictivo";
      return "epoc_hipercapnico";
    }
    if (cls.rama === "eap") return "eap";
    if (cls.rama === "hipoxemico") return "hipoxemico";
    return null;
  }

  function recomendar(e, c, cls) {
    const ap = e.antecedentes || {};
    const resp = ap.respiratorios || [];
    const otros = ap.otros || [];
    const circ = ap.circunstancias || [];
    const alertas = [];
    const refs = [];

    if (cls.rama === "iot") {
      return {
        tipo: cls.let ? "paliativo" : "iot",
        titulo: cls.let ? "LET: valorar VNI paliativa (confort) — no IOT" : "IOT / UCI inmediata",
        detalle: cls.criterios,
        evidencia: "Consenso 2021 tabla 3 · BTS Box 1",
        alertas: cls.let ? ["Vida limitada/LET: la VNI para confort es válida si pertenece a grupos con eficacia documentada (ERS/ATS Q7)."] : [],
      };
    }

    if (cls.rama === "sobredosis") {
      return {
        tipo: "revertir",
        titulo: "Sospecha de sobredosis de depresores: revertir y reevaluar",
        detalle: ["Naloxona (opioides) / flumazenilo (benzodiacepinas) según tóxico, más soporte.", "Repetir gasometría tras la reversión.", "Si no revierte, reclasificar por el patrón gasométrico (rama B/C)."],
        evidencia: "Criterio del borrador — pendiente de validación de Enrique (D-14)",
        alertas: ["Vigilancia estrecha del nivel de consciencia y de la vía aérea."],
      };
    }

    if (cls.rama === "hipercapnia_compensada") {
      return {
        tipo: "no_vni",
        titulo: "Hipercapnia sin acidosis: VNI no indicada de entrada",
        detalle: [R.modificadores.hipercapnia_sin_acidosis],
        evidencia: "ERS/ATS 2017 Q1a (condicional en contra, certeza baja)",
        alertas: ["Reevaluar con gasometría en 60 min o antes si empeora."],
      };
    }

    const escId = escenarioPara(cls, e);
    const esc = escId ? R.escenarios[escId] : null;

    if (cls.rama === "hipoxemico") {
      const pafi = cls.pafi;
      const r = { tipo: "soporte_hipoxemico", escenario: escId, titulo: "", parametros: esc.parametros, titulacion: esc.titulacion.slice(), evidencia: esc.evidencia, alertas };
      const prefiereBinivel = resp.some(x => ["epoc", "sahos", "sho", "restrictivo", "neuromuscular"].includes(x));
      if (pafi >= 300) {
        r.titulo = "Sin hipoxemia: buscar causa del distrés";
        r.tipo = "vigilar";
        r.titulacion = ["Si trabajo respiratorio intenso o FR alta: riesgo de agotamiento — valorar TAFCN y reevaluación muy precoz.", "Buscar y tratar la causa (dolor, ansiedad, acidosis metabólica, anemia…)."];
      } else if (pafi >= 200) {
        r.titulo = "Hipoxemia leve: ↑FiO2 >0,40 y TAFCN de primera línea";
        if (e.sospecha === "eap" || pafi < 250 || (e.clinica && e.clinica.trabajo)) r.titulacion.unshift("CPAP indicada: EAP, trabajo intenso o PaFi <250.");
        if (prefiereBinivel) r.titulacion.unshift("Binivel preferible por sus antecedentes (EPOC/SAHOS/SHO/restrictivo).");
      } else if (pafi >= 100) {
        r.titulo = "Hipoxemia moderada: CPAP (± binivel según antecedentes) o TAFCN vigilada";
        if (pafi < R.clasificacion.pafiUci) alertas.push(`PaFi ${pafi} <150: avisar/consultar con UCI.`);
      } else {
        r.titulo = "Hipoxemia grave: valorar VMI/UCI";
        r.tipo = cls.let ? "paliativo" : "vmi";
        r.titulacion = cls.let
          ? ["LET: VNI/TAFCN como techo terapéutico por equipo experto, con reevaluación precoz y objetivo de confort."]
          : ["VNI solo excepcionalmente (equipo experto, UCI, reevaluación inmediata).", "Preparar IOT: la demora aumenta la mortalidad en el fallo hipoxémico de novo."];
      }
      if (otros.includes("inmunodepresion")) alertas.push(R.modificadores.inmunodepresion);
      if (e.sospecha === "neumonia" && !otros.includes("ic") && !prefiereBinivel) alertas.push(R.modificadores.neumonia_sin_comorbilidad);
      return r;
    }

    if (cls.rama === "eap") {
      const r = { tipo: "cpap", escenario: "eap", titulo: "Iniciar CPAP precoz", parametros: esc.parametros, titulacion: esc.titulacion.slice(), evidencia: esc.evidencia, alertas };
      if (esNum(c.pco2) && c.pco2 > 45) {
        r.titulo = "EAP con hipercapnia: iniciar binivel";
        r.tipo = "binivel";
        r.titulacion.unshift("Hipercapnia asociada: binivel con EPAP 5 e IPAP 10–12 de inicio en lugar de CPAP sola.");
      }
      if (esNum(c.ph) && c.ph < 7.3) {
        alertas.push(`Acidosis significativa en EAP (pH ${c.ph}): binivel, vigilancia estrecha y valorar UCI.`);
      }
      if (esNum(c.pafiEfectiva) && c.pafiEfectiva < 100) {
        alertas.push(`Hipoxemia grave (PaFi ${c.pafiEfectiva}): iniciar CPAP sin demora, avisar a UCI y preparar escalada si no hay respuesta inmediata.`);
      }
      return r;
    }

    if (cls.rama === "hipercapnico") {
      const r = {
        tipo: "binivel", escenario: escId,
        titulo: `Iniciar VNI binivel — ${esc.nombre}`,
        parametros: esc.parametros, titulacion: esc.titulacion.slice(),
        evidencia: esc.evidencia, alertas,
      };
      alertas.push(`Gravedad: ${cls.gravedad.texto} (pH ${c.ph}). ${cls.gravedad.accion}.`);
      if (cls.gravedad.nivel === "critica" && !cls.let) r.tipo = "binivel_critico";
      if (cls.subtipo === "C3") alertas.push("Componente metabólico (C3): buscar hipoperfusión/sepsis/cetoacidosis además del soporte ventilatorio.");
      if (escId === "epoc_hipercapnico" && c.ph < 7.25) {
        r.parametros = JSON.parse(JSON.stringify(esc.parametros));
        r.parametros.ipap.inicial = R.decisionesRapidas && R.decisionesRapidas.btsIpap ? 20 : 15;
        r.titulacion.unshift("Acidosis grave: pauta de subida rápida (BTS): IPAP 15–20 de entrada, escalada cada 10–15 min.");
      }
      if (circ.includes("vmni_domiciliaria")) alertas.push(R.modificadores.vmni_domiciliaria);
      if (escId === "asma") alertas.push("Asma: la evidencia es débil — prueba corta, broncodilatación intensiva y umbral de IOT muy bajo.");
      if (cls.let) alertas.push(R.modificadores.let);
      return r;
    }

    return { tipo: "indeterminado", titulo: "Datos insuficientes para clasificar", detalle: ["Completa gasometría (pH y pCO2) y oxigenación (pO2 o SpO2 con FiO2)."], alertas };
  }

  /* ---------- evaluación completa ---------- */
  function evaluar(entradas) {
    const fio2 = fio2Estimada(entradas.fio2.dispositivo, entradas.fio2.valor);
    const c = calculos(entradas.gasometria, entradas.clinica, fio2.fio2);
    if (fio2.aviso) c.avisos.push(fio2.aviso);
    const cls = clasificar(entradas, c);
    const rec = recomendar(entradas, c, cls);
    const h = hacor({ fc: entradas.clinica.fc, ph: c.ph, gcs: entradas.clinica.gcs, pafi: c.pafiEfectiva, fr: entradas.clinica.fr });
    return { calculos: c, clasificacion: cls, recomendacion: rec, hacor: h, reglasVersion: R.version, estado: R.estado };
  }

  /* ---------- respuesta a la hora ---------- */
  function evaluarRespuesta(basal, hora1) {
    const s = R.seguimiento;
    const menores = [];
    if (esNum(hora1.fr) && (hora1.fr > 35 || (esNum(basal.fr) && hora1.fr > basal.fr))) menores.push(s.criteriosMenores[0]);
    if (esNum(hora1.ph) && (hora1.ph < 7.3 || (esNum(basal.ph) && hora1.ph < basal.ph))) menores.push(s.criteriosMenores[1]);
    if (esNum(hora1.pco2) && esNum(basal.pco2) && hora1.pco2 > basal.pco2 * 1.2) menores.push(s.criteriosMenores[2]);
    if (esNum(hora1.pafi) && hora1.pafi < 150) menores.push(s.criteriosMenores[3]);
    if (esNum(hora1.gcs) && esNum(basal.gcs) && hora1.gcs < basal.gcs) menores.push(s.criteriosMenores[4]);

    const h = hacor({ fc: hora1.fc, ph: hora1.ph, gcs: hora1.gcs ?? 15, pafi: hora1.pafi, fr: hora1.fr });
    const mejoraPh = esNum(hora1.ph) && esNum(basal.ph) && hora1.ph > basal.ph + 0.019;
    const mejoraFr = esNum(hora1.fr) && esNum(basal.fr) && hora1.fr < basal.fr - 2;

    let veredicto, texto;
    if (menores.length >= s.menoresParaIot) {
      veredicto = "fracaso";
      texto = `${menores.length} criterios menores en la primera hora: escalada IOT/UCI. ${s.textoFracaso}`;
    } else if (mejoraPh && mejoraFr) {
      veredicto = "favorable";
      texto = s.textoFavorable;
    } else {
      veredicto = "vigilar";
      texto = "Respuesta incompleta: optimizar (fugas, sincronía, IPAP, FiO2) y repetir gasometría en 1–2 h. Si no mejora a las 4–6 h, considerar fracaso.";
    }
    if (h && h.altoRiesgo && veredicto !== "fracaso") {
      texto += ` HACOR ${h.total} (>5): riesgo alto de fracaso — reevaluación muy precoz y avisar a UCI si no mejora.`;
    }
    return { veredicto, texto, menores, hacor: h, mejoraPh, mejoraFr };
  }

  const Motor = { init, fio2Estimada, calculos, hacor, clasificar, recomendar, evaluar, evaluarRespuesta };
  if (typeof module !== "undefined" && module.exports) module.exports = Motor;
  global.Motor = Motor;
})(typeof window !== "undefined" ? window : globalThis);
