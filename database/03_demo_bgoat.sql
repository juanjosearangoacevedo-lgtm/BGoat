-- =====================================================================
-- BGoat - Datos de demostracion (OPCIONAL)
--
--   cd backend && npm run db:setup -- --demo
--
-- Crea una planta de 12 modulos y reproduce el tablero de la foto:
-- MODULO #2, cliente Crystal, referencia 9703, SAM 6.5, 3 personas,
-- dos horas de montaje y la curva de arranque 11% -> 14% -> 16% -> 18%.
--
-- Todo se ancla a CURDATE() para que el tablero del dia tenga datos.
-- Es seguro volver a ejecutarlo: usa INSERT IGNORE y resuelve los ids
-- por sus llaves naturales.
-- =====================================================================

USE `bgoat`;

-- ---------------------------------------------------------------------
-- Clientes y marcas
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `clientes`
  (`tipo_documento`, `numero_documento`, `razon_social`, `telefono`, `correo`, `direccion`) VALUES
  ('NIT', '900123456-1', 'Crystal S.A.S.',        '6044441122', 'compras@crystal.com.co', 'Medellin, Antioquia'),
  ('NIT', '890900608-9', 'Grupo Exito S.A.',      '6044442233', 'maquila@exito.com.co',   'Envigado, Antioquia'),
  ('NIT', '811004055-2', 'Confecciones Leonisa',  '6044443344', 'proveedores@leonisa.com','Medellin, Antioquia');

INSERT IGNORE INTO `marcas` (`nombre`, `descripcion`) VALUES
  ('GEF',          'Ropa interior y basicos'),
  ('Punto Blanco', 'Ropa interior masculina y femenina'),
  ('Baby Fresh',   'Ropa infantil'),
  ('Arturo Calle', 'Ropa exterior masculina');

-- ---------------------------------------------------------------------
-- Referencias
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `referencias` (`id_marca`, `codigo`, `nombre`, `descripcion`)
SELECT m.id_marca, v.codigo, v.nombre, v.descripcion
FROM (
  SELECT 'GEF'          AS marca, '9703' AS codigo, 'Camiseta cuello redondo' AS nombre, 'Camiseta basica en algodon' AS descripcion UNION ALL
  SELECT 'GEF',                   '9812',           'Boxer algodon',                     'Boxer masculino elasticado' UNION ALL
  SELECT 'Punto Blanco',          'PB-450',         'Camiseta interior',                 'Camiseta interior cuello V' UNION ALL
  SELECT 'Baby Fresh',            'BF-220',         'Conjunto bebe',                     'Conjunto dos piezas' UNION ALL
  SELECT 'Arturo Calle',          'AC-1150',        'Camisa formal',                     'Camisa manga larga tela plana'
) v
JOIN `marcas` m ON m.nombre = v.marca;

-- ---------------------------------------------------------------------
-- Fichas tecnicas (aqui vive el SAM pactado)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `fichas_tecnicas`
  (`id_referencia`, `codigo_ficha`, `version`, `descripcion`, `material_principal`,
   `sam_pactado`, `personal_requerido`, `estado`, `fecha_vigencia`)
SELECT r.id_referencia, v.codigo_ficha, '1.0', v.descripcion, v.material,
       v.sam, v.personal, 'VIGENTE', DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
FROM (
  SELECT '9703'  AS ref, 'FT-9703'  AS codigo_ficha, 'Camiseta cuello redondo, manga corta' AS descripcion, 'Algodon 100% 30/1' AS material, 6.50 AS sam, 3 AS personal UNION ALL
  SELECT '9812',         'FT-9812',                  'Boxer algodon elasticado',                            'Algodon-elastano',            4.20,        3 UNION ALL
  SELECT 'PB-450',       'FT-PB450',                 'Camiseta interior cuello V',                          'Algodon peinado',             5.80,        4 UNION ALL
  SELECT 'BF-220',       'FT-BF220',                 'Conjunto bebe dos piezas',                            'Algodon suave',               9.40,        4 UNION ALL
  SELECT 'AC-1150',      'FT-AC1150',                'Camisa formal manga larga',                           'Popelina algodon',           18.75,        6
) v
JOIN `referencias` r ON r.codigo = v.ref;

-- Operaciones de la ficha de la referencia 9703
INSERT IGNORE INTO `ficha_tecnica_operaciones`
  (`id_ficha_tecnica`, `numero_operacion`, `nombre_operacion`, `maquina_requerida`, `tiempo_estandar_minutos`)
SELECT f.id_ficha_tecnica, v.numero, v.nombre, v.maquina, v.minutos
FROM (
  SELECT 1 AS numero, 'Unir hombros'      AS nombre, 'Fileteadora'  AS maquina, 0.90 AS minutos UNION ALL
  SELECT 2,           'Pegar cuello',                'Collareta',              1.60 UNION ALL
  SELECT 3,           'Pegar mangas',                'Fileteadora',            1.40 UNION ALL
  SELECT 4,           'Cerrar costados',             'Fileteadora',            1.20 UNION ALL
  SELECT 5,           'Ruedo inferior',              'Collareta',              0.90 UNION ALL
  SELECT 6,           'Pegar etiqueta y revision',   'Plana',                  0.50
) v
JOIN `fichas_tecnicas` f ON f.codigo_ficha = 'FT-9703';

-- Materiales e insumos que entrega el cliente
INSERT IGNORE INTO `ficha_tecnica_materiales`
  (`id_ficha_tecnica`, `nombre`, `tipo`, `cantidad_por_prenda`, `unidad_medida`, `obligatorio`)
SELECT f.id_ficha_tecnica, v.nombre, v.tipo, v.cantidad, v.unidad, v.obligatorio
FROM (
  SELECT 'Tela algodon 30/1'   AS nombre, 'TELA'     AS tipo, 0.4500 AS cantidad, 'MTS' AS unidad, 1 AS obligatorio UNION ALL
  SELECT 'Hilo poliester',            'INSUMO',            120.0000,        'CM',         1 UNION ALL
  SELECT 'Etiqueta de marca',         'ETIQUETA',            1.0000,        'UND',        1 UNION ALL
  SELECT 'Etiqueta de composicion',   'ETIQUETA',            1.0000,        'UND',        1 UNION ALL
  SELECT 'Bolsa individual',          'EMPAQUE',             1.0000,        'UND',        0
) v
JOIN `fichas_tecnicas` f ON f.codigo_ficha = 'FT-9703';

-- ---------------------------------------------------------------------
-- Modulos de la planta (12, como en la empresa real)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `modulos`
  (`codigo`, `nombre`, `ubicacion`, `capacidad_operarios`, `horas_jornada`,
   `eficiencia_esperada`, `umbral_cumplimiento`, `orden_visual`) VALUES
  ('MOD-01', 'Modulo 01', 'Seccion A', 12, 9, 80.00, 85.00, 1),
  ('MOD-02', 'Modulo 02', 'Seccion A',  3, 9, 80.00, 85.00, 2),
  ('MOD-03', 'Modulo 03', 'Seccion A', 10, 9, 80.00, 85.00, 3),
  ('MOD-04', 'Modulo 04', 'Seccion B',  8, 9, 80.00, 85.00, 4),
  ('MOD-05', 'Modulo 05', 'Seccion B',  8, 9, 80.00, 85.00, 5),
  ('MOD-06', 'Modulo 06', 'Seccion B', 10, 9, 80.00, 85.00, 6),
  ('MOD-07', 'Modulo 07', 'Seccion C',  6, 9, 80.00, 85.00, 7),
  ('MOD-08', 'Modulo 08', 'Seccion C',  6, 9, 80.00, 85.00, 8),
  ('MOD-09', 'Modulo 09', 'Seccion C',  9, 9, 80.00, 85.00, 9),
  ('MOD-10', 'Modulo 10', 'Seccion D',  9, 9, 80.00, 85.00, 10),
  ('MOD-11', 'Modulo 11', 'Seccion D',  7, 9, 80.00, 85.00, 11),
  ('MOD-12', 'Modulo 12', 'Seccion D',  7, 9, 80.00, 85.00, 12);

-- ---------------------------------------------------------------------
-- Operarios
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `operarios`
  (`codigo_operario`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`,
   `fecha_ingreso`, `cargo`, `especialidad`) VALUES
  ('OP-001', 'CC', '43567891', 'Luz Eliana',  'Martinez Ramos',  '2021-03-01', 'SUPERVISOR', 'Supervision de planta'),
  ('OP-002', 'CC', '43567892', 'Maria',       'Gonzalez Rios',   '2021-05-10', 'OPERARIO',   'Fileteadora'),
  ('OP-003', 'CC', '43567893', 'Sandra',      'Ospina Vera',     '2022-01-17', 'OPERARIO',   'Collareta'),
  ('OP-004', 'CC', '43567894', 'Claudia',     'Restrepo Loaiza', '2022-08-02', 'OPERARIO',   'Plana'),
  ('OP-005', 'CC', '43567895', 'Diana',       'Zapata Muriel',   '2023-02-13', 'OPERARIO',   'Fileteadora'),
  ('OP-006', 'CC', '43567896', 'Carlos',      'Agudelo Perez',   '2020-06-01', 'MECANICO',   'Mantenimiento de maquinas');

-- Asignacion de las 3 operarias del MODULO 02
INSERT IGNORE INTO `asignaciones_modulo`
  (`id_modulo`, `id_operario`, `fecha_inicio`, `turno`, `rol_asignacion`, `estado`)
SELECT m.id_modulo, o.id_operario, CONCAT(CURDATE(), ' 06:00:00'), 'MANANA', v.rol, 'ACTIVA'
FROM (
  SELECT 'OP-002' AS codigo, 'OPERARIO'   AS rol UNION ALL
  SELECT 'OP-003',           'OPERARIO'          UNION ALL
  SELECT 'OP-004',           'OPERARIO'          UNION ALL
  SELECT 'OP-001',           'SUPERVISOR'
) v
JOIN `operarios` o ON o.codigo_operario = v.codigo
JOIN `modulos` m ON m.codigo = 'MOD-02';

-- ---------------------------------------------------------------------
-- Pedido, lote y orden de produccion del tablero de la foto
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `pedidos`
  (`numero_pedido`, `id_cliente`, `id_marca`, `fecha_pedido`, `fecha_entrega_programada`, `estado`)
SELECT 'PED-2026-001', c.id_cliente, m.id_marca,
       DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'EN_PRODUCCION'
FROM `clientes` c JOIN `marcas` m ON m.nombre = 'GEF'
WHERE c.numero_documento = '900123456-1';

INSERT IGNORE INTO `lotes`
  (`codigo_lote`, `id_marca`, `id_pedido`, `id_referencia`, `fecha_recepcion`,
   `fecha_inicio`, `cantidad_programada`, `cantidad_recibida`, `estado`)
SELECT 'LOT-9703-01', m.id_marca, p.id_pedido, r.id_referencia,
       DATE_SUB(CURDATE(), INTERVAL 3 DAY), CURDATE(), 1200, 1200, 'EN_PROCESO'
FROM `marcas` m
JOIN `referencias` r ON r.codigo = '9703'
LEFT JOIN `pedidos` p ON p.numero_pedido = 'PED-2026-001'
WHERE m.nombre = 'GEF';

INSERT IGNORE INTO `ordenes_produccion`
  (`numero_orden`, `id_pedido`, `id_lote`, `id_modulo`, `id_ficha_tecnica`,
   `fecha_inicio_programada`, `fecha_fin_programada`, `cantidad_programada`,
   `valor_maquila_unidad`, `prioridad`, `estado`, `creado_por`)
SELECT 'OP-2026-0001', p.id_pedido, l.id_lote, m.id_modulo, f.id_ficha_tecnica,
       CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 1200,
       2800.00, 'ALTA', 'EN_PROCESO', u.id_usuario
FROM `lotes` l
JOIN `modulos` m ON m.codigo = 'MOD-02'
JOIN `fichas_tecnicas` f ON f.codigo_ficha = 'FT-9703'
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
LEFT JOIN `pedidos` p ON p.numero_pedido = 'PED-2026-001'
WHERE l.codigo_lote = 'LOT-9703-01';

-- ---------------------------------------------------------------------
-- EL TABLERO DE LA FOTO: MODULO #2, hoy
--
--   horas 1 y 2 -> montaje del modulo, cero produccion
--   horas 3 a 6 -> curva de arranque: 3, 4, 3 y 5 unidades
--   hora 5      -> solo 2 personas (por eso la meta baja de 28 a 18)
--   horas 7 a 9 -> pendientes, para poder capturarlas desde la app
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `registros_horarios`
  (`id_modulo`, `fecha`, `hora_jornada`, `id_orden_produccion`, `personas_presentes`,
   `unidades_producidas`, `unidades_defectuosas`, `sam_aplicado`, `id_causa`, `nota`, `registrado_por`)
SELECT m.id_modulo, CURDATE(), v.hora, o.id_orden_produccion, v.personas,
       v.producidas, v.defectuosas, 6.50, c.id_causa, v.nota, u.id_usuario
FROM (
  SELECT 1 AS hora, 3 AS personas, 0 AS producidas, 0 AS defectuosas, 'MONTAJE'     AS causa, 'Montaje del modulo para la referencia 9703' AS nota UNION ALL
  SELECT 2,          3,             0,               0,                'MONTAJE',         'Montaje del modulo para la referencia 9703' UNION ALL
  SELECT 3,          3,             3,               0,                'APRENDIZAJE',     'Primera hora de produccion de la referencia' UNION ALL
  SELECT 4,          3,             4,               0,                'APRENDIZAJE',     NULL UNION ALL
  SELECT 5,          2,             3,               0,                'AUSENCIA',        'Una operaria en permiso medico' UNION ALL
  SELECT 6,          3,             5,               1,                'APRENDIZAJE',     NULL
) v
JOIN `modulos` m ON m.codigo = 'MOD-02'
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN `causas_desviacion` c ON c.codigo = v.causa
LEFT JOIN `ordenes_produccion` o ON o.numero_orden = 'OP-2026-0001';

-- ---------------------------------------------------------------------
-- Ordenes y produccion de otros modulos, para que los indicadores y las
-- comparaciones tengan con que trabajar.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `lotes`
  (`codigo_lote`, `id_marca`, `id_referencia`, `fecha_recepcion`, `fecha_inicio`,
   `cantidad_programada`, `cantidad_recibida`, `estado`)
SELECT v.codigo, m.id_marca, r.id_referencia,
       DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY),
       v.cantidad, v.cantidad, 'EN_PROCESO'
FROM (
  SELECT 'LOT-9812-01' AS codigo, '9812'   AS ref, 12000 AS cantidad UNION ALL
  SELECT 'LOT-PB450-01',          'PB-450',         6000 UNION ALL
  SELECT 'LOT-BF220-01',          'BF-220',         3500
) v
JOIN `referencias` r ON r.codigo = v.ref
JOIN `marcas` m ON m.id_marca = r.id_marca;

INSERT IGNORE INTO `ordenes_produccion`
  (`numero_orden`, `id_lote`, `id_modulo`, `id_ficha_tecnica`, `fecha_inicio_programada`,
   `fecha_fin_programada`, `cantidad_programada`, `valor_maquila_unidad`, `prioridad`, `estado`, `creado_por`)
SELECT v.numero, l.id_lote, m.id_modulo, f.id_ficha_tecnica,
       DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL v.dias DAY),
       l.cantidad_programada, v.valor, v.prioridad, 'EN_PROCESO', u.id_usuario
FROM (
  SELECT 'OP-2026-0002' AS numero, 'LOT-9812-01'  AS lote, 'MOD-01' AS modulo, 'FT-9812'  AS ficha, 1900.00 AS valor, 'MEDIA'   AS prioridad, 8  AS dias UNION ALL
  SELECT 'OP-2026-0003',           'LOT-PB450-01',         'MOD-03',           'FT-PB450',         2400.00,           'ALTA',              3 UNION ALL
  SELECT 'OP-2026-0004',           'LOT-BF220-01',         'MOD-04',           'FT-BF220',         3900.00,           'URGENTE',           2
) v
JOIN `lotes` l ON l.codigo_lote = v.lote
JOIN `modulos` m ON m.codigo = v.modulo
JOIN `fichas_tecnicas` f ON f.codigo_ficha = v.ficha
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com';

-- Produccion de los ultimos 5 dias en esos modulos: eficiencias distintas
-- para que la comparacion entre modulos y el historico tengan sentido.
INSERT IGNORE INTO `registros_horarios`
  (`id_modulo`, `fecha`, `hora_jornada`, `id_orden_produccion`, `personas_presentes`,
   `unidades_producidas`, `unidades_defectuosas`, `sam_aplicado`, `registrado_por`)
SELECT m.id_modulo,
       DATE_SUB(CURDATE(), INTERVAL d.dia DAY),
       h.hora,
       o.id_orden_produccion,
       cfg.personas,
       GREATEST(ROUND((cfg.personas * 60 / cfg.sam) * cfg.factor) - (h.hora MOD 3), 0),
       (h.hora MOD 4 = 0),
       cfg.sam,
       u.id_usuario
FROM (
  SELECT 'MOD-01' AS modulo, 'OP-2026-0002' AS orden, 12 AS personas, 4.20 AS sam, 0.88 AS factor UNION ALL
  SELECT 'MOD-03',           'OP-2026-0003',          10,              5.80,        0.79 UNION ALL
  SELECT 'MOD-04',           'OP-2026-0004',           8,              9.40,        0.94
) cfg
JOIN `modulos` m ON m.codigo = cfg.modulo
JOIN `ordenes_produccion` o ON o.numero_orden = cfg.orden
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN (SELECT 1 AS dia UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d
JOIN (
  SELECT 1 AS hora UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
  SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
) h;

-- Produccion de hoy en esos modulos (hasta la hora 6, como el modulo 2)
INSERT IGNORE INTO `registros_horarios`
  (`id_modulo`, `fecha`, `hora_jornada`, `id_orden_produccion`, `personas_presentes`,
   `unidades_producidas`, `unidades_defectuosas`, `sam_aplicado`, `registrado_por`)
SELECT m.id_modulo, CURDATE(), h.hora, o.id_orden_produccion, cfg.personas,
       GREATEST(ROUND((cfg.personas * 60 / cfg.sam) * cfg.factor) - (h.hora MOD 3), 0),
       (h.hora MOD 4 = 0), cfg.sam, u.id_usuario
FROM (
  SELECT 'MOD-01' AS modulo, 'OP-2026-0002' AS orden, 12 AS personas, 4.20 AS sam, 0.91 AS factor UNION ALL
  SELECT 'MOD-03',           'OP-2026-0003',          10,              5.80,        0.74 UNION ALL
  SELECT 'MOD-04',           'OP-2026-0004',           8,              9.40,        0.96
) cfg
JOIN `modulos` m ON m.codigo = cfg.modulo
JOIN `ordenes_produccion` o ON o.numero_orden = cfg.orden
JOIN `usuarios` u ON u.correo = 'admin@bgoat.com'
JOIN (
  SELECT 1 AS hora UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) h;
