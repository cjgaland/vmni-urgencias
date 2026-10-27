/* ====== VMNI Urgencias · casos FICTICIOS de ejemplo ======
   Todos los casos de este fichero son inventados con fines docentes y así se
   muestran siempre (marca «CASO FICTICIO · DOCENTE»). Tiempos en minutos. */
const CASOS_EJEMPLO = [
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "EPOC agudizado con buena respuesta",
    meta: { edad: 71, sexo: "v", talla: 168, escenario: "EPOC agudizado / fallo hipercápnico" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: ["epoc"], otros: ["hta"], circunstancias: ["o2_domiciliario"] },
        clinica: { fr: 32, fc: 112, tas: 148, gcs: 14, spo2: 86 },
        gasometria: { tipo: "arterial", ph: 7.27, pco2: 68, po2: 54, hco3: 31.5, lactato: 14 },
        fio2: { dispositivo: "gafas", valor: 3 }, sospecha: "epoc",
      },
      resumen: { rama: "hipercapnico", subtipo: "C2", escenarioId: "epoc_hipercapnico", clasif: "Fallo hipercápnico — acidosis crónica agudizada", gravedad: "acidosis moderada", titulo: "Iniciar VNI binivel — EPOC agudizado / fallo hipercápnico", ph: 7.27, pco2: 68, fr: 32, gcs: 14, fc: 112, pafi: 164, hacor: 9 },
    },
    eventos: [
      { t: 5, tipo: "parametros", datos: { modo: "S/T", epap: 5, ipap: 12, fio2: "O₂ 3 L/min", nota: "Mascarilla oronasal, inicio con rampa media" } },
      { t: 10, tipo: "cuidado", datos: { texto: "Protección del puente nasal (hidrocoloide)" } },
      { t: 12, tipo: "farmaco", datos: { id: "broncodilatador", nombre: "Salbutamol ± ipratropio nebulizado", dosis: "5 mg + 0,5 mg en T, sin parar la VNI", nota: "" } },
      { t: 20, tipo: "farmaco", datos: { id: "corticoide", nombre: "Prednisona", dosis: "40 mg vo", nota: "pauta de 5 días" } },
      { t: 35, tipo: "farmaco", datos: { id: "antibiotico", nombre: "Amoxicilina-clavulánico", dosis: "875/125 mg /8 h", nota: "indicado por necesidad de VNI y esputo purulento" } },
      { t: 10, tipo: "cuidado", datos: { texto: "Cabecera a 30–45° y cuello sin flexión" } },
      { t: 30, tipo: "parametros", datos: { modo: "S/T", epap: 5, ipap: 16, fio2: "O₂ 3 L/min", nota: "Subida de IPAP por Vt bajo (380 ml)" } },
      { t: 65, tipo: "reevaluacion", datos: { ph: 7.33, pco2: 59, fr: 24, gcs: 15, fc: 96, spo2: 91, fio2: 0.28 }, veredicto: { veredicto: "favorable", resumen: "↓FR y mejoría del pH en la primera hora: continuar VNI", menores: [] }, hacor: 3 },
      { t: 120, tipo: "nota", datos: { texto: "Tolerancia buena; pausa de 10 min para hidratación y nebulización en T" } },
      { t: 250, tipo: "reevaluacion", datos: { ph: 7.37, pco2: 52, fr: 19, gcs: 15, fc: 84, spo2: 92, fio2: 0.28 }, veredicto: { veredicto: "favorable", resumen: "pH casi normalizado, pCO₂ en descenso", menores: [] }, hacor: 1 },
    ],
    cierre: { t: 420, destino: "Planta con retirada diurna progresiva", comentario: "pH 7,38 en respiración espontánea con O₂ 2 L/min; VNI nocturna la primera noche y valoración por neumología." },
  },
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "EAP con respuesta rápida a CPAP",
    meta: { edad: 78, sexo: "m", talla: 158, escenario: "Edema agudo de pulmón / IC aguda" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: [], otros: ["ic", "hta", "dm"], circunstancias: [] },
        clinica: { fr: 36, fc: 118, tas: 182, gcs: 15, spo2: 84 },
        gasometria: { tipo: "arterial", ph: 7.31, pco2: 44, po2: 52, hco3: 22, lactato: 19 },
        fio2: { dispositivo: "reservorio", valor: 10 }, sospecha: "eap",
      },
      resumen: { rama: "eap", subtipo: "D", escenarioId: "eap", clasif: "EAP / IC aguda", gravedad: "—", titulo: "Iniciar CPAP precoz", ph: 7.31, pco2: 44, fr: 36, gcs: 15, fc: 118, pafi: 58, hacor: 10 },
    },
    eventos: [
      { t: 5, tipo: "parametros", datos: { modo: "CPAP", epap: 5, ipap: "—", fio2: "1,0 (reservorio→CPAP)", nota: "CPAP 5 subiendo de 2 en 2 cada 5-10 min" } },
      { t: 15, tipo: "parametros", datos: { modo: "CPAP", epap: 9, ipap: "—", fio2: "0,8", nota: "CPAP 9: ↓trabajo respiratorio evidente" } },
      { t: 12, tipo: "cuidado", datos: { texto: "Cabecera a 45°; explicada la técnica para reducir ansiedad" } },
      { t: 8, tipo: "farmaco", datos: { id: "diuretico", nombre: "Furosemida IV", dosis: "40 mg en bolo", nota: "" } },
      { t: 12, tipo: "farmaco", datos: { id: "vasodilatador", nombre: "Nitroglicerina IV", dosis: "perfusión 15 µg/min titulando", nota: "TAS 182" } },
      { t: 40, tipo: "reevaluacion", datos: { ph: 7.36, pco2: 40, fr: 26, gcs: 15, fc: 98, spo2: 94, fio2: 0.6 }, veredicto: { veredicto: "favorable", resumen: "SpO₂ 94% y FR en descenso: CPAP eficaz", menores: [] }, hacor: 3 },
      { t: 90, tipo: "reevaluacion", datos: { ph: 7.39, pco2: 38, fr: 20, gcs: 15, fc: 88, spo2: 96, fio2: 0.4 }, veredicto: { veredicto: "favorable", resumen: "Resolución clínica en curso; bajando FiO₂", menores: [] }, hacor: 0 },
      { t: 130, tipo: "parametros", datos: { modo: "CPAP", epap: 5, ipap: "—", fio2: "0,35", nota: "Descenso de CPAP 2 cmH₂O cada 30 min" } },
    ],
    cierre: { t: 180, destino: "Planta de cardiología", comentario: "Retirada de CPAP a O₂ convencional; pendiente de ecocardiografía y ajuste de tratamiento de base." },
  },
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "EPOC grave: fracaso de la VNI e IOT",
    meta: { edad: 66, sexo: "v", talla: 175, escenario: "EPOC agudizado / fallo hipercápnico" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: ["epoc"], otros: ["grave"], circunstancias: [] },
        clinica: { fr: 34, fc: 124, tas: 150, gcs: 13, spo2: 82 },
        gasometria: { tipo: "arterial", ph: 7.21, pco2: 82, po2: 48, hco3: 30, lactato: 16 },
        fio2: { dispositivo: "vk", valor: 31 }, sospecha: "epoc",
      },
      resumen: { rama: "hipercapnico", subtipo: "C2", escenarioId: "epoc_hipercapnico", clasif: "Fallo hipercápnico — acidosis crónica agudizada", gravedad: "acidosis grave", titulo: "Iniciar VNI binivel — EPOC agudizado / fallo hipercápnico", ph: 7.21, pco2: 82, fr: 34, gcs: 13, fc: 124, pafi: 155, hacor: 13 },
    },
    eventos: [
      { t: 5, tipo: "parametros", datos: { modo: "S/T", epap: 5, ipap: 16, fio2: "0,35", nota: "Pauta rápida por pH <7,25; avisada UCI desde el inicio" } },
      { t: 8, tipo: "cuidado", datos: { texto: "Protección del puente nasal; cabecera a 40°" } },
      { t: 10, tipo: "farmaco", datos: { id: "broncodilatador", nombre: "Salbutamol + ipratropio nebulizado", dosis: "5 mg + 0,5 mg en T", nota: "" } },
      { t: 18, tipo: "farmaco", datos: { id: "corticoide", nombre: "Metilprednisolona IV", dosis: "40 mg", nota: "no tolera la vo" } },
      { t: 25, tipo: "parametros", datos: { modo: "S/T", epap: 6, ipap: 20, fio2: "0,35", nota: "Escalada de IPAP; fugas corregidas con cambio de talla" } },
      { t: 60, tipo: "reevaluacion", datos: { ph: 7.18, pco2: 88, fr: 37, gcs: 12, fc: 128, spo2: 85, fio2: 0.4 }, veredicto: { veredicto: "fracaso", resumen: "pH en descenso, FR >35 y deterioro del nivel de consciencia: 3 criterios menores", menores: ["FR >35 o mayor que la inicial", "pH <7,30 o menor que el inicial", "Empeoramiento de la encefalopatía"] }, hacor: 19 },
      { t: 70, tipo: "nota", datos: { texto: "Se activa IOT: secuencia rápida sin incidencias; se conecta a VMI y sube a UCI" } },
    ],
    cierre: { t: 85, destino: "UCI con ventilación mecánica invasiva", comentario: "Fracaso precoz de la VNI pese a optimización. La demora en intubar cuando hay criterios empeora el pronóstico: aquí no la hubo." },
  },
];
if (typeof module !== "undefined" && module.exports) module.exports = CASOS_EJEMPLO;
