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

Corre cuatro archivos de `/database` en orden: `00_migracion_flujo_jornada`,
`01_schema`, `02_seed` y --con `--demo`-- `03_demo`.

La migracion va **primero** a proposito: en una base con el modelo anterior,
las vistas de `01_schema` leen columnas que todavia no existen
(`registros_horarios.id_jornada_modulo`, `lotes.codigo_referencia`,
`clientes.nombre`). En una base nueva se detecta sola --por la ausencia de la
tabla `marcas`-- y no hace nada. Corre una sola vez: queda anotada en
`migraciones`. **Saca un respaldo antes de aplicarla sobre datos reales**
(`../backup.sh`).

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
    filtros.js      El WHERE de un listado: buscar + filtros de igualdad
    fechas.js       hoy() en hora LOCAL (no UTC) y validacion de formato
  middleware/
    auth.js         JWT + verificacion de permisos contra `rol_permiso`
  routes/
    auth.routes.js        login, logout, registro, recuperacion
    jornada.routes.js     abrir/cerrar la jornada del modulo y su nomina
    captura.routes.js     la rejilla horaria (el nucleo)
    lotes.routes.js       subida de la ficha tecnica del lote (multer)
    ordenes.routes.js     ordenes de produccion
    usuarios.routes.js    usuarios (hash de contrasena)
    roles.routes.js       roles + matriz de permisos
    indicadores.routes.js todos los indicadores (leen las vistas)
    index.js              monta todo y aplica el CRUD generico
uploads/
  fichas/           Las fichas tecnicas subidas. No se versiona.
scripts/
  setup-db.js       Ejecuta los .sql de /database
  hash.js           Genera un hash bcrypt
```

### Por que un CRUD generico

Ocho tablas comparten exactamente el mismo comportamiento REST. En vez de
ocho archivos casi identicos, `resources.js` las describe (tabla, llave,
campos, filtros, permiso) y `crud.js` construye el router. Las rutas con logica
propia --jornada, captura, ordenes, usuarios, roles, indicadores-- si estan
escritas a mano.

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
| `GET /api/jornada/opciones` | **Todo lo que el asistente de inicio necesita**: modulos, clientes, lotes y operarias en una sola peticion |
| `POST /api/jornada` | Abre la jornada de un modulo: lote + cantidad de operarias + nomina. **Aqui el modulo TOMA la orden**: si ya la tomo otro, responde 409 |
| `GET /api/jornada/modulo/:id` | La jornada de un modulo en una fecha, con su nomina |
| `POST /api/jornada/:id/cerrar` | Cierra el dia del modulo (reversible con `/reabrir`) |
| `GET /api/jornada/horario` | El horario de la planta (`vw_horario_jornada`): cuantos minutos dura un dia y con que franjas. Reemplazo a `GET /captura/jornadas`, que hacia lo mismo y no lo llamaba nadie |
| `GET /api/captura?fecha=` | **La rejilla del dia**: modulos x horas con lo capturado y lo pendiente |
| `GET /api/captura/pendientes` | Horas vencidas sin registrar. Alimenta el recordatorio horario |
| `PUT /api/captura` | Guarda una celda. Calcula meta y cumplimiento y exige la incidencia bajo el umbral |
| `POST /api/lotes/:id/ficha` | Sube la ficha del lote (max 8 MB). La columna destino --`ruta_imagen` o `ruta_documento_pdf`-- la decide el tipo del archivo |
| `DELETE /api/lotes/:id/ficha/:tipo` | Quita la imagen o el PDF (`imagen` \| `pdf`) |
| `PUT /api/lotes/:id/detalle` | Reemplaza el desglose por talla y color del lote. Una lista vacia lo borra |
| `GET /api/indicadores/resumen` | KPIs del panel |
| `GET /api/indicadores/estado-modulos` | Estado de planta del dia |
| `GET /api/indicadores/causas` | Pareto del tiempo perdido |
| `GET /api/indicadores/sam` | SAM pactado vs observado por referencia |
| `GET /api/indicadores/produccion-cliente` | Produccion agrupada por cliente-marca |
| `GET /api/indicadores/ordenes-riesgo` | Ordenes que no llegan a la fecha comprometida |
| `GET /api/ordenes-produccion` | Listado con el avance real (vista `vw_avance_orden`) |

El mapa completo esta en `frontend/src/shared/services/endpoints.js`.

---

## Lo que no se repite

`lib/filtros.js` y `lib/fechas.js` existen porque su contenido estaba copiado
en varios archivos y las copias no coincidian:

- El armado del `WHERE` de un listado estaba tres veces (`crud.js`, ordenes y
  usuarios) y cada copia entendia distinto que valor significa "sin filtrar":
  una ignoraba `"todos"`, otra `"todos"` y `"all"`, y la tercera miraba uno
  para un campo y otro para el siguiente.
- `hoy()` estaba tres veces y las tres calculaban la fecha en **UTC**. Colombia
  es UTC-5, asi que a partir de las 7:00pm el sistema se pasaba al dia
  siguiente: el panel en ceros, el recordatorio horario mudo y una hora
  capturada tarde guardada con la fecha equivocada.

---

## Las tres reglas de negocio que viven en el backend

**1. Sin jornada no hay captura.** `PUT /api/captura` rechaza una hora cuyo
modulo no tenga jornada abierta ese dia, y responde con `requiere_jornada` para
que la pantalla mande a configurarla. La jornada es la que dice que lote corre
y con cuantas operarias; sin ella el numero que se guarde no se puede comparar
con nada.

**2. La meta no la digita nadie**: la calcula el servidor.

```
minutos_disponibles = personas_presentes * minutos_franja
meta_hora           = minutos_disponibles / sam_pactado   <- el SAM sale del lote
cumplimiento        = unidades_producidas / meta_hora
```

`minutos_franja` es el ancho real de la franja, no un 60 fijo: la ultima franja
de martes a viernes dura 40 y la del sabado 20.

**3. Bajo el umbral, la incidencia es obligatoria.** Si el cumplimiento cae por
debajo del `umbral_cumplimiento` del modulo, el endpoint **rechaza el guardado
sin incidencia**. Esa validacion esta en el backend a proposito: es la que
garantiza que el dato exista, y sin ella el Pareto de tiempo perdido quedaria
vacio.
