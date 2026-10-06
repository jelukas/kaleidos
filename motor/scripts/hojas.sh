#!/usr/bin/env bash
# Regenera las hojas de contactos de verificación (out/stills/*/hoja.jpg). ≈3 min con angle.
set -euo pipefail
cd "$(dirname "$0")/.."
s() { node scripts/stills.mjs "$@" 2>&1 | grep -E "✓|✗|Error" || true; }
s demo --at eventos --estilo prueba-oscuro --nombre oscuro-marco
s demo --at eventos --estilo prueba-oscuro --timeline timeline-recorte.json --nombre oscuro-recorte
s demo --at eventos --estilo prueba-claro --nombre claro-marco
s demo --at eventos --estilo prueba-claro --timeline timeline-recorte.json --nombre claro-recorte
s demo --at eventos --estilo prueba-oscuro --timeline timeline-catalogo.json --cols 5 --nombre catalogo3d-estandar
s demo --at eventos --estilo prueba-claro --timeline timeline-catalogo.json --cols 5 --nombre catalogo3d-toon
s demo --at f90,f201,f315,f537,f734,f1029,f1484,f1733,f2029,f2181 --estilo prueba-oscuro --comp Vertical --cols 5 --escala 0.4 --nombre vertical-oscuro
s demo --at eventos --estilo curso-azul --nombre curso-azul-marco
s demo --at eventos --estilo cuaderno-a-mano --timeline timeline-recorte.json --nombre cuaderno-recorte
if [ -f fixtures/demo-v2/media/timeline.json ]; then s demo-v2 --at eventos --nombre demo-v2-real; fi
if [ -f ../proyectos/dora-v2/timeline.json ]; then
  s dora-v2 --at eventos --escala 0.35 --cols 9 --nombre dora-v2-recorte
  s dora-v2 --at eventos --escala 0.35 --cols 9 --ponente marco --nombre dora-v2-marco
fi
if [ -f fixtures/milikito/media/timeline.json ]; then
  s milikito --at eventos --nombre milikito-escenario
  s milikito --at eventos --timeline timeline-marco.json --nombre milikito-marco
  s milikito --at eventos --timeline timeline-kinds.json --cols 8 --escala 0.4 --nombre milikito-kinds
  s milikito --at eventos --timeline timeline-3d.json --cols 6 --nombre milikito-3d-toon
  s milikito --at eventos --timeline timeline-3d.json --estilo prueba-oscuro --cols 6 --nombre milikito-3d-estandar
fi
if [ -f ../proyectos/dora-milikito/timeline.json ]; then s dora-milikito --at eventos --escala 0.35 --cols 9 --nombre dora-milikito; fi
