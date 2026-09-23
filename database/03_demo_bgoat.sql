-- =====================================================================
-- BGoat - Datos de demostracion (OPCIONAL)
--
--   cd backend && npm run db:setup -- --demo
--
-- Crea una planta de 12 modulos y reproduce el tablero de la foto:
-- MODULO #2, cliente GEF, referencia 9703, SAM 6.5, 3 operarias,
-- dos horas de montaje y la curva de arranque 11% -> 14% -> 16% -> 18%.
--
-- Todo se ancla a CURDATE() para que el tablero del dia tenga datos.
-- Es seguro volver a ejecutarlo: usa INSERT IGNORE y resuelve los ids
-- por sus llaves naturales.
-- =====================================================================

USE `bgoat`;

-- ---------------------------------------------------------------------
-- Clientes
--
--   Una fila = un cliente-marca. Las tres primeras marcas son de
--   Crystal S.A.S.: por eso comparten NIT y contacto, y por eso el
--   indice unico de la tabla va sobre el nombre y no sobre el documento.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `clientes`
  (`nombre`, `descripcion`, `razon_social`, `tipo_documento`, `numero_documento`,
   `telefono`, `correo`, `direccion`) VALUES
  ('GEF',           'Ropa interior y basicos',            'Crystal S.A.S.',        'NIT', '900123456-1', '6044441122', 'compras@crystal.com.co',  'Calle 30 #45-12, Medellin'),
  ('Punto Blanco',  'Ropa interior masculina y femenina', 'Crystal S.A.S.',        'NIT', '900123456-1', '6044441122', 'compras@crystal.com.co',  'Calle 30 #45-12, Medellin'),
  ('Baby Fresh',    'Ropa infantil',                      'Crystal S.A.S.',        'NIT', '900123456-1', '6044441122', 'compras@crystal.com.co',  'Calle 30 #45-12, Medellin'),
  ('Arturo Calle',  'Ropa exterior masculina',            'Arturo Calle S.A.S.',   'NIT', '860002964-4', '6044443344', 'maquila@arturocalle.com', 'Autopista Norte, Bogota');

-- ---------------------------------------------------------------------
-- Modulos de la planta (12, como en la empresa real)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `modulos`
  (`codigo`, `nombre`, `ubicacion`, `capacidad_operarios`,
   `umbral_cumplimiento`, `orden_visual`) VALUES
  ('MOD-01', 'Modulo 01', 'Seccion A', 12, 85.00, 1),
  ('MOD-02', 'Modulo 02', 'Seccion A',  3, 85.00, 2),
  ('MOD-03', 'Modulo 03', 'Seccion A', 10, 85.00, 3),
  ('MOD-04', 'Modulo 04', 'Seccion B',  8, 85.00, 4),
  ('MOD-05', 'Modulo 05', 'Seccion B',  8, 85.00, 5),
  ('MOD-06', 'Modulo 06', 'Seccion B', 10, 85.00, 6),
  ('MOD-07', 'Modulo 07', 'Seccion C',  6, 85.00, 7),
  ('MOD-08', 'Modulo 08', 'Seccion C',  6, 85.00, 8),
  ('MOD-09', 'Modulo 09', 'Seccion C',  9, 85.00, 9),
  ('MOD-10', 'Modulo 10', 'Seccion D',  9, 85.00, 10),
  ('MOD-11', 'Modulo 11', 'Seccion D',  7, 85.00, 11),
  ('MOD-12', 'Modulo 12', 'Seccion D',  7, 85.00, 12);

-- ---------------------------------------------------------------------
-- Operarias
--
--   El catalogo es opcional para arrancar: la jornada admite operarias
--   anonimas. Estas existen para poder mostrar la atribucion por
--   persona en los indicadores.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `operarios`
  (`codigo_operario`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`,
   `fecha_ingreso`, `cargo`, `especialidad`) VALUES
  ('OP-001', 'CC', '43567891', 'Luz Eliana',  'Martinez Ramos',  '2021-03-01', 'OPERARIO', 'Plana'),
  ('OP-002', 'CC', '43567892', 'Maria',       'Gonzalez Rios',   '2021-05-10', 'OPERARIO', 'Fileteadora'),
  ('OP-003', 'CC', '43567893', 'Sandra',      'Ospina Vera',     '2022-01-17', 'OPERARIO', 'Collareta'),
  ('OP-004', 'CC', '43567894', 'Claudia',     'Restrepo Loaiza', '2022-08-02', 'OPERARIO', 'Plana'),
  ('OP-005', 'CC', '43567895', 'Diana',       'Zapata Muriel',   '2023-02-13', 'OPERARIO', 'Fileteadora'),
  ('OP-006', 'CC', '43567896', 'Carlos',      'Agudelo Perez',   '2020-06-01', 'MECANICO', 'Mantenimiento de maquinas');

-- ---------------------------------------------------------------------
-- Lotes
--
--   Cada lote trae todo lo del producto: el folio del pedido, la
--   referencia, el tipo de prenda, el SAM pactado y su ficha tecnica.
--   `ruta_imagen` y `ruta_documento_pdf` quedan vacias porque los
--   archivos se suben desde la pantalla del lote.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `lotes`
  (`codigo_lote`, `numero_pedido`, `id_cliente`, `codigo_referencia`, `nombre_referencia`,
   `id_tipo_prenda`, `sam_pactado`, `material_principal`,
   `fecha_pedido`, `fecha_recepcion`, `fecha_entrega_programada`, `fecha_inicio`,
   `cantidad_programada`, `cantidad_recibida`, `estado`, `observaciones`)
SELECT v.codigo, v.pedido, c.id_cliente, v.ref, v.nombre_ref,
       tp.id_tipo_prenda, v.sam, v.material,
       DATE_SUB(CURDATE(), INTERVAL v.pedido_dias DAY),
       DATE_SUB(CURDATE(), INTERVAL v.recibido DAY),
       DATE_ADD(CURDATE(), INTERVAL v.entrega DAY),
       DATE_SUB(CURDATE(), INTERVAL v.inicio DAY),
       v.cantidad, v.cantidad, v.estado, v.nota
FROM (
  SELECT 'LOT-9703-01'  AS codigo, 'PED-2026-001' AS pedido, 'GEF'          AS cliente, '9703'   AS ref, 'Camiseta cuello redondo' AS nombre_ref, 'Camiseta'      AS tipo, 6.50 AS sam, 'Algodon 30/1'        AS material,  1200 AS cantidad, 10 AS pedido_dias, 3 AS recibido, 12 AS entrega, 0 AS inicio, 'EN_PROCESO' AS estado, 'Camiseta basica en algodon' AS nota UNION ALL
  SELECT 'LOT-9812-01',           'PED-2026-002',           'GEF',                      '9812',           'Boxer algodon',                       'Ropa interior',        4.20,       'Algodon elastizado',           12000,             14,              5,              20,             4,          'EN_PROCESO',          'Boxer masculino elasticado' UNION ALL
  SELECT 'LOT-PB450-01',          'PED-2026-003',           'Punto Blanco',             'PB-450',         'Camiseta interior',                   'Ropa interior',        5.80,       'Algodon peinado',               6000,             12,              5,              15,             4,          'EN_PROCESO',          'Camiseta interior cuello V' UNION ALL
  SELECT 'LOT-BF220-01',          'PED-2026-004',           'Baby Fresh',               'BF-220',         'Conjunto bebe',                       'Sudadera',             9.40,       'Algodon perchado',              3500,             12,              5,               9,             4,          'EN_PROCESO',          'Conjunto dos piezas' UNION ALL
  -- Recien llegado y sin empezar: su orden se queda LIBRE, esperando a
  -- que un modulo la tome. Es el estado nuevo que hay que poder ver.
  SELECT 'LOT-AC330-01',          'PED-2026-005',           'Arturo Calle',             'AC-330',         'Camisa manga larga',                  'Camisa',               8.10,       'Popelina algodon',              2400,              5,              1,              18,             0,          'REGISTRADO',          'Llego ayer, sin asignar a ningun modulo'
) v
JOIN `clientes` c ON c.nombre = v.cliente
LEFT JOIN `tipos_prenda` tp ON tp.nombre = v.tipo;

-- Desglose por talla y color del primer lote.
--
-- Es OPCIONAL: los otros tres lotes quedan sin desglose a proposito,
-- para que la demo muestre los dos casos. Cero filas es un estado
-- valido y no bloquea nada: la produccion se mide por lote.
INSERT IGNORE INTO `lote_detalle_talla_color` (`id_lote`, `id_talla`, `id_color`, `cantidad`)
SELECT l.id_lote, t.id_talla, co.id_color, v.cantidad
FROM (
  SELECT 'S'  AS talla, 'Negro'  AS color, 200 AS cantidad UNION ALL
  SELECT 'M',           'Negro',           400 UNION ALL
  SELECT 'L',           'Negro',           300 UNION ALL
  SELECT 'M',           'Blanco',          200 UNION ALL
  SELECT 'L',           'Blanco',          100
) v
JOIN `lotes` l ON l.codigo_lote = 'LOT-9703-01'
JOIN `tallas` t ON t.nombre = v.talla
JOIN `colores` co ON co.nombre = v.color;

-- ---------------------------------------------------------------------
-- Ordenes de produccion
--   Asignan cada lote a un modulo con su valor de maquila.
-- ---------------------------------------------------------------------
-- La orden ya no nombra modulo: nace libre. Las cuatro primeras las toma
-- un modulo mas abajo, al abrir su jornada; OP-2026-0005 se queda libre a
-- proposito, para que se vea el estado LIBRE en el tablero de ordenes.
INSERT IGNORE INTO `ordenes_produccion`
  (`numero_orden`, `id_lote`, `fecha_inicio_programada`, `fecha_fin_programada`,
   `cantidad_programada`, `valor_maquila_unidad`, `prioridad`, `estado`, `creado_por`)
SELECT v.numero, l.id_lote,
       DATE_SUB(CURDATE(), INTERVAL v.desde DAY),
       DATE_ADD(CURDATE(), INTERVAL v.dias DAY),
       l.cantidad_programada, v.valor, v.prioridad, v.estado, u.id_usuario
FROM (
  SELECT 'OP-2026-0001' AS numero, 'LOT-9703-01'  AS lote, 2800.00 AS valor, 'ALTA'    AS prioridad, 0 AS desde, 10 AS dias, 'EN_PROCESO' AS estado UNION ALL
  SELECT 'OP-2026-0002',           'LOT-9812-01',          1900.00,          'MEDIA',               4,           8,          'EN_PROCESO' UNION ALL
  SELECT 'OP-2026-0003',           'LOT-PB450-01',         2400.00,          'ALTA',                4,           3,          'EN_PROCESO' UNION ALL
  SELECT 'OP-2026-0004',           'LOT-BF220-01',         3900.00,          'URGENTE',             4,           2,          'EN_PROCESO' UNION ALL
  SELECT 'OP-2026-0005',           'LOT-AC330-01',         4100.00,          'MEDIA',               0,          12,          'PENDIENTE'
) v
JOIN `lotes` l ON l.codigo_lote = v.lote
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com';

-- ---------------------------------------------------------------------
-- Jornadas: lo que la digitadora configuro cada dia
--
--   Una por (modulo, fecha). Las de dias pasados quedan CERRADAS; la de
--   hoy queda ABIERTA, que es como la encuentra la digitadora al entrar.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `jornada_modulo`
  (`id_modulo`, `fecha`, `id_lote`, `id_orden_produccion`, `cantidad_operarias`,
   `estado`, `abierta_por`, `fecha_apertura`)
SELECT m.id_modulo, DATE_SUB(CURDATE(), INTERVAL d.dia DAY),
       o.id_lote, o.id_orden_produccion, cfg.personas,
       IF(d.dia = 0, 'ABIERTA', 'CERRADA'), u.id_usuario,
       TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL d.dia DAY), '05:50:00')
FROM (
  SELECT 'MOD-02' AS modulo, 'OP-2026-0001' AS orden,  3 AS personas, 0 AS dias_atras UNION ALL
  SELECT 'MOD-01',           'OP-2026-0002',          12,             5 UNION ALL
  SELECT 'MOD-03',           'OP-2026-0003',          10,             5 UNION ALL
  SELECT 'MOD-04',           'OP-2026-0004',           8,             5
) cfg
JOIN `modulos` m ON m.codigo = cfg.modulo
JOIN `ordenes_produccion` o ON o.numero_orden = cfg.orden
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN (
  SELECT 0 AS dia UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
  SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) d ON d.dia <= cfg.dias_atras;

-- ---------------------------------------------------------------------
-- La nomina del MODULO 02 de hoy
--
--   Dos operarias identificadas y una anonima: es el caso real. La
--   digitadora sabe que hay tres maquinas andando mucho antes de saber
--   el nombre de las tres, y el sistema no la obliga a inventarselo.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `jornada_operaria` (`id_jornada_modulo`, `numero`, `id_operario`)
SELECT jm.id_jornada_modulo, v.numero, o.id_operario
FROM `jornada_modulo` jm
JOIN `modulos` m ON m.id_modulo = jm.id_modulo AND m.codigo = 'MOD-02'
JOIN (
  SELECT 1 AS numero, 'OP-002' AS codigo UNION ALL
  SELECT 2,           'OP-003'
) v
JOIN `operarios` o ON o.codigo_operario = v.codigo
WHERE jm.fecha = CURDATE();

-- La tercera queda sin operaria: cuenta para los minutos disponibles,
-- pero no hay a quien atribuirle la produccion.
INSERT IGNORE INTO `jornada_operaria` (`id_jornada_modulo`, `numero`, `id_operario`)
SELECT jm.id_jornada_modulo, 3, NULL
FROM `jornada_modulo` jm
JOIN `modulos` m ON m.id_modulo = jm.id_modulo AND m.codigo = 'MOD-02'
WHERE jm.fecha = CURDATE();

-- ---------------------------------------------------------------------
-- EL TABLERO DE LA FOTO: MODULO #2, hoy
--
--   horas 1 y 2 -> montaje del modulo, cero produccion
--   horas 3 a 6 -> curva de arranque: 3, 4, 3 y 5 unidades
--   hora 5      -> solo 2 personas (por eso la meta baja de 28 a 18)
--   horas 7 a 9 -> pendientes, para poder capturarlas desde la app
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `registros_horarios`
  (`id_jornada_modulo`, `id_modulo`, `fecha`, `hora_jornada`, `minutos_franja`,
   `id_lote`, `id_orden_produccion`, `personas_presentes`, `unidades_producidas`,
   `unidades_defectuosas`, `sam_aplicado`, `precio_aplicado`, `id_causa`, `nota`, `registrado_por`)
SELECT jm.id_jornada_modulo, jm.id_modulo, jm.fecha, v.hora,
       COALESCE(jf.minutos, 60),
       jm.id_lote, jm.id_orden_produccion, v.personas, v.producidas,
       v.defectuosas, l.sam_pactado, o.valor_maquila_unidad, c.id_causa, v.nota, u.id_usuario
FROM (
  SELECT 1 AS hora, 3 AS personas, 0 AS producidas, 0 AS defectuosas, 'MONTAJE'     AS causa, 'Montaje del modulo para la referencia 9703' AS nota UNION ALL
  SELECT 2,          3,             0,               0,                'MONTAJE',         'Montaje del modulo para la referencia 9703' UNION ALL
  SELECT 3,          3,             3,               0,                'APRENDIZAJE',     'Primera hora de produccion de la referencia' UNION ALL
  SELECT 4,          3,             4,               0,                'APRENDIZAJE',     NULL UNION ALL
  SELECT 5,          2,             3,               0,                'AUSENCIA',        'Una operaria en permiso medico' UNION ALL
  SELECT 6,          3,             5,               1,                'APRENDIZAJE',     NULL
) v
JOIN `jornada_modulo` jm ON jm.fecha = CURDATE()
JOIN `modulos` m ON m.id_modulo = jm.id_modulo AND m.codigo = 'MOD-02'
JOIN `lotes` l ON l.id_lote = jm.id_lote
JOIN `ordenes_produccion` o ON o.id_orden_produccion = jm.id_orden_produccion
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN `causas_desviacion` c ON c.codigo = v.causa
LEFT JOIN `jornada_dia` jd ON jd.dia_semana = WEEKDAY(jm.fecha) + 1
LEFT JOIN `jornada_franjas` jf ON jf.id_jornada = jd.id_jornada AND jf.orden_franja = v.hora;

-- Los minutos que el modulo estuvo parado en las dos horas de montaje.
-- Es lo que convierte "no produjo nada" en "se fueron 120 minutos en
-- montaje, y eso vale tanto".
INSERT IGNORE INTO `registro_minutos_perdidos` (`id_registro`, `id_causa`, `minutos`)
SELECT r.id_registro, c.id_causa, 60
FROM `registros_horarios` r
JOIN `modulos` m ON m.id_modulo = r.id_modulo AND m.codigo = 'MOD-02'
JOIN `causas_desviacion` c ON c.codigo = 'MONTAJE'
WHERE r.fecha = CURDATE() AND r.hora_jornada IN (1, 2);

-- ---------------------------------------------------------------------
-- Produccion de los otros modulos, para que los indicadores y las
-- comparaciones tengan con que trabajar.
--
-- Eficiencias distintas a proposito: asi la comparacion entre modulos
-- y el historico dicen algo.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `registros_horarios`
  (`id_jornada_modulo`, `id_modulo`, `fecha`, `hora_jornada`, `minutos_franja`,
   `id_lote`, `id_orden_produccion`, `personas_presentes`, `unidades_producidas`,
   `unidades_defectuosas`, `sam_aplicado`, `precio_aplicado`, `registrado_por`)
SELECT jm.id_jornada_modulo, jm.id_modulo, jm.fecha, h.hora,
       COALESCE(jf.minutos, 60),
       jm.id_lote, jm.id_orden_produccion, jm.cantidad_operarias,
       GREATEST(
         ROUND((jm.cantidad_operarias * COALESCE(jf.minutos, 60) / l.sam_pactado)
               * IF(jm.fecha = CURDATE(), cfg.factor_hoy, cfg.factor)) - (h.hora MOD 3), 0),
       (h.hora MOD 4 = 0),
       l.sam_pactado, o.valor_maquila_unidad, u.id_usuario
FROM (
  SELECT 'MOD-01' AS modulo, 0.88 AS factor, 0.91 AS factor_hoy UNION ALL
  SELECT 'MOD-03',           0.79,           0.74 UNION ALL
  SELECT 'MOD-04',           0.94,           0.96
) cfg
JOIN `modulos` m ON m.codigo = cfg.modulo
JOIN `jornada_modulo` jm ON jm.id_modulo = m.id_modulo
JOIN `lotes` l ON l.id_lote = jm.id_lote
JOIN `ordenes_produccion` o ON o.id_orden_produccion = jm.id_orden_produccion
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN (
  SELECT 1 AS hora UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
  SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
) h
LEFT JOIN `jornada_dia` jd ON jd.dia_semana = WEEKDAY(jm.fecha) + 1
LEFT JOIN `jornada_franjas` jf ON jf.id_jornada = jd.id_jornada AND jf.orden_franja = h.hora
-- Hoy solo hasta la hora 6, igual que el modulo 2: el dia va corriendo.
WHERE (jm.fecha < CURDATE() OR h.hora <= 6)
  AND l.sam_pactado > 0;
