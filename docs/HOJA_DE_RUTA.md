# Hoja de ruta — VMNI Urgencias v1.2 → v2.x

**Análisis de las propuestas de Carlos (27-10-2026) + propuestas añadidas.**
Documento de planificación: nada de lo aquí descrito está construido. Orden propuesto al final.

---

## 1. Docencia ampliada con navegación entre temas

**Lo pedido:** temas mucho más amplios, flechas ← → para pasar al tema anterior/siguiente (con su nombre) sin volver al índice, y contenido de volúmenes, capacidades y flujos respiratorios.

**Análisis y diseño propuesto:**
- **Navegación:** barra fija al pie de cada tema con «← Interfaces y cuidados» / «Modos y respiradores →» y un indicador «3 de 8». Coste trivial, cero riesgo.
- **Nuevos temas** (orden pedagógico): ① Fisiología: volúmenes y capacidades (VT, VRI, VRE, VR; CV, CRF, CPT) · ② Flujos y curvas (flujo-volumen, PEF, concepto de limitación al flujo) · ③ Mecánica: compliance, resistencia, constante de tiempo y autoPEEP · ④ Intercambio gaseoso y gasometría (V/Q, gradiente, Haldane) — y los 4 actuales detrás.
- **La joya visual:** un **espirograma animado** (canvas, como el simulador) donde se vea la respiración corriente y, al pulsar, una inspiración/espiración máximas, con los volúmenes y capacidades coloreándose y acotándose en vivo. Encaja con la identidad de la app (nada de figuras estáticas).
- **Riesgo:** bajo (contenido de libro de texto, referenciable a West/Artacho). No depende de la validación de Enrique, aunque debería leerlo.

## 2. Modo CASOS: paciente anónimo, evolución, informe y JSON

**Lo pedido:** introducir datos de un paciente, ir modificando parámetros (FiO₂, Vt…), anotar resultados, informe final «qué se hizo y qué no», y guardar/cargar el caso como JSON sin identificadores.

**Análisis y diseño propuesto:**
- **Estructura del caso:** `{ meta: {edad, sexo, talla, tipo: "real"|"ficticio", escenario}, basal: {...evaluación completa}, eventos: [{t, tipo: "parametros"|"gasometria"|"farmaco"|"cuidado"|"nota", datos}], cierre: {destino, estado} }`. Tiempos **relativos** (t+0 min, t+60 min), nunca fechas ni horas reales.
- **Flujo de uso:** «Nuevo caso» → evaluación (reutiliza el asistente actual) → pantalla de caso con línea temporal vertical; cada reevaluación usa el motor (clasificación, HACOR, criterios de fracaso) sobre los datos nuevos.
- **Informe final:** comparación basal→final (tabla + minigráficas de pH/pCO₂/FR/SpO₂), cronología de intervenciones y un **checklist automático** contra lo que el motor recomendó: gasometría a la hora ✓/✗, objetivo SpO₂ correcto ✓/✗, protección nasal anotada ✓/✗, escalada a tiempo ✓/✗… («qué se le ha hecho y qué no»). Salida imprimible (CSS de impresión → PDF desde el navegador).
- **Persistencia:** exportar/importar fichero `.json` (descarga local, sin servidor, coherente con nuestra privacidad) + borrador autoguardado en el dispositivo.
- **⚠️ Punto crítico (decisión con Enrique):** aun sin nombre, un caso real con valores y edad es **dato de salud potencialmente reidentificable**. Propuesta: aviso obligatorio al exportar, campos identificativos inexistentes por diseño (ni fecha de nacimiento ni número de historia: solo edad en años), y etiqueta visible `real/docente`. Valorar redondear la edad (±5 años) en la exportación de casos reales.
- **Riesgo:** medio. La mecánica es sencilla; el checklist «qué se hizo y qué no» debe salir del documento validado para ser justo.

## 3. Casos ficticios de ejemplo

**Análisis:** banco de 6-8 casos `.json` precargados con marca de agua permanente **«CASO FICTICIO · DOCENTE»** en pantalla e informe: EPOC C2 con éxito · EPOC con fracaso→IOT · EAP de libro · SHO · neuromuscular · asma grave · intoxicación por opioides · LET/paliativo.
- **Modo alumno (propuesta añadida):** cargar el caso «a ciegas» por etapas: la app muestra la situación, el alumno decide (parámetros/fármacos/escalada) y después se compara con lo que ocurrió en el caso y con lo que recomendaba el motor. Convierte el banco de casos en un **entrenador de decisiones**, no solo en un visor.
- **Riesgo:** bajo-medio; los guiones de los casos deberían firmarlos Carlos y Enrique (son mini-protocolos encubiertos).

## 4. Más parámetros del respirador en el simulador

**Análisis — en orden de valor docente/esfuerzo:**
1. **FiO₂ + SpO₂ simulada** (cierra el lazo de oxigenación: hoy el simulador solo ventila; con shunt/V-Q por perfil, la SpO₂ respondería a EPAP y FiO₂). El que más enseña.
2. **Trigger inspiratorio** (deslizador de sensibilidad: autociclado y esfuerzos inefectivos pasan a ser corregibles también por su vía real).
3. **Ti mínimo/máximo** (el doble disparo y el ciclado tardío ganan su mando auténtico).
4. **Modo AVAPS/volumen asegurado** (IPAP flotante persiguiendo Vt objetivo — vistoso y muy del SHO).
5. Frecuencia respaldo ya existe; **alarmas configurables** (presión, Vt, apnea) con sonido opcional, como cultura de seguridad.
- **Riesgo:** medio: cada mando nuevo exige recalibrar el modelo para que ninguna combinación produzca curvas absurdas. Propongo añadirlos de uno en uno con «perfiles de prueba» tipo test.

## 5. Tratamientos y fármacos en los casos (simulación de evolución)

**Lo pedido:** que el usuario decida qué administra y cuándo (broncodilatadores, corticoide, diurético/nitroglicerina, morfina, naloxona/flumazenilo, antibiótico…), con recomendaciones por escenario, y ver cómo evoluciona.

**Análisis:** es lo más ambicioso de la lista: convierte la app en un **simulador clínico completo**. Para ser honestos con la ciencia:
- **Motor de evolución semicuantitativo**, no farmacocinético: cada escenario lleva trayectorias de referencia (mejora/estable/empeora) y los tratamientos correctos/incorrectos las desplazan con retardos plausibles (p. ej., EAP + CPAP + NTG → SpO₂ y FR mejoran en 20-40 min; EPOC sin broncodilatador → pH se estanca aunque la VNI esté bien puesta).
- **Recomendaciones de fármacos:** otra sección del documento de base científica (dosis, indicación por rama del algoritmo) → **imprescindible redactarla y que Enrique la valide ANTES de programar nada**. Es medicación: el listón de rigor sube.
- **Marco claro en pantalla:** «simulación docente: la evolución mostrada no predice pacientes reales».
- **Riesgo:** alto (el mayor del documento), valor docente también el mayor. Hacerlo tras el modo casos (2) y los casos ficticios (3), que son su esqueleto.

## 6. Propuestas añadidas (lo que yo sumaría)

- **Checklist de confort y cuidados** integrada en el caso y en Seguimiento: cabecera 30-45°, **evitar la flexión del cuello**, protección nasal desde el minuto 1, temperatura/humidificación, pausas programadas, hidratación de mucosas, SNG si distensión, confort térmico. Con casillas que quedan registradas en el informe (es parte del «qué se hizo»).
- **Modificadores anatómicos del paciente** en evaluación y simulador: cifosis/cifoscoliosis marcada, hernia diafragmática/eventración, obesidad (IMC), toracoplastia — reducen la compliance del modelo, ajustan los parámetros propuestos (Ti, presiones) y añaden avisos (p. ej. vía aérea difícil en SHO).
- **Herramientas rápidas:** mini-calculadoras sueltas (peso ideal, PaFi/SaFi, pH esperado, HACOR, FiO₂ estimada) accesibles en dos toques desde la portada, para usarlas sin hacer una evaluación completa.
- **Modo oscuro** («modo guardia») para las noches, con la paleta ya preparada en variables CSS.
- **Índice ROX** en Seguimiento cuando el soporte sea alto flujo.
- **Progreso personal del quiz** (en el dispositivo): preguntas falladas que reaparecen, racha, porcentaje por tema.
- **Botón de sugerencias** (mailto o issues de GitHub) para que los compañeros reporten erratas y pidan mejoras.
- **Vídeos de Artacho:** ~~enlazarlos en Docencia~~ **DESCARTADO (27-10-2026, decisión de Carlos):** no se conoce el origen ni los permisos del material, así que no se publicarán.

## Orden propuesto

| Versión | Contenido | Esfuerzo | Riesgo clínico | Depende de |
|---|---|---|---|---|
| **v1.2** | Navegación entre temas + 4 temas de fisiología con espirograma animado + herramientas rápidas + modo oscuro | Medio | Bajo | — |
| **v1.3** | Simulador: FiO₂/SpO₂ simulada, trigger, Ti min/max (+ checklist de confort en Seguimiento) | Medio | Medio | — |
| **v2.0** | **Modo CASOS**: registro evolutivo, informe «hecho/no hecho», exportar/importar JSON, banco de casos ficticios con modo alumno | Alto | Medio | Validación de las 16 decisiones (el checklist nace del documento) |
| **v2.1** | Tratamientos/fármacos con motor de evolución + modificadores anatómicos | Alto | **Alto** | Sección de fármacos del documento, validada por Enrique |

**Dos llaves que abren todo lo demás:** la **revisión de Enrique** (las 16 decisiones y, para v2.1, la futura sección de fármacos) y tus **fórmulas de FiO₂ del Vivo** (D-12). Sin ellas, v1.2 y v1.3 pueden avanzar; v2.x no debería.
