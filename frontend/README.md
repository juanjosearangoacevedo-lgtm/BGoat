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

## La pantalla que importa: Captura de Producción

Es el corazón del sistema y reemplaza el tablero de la pared.

Una **rejilla de módulos × horas**: la supervisora recorre la planta y toca la
celda de cada módulo para registrar la hora. Solo digita tres cosas —unidades,
defectuosas y, si el cumplimiento cae bajo el umbral, la causa—; las personas
vienen precargadas de la hora anterior y **la meta y el porcentaje los calcula
el sistema**.

Eso le quita unas 200 cuentas manuales al día (9 horas × 12 módulos × 2
operaciones), y el dato deja de borrarse cada noche.

```
meta_hora    = (personas_presentes × 60) / SAM
cumplimiento = unidades_producidas / meta_hora
```

Las celdas se pueden llenar hacia atrás dentro del mismo día, porque la
supervisora a veces va una o dos horas atrasada y se desatrasa.

---

## Estructura

```text
src/
  features/
    landing/                  Pagina publica
    auth/                     Login, registro y recuperar contrasena
    Admin/
      Layout/                 AdminLayout, Header, Sidebar, Breadcrumb
      Dashboard/              KPIs, estado de planta, ordenes en riesgo
      Captura/                LA REJILLA (nucleo del sistema)
      Modulos/                Tablero y CRUD de modulos
      Operarios/              Personal de planta
      Asignaciones/           Quien trabaja en que modulo
      Causas/                 Catalogo de causas de desviacion
      Ordenes/                Listado, formulario y detalle con curva de arranque
      Lotes/  Referencias/  FichasTecnicas/  Prendas/
      Clientes/  Marcas/  Pedidos/
      Indicadores/            Eficiencia, Pareto de causas, SAM real vs pactado
      Reportes/
      Usuarios/  Roles/  Permisos/
  shared/
    components/               Primitivas de UI + componentes propios
    contexts/                 AuthContext, DarkModeContext
    hooks/                    useCrudResource, useCatalogo, use-mobile
    services/                 apiClient, endpoints
    styles/  utils/
  routes.js                   Registro de rutas
```

### Componentes compartidos propios

| Componente | Uso |
| --- | --- |
| `CrudPage` | Página CRUD completa a partir de una configuración |
| `PageHeader` / `SearchInput` / `DataTable` / `TablePagination` | Estructura de listado |
| `Modal` / `ConfirmDialog` / `FormField` | Formularios |
| `StatusBadge` | Traduce los ENUM de MySQL (`EN_PROCESO` → "En proceso") |
| `ChartCard` / `StatsGrid` / `EmptyState` | Presentación |

Ningún módulo crea su propia copia de un componente reutilizable: todo vive en
`src/shared/components` y se importa con el alias `@`.

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
