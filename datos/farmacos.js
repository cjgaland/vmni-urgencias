/* ====== VMNI Urgencias · tratamiento farmacológico por escenario ======
   Fuente: docs/FARMACOS.md v1.0 (GesEPOC 2021, GOLD, ESC 2021, GINA/GEMA, BTS),
   validado por los autores el 27-10-2026. RECOMENDACIONES GENERALES: siempre
   individualizar (alergias, antecedentes, concomitancias, interacciones,
   función renal/hepática, embarazo) y seguir los protocolos del centro. */
const FARMACOS = {
  descargo: "Recomendaciones generales según guías nacionales e internacionales (GesEPOC, GOLD, ESC, GINA/GEMA, BTS). NO sustituyen la valoración individual: comprueba alergias, antecedentes, enfermedades concomitantes, interacciones, función renal/hepática y embarazo, y sigue los protocolos y el mapa de resistencias de tu centro. Dosis orientativas de adulto. La app ACONSEJA: la decisión de prescribir, ajustar o retirar es siempre del profesional, que registra en el caso lo que realmente hace.",

  escenarios: {
    epoc_hipercapnico: {
      clave: ["broncodilatador", "corticoide"],
      items: [
        { id: "broncodilatador", nombre: "Salbutamol ± ipratropio nebulizado", dosis: "2,5–5 mg (+ 0,5 mg) cada 20–30 min la 1.ª hora; luego cada 4–6 h", nota: "Base del tratamiento. Sin interrumpir la VNI: malla vibrante en T", ref: "GesEPOC · GOLD" },
        { id: "corticoide", nombre: "Prednisona", dosis: "40 mg vo, 5 días (metilprednisolona IV si no tolera la vo)", nota: "No alargar el curso. Mayor eficacia si eosinófilos ≥300/mm³", ref: "GOLD · GesEPOC" },
        { id: "antibiotico", nombre: "Amoxicilina-clavulánico", dosis: "875/125 mg cada 8 h, 5–7 días", nota: "Si purulencia (Anthonisen ≥2), PCR ≥20 o necesidad de VNI (que por sí sola lo indica). Ajustar al mapa local; riesgo de Pseudomonas → ciprofloxacino", ref: "GesEPOC" },
        { id: "hbpm", nombre: "HBPM profiláctica", dosis: "según peso y función renal", nota: "Paciente encamado/ingresado", ref: "GOLD" },
      ],
      noHacer: ["Metilxantinas de rutina", "O₂ sin control (objetivo SpO₂ 88–92%)", "Mucolíticos en el episodio agudo"],
    },
    eap: {
      clave: ["diuretico"],
      items: [
        { id: "diuretico", nombre: "Furosemida IV", dosis: "20–40 mg en bolo (o 1–2 veces su dosis oral habitual); repetir o perfusión según respuesta", nota: "Pilar del tratamiento en congestión", ref: "ESC 2021" },
        { id: "vasodilatador", nombre: "Nitroglicerina", dosis: "sl o IV 10–20 µg/min, titulando", nota: "Solo si TAS >110 mmHg; evitar en TAS <100, estenosis aórtica grave o IAM de VD", ref: "ESC 2021" },
        { id: "morfina", nombre: "Morfina IV (NO rutinaria)", dosis: "2,5–5 mg solo en disnea/ansiedad refractarias", nota: "Su uso rutinario se asocia a peor pronóstico; vigilancia estrecha", ref: "ESC 2021" },
        { id: "hbpm", nombre: "HBPM profiláctica", dosis: "según peso y función renal", nota: "Si no anticoagulado", ref: "ESC 2021" },
      ],
      noHacer: ["Morfina rutinaria", "NTG con TAS <100 / estenosis aórtica grave", "Olvidar el desencadenante (SCA, arritmia, crisis HTA)"],
    },
    asma: {
      clave: ["broncodilatador", "corticoide"],
      items: [
        { id: "broncodilatador", nombre: "Salbutamol + ipratropio", dosis: "4–10 puls. con cámara cada 20 min la 1.ª hora (o neb 2,5–5 mg ×3) + ipratropio 0,5 mg en la crisis grave", nota: "Primera línea indiscutible", ref: "GINA · GEMA" },
        { id: "corticoide", nombre: "Corticoide sistémico PRECOZ", dosis: "prednisona 40–50 mg vo o hidrocortisona 100–200 mg IV, en la 1.ª hora", nota: "La precocidad importa más que la vía", ref: "GINA · GEMA" },
        { id: "magnesio", nombre: "Sulfato de magnesio IV", dosis: "2 g en 20 min, dosis única", nota: "Solo crisis grave sin respuesta al tratamiento inicial o con hipoxemia persistente", ref: "GINA" },
      ],
      noHacer: ["Sedantes fuera de la UCI", "Hiperoxigenar (objetivo SpO₂ 93–95%)"],
    },
    sobredosis: {
      clave: ["naloxona"],
      items: [
        { id: "naloxona", nombre: "Naloxona (opioides)", dosis: "0,04–0,1 mg IV cada 2–3 min, titulando hasta FR ≥10 (no hasta despertar). Opioides largos → perfusión (~2/3 de la dosis eficaz/h)", nota: "PRIMERO ventilar con bolsa-mascarilla. Vida media corta: vigilancia prolongada", ref: "toxicología" },
        { id: "flumazenilo", nombre: "Flumazenilo (uso EXCEPCIONAL)", dosis: "0,2 mg IV lentos; repetir 0,1–0,2 mg/min (máx. 1–2 mg)", nota: "CONTRAINDICADO en dependencia de BZD, coingesta proconvulsivante (tricíclicos) o epilepsia. Valorar con toxicología", ref: "toxicología" },
      ],
      noHacer: ["Naloxona en bolos altos «para despertar» (abstinencia/agitación)", "Flumazenilo indiscriminado"],
    },
    hipoxemico: {
      clave: [],
      items: [
        { id: "causa", nombre: "Tratar la causa", dosis: "según etiología (antibioterapia precoz si neumonía, etc.)", nota: "El soporte no sustituye al tratamiento etiológico", ref: "—" },
        { id: "hbpm", nombre: "HBPM profiláctica", dosis: "según peso y función renal", nota: "Paciente encamado", ref: "—" },
      ],
      noHacer: ["Retrasar la IOT cuando hay criterios (PaFi ≤146 a la hora, FR >30 persistente)"],
    },
    sho_restrictivo: {
      clave: [],
      items: [
        { id: "hbpm", nombre: "HBPM profiláctica", dosis: "según peso y función renal (ajustar en obesidad)", nota: "Riesgo trombótico elevado en SHO", ref: "—" },
      ],
      noHacer: ["Sedantes que depriman el centro respiratorio", "Hiperoxigenar (objetivo 88–92%)"],
    },
    neuromuscular: {
      clave: [],
      items: [
        { id: "causa", nombre: "Tratamiento específico de la ENM", dosis: "según entidad (p. ej. crisis miasténica)", nota: "Coordinación precoz con neurología/UCI", ref: "—" },
      ],
      noHacer: ["Sedantes y relajantes salvo en secuencia de intubación", "Retrasar la IOT si falla la VNI"],
    },
  },

  /* Evolución semicuantitativa por 30 min — SOLO para casos docentes/simulados.
     Tres trayectorias: con tratamiento clave + VNI, parcial, y sin soporte. */
  evolucion: {
    epoc_hipercapnico: {
      completo: { ph: 0.03, pco2: -4.5, fr: -3.5, spo2: 1.5 },
      parcial: { ph: 0.012, pco2: -1.5, fr: -1.5, spo2: 0.8 },
      sinSoporte: { ph: -0.018, pco2: 3.5, fr: 1.5, spo2: -1.5 },
    },
    eap: {
      completo: { ph: 0.025, pco2: -1.5, fr: -5, spo2: 3.5 },
      parcial: { ph: 0.01, pco2: -0.5, fr: -2, spo2: 1.5 },
      sinSoporte: { ph: -0.02, pco2: 2, fr: 2, spo2: -3 },
    },
    asma: {
      completo: { ph: 0.025, pco2: -3, fr: -4, spo2: 2 },
      parcial: { ph: 0.008, pco2: -1, fr: -1.5, spo2: 1 },
      sinSoporte: { ph: -0.025, pco2: 4.5, fr: 2.5, spo2: -2.5 },
    },
    defecto: {
      completo: { ph: 0.02, pco2: -2.5, fr: -3, spo2: 2 },
      parcial: { ph: 0.008, pco2: -1, fr: -1, spo2: 1 },
      sinSoporte: { ph: -0.015, pco2: 2.5, fr: 1.5, spo2: -2 },
    },
  },
};
if (typeof module !== "undefined" && module.exports) module.exports = FARMACOS;
