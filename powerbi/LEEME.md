# Power BI: pasos para armar el reporte

Archivos en esta carpeta:
- `ToolDemandBoard.pbiviz`: visual personalizado (React). Barras por herramienta + matriz de calor por tipo de rol + filtrado cruzado.
- `fact_jobs.csv`, `bridge_job_tool.csv`, `dim_tool.csv`: modelo en estrella (502 vacantes).
- `measures.dax`: todas las medidas.
- `theme.json`: tema oscuro con la misma paleta del dashboard de React.

## 1. Cargar los datos
Power BI Desktop → **Obtener datos → Texto/CSV**, y carga las 3 tablas.
Revisa tipos: `posted_date` = Fecha, `salary_annual_usd` = Número decimal, `mentions_ai` = Número entero.

## 2. Relaciones (vista Modelo)
- `dim_tool[tool]` (uno) → `bridge_job_tool[tool]` (muchos)
- `fact_jobs[job_id]` (uno) → `bridge_job_tool[job_id]` (muchos)
Dirección del filtro: **única** en las dos. No actives bidireccional; las medidas ya lo resuelven.

## 3. Tema
Vista → Temas → **Buscar temas** → `theme.json`.

## 4. Medidas
Crea una tabla vacía `_Measures` (Inicio → Especificar datos) y pega las medidas de `measures.dax` una por una.

## 5. Importar el visual
Panel Visualizaciones → `...` → **Obtener más objetos visuales → Importar un objeto visual desde un archivo** → `ToolDemandBoard.pbiviz`.

## 6. Configurar el visual
| Campo del visual | Pon aquí |
|---|---|
| Tool | `dim_tool[tool]` |
| Tool category | `dim_tool[category]` |
| Role family | `fact_jobs[role_family]` |
| Postings | medida `[Postings]` |

Opcionales: panel de formato → **Display** (cuántas herramientas, matriz, conteos).
`Ctrl + clic` selecciona varias herramientas y filtra las demás gráficas.

## 7. Resto del reporte (sugerido)
- Tarjetas: `[Total Jobs]` / `[Selected Jobs]`, `[AI Share %]`, `[Median Salary (USD)]`, `[Worldwide %]`.
- Segmentadores: `role_family`, `seniority`, `region`.
- Barras: `[Median Salary (USD)]` por `role_family`; columnas por `posted_date` (mes).
- Tarjeta de texto con `[Headline]`.

## Notas
- Salario: solo ~38% de las vacantes lo publican (189 de 502). Dilo en el reporte.
- Las herramientas se cuentan por mención, no por nivel de exigencia.
- Fuente única (Himalayas) y una sola fecha de corte: es una foto, no un tablero en vivo.
