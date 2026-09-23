-- =====================================================================
-- BGoat - Datos base (catalogos)
--
-- Ejecutar DESPUES de 01_schema_bgoat.sql.
-- Todos los INSERT usan INSERT IGNORE: el script se puede volver a correr
-- sin duplicar registros.
--
-- Contenido:
--   * roles              : Administrador, Digitadora, Operario
--   * permisos           : matriz modulo x accion (la misma que pinta el front)
--   * rol_permiso        : permisos por rol
--   * causas_desviacion  : catalogo de incidencias de la hora
--   * jornadas           : el horario real de la planta
--   * tallas / colores / tipos_prenda : catalogos del producto
--   * usuario administrador inicial
-- =====================================================================

USE `bgoat`;

-- ---------------------------------------------------------------------
-- Roles
--
--   "Digitadora" reemplaza a "Supervisor": es quien abre la jornada del
--   modulo, declara las operarias, escoge el lote y registra cada hora.
--   El concepto de una supervisora distinta por modulo desaparecio con
--   la tabla `asignaciones_modulo`.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `roles` (`nombre`, `descripcion`, `estado`) VALUES
  ('Administrador', 'Control total del sistema', 'ACTIVO'),
  ('Digitadora',    'Configura la jornada del modulo y registra la produccion de cada hora', 'ACTIVO'),
  ('Operario',      'Consulta de ordenes e indicadores', 'ACTIVO');

-- ---------------------------------------------------------------------
-- Permisos: un registro por cada combinacion modulo x accion.
--
-- Alcance por modulo:
--   CONSULTA    -> VER, EXPORTAR                (tableros)
--   SIN_BORRADO -> VER, CREAR, EDITAR           (no se borran registros)
--   COMPLETO    -> las cinco acciones
--
-- `Panel` es un solo modulo porque es una sola pantalla: el resumen, los
-- indicadores y los reportes leen las mismas vistas y antes eran tres
-- entradas de menu que llevaban a lo mismo. `EXPORTAR` sigue separado de
-- `VER` para poder dar consulta sin dar descarga.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `permisos` (`nombre`, `modulo`, `accion`, `descripcion`)
SELECT
  CONCAT(LOWER(REPLACE(m.modulo, ' ', '_')), '.', LOWER(a.accion)),
  m.modulo,
  a.accion,
  CONCAT(a.accion, ' en el modulo ', m.modulo)
FROM (
  SELECT 'Panel'           AS modulo, 'CONSULTA'    AS alcance UNION ALL
  SELECT 'Jornada',              'SIN_BORRADO'                 UNION ALL
  SELECT 'Captura',              'SIN_BORRADO'                 UNION ALL
  SELECT 'Usuarios',             'COMPLETO'                    UNION ALL
  SELECT 'Roles',                'COMPLETO'                    UNION ALL
  SELECT 'Permisos',             'SIN_BORRADO'                 UNION ALL
  SELECT 'Clientes',             'COMPLETO'                    UNION ALL
  SELECT 'Lotes',                'COMPLETO'                    UNION ALL
  SELECT 'Operarios',            'COMPLETO'                    UNION ALL
  SELECT 'Modulos',              'COMPLETO'                    UNION ALL
  SELECT 'Ordenes',              'COMPLETO'                    UNION ALL
  SELECT 'Causas',               'COMPLETO'
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
-- Digitadora: todo lo que necesita para arrancar y sostener la jornada.
--
--   Lotes y Clientes van completos a proposito: cuando llega un lote
--   nuevo a media manana, ella tiene que poder registrarlo sin esperar
--   a que un administrador se conecte. De la orden puede crear y
--   corregir, pero no eliminar.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r
JOIN `permisos` p
  ON (p.modulo IN ('Jornada', 'Captura', 'Lotes', 'Clientes', 'Operarios',
                   'Modulos', 'Causas', 'Panel'))
  OR (p.modulo = 'Ordenes' AND p.accion IN ('VER', 'CREAR', 'EDITAR', 'EXPORTAR'))
WHERE r.nombre = 'Digitadora';

-- ---------------------------------------------------------------------
-- Operario: solo consulta de su operacion
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r
JOIN `permisos` p
  ON  p.modulo IN ('Panel', 'Ordenes', 'Jornada')
  AND p.accion = 'VER'
WHERE r.nombre = 'Operario';

-- ---------------------------------------------------------------------
-- Causas de desviacion = el catalogo de INCIDENCIAS
--
-- Es lo que la digitadora ve como botones cuando una hora no alcanza la
-- meta. `tipo` separa el tiempo perdido: PLANEADA (se sabia que iba a
-- pasar), INTERNA (responsabilidad de la empresa) y EXTERNA (del
-- cliente, y por lo tanto negociable).
--
-- `requiere_nota` es la explicacion adicional obligatoria: se exige
-- donde el nombre de la causa no alcanza para entender que paso.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `causas_desviacion`
  (`codigo`, `nombre`, `tipo`, `responsable`, `requiere_nota`, `orden_visual`) VALUES
  ('MONTAJE',      'Montaje',                'PLANEADA', 'Produccion',     0, 1),
  ('CAMBIO_REF',   'Cambio de referencia',   'PLANEADA', 'Produccion',     0, 2),
  ('APRENDIZAJE',  'Curva de aprendizaje',   'PLANEADA', 'Produccion',     0, 3),
  ('MAQUINA',      'Dano de maquina',        'INTERNA',  'Mantenimiento',  1, 4),
  ('ENERGIA',      'Corte de energia',       'EXTERNA',  'Mantenimiento',  0, 5),
  ('INSUMO',       'Falta de material',      'EXTERNA',  'Comercial',      1, 6),
  ('AUSENCIA',     'Ausencia de personal',   'INTERNA',  'Talento humano', 0, 7),
  ('CALIDAD',      'Reproceso por calidad',  'INTERNA',  'Calidad',        0, 8),
  ('OPERATIVO',    'Problema operativo',     'INTERNA',  'Produccion',     1, 9),
  ('OTRA',         'Otra causa',             'INTERNA',  NULL,             1, 10);

-- `MONTAJE` venia rotulado "Montaje / cambio de referencia". Ahora el
-- cambio de referencia es su propia causa, asi que el rotulo viejo
-- sobraba: INSERT IGNORE no toca una fila que ya existe, por eso se
-- corrige aqui.
UPDATE `causas_desviacion` SET `nombre` = 'Montaje', `orden_visual` = 1
 WHERE `codigo` = 'MONTAJE' AND `nombre` <> 'Montaje';

UPDATE `causas_desviacion` SET `nombre` = 'Dano de maquina'
 WHERE `codigo` = 'MAQUINA' AND `nombre` = 'Falla de maquina';

UPDATE `causas_desviacion` SET `nombre` = 'Falta de material'
 WHERE `codigo` = 'INSUMO' AND `nombre` = 'Falta de insumo o corte';

-- ---------------------------------------------------------------------
-- Jornadas y franjas
--
-- Salen del tablero de pared de Confecciones God's Eyes:
--
--   MAR_VIE : 8 franjas de 60 + una de 40  = 520 minutos
--   SABADO  : 7 franjas de 60 + una de 20  = 440 minutos
--
-- Las dos ultimas franjas de cada bloque del tablero estan en 0 minutos
-- (2:40pm-3:00pm y 1:20pm-1:40pm): son el cierre del turno, no se
-- produce en ellas y por eso no se cargan. Una franja de 0 minutos da
-- meta 0 y ensucia el promedio del dia.
--
-- Cada franja es tambien un recordatorio: al cerrarse, la app le avisa
-- a la digitadora que tiene esa hora pendiente por registrar.
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
-- Catalogos del producto
--
-- No tienen pantalla propia: se usan desde el formulario del lote (el
-- tipo de prenda del lote, y las tallas y colores de su desglose
-- opcional). Antes colgaban del modulo Prendas, que era el SKU armado
-- con los tres; ese SKU desaparecio, los catalogos no.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `tallas` (`nombre`, `orden_visual`) VALUES
  ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
  ('6', 10), ('8', 11), ('10', 12), ('12', 13), ('14', 14), ('16', 15);

INSERT IGNORE INTO `colores` (`nombre`, `codigo_hex`) VALUES
  ('Negro',  '#000000'),
  ('Blanco', '#FFFFFF'),
  ('Gris',   '#9CA3AF'),
  ('Azul',   '#1D4ED8'),
  ('Rojo',   '#DC2626'),
  ('Verde',  '#16A34A'),
  ('Beige',  '#E7D8C1'),
  ('Rosado', '#F472B6');

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
