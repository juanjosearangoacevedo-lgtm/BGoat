# BGoat — Frontend

Panel web del sistema de gestión de producción textil de Confecciones God's Eyes SAS.

**React 18 + Vite + Tailwind 4.** Todo el código está en JavaScript (`.js` / `.jsx`).

> Necesita el backend corriendo. Ver [`../backend/README.md`](../backend/README.md).

---

## Puesta en marcha

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:5173/. La URL de la API se configura en `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

Usuario inicial: `admin@bgoat.com` / `Bgoat2026*`

---

## La barra lateral

**Panel** va suelto y arriba de todo: es la pantalla de mirar, no de hacer, y es
a donde cae la sesión al entrar. Debajo, tres grupos:

| Grupo | Qué hay dentro |
|---|---|
| **Producción** | Órdenes de producción · Inicio de jornada · Registrar producción · Tablero por módulo · Módulos |
| **Planta** | Lotes · Clientes · Operarias · Incidencias |
| **Configuración** | Usuarios · Roles y permisos · Consulta de permisos |

*Producción* está en el orden en que ocurre el día: la orden existe suelta, un
módulo la toma al abrir su jornada, se registra cada hora y se mira el tablero.
*Planta* es lo que sostiene esa producción: el material que entra, para quién es
y la gente. *Configuración* administra el sistema, no el negocio.

Los tres grupos arrancan desplegados, así que ninguna pantalla queda a más de
un clic. El menú se filtra por los permisos del rol: un grupo cuyo rol no puede
ver ninguna de sus entradas no se dibuja.

---

## Las dos pantallas que importan

### 1. Inicio de jornada

Un asistente de cuatro pasos, una pregunta por pantalla: **en qué módulo**,
**cuántas operarias**, **quiénes** y **qué se va a producir** (cliente → lote).

**Identificar a las operarias es opcional, y la pantalla lo pregunta de frente.**
El paso 3 no es una lista de puestos en blanco sino dos botones: *decir quiénes
están* o *dejarlas anónimas*. A primera hora la digitadora sabe que hay cinco
máquinas andando mucho antes de saber el nombre de las cinco, y exigirle la
identificación la obligaría a inventar operarias en el catálogo para arrancar.
Identificar no cambia ningún cálculo —la meta sale de cuántas personas hay, no
de quiénes son—; sirve para repartirles la producción del módulo, y se puede
completar después sin detener la captura.

**Aquí es donde un módulo toma la orden.** Las órdenes nacen libres; al elegir
cliente y lote, el asistente ofrece las que nadie ha tomado. Con una sola no
pregunta: la pone. Desde que se inicia la jornada, ningún otro módulo puede
coger esa orden.

También se llega desde *Registrar producción*, con el botón «Jornadas» de la
cabecera y con el aviso de los módulos que aparecen como «Sin jornada».

Una pregunta por pantalla y no un formulario con los cinco campos juntos: el
formulario cabe en menos espacio, pero obliga a leerlo entero antes de
contestar lo primero, y esto se llena de pie y en dos minutos. Por eso también
el módulo es una rejilla de botones grandes y la cantidad un contador con dos
botones, no un desplegable ni un campo de texto.

**Las operarias quedan anónimas por omisión.** Es la decisión importante de esa
pantalla: a primera hora se sabe que hay cinco máquinas andando mucho antes de
saber el nombre de las cinco, y exigir la identificación obligaría a inventar
operarias en el catálogo para poder arrancar el día.

### 2. Registrar producción

El corazón del sistema, y lo que reemplaza el tablero de la pared.

Una **rejilla de módulos × horas**: la digitadora toca la celda de cada módulo
para registrar la hora. Solo digita tres cosas —unidades, defectuosas y, si el
cumplimiento cae bajo el umbral, la incidencia—; las personas vienen
precargadas de la hora anterior y **la meta y el porcentaje los calcula el
sistema**.

Eso le quita unas 200 cuentas manuales al día (9 horas × 12 módulos × 2
operaciones), y el dato deja de borrarse cada noche.

```
meta_hora    = (personas_presentes × minutos_franja) / SAM del lote
cumplimiento = unidades_producidas / meta_hora
```

Un módulo sin jornada abierta sale en gris con el botón de abrirla, no con
celdas que al tocarlas darían error.

**El recordatorio horario** (`useRecordatorioHora`) consulta cada dos minutos
qué franjas ya vencieron sin registrar y avisa solo cuando aparece una nueva.
Un aviso repetido cada dos minutos se vuelve ruido y se deja de leer, que es lo
contrario de lo que el recordatorio busca. Es la única parte del sistema que
interrumpe, y lo hace por una razón: el tablero de pared se llenaba porque
estaba a la vista; una pantalla que hay que acordarse de abrir se queda vacía.

Las celdas se pueden llenar hacia atrás dentro del mismo día, porque la
digitadora a veces va una o dos horas atrasada y se desatrasa.

### 3. El formulario de Lote

Es el único formulario del producto. Reemplaza a los de **Pedidos,
Referencias, Fichas Técnicas y Prendas**: el trabajo llega en una sola hoja del
cliente y ahora se registra en una sola pantalla, en el orden en que se lee esa
hoja —de quién es, qué es, qué acordamos, cuánto y para cuándo.

La ficha técnica son dos ranuras de archivo: la **foto** (que es lo que
confirma de un vistazo, al iniciar la jornada, que el lote es el correcto) y el
**PDF** (que se abre para leer el detalle). El destino lo decide el tipo del
archivo, no un selector.

El **desglose por talla y color** va colapsado y es opcional: dejarlo vacío no
bloquea el guardado, porque la producción se mide por lote y a veces ese dato
no viene en la hoja.

### El Panel

Dashboard, Indicadores y Reportes eran tres entradas de menú que leían las
mismas vistas y respondían a la misma pregunta. Ahora son tres pestañas de una
sola pantalla, y cada una monta su hook solo cuando está activa: traer las tres
de entrada sería pagar tres veces por lo que casi siempre se mira una.

Con la fusión desaparecieron dos pares de componentes que hacían lo mismo:
`KPICards`/`IndicadoresKpis` (los cuatro KPIs de Indicadores eran un
subconjunto exacto de los ocho del Dashboard) y
`ProductivityCharts`/`ReportesGraficos` (las mismas cuatro series).

### La pantalla de Módulos

Está ordenada por la línea que separa **lo que alguien digita** de **lo que el
sistema calcula** —el amarillo y el verde del tablero que llena la empresa.

El formulario del módulo pide **dos cosas**: cuántos puestos tiene y bajo qué %
se exige la incidencia. Antes pedía además las horas de jornada, las horas
semanales y una *eficiencia esperada*. Las tres eran resultados disfrazados de
campo: las horas del día las dan las franjas (8.67 h entre semana) y la
eficiencia se mide contra la meta. Escritas a mano solo contradecían al número
que el sistema calcula.

Todo lo demás se muestra, no se pide. El panel de detalle trae el bloque de
cabecera del tablero —cliente, referencia, lote, personas, SAM pactado y valor
de maquila— y debajo lo que sale de las horas capturadas: meta del día, SAM
observado, minutos puestos y ganados, facturación meta contra real, y los
minutos perdidos abiertos por causa.

**Los dos SAM juntos son la línea de rentabilidad.** Si el observado sube del
pactado, el módulo se está demorando más de lo que el cliente paga; la tabla lo
marca en rojo.

---

## Estructura

```text
src/
  features/
    landing/                  Pagina publica
    auth/                     Login, registro y recuperar contrasena
    Admin/
      Layout/                 AdminLayout, Header, Sidebar, Breadcrumb
      Jornada/                EL ASISTENTE de inicio de jornada
      Captura/                LA REJILLA horaria (nucleo del sistema)
      Panel/                  Resumen + Indicadores + Reportes, en tres pestanas
      Modulos/                Tablero y CRUD de modulos
      Operarios/              Personal de planta
      Causas/                 Catalogo de incidencias
      Ordenes/                Listado, formulario y detalle con curva de arranque
      Lotes/                  EL LOTE: pedido, referencia, SAM, ficha y desglose
      Clientes/               Cliente-marca unificado
      Usuarios/  Roles/  Permisos/
  shared/
    components/               Primitivas de UI + componentes propios
    contexts/                 AuthContext, DarkModeContext
    hooks/                    useCrudResource, useCatalogo, useRecordatorioHora
    services/                 apiClient, endpoints
    styles/  utils/
  index.js                    Punto de entrada (lo carga index.html)
  routes.js                   Registro de rutas
```

**Solo queda la UI que se usa.** La carpeta venia con el catalogo completo de
shadcn/ui --acordeones, carruseles, menubar, calendario, un sidebar propio-- y
ninguna pantalla lo tocaba: 41 archivos y 43 dependencias de npm (MUI,
react-router, react-dnd, react-slick, react-hook-form...) que solo alargaban la
instalacion. De 57 dependencias quedaron **14**.

### Componentes compartidos propios

| Componente | Uso |
| --- | --- |
| `CrudPage` | Página CRUD completa a partir de una configuración |
| `PageHeader` / `SearchInput` / `DataTable` / `TablePagination` | Estructura de listado |
| `Modal` / `ConfirmDialog` / `FormField` | Formularios |
| `StatusBadge` | Traduce los ENUM de MySQL (`EN_PROCESO` → "En proceso") |
| `ChartCard` / `StatsGrid` / `EmptyState` | Presentación |
| `ModalAcciones` | El pie de un formulario en modal: cancelar y guardar |

Ningún módulo crea su propia copia de un componente reutilizable: todo vive en
`src/shared/components` y se importa con el alias `@`. Lo mismo vale para las
funciones: `hoyLocal()` estaba escrita dos veces y otras tres pantallas la
importaban *desde el hook de captura* —una dependencia entre features para pedir
una fecha—; ahora vive en `shared/utils/formatters.js`.

---

## Cómo se conecta con la base de datos

**Regla: el frontend usa los nombres de columna reales.** Nada de `name`,
`status` o `quantity`; se usa `nombres`, `estado`, `cantidad_programada`. El
mapeo completo pantalla → endpoint → tabla está en
[`../database/04_mapeo_frontend_bd.md`](../database/04_mapeo_frontend_bd.md).

| Archivo | Para qué sirve |
| --- | --- |
| `shared/services/endpoints.js` | Mapa único de rutas, con la tabla o vista de cada una |
| `shared/services/apiClient.js` | Token, errores y aviso de sesión expirada |
| `shared/contexts/AuthContext.jsx` | Sesión y permisos del rol (`puede(modulo, accion)`) |
| `shared/hooks/useCrudResource.js` | Estado CRUD contra la API |
| `shared/hooks/useCatalogo.js` | Catálogos para los selects de llaves foráneas |
| `shared/utils/formatters.js` | Única capa que convierte datos crudos en texto |

El menú lateral se filtra con los permisos del rol: cada usuario solo ve lo que
su rol puede ver, y el backend valida lo mismo en cada ruta.

---

## Qué falta

- **Exportación a Excel y PDF**: los botones están en Reportes, la generación del
  archivo no está implementada.
- **Modo offline en la captura**: hoy la rejilla necesita conexión. El diseño
  conceptual lo pide porque la planta tiene zonas sin señal.
- **Alertas push**: las alertas de módulo bajo umbral y orden en riesgo se ven en
  pantalla, pero no se notifican fuera de la app.

---

## Comandos

```bash
npm run build
```

```bash
npm run preview
```

En Windows PowerShell, si `npm` está bloqueado por la política de ejecución, usa
`npm.cmd`.
