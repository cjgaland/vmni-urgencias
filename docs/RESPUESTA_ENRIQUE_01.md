# Respuesta y dudas — 1.ª entrega de la revisión

Enrique: gracias por la primera entrega. Hemos cruzado tu desarrollo completo del flujo clínico con la base científica del proyecto, punto a punto. El resultado, en tres bloques: lo que ya queda incorporado o encaja con lo documentado, los puntos donde discrepan los números, y las dudas concretas que necesitamos que nos resuelvas para seguir. Tus peticiones sobre la app (alarmas, pantalla de problemas, varios pacientes, vistas del simulador) van al final: están ya en manos del equipo de desarrollo.

---

## 1. Lo que encaja (y lo que aporta de nuevo)

- Tu **algoritmo inicial** (sobredosis → hipoxémico por PaFi → hipercápnico por HCO3/láctico/pH esperado) coincide con el árbol de la base casi punto por punto: mismos cortes de PaFi (300/200/100, UCI si <150, VMI si <100), misma rama de sobredosis, mismo inicio rápido EAP/EPOC.
- Las **REC 1–5** (parámetros iniciales concretos por escenario, con rampa, FiO2 objetivo y la subida de soporte de 2 en 2 hasta el Vt calculado) son la gran aportación de esta entrega: concretan decisiones que teníamos abiertas y pasan a la base como propuesta tuya, pendientes solo de las dudas de abajo.
- También incorporamos como novedad: los **criterios cuantitativos de mejoría gasométrica** (MG1–MG3), la **valoración estructurada a las 6 h**, la **pauta de retirada** con descensos, la **memoria de parámetros** (IPAP1/EPAP1) y la **CPAP de Boussignac** como dispositivo nuevo de la app.

## 2. Donde los números no coinciden

Proponemos mantener los valores ya referenciados en la base salvo que veas razón en contra — dinos en cada fila si aceptas o defiendes el tuyo:

| Magnitud | Tu escrito | Base (referencia) |
|---|---|---|
| pH de fallo hipercápnico | <7,33 | <7,35 (ERS/ATS 2017; BTS 2016; consenso 2021) |
| pCO2 de fallo hipercápnico | >50 | >45 (ERS/ATS; BTS usa ~49 como criterio de inicio tras 60 min) |
| SpO2 objetivo hipercápnico | 89–91% | 88–92% (BTS rec. 4, grado A) |
| SpO2 objetivo no hipercápnico | 94–96% | 92–96% (GINA 93–95% en asma) |
| Vt objetivo | peso ideal ×6 (×5 en neuromuscular) | 6–8 ml/kg de peso ideal (BTS) |
| Peso ideal | Lorentz | ARDSNet (es la fórmula con la que se definió el Vt protector) |
| pH predicho | 7,40 + (40−PaCO2)/200 | 7,40 − 0,008×(PaCO2−40) agudo / −0,003 crónico + Winter (Berend, NEJM 2014) |
| IPAP en acidosis grave | 15 si pH <7,20 | BTS: 20 si pH <7,25 |
| FiO2 por gafas nasales | 0,21 + 0,3×L (¿errata por 0,03?) | 0,21 + 0,04×L — ¿consolidamos 0,03 o 0,04? |
| pH de inicio de retirada | >7,34 (escrito «1,34») | ≥7,35 con pCO2 <50 |

Sobre el **pH predicho**: tu fórmula única (0,005/mmHg) cae entre la aguda y la crónica, y justo la distinción agudo/crónico agudizado es la que tu propio flujo necesita para separar la acidosis respiratoria pura (D) de la crónica agudizada (E). Proponemos mantener la doble pendiente + Winter, que además ya está programada.

## 3. Dudas concretas que necesitamos de ti

1. **Fórmulas del Vivo.** Escribes «tengo fórmulas para Vivo». Nosotros habíamos concluido que el fabricante no publica ninguna (su manual solo limita el O2 a 15 L/min). **Mándanos esas fórmulas con su fuente** — si existen, cambian una decisión ya tomada.
2. **Bibliografía de MG1–MG3.** ¿De dónde salen ΔPaFi >21 (o ΔpO2 >9), ΔpH >0,014 y ΔpCO2 >9? Ninguna recomendación entra en el motor sin referencia (guía/estudio y año). Ojo además: tal como está escrito, MG3 (pCO2 a la hora − pCO2 inicial >9) sería un *empeoramiento*; entendemos que quieres decir **descenso** >9.
3. **Bibliografía del Boussignac.** Tú mismo pides «confirmar con buena bibliografía» la tabla flujo→CPAP (15→4 … 27→10). Si tienes la fuente (¿datos de Vygon?), mándala. En las fórmulas de mezcla hay paréntesis bailados; la general sería FiO2 = (0,21×L_aire + L_O2) / (L_aire + L_O2) — confirma que es eso.
4. **FR de respaldo.** «FR 15 (10 r/min por debajo de la del paciente)»: las dos reglas no siempre coinciden (paciente a 32 rpm → ¿15 o 22?). ¿Cuál prevalece, y con qué techo/suelo?
5. **Categorías de HCO3.** Propones «<15, 15-22, 20-30, >30» (se solapan 15–22 y 20–30). En la base quedó fijado el **valor absoluto** porque lo exigen el pH predicho y Winter; la app puede mostrar la categoría además. ¿Te vale así?
6. **Asma (REC 2).** La ERS/ATS 2017 no hace recomendación en asma (evidencia insuficiente). Tu REC 2 es más decidida. Proponemos dejarla como **criterio de autores**, con monitorización estricta y aviso explícito en la app. ¿Lo confirmas?
7. **Retirada en EPOC.** Tu pauta de descenso progresivo es la que incorporamos como procedimiento general; ten en cuenta que en EPOC resuelto el ensayo de Sellarés (ERJ 2017) avala la retirada directa sin descenso. ¿La dejamos como opción preferente en EPOC y el descenso para el resto / mala tolerancia?

## 4. Tu duda sobre Ti y la I:E

Tienes razón en la intuición: en S/T el patrón lo marca el paciente. El **Ti y la I:E programados solo gobiernan los ciclos mandatorios** que entrega la FR de respaldo cuando el paciente no dispara; además, el Ti programado actúa como **Ti máximo de seguridad** del ciclado (si una fuga impide ciclar por flujo, la máquina corta por tiempo). En los ciclos espontáneos manda el paciente. Lo vamos a aclarar en la propia interfaz de la app.

## 5. Tus peticiones sobre la app

Trasladadas al equipo de desarrollo (no necesitan validación científica, sí diseño):

- Alarmas al iniciar seguimiento: a 1 h (valoración 60–120 min) y a las 6 h.
- Pantalla permanente de **corrección de problemas**, activa salvo durante las ventanas de 1 h / 6 h.
- Seguimiento simultáneo de al menos 3 pacientes desde móvil, tablet u ordenador.
- Simulador: un pulsador por gráfica (por defecto las tres activas, combinables).
- Memoria de parámetros IPAP1/EPAP1/rampa1 recuperada en cada ventana.

## 6. Siguiente paso

Con tus respuestas a los puntos 2 y 3 (números y dudas) cerramos esta entrega y lo pasamos al motor. El **formulario de las 19 decisiones (D-1 a D-19)** del Word de revisión sigue abierto — varias quedarán ya respondidas por esta entrega, pero conviene repasarlo porque hay decisiones (jerarquía de fuentes, HACOR, alto flujo/AirVo, modos avanzados y aviso ASV) que tu escrito no toca.

Un abrazo,
Carlos
