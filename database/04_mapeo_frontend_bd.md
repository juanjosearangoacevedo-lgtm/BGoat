# BGoat — Mapeo Frontend ↔ API ↔ Base de datos

Documento de referencia: qué pantalla consume qué endpoint y qué tabla o vista.
**La regla es que el frontend usa los nombres de columna reales de MySQL**, sin
traducir a inglés ni inventar campos.

- Diseño conceptual: [`../DISENO_CONCEPTUAL.md`](../DISENO_CONCEPTUAL.md)
- Migración al flujo de jornada: [`00_migracion_flujo_jornada.sql`](00_migracion_flujo_jornada.sql)
- Esquema: [`01_schema_bgoat.sql`](01_schema_bgoat.sql) — 24 tablas, 9 vistas
- Catálogos base: [`02_seed_bgoat.sql`](02_seed_bgoat.sql)
- Datos de demostración: [`03_demo_bgoat.sql`](03_demo_bgoat.sql)
- Rutas: `frontend/src/shared/services/endpoints.js` y `backend/src/routes/index.js`

---

## 1. Lo primero del día: `jornada_modulo`

Antes de que exista una sola hora capturada, la digitadora configura la jornada
del módulo. Es el requisito de entrada de todo lo demás.

```
UNIQUE (id_modulo, fecha)          -- un módulo trabaja una jornada por día
```

| Columna | Quién la aporta |
| --- | --- |
| `id_modulo`, `fecha` | Ella, en el paso 1 del asistente |
| `cantidad_operarias` | Ella, en el paso 2 |
| `id_lote` | Ella, en el paso 4 (después de escoger el cliente) |
| `id_orden_produccion` | **El backend**, buscando la orden que cubre ese lote en ese módulo. Puede quedar en NULL |
| `abierta_por`, `fecha_apertura` | El backend, desde la sesión |

Su tabla hija `jornada_operaria` es la nómina: una fila por puesto, numeradas
de 1 a `cantidad_operarias`. **`id_operario` en NULL es una operaria anónima**
—cuenta para los minutos disponibles, pero no recibe atribución individual—, y
es el caso normal a primera hora: se sabe que hay cinco máquinas andando mucho
antes de saber el nombre de las cinco.

`cantidad_operarias` **no congela nada**: es el valor por defecto de cada
franja, y `registros_horarios.personas_presentes` se puede bajar si alguien
faltó. Así la meta sigue siendo dinámica, que es la razón de ser del tablero.

De la jornada salen las dos constantes de la hora:

| Dato | De dónde |
| --- | --- |
| `sam_pactado` | `lotes` — viene en la ficha técnica que el cliente manda con el lote |
| `valor_maquila_unidad` | `ordenes_produccion` — lo que el cliente paga por prenda |

Sin orden todavía hay meta (el SAM sale del lote); lo que no hay es
facturación.

---

## 2. El centro del modelo: `registros_horarios`

Una fila = **un módulo en una hora de la jornada**. Es la digitalización exacta
del tablero de pared, y de ella sale todo lo demás.

```
UNIQUE (id_modulo, fecha, hora_jornada)   -- una celda de la rejilla
```

| Columna | Quién la aporta |
| --- | --- |
| `id_modulo`, `fecha`, `hora_jornada` | La celda que la digitadora tocó |
| `personas_presentes` | Ella (precargado con la cantidad de la jornada, y luego con la hora anterior) |
| `unidades_producidas`, `unidades_defectuosas` | Ella |
| `id_causa`, `nota` | Ella, **solo si el cumplimiento cae bajo el umbral** |
| `id_jornada_modulo`, `id_lote`, `id_orden_produccion` | **El backend**, desde la jornada del módulo |
| `sam_aplicado`, `precio_aplicado`, `minutos_franja` | El backend: foto del lote, la orden y el horario |
| `registrado_por`, `fecha_registro` | El backend, desde la sesión |

`sam_aplicado`, `precio_aplicado`, `minutos_franja` e `id_lote` se copian en el
registro para que el histórico no cambie si mañana se renegocia el SAM, la
tarifa, el horario, o el módulo cambia de lote a mitad del día.

### Los cálculos (los hace la base, no el front)

```
minutos_disponibles = personas_presentes * minutos_franja
meta_hora           = minutos_disponibles / sam_aplicado
cumplimiento        = unidades_producidas / meta_hora
eficiencia          = (unidades_producidas * sam_aplicado) / minutos_disponibles
sam_observado       = minutos_disponibles / unidades_producidas
```

---

## 3. Mapa pantalla → endpoint → origen

| Pantalla | Endpoint | Tabla / vista |
| --- | --- | --- |
| Login / registro / recuperación | `/auth/*` | `usuarios`, `recuperacion_claves`, `sesiones_acceso` |
| **Inicio de jornada** (y el único sitio donde un módulo toma una orden) | `/jornada/opciones`, `POST /jornada` | **`jornada_modulo`** + `jornada_operaria` |
| **Registrar producción** | `GET/PUT /captura` | **`registros_horarios`** + `vw_registro_horario` |
| Recordatorio horario | `GET /captura/pendientes` | `jornada_modulo` + `jornada_franjas` + `registros_horarios` |
| Tablero por módulo | `GET /captura/modulo/:id` | `vw_tablero_modulo_dia` + `vw_estado_modulo_dia` |
| **Panel** (Resumen · Indicadores · Reportes) | `/indicadores/*` | `vw_estado_planta_hora`, `vw_estado_modulo_dia`, `vw_avance_orden`, `vw_perdidas_por_causa`, `vw_productividad_operario` |
| Órdenes (libres y tomadas) | `/ordenes-produccion` | `ordenes_produccion` + `vw_avance_orden` |
| Detalle de orden | `/ordenes-produccion/:id`, `/:id/curva` | `vw_avance_orden`, `vw_curva_arranque`, `vw_registro_horario` |
| Módulos | `/modulos` + `/indicadores/estado-modulos` | `modulos` + `vw_estado_modulo_dia` |
| Operarias | `/operarios` | `operarios` |
| Incidencias | `/causas` | `causas_desviacion` |
| Lotes | `/lotes`, `POST /lotes/:id/ficha`, `PUT /lotes/:id/detalle` | `lotes` (pedido, referencia, SAM y ficha técnica incluidos) + `lote_detalle_talla_color` |
| Catálogos del producto | `/tallas`, `/colores`, `/tipos-prenda` | tablas homónimas — **sin pantalla propia**, se usan dentro del formulario de Lote |
| Clientes | `/clientes` | `clientes` (cliente-marca unificado) |
| Usuarios / Roles / Permisos | `/usuarios`, `/roles`, `/permisos` | `usuarios`, `roles`, `permisos`, `rol_permiso` |

---

## 4. Las vistas y para qué existe cada una

| Vista | Responde a |
| --- | --- |
| `vw_horario_jornada` | ¿Cuánto dura de verdad un día de planta? Suma `jornada_franjas`: 520 min entre semana, 440 el sábado. Reemplaza al `modulos.horas_jornada` que se digitaba |
| `vw_registro_horario` | La rejilla con meta, cumplimiento, eficiencia y SAM observado ya calculados |
| `vw_estado_modulo_dia` | ¿Cómo le fue a cada módulo hoy? |
| `vw_estado_planta_hora` | ¿La caída fue de un módulo o de toda la planta a esa hora? |
| `vw_avance_orden` | ¿Cuánto lleva cada orden y llega a la fecha? |
| `vw_perdidas_por_causa` | ¿En qué se nos van los minutos? (Pareto) |
| `vw_tablero_modulo_dia` | El tablero de un módulo franja por franja, **con acumulados** |
| `vw_curva_arranque` | ¿Cuánto tarda un módulo en llegar a régimen con una referencia nueva? |
| `vw_productividad_operario` | Producción **atribuida** por operaria (el módulo se mide completo y se reparte entre las personas de la nómina de esa jornada). Las anónimas no aparecen: cuentan para los minutos, pero no hay a quién atribuirles nada |

---

## 5. Campos por módulo

### Usuarios → `usuarios`

`clave` (el formulario) → `clave_hash` (la tabla). **El front envía la
contraseña en claro; el backend calcula el bcrypt.** Al editar, dejar la clave
vacía significa "no cambiarla".
`intentos_fallidos` y `bloqueado_hasta` los administra el backend.

### Permisos → `permisos` + `rol_permiso`

Matriz de `modulo` × `accion` (`VER, CREAR, EDITAR, ELIMINAR, EXPORTAR`).
**51 permisos sobre 12 módulos.** No todos admiten las 5 acciones: `Panel`
solo `VER` y `EXPORTAR`; Jornada, Captura y Permisos no tienen `ELIMINAR`.

`Panel` es un solo permiso porque es una sola pantalla: antes había uno para
Dashboard, otro para Indicadores y otro para Reportes, y los tres protegían las
mismas vistas. `EXPORTAR` sigue aparte de `VER` para poder dar consulta sin dar
descarga. Los catálogos `tallas`, `colores` y `tipos_prenda` los protege el
permiso de **Lotes**: quien puede registrar un lote puede agregarle la talla que
le falte sin pedirle permiso a nadie.
El cuerpo del guardado es `{ permisos: [id_permiso, ...] }`.
El mismo catálogo protege cada ruta de la API (`requierePermiso`).

### Clientes → `clientes`

El cliente-marca unificado. Lo identifica `nombre` —como la planta lo nombra,
casi siempre la marca— y es lo único obligatorio; la razón social y el NIT son
opcionales, para que un lote que llega a media mañana se pueda registrar con el
nombre que trae la hoja.

El documento **no es único**: un mismo cliente jurídico con varias marcas son
varias filas con el mismo NIT.

### Lotes → `lotes` + `lote_detalle_talla_color`

El trabajo que llega del cliente, y la **única entidad del producto**. Absorbió
cuatro tablas que antes tenían pantalla propia:

| De dónde venía | Qué se quedó en `lotes` |
| --- | --- |
| `pedidos` | `numero_pedido`, `fecha_pedido`, `fecha_entrega_programada`, `fecha_entrega_real` |
| `referencias` | `codigo_referencia`, `nombre_referencia` |
| `fichas_tecnicas` | `sam_pactado`, `material_principal`, `ruta_imagen`, `ruta_documento_pdf` |
| `prendas` | `id_tipo_prenda` + la tabla hija `lote_detalle_talla_color` |

`estado` cubre el ciclo de vida completo —`REGISTRADO`, `APROBADO`,
`EN_PROCESO`, `DESPACHADO`, `ENTREGADO`, `FINALIZADO`, `CANCELADO`,
`INACTIVO`—: es la unión de los estados que `lotes` y `pedidos` tenían por
separado. Los tres del medio vienen del pedido.

`lote_detalle_talla_color` es **opcional**: cero filas es un estado válido. El
negocio todavía no decide si va a usarlo, y exigirlo bloquearía el registro del
lote por un dato que a veces no viene en la hoja del cliente. La producción se
sigue midiendo por lote; la captura horaria no toca esta tabla.

`sam_pactado` es **el SAM**: los minutos que el cliente paga por unidad. Es la
línea de rentabilidad del contrato y el dato con el que se calcula la meta. Un
lote sin SAM **no deja abrir la jornada**, y el aviso sale al abrirla, no al
guardar la primera hora.

`ruta_imagen` y `ruta_documento_pdf` apuntan a los archivos que sube
`POST /lotes/:id/ficha` (máximo 8 MB, guardados en `backend/uploads/fichas`).
No son campos que se digiten: los escribe el backend, y **la columna destino la
decide el tipo del archivo**, no el formulario. Van separados porque son dos
cosas distintas: la foto se reconoce de un vistazo al escoger el lote, y el PDF
se abre para leer el detalle.

### Módulos → `modulos`

**Solo dos columnas configurables**, y las dos son decisiones del negocio que
ningún cálculo deduce:

| Columna | Qué decide |
| --- | --- |
| `capacidad_operarios` | cuántos puestos tiene el módulo. Es el tope al armar la jornada, no la gente que hay hoy (esa la declara `jornada_modulo.cantidad_operarias`) |
| `umbral_cumplimiento` | el % por debajo del cual la app **exige la incidencia**, validado en el backend y no solo en la UI |

Aquí vivían tres cifras más que se digitaban a mano y que en el tablero de la
empresa son celdas **verdes**, o sea resultados:

| Columna borrada | De dónde sale ahora |
| --- | --- |
| `horas_jornada` | `vw_horario_jornada`: la suma de `jornada_franjas`. Son 8.67 h entre semana y 7.33 el sábado; la columna decía 9 |
| `horas_semanales` | no la usaba ningún cálculo real |
| `eficiencia_esperada` | la eficiencia **se mide** (`vw_estado_modulo_dia.eficiencia`). Declararla a mano solo servía para que el número escrito contradijera al calculado |

Las tres alimentaban una "capacidad semanal teórica" que no aparece en ningún
tablero de la empresa. La migración `00b_migracion_modulos_calculados.sql` las
suelta; no se pierde historia, porque ningún registro horario las guardó nunca.

### Jornadas → `jornadas` + `jornada_franjas` + `jornada_dia`

Ojo con el nombre: esto es el **horario** de la planta, el patrón de franjas.
La jornada de trabajo de un módulo en un día concreto es `jornada_modulo`.

`jornada_dia` dice qué horario rige cada día de la semana (1 = lunes … 7 =
domingo; un día sin fila no se trabaja) y `jornada_franjas` trae las columnas
de la rejilla con su ancho real:

| Jornada | Franjas | Minutos |
| --- | --- | --- |
| `MAR_VIE` | 8 de 60 + 1 de 40 (2:00pm-2:40pm) | 520 |
| `SABADO` | 7 de 60 + 1 de 20 (1:00pm-1:20pm) | 440 |

`minutos` es lo que fija la meta. Con un 60 fijo, la última franja del día
pedía una meta que nunca fue alcanzable y el módulo aparecía por debajo del
umbral sin serlo.

Cada franja es también un recordatorio: al cerrarse sin registro,
`GET /captura/pendientes` la reclama.

Las franjas de 0 minutos del tablero de pared (2:40pm-3:00pm y 1:20pm-1:40pm)
no se cargan: son el cierre del turno, no se produce en ellas, y una franja de
meta 0 solo ensucia el promedio del día.

### Minutos perdidos → `registro_minutos_perdidos`

Los minutos que el módulo estuvo parado en esa franja, abiertos por causa. El
tablero de pared trae tres columnas fijas —máquina, calidad, montaje/insumos—
y aquí son N causas del catálogo; esas tres siguen saliendo como pivot en
`vw_registro_horario`, y `minutos_otras` recoge cualquiera que se agregue
después.

`minutos` son minutos **de módulo** (lo que la digitadora observa).
Multiplicados por las personas presentes dan los minutos-persona, que es la
unidad de `minutos_disponibles` y la columna "Total Minutos" del tablero.

Registrar minutos **no baja la meta**: la meta la fija la franja. El tiempo
perdido explica el hueco, no lo perdona.

### Órdenes → `ordenes_produccion`

Asigna un lote a un módulo: cuánto hay que sacar, para cuándo y a qué valor de
maquila. No lleva ficha técnica (vive en el lote) ni detalle por prenda: la
producción se mide por lote, que es como se mide en planta.

`creado_por` no se pide en el formulario: lo pone el backend con el usuario de
la sesión. `valor_maquila_unidad` dividido entre el SAM da la **tarifa por
minuto**, la métrica económica real de una maquila.

Ese mismo `valor_maquila_unidad` es el `$ / unidad` del tablero de pared: se
copia a cada registro como `precio_aplicado` y de ahí salen la meta de
facturación, la facturación real y el % entre las dos. Es lo que convierte
"se perdieron 20 minutos" en "dejamos de facturar $180.000".

### Incidencias → `causas_desviacion`

El catálogo de botones que ve la digitadora cuando una hora no alcanza la meta:
montaje, cambio de referencia, curva de aprendizaje, daño de máquina, corte de
energía, falta de material, ausencia de personal, reproceso por calidad,
problema operativo, otra.

`tipo` separa `PLANEADA` (montaje, curva de aprendizaje), `INTERNA`
(responsabilidad de la empresa) y **`EXTERNA`** (del cliente: falta de
material, corte de energía). Esa última categoría es tiempo perdido negociable,
y hoy la empresa lo absorbe en silencio porque nadie lo mide.

`requiere_nota` obliga a escribir la explicación adicional, y se exige donde el
nombre de la causa no alcanza para entender qué pasó.

---

## 6. Cambios del flujo de jornada (2026-09)

| Cambio | Por qué |
| --- | --- |
| **Nuevas `jornada_modulo` + `jornada_operaria`, reemplazan a `asignaciones_modulo`** | Aquella respondía "quién está adscrito a este módulo en general", con rangos de fechas abiertos; el dato que el sistema necesita es "quién está HOY", que es lo único que permite repartir la producción de la hora. Y trae el concepto de **operaria anónima**, que es el caso normal a primera hora |
| **`marcas` se fusionó dentro de `clientes`** | No había ninguna llave entre las dos: la relación solo existía dentro de un pedido. En planta nadie dice "el lote de Crystal para la marca GEF", dice "el lote de GEF" |
| **`referencias` y `fichas_tecnicas` (+3 hijas) se fusionaron dentro de `lotes`** | Cada lote llega con su propia ficha en papel y todas son distintas, así que el catálogo obligaba a crear una referencia y una ficha —para usarlas una sola vez— antes de poder registrar el lote. Ahora la ficha es la imagen que viene con el lote |
| `lotes.sam_pactado` | El SAM se mudó desde `fichas_tecnicas`: viene con el lote, que es donde la empresa lo recibe |
| **`pedidos` se fusionó dentro de `lotes`** | Para la empresa el pedido y el lote son la misma información de negocio, y tenerlos separados obligaba a digitar dos veces el mismo compromiso. El folio y las tres fechas pasaron a ser columnas del lote, y su ENUM de estados se unió con el de `lotes` |
| **Se eliminaron `detalle_pedido`, `prendas` y `detalle_orden_produccion`** | El diseño conceptual ya tenía el SKU marcado como sobredimensionado (§9.1). Lo que se quería de él quedó en `lotes.id_tipo_prenda` y en la nueva `lote_detalle_talla_color`, que sí cuelga del lote |
| `tallas`, `colores` y `tipos_prenda` **se conservan** | Siguen siendo los catálogos del producto; lo que desapareció es `prendas`, que era el SKU armado con los tres. Ahora se usan desde el formulario del lote, sin pantalla propia |
| **Dashboard + Indicadores + Reportes → un solo `Panel`** | Los tres leían las mismas vistas y respondían a la misma pregunta desde tres entradas de menú. Se fusionaron en una pantalla de tres pestañas, y con ellos dos pares de componentes duplicados (`KPICards`/`IndicadoresKpis` y `ProductivityCharts`/`ReportesGraficos`) |
| `registros_horarios.id_jornada_modulo` (NOT NULL) e `id_lote` | Una hora solo existe dentro de una jornada. `id_lote` es la foto de lo que se estaba confeccionando, para que cambiar de referencia a mitad del día no reescriba las horas ya capturadas |
| Rol `Supervisor` → **`Digitadora`**; `operarios.cargo` pierde `SUPERVISOR` | La jornada la configura la digitadora desde la app, no una supervisora por módulo |
| `vw_productividad_operario` reconstruida sobre `jornada_operaria` | Con rangos abiertos, una asignación sin fecha de fin atribuía producción para siempre, incluso a quien ya no estaba en ese módulo |
| Corregido en `vw_avance_orden`: `personas_presentes * 60` → `* minutos_franja` | El 60 fijo inflaba la franja de 40 y hacía ver la orden menos eficiente de lo que fue |

---

## 6c. La orden de producción se soltó del módulo (2026-09)

| Cambio | Por qué |
| --- | --- |
| `ordenes_produccion.id_modulo` borrada | Era `NOT NULL`: obligaba a decidir el módulo en el escritorio, días antes de que la planta supiera cuál se desocupa |
| El vínculo vive en `jornada_modulo.id_orden_produccion` | Es el único sitio donde un módulo toma una orden: al abrir la jornada |
| `vw_avance_orden` deduce el módulo | `id_modulo` y `codigo_modulo` siguen ahí, pero salen de quien la tomó. Nueva columna `asignacion`: `LIBRE` o `TOMADA` |
| Una orden = un módulo, validado al abrir | No es un índice único porque el mismo módulo abre una jornada por día sobre la misma orden. Lo que no puede haber es dos módulos: el backend responde 409 |
| El formulario de la orden perdió el selector de módulo | Y la estimación de capacidad pasó a ser un supuesto editable («si la toma un módulo de N operarias») en vez de leer la capacidad del módulo asignado |

La migración `00c_migracion_ordenes_libres.sql` **primero anota la orden en las
jornadas que ya corrían ese lote** y solo después suelta la columna, así que la
asignación que existía no se pierde: cambia de sitio.

---

## 6b. Los parámetros del módulo que eran cálculos (2026-09)

El tablero real de la empresa marca en **amarillo** lo que alguien digita y en
**verde** lo que sale solo. Tres columnas de `modulos` estaban del lado
equivocado de esa línea:

| Cambio | Por qué |
| --- | --- |
| `modulos.horas_jornada`, `horas_semanales` y `eficiencia_esperada` borradas | En la hoja las horas del día y la eficiencia son celdas verdes. La columna decía 9 horas mientras la planta trabaja 8.67, y la eficiencia escrita a mano contradecía a la calculada |
| Vista `vw_horario_jornada` | El horario es de la **planta**, no de cada módulo. Si cambia, se cambian filas de `jornada_franjas` y la vista se mueve sola |
| `GET /jornada/horario` reemplaza a `GET /captura/jornadas` | Hacían lo mismo. El viejo no lo llamaba nadie y repetía en SQL la agregación que ahora es la vista |
| `/indicadores/estado-modulos` devuelve minutos, facturación y los dos SAM | La pantalla de Módulos mostraba solo producido y eficiencia; el resto del tablero de la empresa ya estaba calculado en `vw_estado_modulo_dia` y nadie lo leía |
| Eficiencia de planta pasa a ser ponderada | Sumaba los % de cada módulo y dividía por 12, dándole el mismo peso a uno de 3 personas que a uno de 12. Ahora es `minutos_ganados / minutos_disponibles`, igual que las vistas |
| La estimación de la orden usa los minutos reales | Multiplicaba por `horas_jornada` y por un 60 fijo. Con una hora de más por día comprometía fechas de entrega que no daban |

---

## 7. Cambios respecto al modelo original

| Cambio | Por qué |
| --- | --- |
| **Nueva `registros_horarios`, reemplaza a `producciones`** | `producciones` exigía operario y detalle de prenda por registro; la planta mide **el módulo por hora**, y pedir más rompía la restricción de 15 segundos de la captura |
| **Nueva `causas_desviacion`** | Sin causa, un 18% no se puede accionar. El tablero físico ya la registraba ("Montaje") |
| `modulos.umbral_cumplimiento`, `orden_visual` | Disparo de la causa y orden del recorrido |
| **Nuevas `jornadas` / `jornada_franjas` / `jornada_dia`** | La planta trabaja 520 minutos de martes a viernes y 440 el sábado, y la última franja del día no dura 60. El alto de la rejilla y el ancho de cada franja son datos, no código |
| **Nueva `registro_minutos_perdidos`** | El Pareto *deducía* el tiempo perdido restando lo ganado a lo disponible, que mezcla una parada de máquina con un módulo que va lento. Ahora se mide |
| `registros_horarios.minutos_franja` y `precio_aplicado` | Foto del ancho de la franja y de la tarifa al momento de capturar, igual que `sam_aplicado`: reconfigurar el horario o renegociar no reescribe el pasado |
| `tiempo_estandar_minutos` → **`sam_pactado`** | El nombre dice lo que el dato es: un acuerdo comercial, no una constante |
| `ordenes_produccion.valor_maquila_unidad` | Permite la tarifa por minuto |
| Se eliminó `metas_produccion` | La meta se **calcula** (`personas × minutos de la franja / SAM`); guardarla a mano la dejaba desactualizada |
| Vistas nuevas: `vw_registro_horario`, `vw_estado_modulo_dia`, `vw_estado_planta_hora`, `vw_perdidas_por_causa`, `vw_curva_arranque` | El front pedía avance, causas y curva de arranque; nada de eso existía |
| Vista nueva `vw_tablero_modulo_dia` | El tablero de un módulo franja por franja **con acumulados**: la digitadora no quiere saber solo cómo le fue en la hora, quiere saber cómo va el día mientras todavía puede reaccionar |

---

## 8. Qué queda fuera

- **Exportación a Excel/PDF**: los botones existen en Reportes, la generación
  del archivo no está implementada.
- **Envío de correo en la recuperación de contraseña**: el token se imprime en
  la consola del backend en vez de enviarse por correo.
- **Modo offline de la captura**: hoy la rejilla necesita conexión. El diseño
  conceptual lo pide (§4) porque la planta tiene zonas sin señal.
