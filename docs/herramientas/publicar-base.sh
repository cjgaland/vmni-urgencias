#!/bin/bash
# Genera la edición PÚBLICA de la Base Científica (sin la cocina de revisión)
# y la deja como base-cientifica.pdf en la raíz, lista para servir desde la app.
# Uso: bash docs/herramientas/publicar-base.sh  (desde la raíz del proyecto)
# Requiere: node con el paquete docx accesible (NODE_PATH) y LibreOffice.
set -e
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"

python3 - <<'PY'
import re
s = open("docs/BASE_CIENTIFICA.md").read()
# fuera la cita de cabecera interna (Objeto/Aviso de trabajo)
s = re.sub(r"\n> \*\*Objeto\.\*\*.*?---\n", "\n---\n", s, count=1, flags=re.S)
# fuera las secciones internas de revisión
s = re.sub(r"## 14\. Decisiones abiertas para revisión.*?(?=## 15\.)", "", s, flags=re.S)
s = re.sub(r"## 16\. Correcciones al borrador inicial.*?(?=\n## |\Z)", "", s, flags=re.S)
# referencias internas al formulario → nota neutra
s = re.sub(r"\s*→ \*\*decisión abierta D-\d+\*\*", " (pendiente de revisión)", s)
s = re.sub(r"\s*→ decisión abierta D-\d+( \([^)]*\))?", " (pendiente de revisión)", s)
s = re.sub(r"\s*\(→ decisión abierta D-\d+\)", " (pendiente de revisión)", s)
s = re.sub(r" \(D-\d+\)", " (pendiente de revisión)", s)
s = re.sub(r"\s*\(criterio propuesto; ver decisión abierta D-\d+\)", " (criterio propuesto, pendiente de revisión)", s)
s = re.sub(r"ver decisión abierta D-\d+", "pendiente de revisión", s)
s = re.sub(r"Las discrepancias entre fuentes están en D-\d+…D-\d+ \(sección \d+\)\.?", "Donde las fuentes discrepan se indica el rango y la opción propuesta, pendiente de revisión.", s)
s = re.sub(r"Las discrepancias entre fuentes están en D-\d+…D-\d+[^.\n]*\.?", "Donde las fuentes discrepan se indica el rango y la opción propuesta, pendiente de revisión.", s)
s = re.sub(r"\s*—\s*D-\d+\)", ")", s)
s = re.sub(r"D-\d+", "pendiente de revisión", s)  # red de seguridad final
s = re.sub(r"\s*\| D-\d+ \|", " |", s)  # por si quedara alguna tabla
s = s.replace("## 15. Bibliografía", "## 14. Bibliografía")
open("docs/BASE_PUBLICA.md", "w").write(s)
print("BASE_PUBLICA.md generada")
PY

node docs/herramientas/md2docx.js docs/BASE_PUBLICA.md docs/BASE_PUBLICA.docx docs/herramientas/portada-publica.json
/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf docs/BASE_PUBLICA.docx --outdir . >/dev/null
mv -f BASE_PUBLICA.pdf base-cientifica.pdf
echo "base-cientifica.pdf listo ($(du -h base-cientifica.pdf | cut -f1))"
