/* ====== VMNI Urgencias · modo CASOS ======
   Registro evolutivo ANÓNIMO de un caso: basal (desde la Evaluación), línea
   temporal de eventos, informe con checklist «hecho / no registrado» y
   exportación/importación como fichero .json local. Sin identificadores por
   diseño: solo edad en años, sexo y talla; tiempos RELATIVOS en minutos. */
const Casos = (() => {
  "use strict";
  const LS = "vmni-caso-activo";
  let caso = null;
  let vista = "lista"; // lista | nuevo | activo | informe

  try { const b = localStorage.getItem(LS); if (b) { caso = JSON.parse(b); vista = "activo"; } } catch (e) {}

  const $ = id => document.getElementById(id);
  const nv = id => { const v = parseFloat($(id)?.value); return isFinite(v) ? v : undefined; };
  const esc = s => String(s ?? "").replace(/</g, "&lt;");
  const f1 = n => (n === undefined || n === null) ? "—" : String(n).replace(".", ",");

  function guardar() {
    try { caso ? localStorage.setItem(LS, JSON.stringify(caso)) : localStorage.removeItem(LS); } catch (e) {}
  }
  function tSugerido() {
    const ult = caso.eventos.length ? Math.max(...caso.eventos.map(e => e.t)) : 0;
    return ult + 30;
  }
  const etiquetaTipo = () => caso.ejemplo
    ? `<span class="etiq-caso ficticio">CASO FICTICIO · DOCENTE</span>`
    : `<span class="etiq-caso ${caso.tipo}">${caso.tipo === "real" ? "CASO REAL (anonimizado)" : "CASO DOCENTE"}</span>`;

  /* ================= vistas ================= */
  function pintar() {
    const cont = $("casosCont");
    if (!cont) return;
    if (vista === "informe" && caso) return pintarInforme();
    if (caso) return pintarActivo();
    pintarLista();
  }

  function pintarLista() {
    vista = "lista";
    $("casosCont").innerHTML = `
      <div class="grid-modulos">
        <article class="card modulo" onclick="Casos.nuevo()">
          <div class="icono doc">➕</div><h3>Nuevo caso</h3>
          <p>Parte de una evaluación: registra la situación basal y ve añadiendo gasometrías, cambios de parámetros y cuidados.</p>
        </article>
        <article class="card modulo" onclick="document.getElementById('ficheroCaso').click()">
          <div class="icono doc">📂</div><h3>Cargar un caso (.json)</h3>
          <p>Importa un caso guardado para revisar su evolución y su informe.</p>
        </article>
      </div>
      <p class="sub" style="margin-top:22px">Casos ficticios de ejemplo <em>(inventados, para aprender)</em></p>
      <div class="grid-modulos">
        ${CASOS_EJEMPLO.map((c, i) => `
          <article class="card modulo" onclick="Casos.cargarEjemplo(${i})">
            <div class="icono doc">🎭</div><h3>${esc(c.titulo)}</h3>
            <p>${esc(c.meta.escenario)} · ${c.meta.edad} años · ${c.eventos.length} eventos</p>
            <span class="fix">CASO FICTICIO · DOCENTE</span>
          </article>`).join("")}
      </div>
      <input type="file" id="ficheroCaso" accept=".json,application/json" style="display:none" onchange="Casos.importar(this.files[0])">`;
  }

  function nuevo() {
    if (typeof ULTIMA_EVAL === "undefined" || !ULTIMA_EVAL) {
      vista = "nuevo";
      $("casosCont").innerHTML = `
        <div class="card"><h3>Primero, la evaluación basal</h3>
        <p class="explica">Un caso empieza por la situación inicial del paciente. Haz la evaluación y, en la pantalla de resultado, pulsa <strong>«🗂 Iniciar caso»</strong>.</p>
        <div class="botonera"><button class="btn-sec" onclick="Casos.pintar()">← Volver</button>
        <button class="btn-primario" onclick="irA('evaluacion')">Ir a la evaluación →</button></div></div>`;
      return;
    }
    vista = "nuevo";
    $("casosCont").innerHTML = `
      <div class="card">
        <h3>🗂 Nuevo caso desde la última evaluación</h3>
        <p class="explica">Clasificación basal: <strong>${esc(ULTIMA_EVAL.resumen.clasif)}</strong>. Sin nombres ni fechas: solo edad, sexo y talla.</p>
        <div class="fila-campos" style="margin-top:12px">
          <div class="campo ancho"><label>Título del caso</label><input id="ncTitulo" placeholder="p. ej. EPOC agudizado box 3"></div>
          <div class="campo"><label>Edad (años)</label><input type="number" id="ncEdad"></div>
          <div class="campo"><label>Sexo</label><select id="ncSexo"><option value="v">Varón</option><option value="m">Mujer</option></select></div>
          <div class="campo"><label>Talla (cm)</label><input type="number" id="ncTalla"></div>
          <div class="campo ancho"><label>Tipo</label><select id="ncTipo"><option value="docente">Docente / simulado</option><option value="real">Real (anonimizado)</option></select></div>
        </div>
        <div class="botonera"><button class="btn-sec" onclick="Casos.pintar()">← Cancelar</button>
        <button class="btn-primario" onclick="Casos.crear()">Crear caso →</button></div>
      </div>`;
  }

  function crear() {
    const edad = nv("ncEdad");
    if (!edad) { alert("Indica al menos la edad (en años)."); return; }
    caso = {
      formato: "vmni-caso-v1",
      tipo: $("ncTipo").value,
      titulo: $("ncTitulo").value.trim() || "Caso sin título",
      meta: { edad, sexo: $("ncSexo").value, talla: nv("ncTalla"), escenario: ULTIMA_EVAL.resumen.clasif },
      basal: JSON.parse(JSON.stringify(ULTIMA_EVAL)),
      eventos: [],
      cierre: null,
    };
    guardar(); vista = "activo"; pintar();
  }

  function pintarActivo() {
    vista = "activo";
    const r = caso.basal.resumen;
    const linea = ev => {
      const iconos = { reevaluacion: "🧪", parametros: "🎛", cuidado: "🛏", nota: "📝" };
      let cuerpo = "";
      if (ev.tipo === "reevaluacion") {
        const v = ev.veredicto || {};
        cuerpo = `pH ${f1(ev.datos.ph)} · pCO₂ ${f1(ev.datos.pco2)} · FR ${f1(ev.datos.fr)} · SpO₂ ${f1(ev.datos.spo2)}%${ev.hacor !== undefined ? ` · HACOR ${ev.hacor}` : ""}
          <div class="ev-veredicto ${v.veredicto || ""}">${esc(v.resumen || v.texto || "")}</div>`;
      } else if (ev.tipo === "parametros") {
        cuerpo = `${esc(ev.datos.modo)} · EPAP ${f1(ev.datos.epap)} · IPAP ${f1(ev.datos.ipap)} · FiO₂ ${esc(ev.datos.fio2)}${ev.datos.nota ? ` — ${esc(ev.datos.nota)}` : ""}`;
      } else {
        cuerpo = esc(ev.datos.texto);
      }
      return `<div class="ev"><span class="ev-t">t+${ev.t}′</span><span class="ev-icono">${iconos[ev.tipo]}</span><div class="ev-cuerpo">${cuerpo}</div></div>`;
    };
    $("casosCont").innerHTML = `
      <div class="card caso-cab">
        <div class="caso-titulo"><h3>🗂 ${esc(caso.titulo)}</h3>${etiquetaTipo()}</div>
        <p class="explica">${esc(caso.meta.escenario)} · ${caso.meta.edad} años · ${caso.meta.sexo === "v" ? "varón" : "mujer"}${caso.meta.talla ? ` · ${caso.meta.talla} cm` : ""}</p>
        <div class="chips-datos">
          <span class="dato">pH <strong>${f1(r.ph)}</strong></span>
          <span class="dato">pCO₂ <strong>${f1(r.pco2)}</strong></span>
          <span class="dato">FR <strong>${f1(r.fr)}</strong></span>
          ${r.pafi ? `<span class="dato">PaFi <strong>${r.pafi}</strong></span>` : ""}
          ${r.hacor !== undefined && r.hacor !== null ? `<span class="dato">HACOR <strong>${r.hacor}</strong></span>` : ""}
          <span class="dato">Basal: <strong>t+0′</strong></span>
        </div>
      </div>

      <div class="card">
        <h3>Línea temporal</h3>
        <div class="timeline">
          <div class="ev basal"><span class="ev-t">t+0′</span><span class="ev-icono">🩺</span><div class="ev-cuerpo"><strong>${esc(r.clasif)}</strong> — ${esc(r.titulo)}</div></div>
          ${caso.eventos.slice().sort((a, b) => a.t - b.t).map(linea).join("")}
          ${caso.cierre ? `<div class="ev cierre"><span class="ev-t">t+${caso.cierre.t}′</span><span class="ev-icono">🏁</span><div class="ev-cuerpo"><strong>${esc(caso.cierre.destino)}</strong>${caso.cierre.comentario ? ` — ${esc(caso.cierre.comentario)}` : ""}</div></div>` : ""}
        </div>
      </div>

      ${caso.cierre ? "" : `
      <div class="card">
        <h3>Añadir evento</h3>
        <div class="chips" style="margin-bottom:12px">
          <button class="chip" onclick="Casos.formulario('reevaluacion')">🧪 Reevaluación</button>
          <button class="chip" onclick="Casos.formulario('parametros')">🎛 Cambio de parámetros</button>
          <button class="chip" onclick="Casos.formulario('cuidado')">🛏 Cuidado / confort</button>
          <button class="chip" onclick="Casos.formulario('nota')">📝 Nota</button>
          <button class="chip alerta" onclick="Casos.formulario('cierre')">🏁 Cerrar caso</button>
        </div>
        <div id="formEvento"></div>
      </div>`}

      <div class="botonera suelta">
        <button class="btn-sec" onclick="Casos.descartar()">🗑 Descartar caso</button>
        <span style="display:flex;gap:10px">
          <button class="btn-sec" onclick="Casos.exportar()">💾 Guardar .json</button>
          <button class="btn-primario" onclick="Casos.verInforme()">📄 Informe →</button>
        </span>
      </div>`;
  }

  /* ================= eventos ================= */
  function formulario(tipo) {
    const t = tSugerido();
    const campoT = `<div class="campo"><label>Min desde inicio</label><input type="number" id="evT" value="${t}"></div>`;
    const forms = {
      reevaluacion: `
        <div class="fila-campos">${campoT}
          <div class="campo"><label>pH</label><input type="number" step="0.01" id="evPh"></div>
          <div class="campo"><label>pCO₂</label><input type="number" id="evPco2"></div>
          <div class="campo"><label>FR</label><input type="number" id="evFr"></div>
          <div class="campo"><label>GCS</label><input type="number" id="evGcs"></div>
          <div class="campo"><label>FC</label><input type="number" id="evFc"></div>
          <div class="campo"><label>SpO₂ %</label><input type="number" id="evSpo2"></div>
          <div class="campo"><label>FiO₂</label><input type="number" step="0.05" id="evFio2"></div>
        </div>
        <div class="botonera"><span></span><button class="btn-primario" onclick="Casos.addReevaluacion()">Valorar y añadir →</button></div>`,
      parametros: `
        <div class="fila-campos">${campoT}
          <div class="campo"><label>Modo</label><select id="evModo"><option>S/T</option><option>CPAP</option><option>PCV</option><option>AVAPS</option><option>TAFCN</option></select></div>
          <div class="campo"><label>EPAP</label><input type="number" id="evEpap"></div>
          <div class="campo"><label>IPAP</label><input type="number" id="evIpap"></div>
          <div class="campo"><label>FiO₂ / O₂</label><input id="evFio2p" placeholder="0,35 o «3 L/min»"></div>
          <div class="campo ancho"><label>Nota</label><input id="evNotaP" placeholder="motivo del cambio"></div>
        </div>
        <div class="botonera"><span></span><button class="btn-primario" onclick="Casos.addParametros()">Añadir →</button></div>`,
      cuidado: `
        <div class="fila-campos">${campoT}</div>
        <div class="chips" style="margin-top:10px">
          ${["Cabecera a 30–45° y cuello sin flexión", "Protección del puente nasal (hidrocoloide)", "Pausa programada e hidratación", "Nebulización sin interrumpir la VNI", "SNG por distensión/vómitos", "Rotación de interfaz / revisión de apoyos"]
            .map(c => `<button class="chip" onclick="Casos.addCuidado('${c.replace(/'/g, "\\'")}')">${c}</button>`).join("")}
        </div>`,
      nota: `
        <div class="fila-campos">${campoT}
          <div class="campo ancho"><label>Texto</label><input id="evNota" placeholder="observación libre (sin datos identificativos)"></div>
        </div>
        <div class="botonera"><span></span><button class="btn-primario" onclick="Casos.addNota()">Añadir →</button></div>`,
      cierre: `
        <div class="fila-campos">${campoT}
          <div class="campo ancho"><label>Destino</label><select id="evDestino">
            <option>Planta con retirada diurna progresiva</option><option>Planta de cardiología</option>
            <option>Alta desde urgencias</option><option>UCI con VNI</option>
            <option>UCI con ventilación mecánica invasiva</option><option>Cuidados paliativos / confort</option><option>Exitus</option>
          </select></div>
          <div class="campo ancho"><label>Comentario</label><input id="evCierre" placeholder="resumen final"></div>
        </div>
        <div class="botonera"><span></span><button class="btn-primario" onclick="Casos.cerrarCaso()">Cerrar caso →</button></div>`,
    };
    $("formEvento").innerHTML = forms[tipo];
  }

  function addReevaluacion() {
    const d = { ph: nv("evPh"), pco2: nv("evPco2"), fr: nv("evFr"), gcs: nv("evGcs"), fc: nv("evFc"), spo2: nv("evSpo2"), fio2: nv("evFio2") };
    if (d.ph === undefined || d.fr === undefined) { alert("Faltan al menos pH y FR."); return; }
    let pafi;
    if (d.spo2 !== undefined && d.fio2) {
      const cc = Motor.calculos({ tipo: "arterial" }, { spo2: d.spo2 }, d.fio2);
      pafi = cc.pafiDeSafi;
    }
    const r = caso.basal.resumen;
    const v = Motor.evaluarRespuesta({ ph: r.ph, pco2: r.pco2, fr: r.fr, gcs: r.gcs }, { ...d, pafi });
    const h = Motor.hacor({ fc: d.fc, ph: d.ph, gcs: d.gcs ?? 15, pafi, fr: d.fr });
    caso.eventos.push({ t: nv("evT") ?? tSugerido(), tipo: "reevaluacion", datos: d, veredicto: { veredicto: v.veredicto, resumen: v.texto, menores: v.menores }, hacor: h ? h.total : undefined });
    guardar(); pintar();
  }
  function addParametros() {
    caso.eventos.push({ t: nv("evT") ?? tSugerido(), tipo: "parametros", datos: { modo: $("evModo").value, epap: nv("evEpap"), ipap: nv("evIpap"), fio2: $("evFio2p").value || "—", nota: $("evNotaP").value } });
    guardar(); pintar();
  }
  function addCuidado(texto) {
    caso.eventos.push({ t: nv("evT") ?? tSugerido(), tipo: "cuidado", datos: { texto } });
    guardar(); pintar();
  }
  function addNota() {
    const texto = $("evNota").value.trim();
    if (!texto) return;
    caso.eventos.push({ t: nv("evT") ?? tSugerido(), tipo: "nota", datos: { texto } });
    guardar(); pintar();
  }
  function cerrarCaso() {
    caso.cierre = { t: nv("evT") ?? tSugerido(), destino: $("evDestino").value, comentario: $("evCierre").value };
    guardar(); pintar();
  }
  function descartar() {
    if (!confirm("¿Descartar este caso? Se borrará de este dispositivo (si lo quieres conservar, guárdalo antes como .json).")) return;
    caso = null; guardar(); pintar();
  }

  /* ================= informe ================= */
  function checklist() {
    const evs = caso.eventos;
    const reevs = evs.filter(e => e.tipo === "reevaluacion").sort((a, b) => a.t - b.t);
    const params = evs.filter(e => e.tipo === "parametros").sort((a, b) => a.t - b.t);
    const cuidados = evs.filter(e => e.tipo === "cuidado").map(e => e.datos.texto.toLowerCase());
    const huboFracaso = reevs.some(e => e.veredicto?.veredicto === "fracaso");
    const tFracaso = huboFracaso ? reevs.find(e => e.veredicto?.veredicto === "fracaso").t : null;
    const escalada = huboFracaso && ((caso.cierre && /uci|invasiva|iot/i.test(caso.cierre.destino)) ||
      evs.some(e => e.t >= tFracaso && /iot|uci|intubaci|escala/i.test(JSON.stringify(e.datos).toLowerCase())));
    const na = { estado: "na", icono: "—" }, si = { estado: "si", icono: "✓" }, no = { estado: "no", icono: "✗" };
    return [
      { texto: "Gasometría de control en los primeros 90 minutos", ...(reevs.some(e => e.t <= 90) ? si : no) },
      { texto: "Reevaluación tras el último cambio de parámetros", ...(params.length === 0 ? na : (reevs.some(e => e.t > params[params.length - 1].t) ? si : no)) },
      { texto: "Protección del puente nasal registrada", ...(cuidados.some(c => c.includes("nasal")) ? si : no) },
      { texto: "Cabecera a 30–45° registrada", ...(cuidados.some(c => c.includes("cabecera")) ? si : no) },
      { texto: "Escalada registrada ante criterios de fracaso", ...(!huboFracaso ? na : (escalada ? si : no)) },
      { texto: "Caso cerrado con destino", ...(caso.cierre ? si : no) },
    ];
  }

  function pintarInforme() {
    vista = "informe";
    const r = caso.basal.resumen;
    const reevs = caso.eventos.filter(e => e.tipo === "reevaluacion").sort((a, b) => a.t - b.t);
    const fin = reevs[reevs.length - 1];
    const fila = (n, b, f) => `<tr><td>${n}</td><td>${f1(b)}</td><td>${fin ? f1(f) : "—"}</td></tr>`;
    const chk = checklist();
    $("casosCont").innerHTML = `
      <div id="informeCaso">
        <div class="card">
          <div class="caso-titulo"><h3>📄 Informe del caso: ${esc(caso.titulo)}</h3>${etiquetaTipo()}</div>
          <p class="explica">${esc(caso.meta.escenario)} · ${caso.meta.edad} años · ${caso.meta.sexo === "v" ? "varón" : "mujer"}${caso.meta.talla ? ` · ${caso.meta.talla} cm` : ""} · duración registrada: t+${caso.cierre ? caso.cierre.t : (caso.eventos.length ? Math.max(...caso.eventos.map(e => e.t)) : 0)}′</p>

          <h4 class="inf-sub">Evolución: basal → ${fin ? `última reevaluación (t+${fin.t}′)` : "sin reevaluaciones"}</h4>
          <table class="tabla-informe"><thead><tr><th></th><th>Basal</th><th>Final</th></tr></thead><tbody>
            ${fila("pH", r.ph, fin?.datos.ph)}
            ${fila("pCO₂ (mmHg)", r.pco2, fin?.datos.pco2)}
            ${fila("FR (rpm)", r.fr, fin?.datos.fr)}
            ${fila("SpO₂ (%)", caso.basal.entradas?.clinica?.spo2, fin?.datos.spo2)}
            ${fila("GCS", r.gcs, fin?.datos.gcs)}
            ${fila("HACOR", r.hacor, fin?.hacor)}
          </tbody></table>

          <h4 class="inf-sub">Qué se hizo (cronología)</h4>
          <div class="timeline">
            <div class="ev basal"><span class="ev-t">t+0′</span><span class="ev-icono">🩺</span><div class="ev-cuerpo"><strong>${esc(r.clasif)}</strong> — ${esc(r.titulo)}</div></div>
            ${caso.eventos.slice().sort((a, b) => a.t - b.t).map(ev => {
              const iconos = { reevaluacion: "🧪", parametros: "🎛", cuidado: "🛏", nota: "📝" };
              let c = ev.tipo === "reevaluacion"
                ? `pH ${f1(ev.datos.ph)} · pCO₂ ${f1(ev.datos.pco2)} · FR ${f1(ev.datos.fr)} — <em>${esc(ev.veredicto?.veredicto || "")}</em>`
                : ev.tipo === "parametros"
                  ? `${esc(ev.datos.modo)} · EPAP ${f1(ev.datos.epap)} · IPAP ${f1(ev.datos.ipap)} · FiO₂ ${esc(ev.datos.fio2)}${ev.datos.nota ? ` — ${esc(ev.datos.nota)}` : ""}`
                  : esc(ev.datos.texto);
              return `<div class="ev"><span class="ev-t">t+${ev.t}′</span><span class="ev-icono">${iconos[ev.tipo]}</span><div class="ev-cuerpo">${c}</div></div>`;
            }).join("")}
            ${caso.cierre ? `<div class="ev cierre"><span class="ev-t">t+${caso.cierre.t}′</span><span class="ev-icono">🏁</span><div class="ev-cuerpo"><strong>${esc(caso.cierre.destino)}</strong>${caso.cierre.comentario ? ` — ${esc(caso.cierre.comentario)}` : ""}</div></div>` : ""}
          </div>

          <h4 class="inf-sub">Checklist frente a lo recomendado <small>(reglas provisionales)</small></h4>
          <div class="chk-lista">
            ${chk.map(c => `<div class="chk ${c.estado}"><span>${c.icono}</span> ${c.texto}${c.estado === "no" ? " — <em>no registrado</em>" : c.estado === "na" ? " — <em>no aplica</em>" : ""}</div>`).join("")}
          </div>
          <p class="provisional">Informe generado por VMNI Urgencias v2.0 · reglas clínicas provisionales pendientes de validación · caso sin identificadores (tiempos relativos) · utilidad de apoyo y docencia: no sustituye la historia clínica.</p>
        </div>
      </div>
      <div class="botonera suelta no-imprimir">
        <button class="btn-sec" onclick="Casos.pintar()">← Volver al caso</button>
        <span style="display:flex;gap:10px">
          <button class="btn-sec" onclick="Casos.exportar()">💾 Guardar .json</button>
          <button class="btn-primario" onclick="window.print()">🖨 Imprimir / PDF</button>
        </span>
      </div>`;
  }

  /* ================= exportar / importar ================= */
  function exportar() {
    if (caso.tipo === "real" && !caso.ejemplo) {
      if (!confirm("Vas a guardar un CASO REAL anonimizado.\n\nComprueba que no hay ningún dato identificativo en títulos ni notas (nombres, fechas, nº de historia). El fichero queda SOLO en tu dispositivo; trátalo como documentación clínica.\n\n¿Continuar?")) return;
    }
    const slug = caso.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "caso";
    const blob = new Blob([JSON.stringify(caso, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `caso-vmni-${slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importar(fichero) {
    if (!fichero) return;
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const c = JSON.parse(lector.result);
        if (c.formato !== "vmni-caso-v1") throw new Error("formato");
        caso = c; guardar(); vista = "activo"; pintar();
      } catch (e) { alert("Ese fichero no parece un caso de VMNI Urgencias (.json con formato vmni-caso-v1)."); }
    };
    lector.readAsText(fichero);
  }
  function cargarEjemplo(i) {
    caso = JSON.parse(JSON.stringify(CASOS_EJEMPLO[i]));
    guardar(); vista = "activo"; pintar();
  }

  function verInforme() { vista = "informe"; pintar(); }

  return { pintar, nuevo, crear, formulario, addReevaluacion, addParametros, addCuidado, addNota, cerrarCaso, descartar, verInforme, exportar, importar, cargarEjemplo };
})();
