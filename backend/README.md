# BGoat — API

Backend del sistema de gestion de produccion textil de Confecciones God's Eyes SAS.

**Node.js + Express + MySQL 8** (driver `mysql2`, sin ORM: el SQL queda a la
vista, que es lo que el proyecto necesita poder explicar).

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar el entorno

Copia `.env.example` a `.env` y completa **tu contrasena de MySQL**:

```
DB_PASSWORD=tu_clave_de_mysql
JWT_SECRET=una-cadena-larga-y-aleatoria
```

### 3. Crear la base de datos

```bash
npm run db:setup
```

Con datos de demostracion (12 modulos y el tablero de la foto):

```bash
npm run db:setup -- --demo
```

Para borrar todo y empezar de cero:

```bash
npm run db:reset -- --demo
```

### 4. Levantar la API

```bash
npm run dev
```

Queda en `http://localhost:4000/api`. Prueba rapida: `GET /api/salud`.

**Usuario inicial:** `admin@bgoat.com` / `Bgoat2026*`
Cambialo despues del primer ingreso. Para generar otro hash:

```bash
npm run hash -- "MiClaveNueva"
```

---

## Estructura

```text
src/
  config/
    env.js          Variables de entorno con validacion
    db.js           Pool de MySQL, query/execute/transaction
    resources.js    Definicion declarativa de los recursos CRUD
  lib/
    http.js         ApiError, asyncHandler y traduccion de errores de MySQL
    crud.js         Fabrica de routers REST a partir de resources.js
  middleware/
    auth.js         JWT + verificacion de permisos contra `rol_permiso`
  routes/
    auth.routes.js        login, logout, registro, recuperacion
    captura.routes.js     la rejilla horaria (el nucleo)
    ordenes.routes.js     ordenes + su detalle por prenda
    usuarios.routes.js    usuarios (hash de contrasena)
    roles.routes.js       roles + matriz de permisos
    fichas.routes.js      operaciones, materiales y medidas de la ficha
    indicadores.routes.js todos los indicadores (leen las vistas)
    index.js              monta todo y aplica el CRUD generico
scripts/
  setup-db.js       Ejecuta los .sql de /database
  hash.js           Genera un hash bcrypt
```

### Por que un CRUD generico

Catorce tablas comparten exactamente el mismo comportamiento REST. En vez de
catorce archivos casi identicos, `resources.js` las describe (tabla, llave,
campos, filtros, permiso) y `crud.js` construye el router. Las rutas con logica
propia —captura, ordenes, usuarios, roles, indicadores— si estan escritas a mano.

---

## Seguridad

| Mecanismo | Donde |
| --- | --- |
| Contrasenas con bcrypt (10 rondas) | `auth.routes.js`, `usuarios.routes.js` |
| Sesion con JWT | `middleware/auth.js` |
| Permisos por rol (`modulo` + `accion`) | `requierePermiso` en cada ruta |
| Bloqueo temporal por intentos fallidos | `auth.routes.js` (5 intentos / 15 min) |
| Auditoria de accesos | tabla `sesiones_acceso` |
| Consultas parametrizadas | todas (`?` en `query`/`execute`) |
| CORS con lista blanca | `server.js` |

Los nombres de tabla y columna nunca vienen del cliente: salen de
`resources.js`, que es codigo del proyecto.

---

## Endpoints principales

| Metodo y ruta | Que hace |
| --- | --- |
| `POST /api/auth/login` | Valida credenciales, registra el acceso y firma el token |
| `GET /api/captura?fecha=` | **La rejilla del dia**: modulos x horas con lo capturado y lo pendiente |
| `PUT /api/captura` | Guarda una celda. Calcula meta y cumplimiento y exige causa bajo el umbral |
| `GET /api/indicadores/resumen` | KPIs del dashboard |
| `GET /api/indicadores/estado-modulos` | Estado de planta del dia |
| `GET /api/indicadores/causas` | Pareto del tiempo perdido |
| `GET /api/indicadores/sam` | SAM pactado vs observado por referencia |
| `GET /api/indicadores/ordenes-riesgo` | Ordenes que no llegan a la fecha comprometida |
| `GET /api/ordenes-produccion` | Listado con el avance real (vista `vw_avance_orden`) |

El mapa completo esta en `frontend/src/shared/services/endpoints.js`.

---

## La regla de negocio que vive en el backend

La meta de cada hora **no la digita nadie**: la calcula el servidor.

```
minutos_disponibles = personas_presentes * 60
meta_hora           = minutos_disponibles / sam_pactado
cumplimiento        = unidades_producidas / meta_hora
```

Si el cumplimiento cae por debajo del `umbral_cumplimiento` del modulo, el
endpoint de captura **rechaza el guardado sin causa**. Esa validacion esta en el
backend a proposito: es la que garantiza que el dato de causa exista, y sin ella
el Pareto de tiempo perdido quedaria vacio.
