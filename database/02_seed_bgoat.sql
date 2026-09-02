-- =====================================================================
-- BGoat - Datos base (catalogos)
--
-- Ejecutar DESPUES de 01_schema_bgoat.sql.
-- Todos los INSERT usan INSERT IGNORE: el script se puede volver a correr
-- sin duplicar registros.
--
-- Contenido:
--   * roles              : Administrador, Supervisor, Operario
--   * permisos           : matriz modulo x accion (la misma que pinta el front)
--   * rol_permiso        : permisos por rol
--   * causas_desviacion  : catalogo de motivos de tiempo perdido
--   * tallas / colores / tipos_prenda
--   * usuario administrador inicial
-- =====================================================================

USE `bgoat`;

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `roles` (`nombre`, `descripcion`, `estado`) VALUES
  ('Administrador', 'Control total del sistema', 'ACTIVO'),
  ('Supervisor',    'Captura de produccion y gestion de planta', 'ACTIVO'),
  ('Operario',      'Consulta de ordenes e indicadores', 'ACTIVO');

-- ---------------------------------------------------------------------
-- Permisos: un registro por cada combinacion modulo x accion.
--
-- Alcance por modulo:
--   CONSULTA    -> VER, EXPORTAR                (tableros)
--   SIN_BORRADO -> VER, CREAR, EDITAR           (no se borran registros)
--   COMPLETO    -> las cinco acciones
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `permisos` (`nombre`, `modulo`, `accion`, `descripcion`)
SELECT
  CONCAT(LOWER(REPLACE(m.modulo, ' ', '_')), '.', LOWER(a.accion)),
  m.modulo,
  a.accion,
  CONCAT(a.accion, ' en el modulo ', m.modulo)
FROM (
  SELECT 'Dashboard'       AS modulo, 'CONSULTA'    AS alcance UNION ALL
  SELECT 'Captura',              'SIN_BORRADO'                 UNION ALL
  SELECT 'Usuarios',             'COMPLETO'                    UNION ALL
  SELECT 'Roles',                'COMPLETO'                    UNION ALL
  SELECT 'Permisos',             'SIN_BORRADO'                 UNION ALL
  SELECT 'Clientes',             'COMPLETO'                    UNION ALL
  SELECT 'Marcas',               'COMPLETO'                    UNION ALL
  SELECT 'Pedidos',              'COMPLETO'                    UNION ALL
  SELECT 'Lotes',                'COMPLETO'                    UNION ALL
  SELECT 'Referencias',          'COMPLETO'                    UNION ALL
  SELECT 'Fichas Tecnicas',      'COMPLETO'                    UNION ALL
  SELECT 'Prendas',              'COMPLETO'                    UNION ALL
  SELECT 'Operarios',            'COMPLETO'                    UNION ALL
  SELECT 'Modulos',              'COMPLETO'                    UNION ALL
  SELECT 'Asignaciones',         'COMPLETO'                    UNION ALL
  SELECT 'Ordenes',              'COMPLETO'                    UNION ALL
  SELECT 'Causas',               'COMPLETO'                    UNION ALL
  SELECT 'Indicadores',          'CONSULTA'                    UNION ALL
  SELECT 'Reportes',             'CONSULTA'
) m
JOIN (
  SELECT 'VER'      AS accion UNION ALL
  SELECT 'CREAR'              UNION ALL
  SELECT 'EDITAR'             UNION ALL
  SELECT 'ELIMINAR'           UNION ALL
  SELECT 'EXPORTAR'
) a
  ON  (m.alcance = 'COMPLETO')
  OR  (m.alcance = 'CONSULTA'    AND a.accion IN ('VER', 'EXPORTAR'))
  OR  (m.alcance = 'SIN_BORRADO' AND a.accion IN ('VER', 'CREAR', 'EDITAR'));

-- ---------------------------------------------------------------------
-- Administrador: todos los permisos
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r
CROSS JOIN `permisos` p
WHERE r.nombre = 'Administrador';

-- ---------------------------------------------------------------------
-- Supervisor: captura y planta completas, consulta en lo comercial
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r
JOIN `permisos` p
  ON (p.modulo IN ('Captura', 'Lotes', 'Fichas Tecnicas', 'Prendas', 'Operarios',
                   'Modulos', 'Asignaciones', 'Ordenes', 'Causas', 'Referencias'))
  OR (p.modulo IN ('Dashboard', 'Indicadores', 'Reportes'))
  OR (p.modulo IN ('Clientes', 'Marcas', 'Pedidos') AND p.accion IN ('VER', 'EXPORTAR'))
WHERE r.nombre = 'Supervisor';

-- ---------------------------------------------------------------------
-- Operario: solo consulta de su operacion
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r
JOIN `permisos` p
  ON  p.modulo IN ('Dashboard', 'Ordenes', 'Asignaciones', 'Indicadores')
  AND p.accion = 'VER'
WHERE r.nombre = 'Operario';

-- ---------------------------------------------------------------------
-- Causas de desviacion
--
-- `tipo` separa el tiempo perdido: PLANEADA (se sabia que iba a pasar),
-- INTERNA (responsabilidad de la empresa) y EXTERNA (del cliente, y por
-- lo tanto negociable).
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `causas_desviacion`
  (`codigo`, `nombre`, `tipo`, `responsable`, `requiere_nota`, `orden_visual`) VALUES
  ('MONTAJE',      'Montaje / cambio de referencia', 'PLANEADA', 'Produccion',    0, 1),
  ('APRENDIZAJE',  'Curva de aprendizaje',           'PLANEADA', 'Produccion',    0, 2),
  ('AUSENCIA',     'Ausencia de personal',           'INTERNA',  'Talento humano',0, 3),
  ('MAQUINA',      'Falla de maquina',               'INTERNA',  'Mantenimiento', 1, 4),
  ('INSUMO',       'Falta de insumo o corte',        'EXTERNA',  'Comercial',     1, 5),
  ('CALIDAD',      'Reproceso por calidad',          'INTERNA',  'Calidad',       0, 6),
  ('ENERGIA',      'Corte de energia',               'EXTERNA',  'Mantenimiento', 0, 7),
  ('OTRA',         'Otra causa',                     'INTERNA',  NULL,            1, 8);

-- ---------------------------------------------------------------------
-- Jornadas y franjas
--
-- Salen del tablero de pared de Confecciones God's Eyes, tal como lo
-- llena la supervisora:
--
--   MAR_VIE : 8 franjas de 60 + una de 40  = 520 minutos
--   SABADO  : 7 franjas de 60 + una de 20  = 440 minutos
--
-- Las dos ultimas franjas de cada bloque del tablero estan en 0 minutos
-- (2:40pm-3:00pm y 1:20pm-1:40pm): son el cierre del turno, no se
-- produce en ellas y por eso no se cargan. Una franja de 0 minutos da
-- meta 0 y ensucia el promedio del dia.
--
-- Si la empresa cambia el horario, se cambia AQUI y la rejilla entera se
-- reacomoda: ningun calculo tiene el 60 escrito adentro.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `jornadas` (`codigo`, `nombre`) VALUES
  ('MAR_VIE', 'Martes a viernes (520 min)'),
  ('SABADO',  'Sabado (440 min)');

INSERT IGNORE INTO `jornada_franjas`
  (`id_jornada`, `orden_franja`, `hora_inicio`, `hora_fin`, `minutos`, `etiqueta`)
SELECT j.id_jornada, f.orden, f.inicio, f.fin, f.minutos, f.etiqueta
FROM `jornadas` j
JOIN (
  SELECT 'MAR_VIE' AS jornada, 1 AS orden, '06:00:00' AS inicio, '07:00:00' AS fin, 60 AS minutos, '6:00am - 7:00am'   AS etiqueta UNION ALL
  SELECT 'MAR_VIE', 2, '07:00:00', '08:00:00', 60, '7:00am - 8:00am'   UNION ALL
  SELECT 'MAR_VIE', 3, '08:00:00', '09:00:00', 60, '8:00am - 9:00am'   UNION ALL
  SELECT 'MAR_VIE', 4, '09:00:00', '10:00:00', 60, '9:00am - 10:00am'  UNION ALL
  SELECT 'MAR_VIE', 5, '10:00:00', '11:00:00', 60, '10:00am - 11:00am' UNION ALL
  SELECT 'MAR_VIE', 6, '11:00:00', '12:00:00', 60, '11:00am - 12:00m'  UNION ALL
  SELECT 'MAR_VIE', 7, '12:00:00', '13:00:00', 60, '12:00m - 1:00pm'   UNION ALL
  SELECT 'MAR_VIE', 8, '13:00:00', '14:00:00', 60, '1:00pm - 2:00pm'   UNION ALL
  SELECT 'MAR_VIE', 9, '14:00:00', '14:40:00', 40, '2:00pm - 2:40pm'   UNION ALL
  SELECT 'SABADO',  1, '06:00:00', '07:00:00', 60, '6:00am - 7:00am'   UNION ALL
  SELECT 'SABADO',  2, '07:00:00', '08:00:00', 60, '7:00am - 8:00am'   UNION ALL
  SELECT 'SABADO',  3, '08:00:00', '09:00:00', 60, '8:00am - 9:00am'   UNION ALL
  SELECT 'SABADO',  4, '09:00:00', '10:00:00', 60, '9:00am - 10:00am'  UNION ALL
  SELECT 'SABADO',  5, '10:00:00', '11:00:00', 60, '10:00am - 11:00am' UNION ALL
  SELECT 'SABADO',  6, '11:00:00', '12:00:00', 60, '11:00am - 12:00m'  UNION ALL
  SELECT 'SABADO',  7, '12:00:00', '13:00:00', 60, '12:00m - 1:00pm'   UNION ALL
  SELECT 'SABADO',  8, '13:00:00', '13:20:00', 20, '1:00pm - 1:20pm'
) f ON f.jornada = j.codigo;

-- Que jornada rige cada dia: 1 = lunes ... 7 = domingo.
-- El domingo no aparece porque no se trabaja.
--
-- >>> El tablero esta rotulado "MARTES A VIERNES" y no dice nada del
--     lunes. Aqui el lunes queda con la misma jornada. Si el lunes
--     arranca distinto (montaje, entrada mas tarde), se corrige esta
--     fila y nada mas: ni el codigo ni las vistas se enteran.
INSERT IGNORE INTO `jornada_dia` (`dia_semana`, `id_jornada`)
SELECT d.dia, j.id_jornada
FROM `jornadas` j
JOIN (
  SELECT 1 AS dia, 'MAR_VIE' AS jornada UNION ALL
  SELECT 2, 'MAR_VIE' UNION ALL
  SELECT 3, 'MAR_VIE' UNION ALL
  SELECT 4, 'MAR_VIE' UNION ALL
  SELECT 5, 'MAR_VIE' UNION ALL
  SELECT 6, 'SABADO'
) d ON d.jornada = j.codigo;

-- ---------------------------------------------------------------------
-- Tallas
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `tallas` (`nombre`, `orden_visual`) VALUES
  ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
  ('6', 10), ('8', 11), ('10', 12), ('12', 13), ('14', 14), ('16', 15);

-- ---------------------------------------------------------------------
-- Colores
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `colores` (`nombre`, `codigo_hex`) VALUES
  ('Negro',  '#000000'),
  ('Blanco', '#FFFFFF'),
  ('Gris',   '#9CA3AF'),
  ('Azul',   '#1D4ED8'),
  ('Rojo',   '#DC2626'),
  ('Verde',  '#16A34A'),
  ('Beige',  '#E7D8C1'),
  ('Rosado', '#F472B6');

-- ---------------------------------------------------------------------
-- Tipos de prenda
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `tipos_prenda` (`nombre`, `descripcion`) VALUES
  ('Camiseta',        'Prenda superior de punto'),
  ('Polo',            'Camiseta con cuello tejido'),
  ('Camisa',          'Prenda superior de tela plana'),
  ('Jean',            'Pantalon en denim'),
  ('Pantalon',        'Pantalon en tela plana'),
  ('Sudadera',        'Conjunto o prenda deportiva'),
  ('Chaqueta',        'Prenda exterior'),
  ('Ropa interior',   'Ropa interior femenina y masculina'),
  ('Vestido de bano', 'Vestido de bano y playa');

-- ---------------------------------------------------------------------
-- Usuario administrador inicial
--
--   correo     : admin@bgoat.com
--   contrasena : Bgoat2026*
--
-- >>> CAMBIAR LA CONTRASENA DESPUES DEL PRIMER INGRESO <<<
-- El hash es bcrypt (10 rondas), el mismo algoritmo que usa el backend.
-- Para generar otro: cd backend && npm run hash -- "MiClaveNueva"
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `usuarios`
  (`id_rol`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`,
   `correo`, `telefono`, `clave_hash`, `estado`)
SELECT
  r.id_rol, 'CC', '1017925610', 'Juan Jose', 'Arango Acevedo',
  'admin@bgoat.com', '3219023372',
  '$2a$10$M/YuAycaYTixt9pWqxnlOumqK/qYQ0XhWmFdMHFT4Mt08eNIYzo9.', 'ACTIVO'
FROM `roles` r WHERE r.nombre = 'Administrador';


-- ---------------------------------------------------------------------
-- Relleno de los registros capturados antes de que existieran las
-- jornadas.
--
-- Esas filas se guardaron dando por hecho que toda franja duraba 60
-- minutos y sin precio. Aqui se les pone el ancho real de su franja y
-- la tarifa de la orden que estaban corriendo, para que el historico
-- quede en la misma unidad que lo que se capture de ahora en adelante.
--
-- Corre UNA sola vez: `minutos_franja` y `precio_aplicado` son una foto
-- del momento de la captura, y volver a rellenarlos despues de que la
-- empresa cambie el horario o renegocie la tarifa reescribiria el
-- pasado, que es justo lo que estas dos columnas existen para evitar.
-- ---------------------------------------------------------------------
SET @pendiente = (SELECT COUNT(*) = 0 FROM `migraciones`
                  WHERE `clave` = '2026-08_jornadas_y_facturacion');

SET @sql_relleno = IF(@pendiente,
  'UPDATE registros_horarios r
     JOIN jornada_dia jd ON jd.dia_semana = WEEKDAY(r.fecha) + 1
     JOIN jornada_franjas jf ON jf.id_jornada = jd.id_jornada
                            AND jf.orden_franja = r.hora_jornada
      SET r.minutos_franja = jf.minutos',
  'DO 0');
PREPARE ejecutar FROM @sql_relleno; EXECUTE ejecutar; DEALLOCATE PREPARE ejecutar;

SET @sql_relleno = IF(@pendiente,
  'UPDATE registros_horarios r
     JOIN ordenes_produccion o ON o.id_orden_produccion = r.id_orden_produccion
      SET r.precio_aplicado = o.valor_maquila_unidad
    WHERE r.precio_aplicado IS NULL',
  'DO 0');
PREPARE ejecutar FROM @sql_relleno; EXECUTE ejecutar; DEALLOCATE PREPARE ejecutar;

INSERT IGNORE INTO `migraciones` (`clave`) VALUES ('2026-08_jornadas_y_facturacion');
