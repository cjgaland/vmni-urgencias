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
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "Asma grave: prueba corta de VNI vigilada",
    meta: { edad: 34, sexo: "m", talla: 164, escenario: "Asma aguda grave" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: ["asma"], otros: [], circunstancias: [] },
        clinica: { fr: 35, fc: 126, tas: 150, gcs: 15, spo2: 89 },
        gasometria: { tipo: "arterial", ph: 7.33, pco2: 48, po2: 61, hco3: 24, lactato: 20 },
        fio2: { dispositivo: "vk", valor: 35 }, sospecha: "asma",
      },
      resumen: { rama: "hipercapnico", subtipo: "C1", escenarioId: "asma", clasif: "Fallo hipercápnico — acidosis respiratoria aguda pura", gravedad: "acidosis leve", titulo: "Prueba corta de binivel SOLO con vigilancia estrecha", ph: 7.33, pco2: 48, fr: 35, gcs: 15, fc: 126, pafi: 174, hacor: 7 },
    },
    eventos: [
      { t: 3, tipo: "farmaco", datos: { id: "broncodilatador", nombre: "Salbutamol + ipratropio", dosis: "neb 5 mg + 0,5 mg, repetida ×3 la 1.ª hora", nota: "" } },
      { t: 8, tipo: "farmaco", datos: { id: "corticoide", nombre: "Hidrocortisona IV", dosis: "200 mg", nota: "corticoide en la primera hora" } },
      { t: 15, tipo: "nota", datos: { texto: "UCI avisada desde el inicio; se pacta prueba corta de VNI con reevaluación a los 30-45 min" } },
      { t: 20, tipo: "parametros", datos: { modo: "S/T", epap: 4, ipap: 10, fio2: "0,35", nota: "Prueba corta; vigilancia 1:1" } },
      { t: 40, tipo: "farmaco", datos: { id: "magnesio", nombre: "Sulfato de magnesio IV", dosis: "2 g en 20 min", nota: "respuesta inicial incompleta" } },
      { t: 55, tipo: "reevaluacion", datos: { ph: 7.37, pco2: 42, fr: 24, gcs: 15, fc: 104, spo2: 95, fio2: 0.35 }, veredicto: { veredicto: "favorable", resumen: "Broncodilatación efectiva: pCO₂ normalizándose y FR en descenso", menores: [] }, hacor: 2 },
    ],
    cierre: { t: 150, destino: "Planta con retirada diurna progresiva", comentario: "Retirada de la VNI a los 90 min; continúa broncodilatación pautada y corticoide. El asma que retiene CO₂ siempre es una crisis grave: la VNI fue puente, no sustituto, del tratamiento médico." },
  },
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "SHO agudizado: volumen asegurado y destino VMD",
    meta: { edad: 59, sexo: "v", talla: 170, escenario: "SHO / restrictivo" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: ["sho", "sahos", "obesidad"], otros: ["hta", "dm"], circunstancias: [] },
        clinica: { fr: 26, fc: 102, tas: 156, gcs: 13, spo2: 83 },
        gasometria: { tipo: "arterial", ph: 7.26, pco2: 78, po2: 50, hco3: 34, lactato: 13 },
        fio2: { dispositivo: "gafas", valor: 2 }, sospecha: "noclaro",
      },
      resumen: { rama: "hipercapnico", subtipo: "C2", escenarioId: "sho_restrictivo", clasif: "Fallo hipercápnico — acidosis crónica agudizada", gravedad: "acidosis moderada", titulo: "Iniciar VNI binivel — SHO / restrictivo", ph: 7.26, pco2: 78, fr: 26, gcs: 13, fc: 102, pafi: 172, hacor: 9 },
    },
    eventos: [
      { t: 5, tipo: "parametros", datos: { modo: "S/T", epap: 8, ipap: 16, fio2: "0,3", nota: "EPAP alta de inicio por obesidad (IMC 44)" } },
      { t: 6, tipo: "cuidado", datos: { texto: "Cabecera a 45° (clave en la obesidad) y protección nasal" } },
      { t: 30, tipo: "parametros", datos: { modo: "AVAPS", epap: 8, ipap: "14–24", fio2: "0,3", nota: "Volumen asegurado 480 ml: no se alcanzaba Vt con presión fija" } },
      { t: 70, tipo: "reevaluacion", datos: { ph: 7.31, pco2: 68, fr: 21, gcs: 15, fc: 92, spo2: 90, fio2: 0.3 }, veredicto: { veredicto: "favorable", resumen: "Despierto y colaborador; pH y pCO₂ mejorando con el volumen asegurado", menores: [] }, hacor: 3 },
      { t: 240, tipo: "reevaluacion", datos: { ph: 7.35, pco2: 60, fr: 18, gcs: 15, fc: 84, spo2: 91, fio2: 0.28 }, veredicto: { veredicto: "favorable", resumen: "Camino de su situación basal de hipercapnia crónica", menores: [] }, hacor: 1 },
      { t: 300, tipo: "nota", datos: { texto: "Interconsulta a neumología: VNI nocturna domiciliaria y estudio de sueño al alta" } },
    ],
    cierre: { t: 420, destino: "Planta con retirada diurna progresiva", comentario: "Retirada diurna manteniendo VNI nocturna. En el SHO el episodio agudo es la puerta de entrada a la ventilación domiciliaria: no darle el alta sin ese plan." },
  },
  {
    formato: "vmni-caso-v1", tipo: "docente", ejemplo: true,
    titulo: "Intoxicación por opioides: naloxona titulada",
    meta: { edad: 42, sexo: "v", talla: 176, escenario: "Sobredosis de depresores" },
    basal: {
      entradas: {
        antecedentes: { respiratorios: [], otros: [], circunstancias: [] },
        clinica: { fr: 7, fc: 88, tas: 118, gcs: 9, spo2: 81 },
        gasometria: { tipo: "arterial", ph: 7.24, pco2: 66, po2: 52, hco3: 27, lactato: 18 },
        fio2: { dispositivo: "aire", valor: 0 }, sospecha: "sobredosis",
      },
      resumen: { rama: "sobredosis", subtipo: "A", escenarioId: "sobredosis", clasif: "Sospecha de sobredosis de depresores", gravedad: "—", titulo: "Revertir y reevaluar", ph: 7.24, pco2: 66, fr: 7, gcs: 9, fc: 88, pafi: null, hacor: null },
    },
    eventos: [
      { t: 2, tipo: "nota", datos: { texto: "Ventilación asistida con bolsa-mascarilla mientras se prepara la naloxona: ventilar SIEMPRE antes que revertir" } },
      { t: 5, tipo: "farmaco", datos: { id: "naloxona", nombre: "Naloxona IV titulada", dosis: "0,08 mg, repetida cada 2-3 min (total 0,24 mg)", nota: "objetivo FR ≥10, no despertar de golpe" } },
      { t: 12, tipo: "reevaluacion", datos: { ph: 7.33, pco2: 52, fr: 13, gcs: 13, fc: 92, spo2: 93, fio2: 0.28 }, veredicto: { veredicto: "favorable", resumen: "Ventila por sí mismo sin abstinencia brusca; vigilancia prolongada por vida media corta de la naloxona", menores: [] }, hacor: 3 },
      { t: 90, tipo: "reevaluacion", datos: { ph: 7.38, pco2: 44, fr: 14, gcs: 15, fc: 86, spo2: 96, fio2: 0.21 }, veredicto: { veredicto: "favorable", resumen: "Resuelto sin VNI ni IOT; el antídoto bien titulado evitó ambas", menores: [] }, hacor: 0 },
    ],
    cierre: { t: 360, destino: "Alta desde urgencias", comentario: "Observación prolongada (6 h) por posible renarcotización. La hipoventilación por tóxicos se trata revirtiendo la causa: la VNI no sustituye al antídoto." },
  },
];
if (typeof module !== "undefined" && module.exports) module.exports = CASOS_EJEMPLO;
