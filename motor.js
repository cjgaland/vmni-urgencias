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
        return { fio2: red(Math.min(v.base + v.porLitro * (valor || 0), v.max)), decision: "D-12", aviso: "Estimación orientativa (tabla de banco Thys & Liistro): la FiO₂ real varía con presiones, fuga y patrón. Titule por SpO₂ y, si el Vivo monta célula de FiO₂, use el valor medido." };
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
    // peso ideal (talla y sexo) → Vt objetivo 6-8 ml/kg IDEAL (el pulmón no engorda:
    // nunca usar el peso real para el volumen corriente)
    if (esNum(clinica.talla) && clinica.talla >= 120) {
      const base = clinica.sexo === "m" ? 45.5 : 50;
      c.pesoIdeal = red(base + 0.91 * (clinica.talla - 152.4), 1);
      c.vtObjetivo = [Math.round(c.pesoIdeal * 6), Math.round(c.pesoIdeal * 8)];
    }
    return c;
  }

  /* ---------- SpO2 simulada (usada por el simulador; pura para poder testearla) ----------
     Modelo docente: alveolar simplificada + shunt del perfil, reclutable con la EPAP,
     y dilución de la FiO2 por la fuga; saturación por la ecuación de Severinghaus. */
  function spo2Simulada(perfil, fio2, epap, fugaLmin) {
    const fio2Eff = 0.21 + (fio2 - 0.21) * (1 - Math.min(0.5, (fugaLmin || 0) / 50));
    const reclut = Math.min(1, Math.max(0, (epap - 4) / 8));
    const shuntEff = perfil.shunt * (1 - perfil.recluta * reclut);
    const pao2 = Math.max(28, (fio2Eff * 713 - perfil.paco2 / 0.8) * (1 - 3.3 * shuntEff));
    const spo2 = Math.min(100, 100 / (1 + 23400 / (pao2 ** 3 + 150 * pao2)));
    return { spo2, pao2: red(pao2, 0), fio2Eff: red(fio2Eff, 2) };
  }

  /* ---------- Volúmenes y capacidades teóricos (docencia) ----------
     PBW por ARDSNet (igual que pesoIdeal), CV por Knudson 1976 y VR por las
     ecuaciones de referencia ECSC/ERS (Quanjer 1993). El reparto VRE≈25% de la CV
     es la proporción del adulto tipo de los textos de fisiología. */
  function volumenesTeoricos(sexo, edad, talla) {
    if (!esNum(edad) || !esNum(talla) || talla < 130 || talla > 220 || edad < 16 || edad > 100) return null;
    const mujer = sexo === "m";
    const pbw = red((mujer ? 45.5 : 50) + 0.91 * (talla - 152.4), 1);
    const vt = red(pbw * 7 / 1000, 2); // punto medio del rango fisiológico 6-8 ml/kg ideal
    const cv = red(mujer ? 0.041 * talla - 0.018 * edad - 2.69
                         : 0.052 * talla - 0.022 * edad - 3.60, 2);
    const vr = red(mujer ? 1.81 * (talla / 100) + 0.016 * edad - 2.00
                         : 1.31 * (talla / 100) + 0.022 * edad - 1.23, 2);
    if (!(cv > vt + 0.5) || !(vr > 0.3)) return null;
    const vre = red(0.25 * cv, 2);
    const vri = red(cv - vt - vre, 2);
    return { pbw, vt, cv, vr, vre, vri, crf: red(vr + vre, 2), cpt: red(cv + vr, 2) };
  }

  /* ---------- Clasificación ácido-base (lectura sistemática de la gasometría) ----------
     pH → ¿acidemia/alcalemia? → componente respiratorio (pCO2) o metabólico (HCO3)
     → compensación esperada (pH esperado agudo/crónico; Winter). Enfoque de Berend
     NEJM 2014. Pura para poder testearla y mostrarla en vivo en la evaluación. */
  function clasificarAcidoBase(ph, pco2, hco3) {
    if (!esNum(ph) || !esNum(pco2)) return null;
    const d = [];
    const co2Alto = pco2 > 45, co2Bajo = pco2 < 35;
    const hco3Bajo = esNum(hco3) && hco3 < 22, hco3Alto = esNum(hco3) && hco3 > 26;
    let titulo, tipo;

    if (ph < 7.35) {
      tipo = "acidosis";
      const coma = n => String(n).replace(".", ",");
      if (co2Alto && hco3Bajo) { titulo = "Acidosis mixta (respiratoria + metabólica)"; d.push("pCO2 alta e HCO3 bajo a la vez: dos procesos acidóticos simultáneos."); }
      else if (co2Alto) {
        const phAgudo = red(7.4 - R.acidoBase.phEsperadoAgudo.porMmHg * (pco2 - 40), 2);
        const phCronico = red(7.4 - R.acidoBase.phEsperadoCronico.porMmHg * (pco2 - 40), 2);
        if (ph <= phAgudo + 0.02) { titulo = "Acidosis respiratoria aguda"; d.push(`El pH cae ≈0,008 por mmHg de pCO2 (esperado ${coma(phAgudo)}): no ha dado tiempo a compensar.`); }
        else if (ph >= phCronico - 0.02) { titulo = "Acidosis respiratoria crónica (compensada)"; d.push(`El riñón ya retiene HCO3: pH cerca del esperado crónico (${coma(phCronico)}).`); }
        else { titulo = "Acidosis respiratoria crónica agudizada"; d.push(`pH entre el esperado agudo (${coma(phAgudo)}) y el crónico (${coma(phCronico)}): hipercapnia crónica con empeoramiento agudo.`); }
      } else if (hco3Bajo) {
        titulo = "Acidosis metabólica";
        const winter = red(1.5 * hco3 + 8, 0);
        if (pco2 > winter + 2) { titulo += " con compensación respiratoria insuficiente"; d.push(`Winter: pCO2 esperada ${winter}±2 y tiene ${pco2} → componente respiratorio añadido (¿fatiga?).`); }
        else if (pco2 < winter - 2) { titulo += " + alcalosis respiratoria añadida"; d.push(`Winter: pCO2 esperada ${winter}±2 y tiene ${pco2}: hiperventila más de lo que compensa.`); }
        else d.push(`Compensación respiratoria adecuada (Winter: pCO2 esperada ${winter}±2).`);
      } else { titulo = "Acidemia sin causa clara con estos datos"; d.push("pCO2 y HCO3 no la explican: revisa los valores (¿láctico, tóxicos?)."); }
    } else if (ph > 7.45) {
      tipo = "alcalosis";
      if (co2Bajo && hco3Alto) { titulo = "Alcalosis mixta (respiratoria + metabólica)"; d.push("pCO2 baja e HCO3 alto a la vez."); }
      else if (co2Bajo) { titulo = "Alcalosis respiratoria"; d.push("Hiperventilación: pCO2 baja con pH alto (dolor, ansiedad, hipoxemia, TEP…)."); }
      else if (hco3Alto) { titulo = "Alcalosis metabólica"; d.push("HCO3 alto con pH alto (vómitos, diuréticos, hipopotasemia…)."); }
      else { titulo = "Alcalemia sin causa clara con estos datos"; d.push("pCO2 y HCO3 no la explican: revisa los valores."); }
    } else {
      tipo = "normal";
      if (co2Alto && hco3Alto) { titulo = "pH normal con hipercapnia compensada"; d.push("Acidosis respiratoria crónica totalmente compensada (retenedor crónico) — pH normal NO significa gasometría normal."); tipo = "compensado"; }
      else if (co2Bajo && hco3Bajo) { titulo = "pH normal con hipocapnia e HCO3 bajo"; d.push("Posible acidosis metabólica compensada o trastorno mixto equilibrado."); tipo = "compensado"; }
      else if (co2Alto || co2Bajo || hco3Bajo || hco3Alto) { titulo = "pH normal con alteración aislada"; d.push("Un solo parámetro alterado con pH normal: posible trastorno mixto equilibrado; valora clínica y repite."); tipo = "compensado"; }
      else titulo = "Equilibrio ácido-base normal";
    }
    return { tipo, titulo, detalle: d };
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
      if (["sho", "restrictivo", "obesidad", "hernia_diafragmatica", "cifosis", "cirugia_toracica"].some(x => resp.includes(x))) return "sho_restrictivo";
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
    // modificadores anatómicos: avisos que aplican a cualquier soporte
    const anatomicas = () => {
      if (resp.includes("obesidad")) alertas.push("Obesidad importante: EPAP inicial 8–10 (carga torácica), posible vía aérea difícil (avisar si IOT) y HBPM con dosis ajustada.");
      if (resp.includes("hernia_diafragmatica")) alertas.push("Hernia diafragmática/eventración: parénquima reducido — Vt en el rango bajo (≈6 ml/kg ideal), Ti 1,2–1,5 s y SNG precoz si distensión gástrica.");
      if (resp.includes("cifosis")) alertas.push("Cifosis/cifoscoliosis severa: CPT reducida y caja rígida — pueden necesitarse IPAP altas (>20) para lograr Vt, Ti 1,2–1,5 s, EPAP de reclutamiento; posible vía aérea difícil.");
      if (resp.includes("cirugia_toracica")) alertas.push("Cirugía torácica previa (resección/toracoplastia): capacidad pulmonar reducida — Vt en rango bajo, vigilar asimetría ventilatoria y umbral bajo para descartar neumotórax con imagen.");
    };

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
      anatomicas();
      if (otros.includes("inmunodepresion")) alertas.push(R.modificadores.inmunodepresion);
      if (e.sospecha === "neumonia" && !otros.includes("ic") && !prefiereBinivel) alertas.push(R.modificadores.neumonia_sin_comorbilidad);
      return r;
    }

    if (cls.rama === "eap") {
      anatomicas();
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
      anatomicas();
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

  const Motor = { init, fio2Estimada, calculos, hacor, clasificar, recomendar, evaluar, evaluarRespuesta, spo2Simulada, volumenesTeoricos, clasificarAcidoBase };
  if (typeof module !== "undefined" && module.exports) module.exports = Motor;
  global.Motor = Motor;
})(typeof window !== "undefined" ? window : globalThis);
