/* ====== VMNI Urgencias · Ayuda: manual, control de versiones y FAQ ======
   Mismo patrón que las demás apps de la casa (Manual / Control de Versiones / FAQ). */

const CAMBIOS_AYUDA = [
  {
    version: "v2.4",
    titulo: "Diagnóstico ácido-base en vivo y espirograma a medida",
    texto: "La **Evaluación** interpreta ahora la gasometría mientras la tecleas: bajo el paso 3 aparece el **diagnóstico ácido-base** al instante (acidosis/alcalosis, respiratoria/metabólica, aguda, crónica o crónica agudizada, compensaciones por pH esperado y Winter), también con gasometría venosa (pH corregido). La **Docencia** estrena el tema **🧪 Gasometría: análisis y diagnóstico** (lectura sistemática en 4 pasos, con sus trampas) y 4 preguntas nuevas en el cuestionario (44 en total). Y el **espirograma interactivo** se hace personal: elige **sexo, edad y talla** y verás los **valores teóricos** de todos los volúmenes y capacidades (peso ideal ARDSNet, capacidad vital de Knudson, volumen residual ECSC/ERS) con el gráfico **reescalado a esa persona**; además se arregla el corte visual que hacían las maniobras de inspiración y espiración máximas, que ahora fluyen sin reiniciar el trazado.",
  },
  {
    version: "v2.3",
    titulo: "Manual ilustrado, curva flujo-volumen, modo alumno con decisiones y más",
    texto: "La **Ayuda** estrena el **Manual del Usuario completo en PDF** (descargable e imprimible, con capturas de pantalla, trucos y FAQ) y el **código QR** para compartir la app apuntando con la cámara. La **Docencia** crece hasta **9 temas** (nuevo tema de **alto flujo nasal — TAFCN**) con la **curva flujo-volumen animada** (asas normal, obstructiva y restrictiva); el cuestionario pasa a **40 preguntas** con **progreso guardado** (aciertos, racha y **repaso de falladas**). Los **Casos** permiten **archivar varios casos** en el dispositivo y añaden **6 ejemplos ficticios** completos; el 🎓 modo alumno registra **tus decisiones** en cada etapa y las compara con lo que se hizo. El **Seguimiento** calcula el **índice ROX** cuando el soporte es alto flujo. El **simulador** incorpora **AVAPS** (volumen asegurado) con volumen diana. Y además: **enlaces directos** a cada sección (#simulador, #docencia…), **tamaño de letra ajustable** (A− / A+ en Ayuda), y el buzón de **💬 Sugerencias** en el pie.",
  },
  {
    version: "v2.2",
    titulo: "Base científica pública, cifosis y cirugía torácica",
    texto: "Transparencia: desde **Docencia → Bibliografía** puedes **ver y descargar en PDF la base científica completa** de la app (edición de divulgación, con todas las referencias). Los modificadores anatómicos incorporan la **cifosis severa** (CPT reducida: IPAP altas, Ti largo, posible vía aérea difícil) y la **cirugía torácica previa** (capacidad reducida: Vt bajo, vigilar asimetría y neumotórax). Y el documento interno de base científica pasa a v0.2 con la **sección de fármacos validada** integrada.",
  },
  {
    version: "v2.1",
    titulo: "Tratamiento farmacológico, evolución simulada y modo alumno",
    texto: "Tras la validación del documento de fármacos, el resultado de la evaluación incluye la tarjeta **💊 Tratamiento médico recomendado** por escenario (GesEPOC, GOLD, ESC, GINA/GEMA), siempre con el aviso de **individualizar** (alergias, antecedentes, concomitancias, protocolos del centro). En los **casos**, los fármacos se registran como eventos con dosis prefijadas editables y el informe añade su **checklist** (broncodilatador en 30 min, corticoide en 1 h, diurético en el EAP…). Los casos **docentes** estrenan **⚗️ Simular evolución**: tú decides qué administras y la app genera la siguiente reevaluación según el soporte y los fármacos clave (nunca disponible en casos reales: es docencia, no predicción). Los ejemplos ficticios añaden el **🎓 modo alumno** por etapas: piensa qué harías y revela lo que pasó. Y la evaluación reconoce **obesidad** y **hernia diafragmática** con sus avisos específicos.",
  },
  {
    version: "v2.0",
    titulo: "Modo CASOS: evolución, informe y ficheros",
    texto: "Nueva sección **🗂 Casos**: desde cualquier evaluación puedes **iniciar un caso anónimo** (solo edad, sexo y talla; tiempos relativos, nunca fechas) e ir registrando en su línea temporal **reevaluaciones** (valoradas por el motor, con HACOR y criterios de fracaso), **cambios de parámetros**, **cuidados** y **notas**. Al final, un **informe imprimible** compara la situación basal con la final, recoge la cronología completa y pasa un **checklist automático** de lo hecho y lo no registrado (gasometría en los primeros 90 min, protección nasal, escalada ante fracaso…). Los casos se **guardan y cargan como ficheros .json** que viven solo en tu dispositivo, y se incluyen **tres casos ficticios de ejemplo** —siempre marcados como tales— para aprender. La Evaluación pide ahora **talla y sexo** (opcionales) para darte el **Vt objetivo en mililitros** sobre el **peso ideal** — nunca el real: el pulmón no engorda. Y la SpO₂ simulada del simulador queda cubierta por tests automáticos.",
  },
  {
    version: "v1.3",
    titulo: "Oxigenación simulada, más mandos del respirador y confort",
    texto: "El simulador cierra el lazo de la oxigenación: nuevo deslizador de **FiO₂** y **SpO₂ simulada** en el panel de numéricos, que responde a la FiO₂, a la **EPAP** (reclutamiento: pruébalo con el perfil EAP) y a las **fugas** (la fuga diluye el oxígeno), con alarma por debajo del 88%. Llegan además los mandos de **trigger** (sensibilidad de disparo) y **Ti máximo**, con guías propias: el **autociclado** se corrige bajando la sensibilidad y el **doble disparo** alargando el Ti, como en la realidad. En **Seguimiento** se estrena el **checklist de confort y cuidados** (cabecera 30–45°, cuello sin flexión, protección nasal, pausas…). Y se arregla el **beep en el móvil**: el sonido se desbloquea con el primer toque en la pantalla.",
  },
  {
    version: "v1.2",
    titulo: "Fisiología respiratoria, espirograma animado y alarmas",
    texto: "La **Docencia** crece con cuatro temas nuevos de fisiología (**volúmenes y capacidades** con un **espirograma animado interactivo**, flujos y curva flujo-volumen, mecánica con la constante de tiempo, e intercambio gaseoso) y **navegación entre temas** con flechas ← → sin volver al índice. El **simulador** estrena **alarmas**: cuando la FR, el volumen corriente o la fuga se salen de rango, el parámetro parpadea en **rojo** y suena un **beep** (silenciable con el botón 🔔 del monitor). Llegan además las **🧮 Herramientas rápidas** (PaFi/SaFi, peso ideal y Vt, pH esperado con interpretación, HACOR y FiO₂ estimada, desde la portada) y el **🌙 modo oscuro «de guardia»** (botón de la cabecera; la app recuerda tu elección). La bibliografía incorpora las guías de tratamiento farmacológico (GesEPOC, GINA, GEMA).",
  },
  {
    version: "v1.1",
    titulo: "Ayuda, control de versiones y aviso de actualización",
    texto: "La app estrena este apartado de **Ayuda** con el **Manual del Usuario**, el **Control de Versiones** y las **Preguntas Frecuentes**. Además, cuando publiquemos una versión nueva, la app instalada te avisará con un mensaje para que pulses **Actualizar ahora** y la recibas al instante, sin reinstalar nada.",
  },
  {
    version: "v1.0",
    titulo: "Lanzamiento inicial (beta)",
    texto: "Primera versión completa: **Evaluación** guiada del fallo respiratorio con clasificación automática y recomendación de parámetros (reglas provisionales pendientes de validación científica), **inicio rápido** para EAP y EPOC hipercápnico, **Simulador** fisiológico de gráficas con perfiles de paciente, vistas tipo Vivo/V60/VITAE, cinco asincronías con guías interactivas y modo examen, **Seguimiento** de la respuesta a la hora con criterios de fracaso y HACOR, módulo de **Docencia** (temas, glosario, cuestionario y bibliografía comentada) e instalación como **app de móvil y ordenador** con funcionamiento sin conexión.",
  },
];

const MANUAL_AYUDA = [
  {
    icono: "🩺", titulo: "Evaluación del paciente",
    secciones: [
      {
        titulo: "La evaluación completa, en 4 pasos",
        texto: "Pulsa **Evaluación completa** en la pantalla de inicio y rellena los pasos: **Antecedentes** (toca las etiquetas que apliquen), **Clínica** (constantes, GCS y sospecha clínica principal), **Gasometría** (elige arterial o venosa y apunta la FiO₂ que lleva el paciente) y pulsa **Calcular**. La app clasifica el fallo respiratorio, te propone modo y parámetros iniciales y te avisa de las banderas rojas.",
        cajas: [{ titulo: "💡 Aspectos clave", items: [
          "**Inicio rápido:** en EAP o EPOC hipercápnico evidentes, los botones ⚡ de la portada saltan directos a la gasometría.",
          "**Gasometría venosa:** la app corrige el pH (+0,03) y te recuerda que la pCO₂ venosa solo sirve para descartar (<45).",
          "**FiO₂ estimada:** cambia el dispositivo (gafas, Ventimask, reservorio, Vivo…) y verás la FiO₂ calculada al momento.",
          "**Criterios de IOT:** si marcas alguno, la app no te propone VNI: te manda a intubación/UCI (o a la rama paliativa si hay LET).",
        ] }],
      },
      {
        titulo: "Leer el resultado",
        texto: "La tarjeta superior es la **clasificación** (con PaFi, SaFi, pH esperado, láctico y HACOR); la inferior, la **recomendación**: modo, parámetros en fichas grandes, pauta de titulación y alertas en rojo. Desde ahí puedes saltar al **simulador** o iniciar el **seguimiento**.",
      },
    ],
  },
  {
    icono: "📈", titulo: "Simulador de gráficas",
    secciones: [
      {
        titulo: "Un respirador de juguete… con física de verdad",
        texto: "Elige la **vista** (genérico, Vivo 50/60, V60 o VITAE 40) y el **perfil de paciente** (pulmón normal, EPOC o EAP/restrictivo). Las curvas de presión, flujo y volumen salen de un modelo con resistencia y compliance reales: lo que muevas en los deslizadores tiene consecuencias coherentes.",
        cajas: [{ titulo: "💡 Sácale partido", items: [
          "**Asincronías:** actívalas y fíjate en las anotaciones rojas sobre las curvas y en las fichas 👁 qué ves · ⚙️ por qué · 🛠 qué tocar.",
          "**Guías interactivas:** en las asincronías corregibles se ilumina en ámbar el deslizador implicado con el valor sugerido; al alcanzarlo se pone verde y la curva se normaliza.",
          "**🎓 Modo examen:** la app elige una asincronía al azar sin decirte cuál; diagnostícala mirando las curvas y pulsa Revelar.",
          "**🔔 Alarmas:** si la FR, el Vte, la SpO₂ o la fuga se salen de rango, el parámetro parpadea en rojo y suena un beep; silencia o reactiva el sonido con el botón 🔔 del monitor (en el móvil, el sonido se activa tras tu primer toque en la pantalla).",
          "**🩸 Oxigenación:** mueve la FiO₂ y la EPAP con el perfil EAP y observa la SpO₂ simulada: la presión recluta (sube la saturación sin subir la FiO₂) y la fuga la diluye.",
        ] }],
      },
    ],
  },
  {
    icono: "⏱", titulo: "Seguimiento de la respuesta",
    secciones: [
      {
        titulo: "La hora de la verdad",
        texto: "Tras iniciar la VNI, vuelve a **Seguimiento** con la gasometría de control: si vienes de una evaluación, los valores basales ya están puestos. Introduce los datos a la hora y pulsa **Valorar respuesta**: verás la evolución de pH, FR y pCO₂, el HACOR y el veredicto (favorable, vigilar o criterios de fracaso con la pauta de escalada). Debajo tienes el **checklist de confort y cuidados** para ir marcando lo hecho: el confort es parte del tratamiento.",
      },
    ],
  },
  {
    icono: "🎓", titulo: "Docencia",
    secciones: [
      {
        titulo: "Cuatro pestañas para aprender y repasar",
        texto: "**Temas** (fundamentos, interfaces, modos y respiradores del área, la evidencia en 1 minuto), **Glosario** con buscador, **Ponte a prueba** (10 preguntas aleatorias autocorregidas con explicación y referencia) y **Bibliografía comentada** con el porqué de cada fuente.",
      },
    ],
  },
  {
    icono: "🗂", titulo: "Casos: registrar, informar y compartir",
    secciones: [
      {
        titulo: "De la evaluación al informe",
        texto: "Haz la evaluación y pulsa **🗂 Iniciar caso** en el resultado: la situación basal queda guardada y se abre la **línea temporal**, donde añades reevaluaciones (el motor las valora al momento), cambios de parámetros, cuidados y notas, siempre con **tiempos relativos** (t+60′). Al cerrar el caso con su destino, el **informe** compara basal→final, lista la cronología y pasa un **checklist de lo hecho y lo no registrado**; imprímelo o guárdalo en PDF con el botón 🖨.",
        cajas: [{ titulo: "💊⚗️🎓 Fármacos, evolución y modo alumno", items: [
          "**Fármacos como eventos:** elige el tratamiento del escenario (dosis prefijada editable) y el informe comprobará los tiempos clave (broncodilatador ≤30 min, corticoide ≤1 h…).",
          "**⚗️ Simular evolución** (solo casos docentes): la app genera la siguiente gasometría según el soporte y los fármacos clave que hayas registrado. Es docencia: jamás predice pacientes reales.",
          "**🎓 Modo alumno** en los ejemplos: el caso se revela por etapas; decide tú antes de ver qué pasó.",
        ] }, { titulo: "🔒 Anonimato por diseño", items: [
          "**Sin identificadores:** solo edad en años, sexo y talla; ni nombres, ni fechas, ni número de historia — tampoco los escribas en el título o las notas.",
          "**Fichero .json local:** el caso se guarda y carga como fichero en TU dispositivo; la app no lo envía a ningún sitio.",
          "**Ejemplos ficticios:** tres casos inventados (siempre marcados «CASO FICTICIO · DOCENTE») para practicar la lectura de evoluciones.",
        ] }],
      },
    ],
  },
  {
    icono: "📲", titulo: "Instalación y actualizaciones",
    secciones: [
      {
        titulo: "Llévala en el móvil y en el ordenador",
        texto: "La app se instala desde el navegador, sin tiendas de aplicaciones, y **funciona sin conexión** una vez instalada.",
        cajas: [
          { titulo: "📱 En el móvil", items: [
            "**Android (Chrome):** abre la app, toca el menú ⋮ y elige **Instalar aplicación** (o «Añadir a pantalla de inicio»).",
            "**iPhone (Safari):** botón Compartir → **Añadir a pantalla de inicio**.",
          ] },
          { titulo: "💻 En el ordenador (Chrome/Edge)", items: [
            "Abre la app y pulsa el **icono de instalar** (un monitor con una flecha) a la derecha de la barra de direcciones, o menú ⋮ → **Transmitir, guardar y compartir → Instalar**. Quedará como una app más, con su icono en el dock/barra de tareas.",
          ] },
          { titulo: "🔄 Actualizaciones", items: [
            "Cuando publiquemos una versión nueva, la app te mostrará un aviso: pulsa **Actualizar ahora** y se recargará ya actualizada. Lo que trae cada versión está en la pestaña **Control de Versiones**.",
          ] },
        ],
      },
    ],
  },
];

const FAQ_AYUDA = [
  { p: "¿La app decide por mí?", r: "No. Es una **utilidad de apoyo a la decisión** con fines también docentes: te acerca los umbrales y la evidencia, pero la decisión clínica es siempre del profesional, con el paciente delante y los protocolos del centro en la mano." },
  { p: "¿De dónde salen las recomendaciones?", r: "De un documento de base científica construido sobre las guías ATS 2026, ERS/ATS 2017, BTS 2016, el consenso español SEPAR/SEMICYUC/SEMES 2021, GOLD, ESC 2021, GesEPOC, GINA/GEMA, las revisiones Cochrane y los manuales de referencia. Puedes **ver y descargar la base científica completa en PDF** desde **Docencia → Bibliografía** — transparencia total del proyecto." },
  { p: "¿Por qué pone «reglas provisionales»?", r: "Porque la revisión científica final del documento (16 decisiones concretas, como techos de EPAP o unidades del láctico) está **pendiente de validación** por el coautor. Cuando se cierre, publicaremos una versión con las reglas definitivas y retiraremos el aviso." },
  { p: "¿Guarda datos de los pacientes?", r: "**No.** Todos los cálculos ocurren en tu dispositivo; la app no recoge, almacena ni envía ningún dato. Al cerrar la evaluación, los valores desaparecen." },
  { p: "¿Funciona sin internet?", r: "Sí: una vez instalada (o tras la primera visita), queda guardada en tu dispositivo y funciona **sin conexión**. Internet solo hace falta para recibir actualizaciones." },
  { p: "¿Cómo sé que tengo la última versión?", r: "La versión aparece en el pie de la app y aquí, en Control de Versiones. Si hay una nueva, te saldrá el aviso 🔄 para actualizar con un toque; también se actualiza sola al reabrirla con conexión." },
  { p: "¿Puedo compartirla?", r: "Claro: pásale el enlace a cualquier compañero. No necesita cuentas ni instalación obligatoria — el navegador basta." },
];

if (typeof module !== "undefined" && module.exports) module.exports = { CAMBIOS_AYUDA, MANUAL_AYUDA, FAQ_AYUDA };
