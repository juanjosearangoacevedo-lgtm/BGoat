# BGoat — Mapeo Frontend ↔ API ↔ Base de datos

Documento de referencia: qué pantalla consume qué endpoint y qué tabla o vista.
**La regla es que el frontend usa los nombres de columna reales de MySQL**, sin
traducir a inglés ni inventar campos.

- Diseño conceptual: [`../DISENO_CONCEPTUAL.md`](../DISENO_CONCEPTUAL.md)
- Esquema: [`01_schema_bgoat.sql`](01_schema_bgoat.sql) — 27 tablas, 7 vistas
- Catálogos base: [`02_seed_bgoat.sql`](02_seed_bgoat.sql)
- Datos de demostración: [`03_demo_bgoat.sql`](03_demo_bgoat.sql)
- Rutas: `frontend/src/shared/services/endpoints.js` y `backend/src/routes/index.js`

---

## 1. El centro del modelo: `registros_horarios`

Una fila = **un módulo en una hora de la jornada**. Es la digitalización exacta
del tablero de pared, y de ella sale todo lo demás.

```
UNIQUE (id_modulo, fecha, hora_jornada)   -- una celda de la rejilla
```

| Columna | Quién la aporta |
| --- | --- |
| `id_modulo`, `fecha`, `hora_jornada` | La celda que la supervisora tocó |
| `personas_presentes` | Ella (precargado con la hora anterior) |
| `unidades_producidas`, `unidades_defectuosas` | Ella |
| `id_causa`, `nota` | Ella, **solo si el cumplimiento cae bajo el umbral** |
| `id_orden_produccion`, `sam_aplicado` | **El backend**, desde la orden activa del módulo |
| `registrado_por`, `fecha_registro` | El backend, desde la sesión |

`sam_aplicado` se copia en el registro para que el histórico no cambie si el SAM
se renegocia después.

### Los cálculos (los hace la base, no el front)

```
minutos_disponibles = personas_presentes * 60
meta_hora           = minutos_disponibles / sam_aplicado
cumplimiento        = unidades_producidas / meta_hora
eficiencia          = (unidades_producidas * sam_aplicado) / minutos_disponibles
sam_observado       = minutos_disponibles / unidades_producidas
```

---

## 2. Mapa pantalla → endpoint → origen

| Pantalla | Endpoint | Tabla / vista |
| --- | --- | --- |
| Login / registro / recuperación | `/auth/*` | `usuarios`, `recuperacion_claves`, `sesiones_acceso` |
| **Captura de Producción** | `GET/PUT /captura` | **`registros_horarios`** + `vw_registro_horario` |
| Dashboard | `/indicadores/resumen`, `/estado-modulos`, `/ordenes-riesgo` | `vw_estado_planta_hora`, `vw_estado_modulo_dia`, `vw_avance_orden` |
| Indicadores | `/indicadores/causas`, `/sam`, `/tendencia`, `/planta-hora` | `vw_perdidas_por_causa`, `vw_avance_orden`, `vw_estado_modulo_dia` |
| Reportes | `/indicadores/productividad-*` | `vw_estado_modulo_dia`, `vw_productividad_operario` |
| Órdenes | `/ordenes-produccion` | `ordenes_produccion` + `detalle_orden_produccion` + `vw_avance_orden` |
| Detalle de orden | `/ordenes-produccion/:id`, `/:id/curva` | `vw_avance_orden`, `vw_curva_arranque`, `vw_registro_horario` |
| Módulos | `/modulos` + `/indicadores/estado-modulos` | `modulos` + `vw_estado_modulo_dia` |
| Operarios | `/operarios` | `operarios` |
| Asignación operativa | `/asignaciones-modulo` | `asignaciones_modulo` |
| Causas de desviación | `/causas` | `causas_desviacion` |
| Lotes | `/lotes` | `lotes` |
| Fichas técnicas | `/fichas-tecnicas` (+ `/operaciones`, `/materiales`, `/medidas`) | `fichas_tecnicas` y sus tres tablas hijas |
| Referencias | `/referencias` | `referencias` |
| Prendas | `/prendas` | `prendas` |
| Clientes / Marcas / Pedidos | `/clientes`, `/marcas`, `/pedidos` | tablas homónimas |
| Usuarios / Roles / Permisos | `/usuarios`, `/roles`, `/permisos` | `usuarios`, `roles`, `permisos`, `rol_permiso` |

---

## 3. Las vistas y para qué existe cada una

| Vista | Responde a |
| --- | --- |
| `vw_registro_horario` | La rejilla con meta, cumplimiento, eficiencia y SAM observado ya calculados |
| `vw_estado_modulo_dia` | ¿Cómo le fue a cada módulo hoy? |
| `vw_estado_planta_hora` | ¿La caída fue de un módulo o de toda la planta a esa hora? |
| `vw_avance_orden` | ¿Cuánto lleva cada orden y llega a la fecha? |
| `vw_perdidas_por_causa` | ¿En qué se nos van los minutos? (Pareto) |
| `vw_curva_arranque` | ¿Cuánto tarda un módulo en llegar a régimen con una referencia nueva? |
| `vw_productividad_operario` | Producción **atribuida** por operario (el módulo se mide completo y se reparte entre las personas asignadas) |

---

## 4. Campos por módulo

### Usuarios → `usuarios`

`clave` (el formulario) → `clave_hash` (la tabla). **El front envía la
contraseña en claro; el backend calcula el bcrypt.** Al editar, dejar la clave
vacía significa "no cambiarla".
`intentos_fallidos` y `bloqueado_hasta` los administra el backend.

### Permisos → `permisos` + `rol_permiso`

Matriz de `modulo` × `accion` (`VER, CREAR, EDITAR, ELIMINAR, EXPORTAR`).
**82 permisos sobre 19 módulos.** No todos admiten las 5 acciones: los tableros
solo `VER` y `EXPORTAR`; Captura y Permisos no tienen `ELIMINAR`.
El cuerpo del guardado es `{ permisos: [id_permiso, ...] }`.
El mismo catálogo protege cada ruta de la API (`requierePermiso`).

### Fichas técnicas → `fichas_tecnicas`

`sam_pactado` es **el SAM**: los minutos que el cliente paga por unidad. Es la
línea de rentabilidad del contrato y el dato con el que se calcula la meta.
Tablas hijas: `ficha_tecnica_operaciones`, `ficha_tecnica_materiales`,
`ficha_tecnica_medidas`.

### Módulos → `modulos`

`umbral_cumplimiento` es el % por debajo del cual la app **exige la causa**
(validado en el backend, no solo en la UI). `capacidad_operarios`,
`horas_semanales`, `horas_jornada` y `eficiencia_esperada` sirven para estimar
la capacidad al comprometer una fecha.

`horas_jornada` **ya no define el alto de la rejilla**: eso lo dan las franjas
del día (ver abajo), que cambian entre semana y sábado. Quedó como cifra de
planeación.

### Jornadas → `jornadas` + `jornada_franjas` + `jornada_dia`

El horario de la planta. `jornada_dia` dice qué jornada rige cada día de la
semana (1 = lunes … 7 = domingo; un día sin fila no se trabaja) y
`jornada_franjas` trae las columnas de la rejilla con su ancho real:

| Jornada | Franjas | Minutos |
| --- | --- | --- |
| `MAR_VIE` | 8 de 60 + 1 de 40 (2:00pm-2:40pm) | 520 |
| `SABADO` | 7 de 60 + 1 de 20 (1:00pm-1:20pm) | 440 |

`minutos` es lo que fija la meta. Con un 60 fijo, la última franja del día
pedía una meta que nunca fue alcanzable y el módulo aparecía por debajo del
umbral sin serlo.

Las franjas de 0 minutos del tablero de pared (2:40pm-3:00pm y 1:20pm-1:40pm)
no se cargan: son el cierre del turno, no se produce en ellas, y una franja de
meta 0 solo ensucia el promedio del día.

### Minutos perdidos → `registro_minutos_perdidos`

Los minutos que el módulo estuvo parado en esa franja, abiertos por causa. El
tablero de pared trae tres columnas fijas —máquina, calidad, montaje/insumos—
y aquí son N causas del catálogo; esas tres siguen saliendo como pivot en
`vw_registro_horario`, y `minutos_otras` recoge cualquiera que se agregue
después.

`minutos` son minutos **de módulo** (lo que la supervisora observa).
Multiplicados por las personas presentes dan los minutos-persona, que es la
unidad de `minutos_disponibles` y la columna "Total Minutos" del tablero.

Registrar minutos **no baja la meta**: la meta la fija la franja. El tiempo
perdido explica el hueco, no lo perdona.

### Órdenes → `ordenes_produccion` + `detalle_orden_produccion`

`creado_por` no se pide en el formulario: lo pone el backend con el usuario de
la sesión. `valor_maquila_unidad` dividido entre el SAM da la **tarifa por
minuto**, la métrica económica real de una maquila.

Ese mismo `valor_maquila_unidad` es el `$ / unidad` del tablero de pared: se
copia a cada registro como `precio_aplicado` y de ahí salen la meta de
facturación, la facturación real y el % entre las dos. Es lo que convierte
"se perdieron 20 minutos" en "dejamos de facturar $180.000".

### Causas → `causas_desviacion`

`tipo` separa `PLANEADA` (montaje, curva de aprendizaje), `INTERNA`
(responsabilidad de la empresa) y **`EXTERNA`** (del cliente: falta de insumo,
corte de energía). Esa última categoría es tiempo perdido negociable, y hoy la
empresa lo absorbe en silencio porque nadie lo mide.

---

## 5. Cambios respecto al modelo anterior

| Cambio | Por qué |
| --- | --- |
| **Nueva `registros_horarios`, reemplaza a `producciones`** | `producciones` exigía operario y detalle de prenda por registro; la planta mide **el módulo por hora**, y pedir más rompía la restricción de 15 segundos de la captura |
| **Nueva `causas_desviacion`** | Sin causa, un 18% no se puede accionar. El tablero físico ya la registraba ("Montaje") |
| `modulos.umbral_cumplimiento`, `orden_visual` | Disparo de la causa y orden del recorrido |
| **Nuevas `jornadas` / `jornada_franjas` / `jornada_dia`** | La planta trabaja 520 minutos de martes a viernes y 440 el sábado, y la última franja del día no dura 60. El alto de la rejilla y el ancho de cada franja son datos, no código |
| **Nueva `registro_minutos_perdidos`** | El Pareto *deducía* el tiempo perdido restando lo ganado a lo disponible, que mezcla una parada de máquina con un módulo que va lento. Ahora se mide |
| `registros_horarios.minutos_franja` y `precio_aplicado` | Foto del ancho de la franja y de la tarifa al momento de capturar, igual que `sam_aplicado`: reconfigurar el horario o renegociar no reescribe el pasado |
| `fichas_tecnicas.tiempo_estandar_minutos` → **`sam_pactado`** | El nombre dice lo que el dato es: un acuerdo comercial, no una constante |
| `ordenes_produccion.valor_maquila_unidad` | Permite la tarifa por minuto |
| `detalle_pedido.precio_unitario` → `valor_maquila_unidad` | Una maquila cobra el servicio, no vende la prenda |
| Se eliminó `prendas.precio` | La prenda no tiene precio de venta en este negocio |
| Se eliminó `metas_produccion` | La meta se **calcula** (`personas × minutos de la franja / SAM`); guardarla a mano la dejaba desactualizada |
| Se eliminó `detalle_orden_produccion.meta_por_hora` | Misma razón |
| Vistas nuevas: `vw_registro_horario`, `vw_estado_modulo_dia`, `vw_estado_planta_hora`, `vw_perdidas_por_causa`, `vw_curva_arranque` | El front pedía avance, causas y curva de arranque; nada de eso existía |
| Vista nueva `vw_tablero_modulo_dia` | El tablero de un módulo franja por franja **con acumulados**: la supervisora no quiere saber solo cómo le fue en la hora, quiere saber cómo va el día mientras todavía puede reaccionar |

---

## 6. Qué queda fuera

- **Exportación a Excel/PDF**: los botones existen en Reportes, la generación
  del archivo no está implementada.
- **Envío de correo en la recuperación de contraseña**: el token se imprime en
  la consola del backend en vez de enviarse por correo.
- **Modo offline de la captura**: hoy la rejilla necesita conexión. El diseño
  conceptual lo pide (§4) porque la planta tiene zonas sin señal.
