# VMNI Urgencias

**Apoyo al diagnóstico y manejo con Ventilación Mecánica No Invasiva en Urgencias.**
App web y móvil (PWA) con carácter docente y práctico: evaluación guiada del fallo respiratorio agudo, recomendación de modo y parámetros con evidencia, simulador fisiológico de gráficas, seguimiento de la respuesta y módulo de docencia.

🌐 **Usar la app:** https://cjgaland.github.io/vmni-urgencias/

> ⚠️ **Versión 1.0 beta.** Las reglas clínicas son **provisionales**, pendientes de la validación científica final (decisiones D-1 a D-16 de `docs/BASE_CIENTIFICA.md`). Utilidad de apoyo a la decisión: **no sustituye el criterio del profesional sanitario** ni los protocolos del centro.

## Qué incluye

| Módulo | Qué hace |
|---|---|
| **Evaluación** | Asistente en 4 pasos (antecedentes, clínica, gasometría arterial/venosa, FiO₂ estimada) → clasificación del fallo respiratorio (árbol A–E) y recomendación con parámetros iniciales, titulación y alertas, todo referenciado. Inicio rápido para EAP y EPOC hipercápnico. |
| **Simulador** | Modelo fisiológico en tiempo real (resistencia/compliance; perfiles pulmón normal, EPOC y EAP). Vistas inspiradas en el parque del área (Vivo 50/60, V60, VITAE 40). 5 asincronías con modo docente: anotaciones sobre las curvas, fichas «qué ves / por qué / qué tocar», guías interactivas en los deslizadores y modo examen. |
| **Seguimiento** | Reevaluación a la hora: criterios menores de IOT (consenso 2021), score HACOR y veredicto. |
| **Problemas** | Fugas y asincronías: reconocimiento y corrección. |
| **Docencia** | Temas desarrollados, glosario de 75 términos con buscador, cuestionario autocorregido (banco de 26 preguntas) y bibliografía comentada. |

## Instalar en el móvil (PWA)

1. Abre https://cjgaland.github.io/vmni-urgencias/ en el navegador del móvil.
2. **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio».
   **Android (Chrome):** menú ⋮ → «Instalar aplicación» (o «Añadir a pantalla de inicio»).
3. La app funciona **sin conexión** una vez instalada y se actualiza sola cuando hay red.

No se recoge, almacena ni envía **ningún dato de paciente**: todos los cálculos ocurren en el dispositivo.

## Base científica

El motor de decisión nace de `docs/BASE_CIENTIFICA.md` (con versión Word para revisión), construido sobre: ATS 2026, ERS/ATS 2017, BTS/ICS 2016, consenso español SEPAR/SEMICYUC/SEMES 2021, GOLD, ESC 2021, revisiones Cochrane y manuales de referencia. Cada umbral del fichero de reglas (`datos/reglas.json`) lleva su etiqueta de decisión pendiente o validada.

## Desarrollo

Sin dependencias ni build: HTML/CSS/JS puro.

```bash
node herramientas/servidor.js        # servidor local en http://localhost:8123
node herramientas/test-motor.js      # 19 viñetas clínicas del motor
```

Estructura: `motor.js` (cálculos y clasificación, puro) · `datos/reglas.json` (umbrales declarativos) · `sim.js` (simulador fisiológico) · `datos/docencia.js` (contenido docente) · `docs/` (base científica y diagrama del algoritmo).

## Autoría

**Diseño y desarrollo:** Carlos J. Galán Doval — Urgencias, Hospital de Montilla (AGS Sur de Córdoba).
**Coautor y revisor científico:** Enrique Fernández Romero — especialista en VMNI, Médico de Familia, Urgencias del Hospital de Montilla.

© 2026 los autores. Uso clínico-docente; para otros usos, contactar con los autores.
