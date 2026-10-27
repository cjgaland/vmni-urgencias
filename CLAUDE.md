# VMNI Urgencias — App de apoyo al diagnóstico y manejo con Ventilación Mecánica No Invasiva

## Qué es
App web + móvil (PWA) de apoyo a la decisión clínica: diagnóstico del fallo respiratorio agudo,
indicación de VMNI, elección de modo, parámetros iniciales, titulación, seguimiento de respuesta,
detección de fracaso y resolución de problemas (fugas, asincronías). Carácter docente y práctico,
visualmente muy elegante, con simulador dinámico de las gráficas de los respiradores.

## Autoría
- **Autor y desarrollador:** Carlos J. Galán Doval — Urgencias, Hospital de Montilla (AGS Sur de Córdoba).
- **Coautor y revisor científico:** Enrique Fernández Romero — especialista en VMNI, Médico de Familia,
  Urgencias del Hospital de Montilla. Debe figurar en los créditos y valida toda la base científica.

## Decisiones de arquitectura (2026-10-27, confirmadas por Carlos)
- **PWA estática sin dependencias**: HTML/CSS/JS puro, instalable en móvil, funciona offline,
  despliegue en GitHub Pages. Sin frameworks, sin build, sin npm.
- **Ningún dato de paciente se persiste ni se envía a servidor alguno.** Cálculo puntual en cliente.
- **Documento primero**: la base científica se valida en `docs/` (y su Word para revisión) ANTES de
  programar el motor. Nada entra en el motor sin estar en el documento validado.
- **Motor de reglas declarativo**: los umbrales y recomendaciones vivirán en JSON separado de la
  interfaz, auditable y editable sin tocar código.
- **Respiradores a contemplar** (parque real del área): Breas Vivo 50 y Vivo 60, Philips V60,
  Hersill VITAE 40 (transporte, sala de críticos), más un simulador genérico CPAP/BiPAP.
- Alcance v1: motor diagnóstico-terapéutico (con inicio rápido EAP / EPOC hipercápnico),
  simulador de gráficas con asincronías, seguimiento de respuesta/fracaso, módulo docente.
- **Estética APROBADA por Carlos (2026-10-27)** sobre el boceto v0.2: paleta azul petróleo
  (--primario #0F4C5C, --secundario #16697A, --acento #2A7F8E), tarjetas suaves, fichas de
  parámetros grandes, monitor oscuro en el simulador, barra inferior en móvil. No cambiarla
  sin pedirlo él.

## Estructura
- `Apoyo/` — prompt inicial (.docx) y reservorio científico (git-ignorado: copyright y vídeos pesados).
  Copia completa de la bibliografía también en `/Volumes/Rocinante/Bibliografia VMNI`.
- `docs/` — base de conocimiento clínico del proyecto (fuente de verdad del motor de reglas).
- `Backup/` — copias de seguridad locales con rotación (git-ignorado).

## Reglas de trabajo
- Rigor científico máximo: toda recomendación del motor debe tener referencia (guía/estudio y año).
  Las dudas o decisiones clínicas abiertas se listan explícitamente para revisión de Enrique.
- Español en toda la interfaz y documentación. Terminología: VMNI/VNI, CPAP, BiPAP (EPAP/IPAP).
- Incluir siempre el descargo: utilidad de apoyo a la decisión, no sustituye el criterio del profesional.
- Pie de la app: "Diseñado y Desarrollado por Carlos J. Galán Doval" + coautoría de Enrique.
- Antes de cambios grandes o despliegues: copia de seguridad (`Backup/`, rotación de 5).

## Copias de seguridad locales

Sistema de respaldo local con rotación (carpeta `Backup/`, ignorada en git):

- Cada copia es una carpeta `Backup/Copia_Seguridad_VMNI_DD_MM_YYYY-HH_MM` con el proyecto
  completo (rsync -a), excluyendo `Backup`, `.git`, datos personales/secretos (`*.csv`, `.env*`)
  y **`Apoyo/`** (bibliografía y vídeos pesados: material estático con copia propia en
  `/Volumes/Rocinante/Bibliografia VMNI`, no hace falta respaldarlo en cada rotación).
- Se conservan solo las **5 copias más recientes**; al crear una nueva se borra la más antigua.
- Disparadores: "Haz una copia" / "Copia de seguridad", o antes de desplegar.
- Script: skill personal `app-copia_seguridad`, ejecutar con
  `--root "/Users/Trabajo/Desktop/Utilidades Clínicas/Urgencias/VMNI" --name "VMNI" --exclude "Apoyo"`.
