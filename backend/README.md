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
    lotes.js        Reglas del lote: mayusculas, "al menos uno de tres" y el consecutivo del codigo
    administradores.js  Guarda: el sistema no se queda sin administrador activo
    codigos.js      Codigos que asigna el sistema: MOD-01 (modulo) y OP-001 (operario)
    tallas.js       El orden de las tallas, sacado del nombre (ya no se digita)
    documentos.js   Documento de identidad: reglas por tipo y digito de verificacion del NIT
    identidad.js    Documento, correo y telefono: se normalizan y se validan antes de guardar
    enlaces.js      A que esta enlazado un registro antes de eliminarlo (lotes, jornadas...)
    prioridad.js    El puesto que tendria una orden nueva en la cola, antes de crearla
    ubicaciones.js  Departamentos y municipios de Colombia (api-colombia.com + copia local)
    correo.js       Envio de correos (recuperar contrasena) y su diagnostico
    filtros.js      El WHERE de un listado: buscar + filtros de igualdad
    fechas.js       hoy() en hora LOCAL (no UTC) y validacion de formato
  data/
    colombia.json   Copia de respaldo de departamentos y municipios (`npm run ubicaciones:generar`)
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
    ubicaciones.routes.js departamentos y municipios para el formulario de clientes
    indicadores.routes.js todos los indicadores (leen las vistas)
    index.js              monta todo y aplica el CRUD generico
uploads/
  fichas/           Las fichas tecnicas subidas. No se versiona.
scripts/
  setup-db.js       Ejecuta los .sql de /database
  hash.js           Genera un hash bcrypt
  probar-correo.js  Revisa el correo del sistema (`npm run correo:probar`)
  generar-ubicaciones.js  Baja la lista de departamentos y municipios (`npm run ubicaciones:generar`)
test/
  lotes.test.js     Reglas del lote que no necesitan base de datos (`npm test`)
  administradores.test.js  La guarda del ultimo administrador, con consultas falsas
  documentos.test.js  Documentos, correo y telefono; compara la regla con la de la pantalla
  codigos.test.js   Los codigos automaticos y la expresion del orden de tallas
  enlaces.test.js   Lo que se le dice al usuario cuando algo esta enlazado
  prioridad.test.js La prioridad estimada de una orden nueva
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
| `GET /api/indicadores/ordenes-riesgo` | Ordenes que no llegan a la fecha comprometida |
| `GET /api/ordenes-produccion` | Listado con el avance real (vista `vw_avance_orden`) |
| `GET /api/ordenes-produccion/prioridad-estimada?id_lote=` | El puesto que tendria una orden nueva de ese lote y a cuales empuja atras (el formulario lo muestra al elegir el lote) |
| `GET /api/<recurso>/:id/enlaces` | A que esta enlazado un registro antes de eliminarlo: `{ bloqueado, motivo, ayuda, total, enlaces[], borra, yaInactivo }`. Lo piden el dialogo de eliminar de cada modulo (clientes, lotes, tallas, colores, operarios, modulos, responsables, roles, usuarios, ordenes) |
| `GET /api/ubicaciones/departamentos` | Los 33 departamentos de Colombia (api-colombia.com, con copia local si no responde) |
| `GET /api/ubicaciones/departamentos/:id/municipios` | Los municipios de un departamento |

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

## Las reglas de negocio que viven en el backend

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

**4. El codigo del lote lo pone el sistema, y el lote se identifica por tres
datos.** `POST /api/lotes` ignora cualquier `codigo_lote` que llegue y asigna el
siguiente consecutivo del año (`LT-2026-0001`, `LT-2026-0002`...; arranca en 1
cada primero de enero). Dos creaciones simultaneas no se pisan: dentro del
proceso se atienden de a una y, si dos procesos calculan el mismo numero, el
indice `UNIQUE` rechaza al segundo y se le pide otro. Ademas hace falta **al
menos uno** de `numero_pedido`, `codigo_referencia` o `nombre_referencia` (al
crear; al editar, solo se rechaza si un lote que ya tenia uno se quedaria sin
ninguno), y `numero_pedido` y `codigo_referencia` se guardan siempre en
**mayusculas**. Todo vive en `src/lib/lotes.js`; la migracion
`00j_migracion_lote_mayusculas.sql` sube a mayusculas lo que ya estaba guardado.

**5. El sistema no se queda sin administrador.** Nadie puede inactivarse a si
mismo (ni por `PUT` ni por `DELETE /api/usuarios/:id`), y no se puede inactivar,
bloquear ni quitarle el rol al **ultimo administrador activo**. "Administrador"
es quien puede editar usuarios (`Usuarios` + `EDITAR`), no un rol con ese
nombre: es lo que hace falta para volver a activar a alguien. Sin esta guarda, el
interruptor de estado de la pantalla de usuarios dejaba a un administrador
inactivarse y, con el unico fuera, nadie podia entrar a reactivarlo (solo se
arreglaba a mano en la base). Vive en `src/lib/administradores.js`.

**5b. Los codigos de modulo y de operario los pone el sistema.** `POST /api/modulos`
y `POST /api/operarios` ignoran cualquier `codigo` que llegue y asignan el siguiente
consecutivo (`MOD-01`, `MOD-02`... y `OP-001`, `OP-002`...): el mas alto que exista
con ese formato, mas uno. Despues no cambian. Se conecta con `consecutivo` en
`config/resources.js`, como el del lote, asi que dos altas simultaneas no se pisan.
Vive en `src/lib/codigos.js`. Por la misma razon, `modulos.ubicacion` ya no se escribe
(la columna queda sin usarse) y el orden de las tallas ya no se digita: sale del
nombre (`src/lib/tallas.js`).

**6. Eliminar es dejar fuera de servicio, y lo que sigue en uso no sale.** En
este sistema nada con historia se borra: `DELETE` inactiva el registro (solo se
borra de verdad lo que nunca se uso: un rol sin usuarios, una orden sin
produccion ni jornadas, un dia no laboral). Y un registro que algo mantiene en
uso no se puede eliminar **ni dejar inactivo desde el formulario**: un cliente con
lotes sin finalizar, una talla o un color del desglose de un lote activo, un
lote con ordenes sin terminar o una jornada abierta, un modulo o un operario con
la jornada abierta, un rol con usuarios activos. La respuesta es un `409` que
nombra a cuales esta enlazado, y `GET /api/<recurso>/:id/enlaces` da la misma
informacion antes de intentarlo (la pantalla la usa para avisar de entrada).
Que cuenta como "en uso" de cada recurso esta declarado en `src/lib/enlaces.js`
y se conecta con `enlaces:` en `config/resources.js`. En la pantalla, en una fila
inactiva el boton es "Activar".

**7. El documento se valida segun su tipo.** CC 6 a 10 digitos, TI 10 u 11, CE 5
a 10, NIT 8 a 10 digitos con su digito de verificacion opcional (si viene, se
comprueba con la formula de la DIAN), pasaporte y otro 5 a 15 letras y numeros.
A la API le quita solo el formato (puntos, espacios): si trae letras en una
cedula la rechaza en vez de borrarselas. Lo que ya estaba guardado y no se toca
no se vuelve a juzgar, para que un dato viejo no impida, por ejemplo, reactivar
un registro. Es la misma regla de la pantalla
(`frontend/src/shared/validations/documentRules.js`) y `test/documentos.test.js`
las corre con la misma tabla. El correo y el telefono se revisan igual
(`src/lib/identidad.js`).

---

## Correo (recuperar contrasena)

`POST /api/auth/recuperar` manda un enlace por correo (SMTP, ver `.env.example`).
La pantalla responde lo mismo exista o no la cuenta, y funcione o no el envio, a
proposito: decir "fallo" confirmaria que la cuenta existe. Por eso **el motivo de
un fallo solo sale en la consola del backend**.

Para revisar el correo sin enviar nada:

```bash
npm run correo:probar                  # comprueba el usuario y la clave contra el servidor
npm run correo:probar -- tu@correo.com # ademas manda un correo de prueba
```

Un `535 Username and Password not accepted` con Gmail significa que
`SMTP_PASS` ya no sirve: es una "contrasena de aplicacion" de 16 letras (Cuenta de
Google > Seguridad > Verificacion en 2 pasos > Contrasenas de aplicaciones) y se
invalida si se cambia la clave de la cuenta o se revoca. Se crea otra, se pone en
`backend/.env` y se reinicia el backend. En desarrollo, si el envio falla, el
enlace queda escrito en la consola para poder seguir probando el cambio de clave.
