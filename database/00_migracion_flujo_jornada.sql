-- =====================================================================
-- BGoat - Migracion al flujo de jornada de la digitadora
-- Clave: 2026-09_flujo_jornada
--
-- QUE HACE
--   Lleva una base con el modelo viejo (supervisora asignada por modulo,
--   cliente y marca separados, ficha tecnica y prendas como catalogos)
--   al modelo nuevo, SIN perder lo capturado.
--
-- POR QUE CORRE ANTES DE `01_schema_bgoat.sql`
--   Las vistas de `01` leen columnas que en una base vieja todavia no
--   existen (`registros_horarios.id_jornada_modulo`,
--   `lotes.codigo_referencia`, `clientes.nombre`). Si `01` corriera
--   primero, sus `CREATE OR REPLACE VIEW` fallarian. Aqui se preparan
--   las columnas; `01` despues las encuentra en su sitio.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Todo va condicionado a que exista la tabla `marcas`, que es la
--   huella del modelo viejo. Sin ella, cada paso se convierte en `DO 0`.
--
-- CORRE UNA SOLA VEZ
--   Queda anotada en `migraciones`. Volver a aplicarla despues de que la
--   empresa edite un cliente o cambie un SAM reescribiria justo lo que
--   se quiso conservar.
--
-- ANTES DE CORRERLA: saca un respaldo. `backup.sh` en la raiz lo hace.
--
-- QUE SE CONSERVA
--   * Los registros horarios completos, con su lote y su cliente
--     resueltos por el camino nuevo.
--   * Los minutos perdidos y sus causas.
--   * Los lotes, con la referencia, el SAM, el material y los archivos de
--     la ficha tecnica que antes vivian en tres tablas aparte.
--   * Los clientes y las marcas, fusionados en una sola entidad.
--   * Los pedidos: folio y fechas pasan a ser columnas del lote.
--   * El desglose por talla y color de `detalle_pedido`, rescatado en
--     `lote_detalle_talla_color` antes de borrar esa tabla.
--   * Los catalogos `tallas`, `colores` y `tipos_prenda`, que se
--     conservan intactos y ahora se usan desde el formulario del lote.
--   * Las asignaciones de operarias, convertidas en la nomina de cada
--     jornada.
--
-- QUE SE PIERDE A PROPOSITO (y por que)
--   * `ficha_tecnica_operaciones` / `_materiales` / `_medidas`: el
--     detalle de la ficha. Cada lote trae su propia ficha en papel; el
--     sistema guarda ahora la imagen y el PDF, no el desglose
--     transcrito. Si el negocio los necesita despues, vuelven como
--     tablas hijas de `lotes`.
--   * `prendas`: era el SKU armado con talla + color + tipo. La
--     produccion se mide por lote; lo que se queria del SKU vive ahora
--     en `lotes.id_tipo_prenda` y `lote_detalle_talla_color`.
--   * `detalle_orden_produccion`: su `id_prenda` era obligatorio y
--     apuntaba a `prendas`. El desglose quedo en el lote.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `bgoat` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bgoat`;

SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ---------------------------------------------------------------------
-- ¿Hay que migrar?
--   `marcas` solo existe en el modelo viejo. `migraciones` puede no
--   existir todavia, asi que tambien se pregunta por ella antes de
--   leerla.
-- ---------------------------------------------------------------------
SET @hay_marcas = (SELECT COUNT(*) FROM information_schema.TABLES
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'marcas');

SET @hay_migraciones = (SELECT COUNT(*) FROM information_schema.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'migraciones');

SET @ya_aplicada = 0;
SET @sql = IF(@hay_migraciones > 0,
  'SET @ya_aplicada = (SELECT COUNT(*) FROM migraciones WHERE clave = ''2026-09_flujo_jornada'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @migrar = (@hay_marcas > 0 AND @ya_aplicada = 0);

SELECT IF(@migrar, 'Migrando al flujo de jornada...', 'Nada que migrar (base nueva o ya migrada)') AS estado;

-- =====================================================================
-- Paso 0 - Fuera las vistas viejas
--   Leen tablas que estan a punto de desaparecer. `01_schema` las vuelve
--   a crear, ya apuntando al modelo nuevo.
-- =====================================================================
DROP VIEW IF EXISTS `vw_productividad_operario`;
DROP VIEW IF EXISTS `vw_curva_arranque`;
DROP VIEW IF EXISTS `vw_tablero_modulo_dia`;
DROP VIEW IF EXISTS `vw_perdidas_por_causa`;
DROP VIEW IF EXISTS `vw_avance_orden`;
DROP VIEW IF EXISTS `vw_estado_planta_hora`;
DROP VIEW IF EXISTS `vw_estado_modulo_dia`;
DROP VIEW IF EXISTS `vw_registro_horario`;

-- =====================================================================
-- Paso 1 - Las dos tablas del flujo nuevo
--   Mismo DDL que en `01_schema_bgoat.sql`. Se repite aqui porque los
--   pasos siguientes necesitan escribir en ellas y `01` todavia no ha
--   corrido; alla el CREATE queda en no-op.
-- =====================================================================
SET @sql = IF(@migrar,
'CREATE TABLE IF NOT EXISTS `jornada_modulo` (
  `id_jornada_modulo` BIGINT NOT NULL AUTO_INCREMENT,
  `id_modulo` BIGINT NOT NULL,
  `fecha` DATE NOT NULL,
  `id_lote` BIGINT NOT NULL,
  `id_orden_produccion` BIGINT DEFAULT NULL,
  `cantidad_operarias` SMALLINT NOT NULL DEFAULT 0,
  `estado` ENUM(''ABIERTA'', ''CERRADA'') NOT NULL DEFAULT ''ABIERTA'',
  `abierta_por` BIGINT NOT NULL,
  `fecha_apertura` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` DATETIME DEFAULT NULL,
  `observaciones` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id_jornada_modulo`),
  UNIQUE INDEX `uq_jornada_modulo_fecha` (`id_modulo`, `fecha`),
  INDEX `fk_jornada_modulo_lote` (`id_lote`),
  INDEX `fk_jornada_modulo_orden` (`id_orden_produccion`),
  INDEX `fk_jornada_modulo_usuario` (`abierta_por`),
  INDEX `idx_jornada_modulo_fecha` (`fecha`, `estado`),
  CONSTRAINT `fk_jornada_modulo_modulo` FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_jornada_modulo_lote` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_jornada_modulo_orden` FOREIGN KEY (`id_orden_produccion`) REFERENCES `ordenes_produccion` (`id_orden_produccion`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_jornada_modulo_usuario` FOREIGN KEY (`abierta_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_jornada_modulo_operarias` CHECK (`cantidad_operarias` >= 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4',
'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
'CREATE TABLE IF NOT EXISTS `jornada_operaria` (
  `id_jornada_operaria` BIGINT NOT NULL AUTO_INCREMENT,
  `id_jornada_modulo` BIGINT NOT NULL,
  `numero` SMALLINT NOT NULL,
  `id_operario` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id_jornada_operaria`),
  UNIQUE INDEX `uq_jornada_operaria_numero` (`id_jornada_modulo`, `numero`),
  UNIQUE INDEX `uq_jornada_operaria_operario` (`id_jornada_modulo`, `id_operario`),
  INDEX `fk_jornada_operaria_operario` (`id_operario`),
  CONSTRAINT `fk_jornada_operaria_jornada` FOREIGN KEY (`id_jornada_modulo`) REFERENCES `jornada_modulo` (`id_jornada_modulo`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_jornada_operaria_operario` FOREIGN KEY (`id_operario`) REFERENCES `operarios` (`id_operario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_jornada_operaria_numero` CHECK (`numero` BETWEEN 1 AND 99)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4',
'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El desglose por talla y color del lote. Se crea aqui porque el paso 3
-- lo llena con lo que traia `detalle_pedido`, antes de que esa tabla
-- desaparezca.
SET @sql = IF(@migrar,
'CREATE TABLE IF NOT EXISTS `lote_detalle_talla_color` (
  `id_detalle` BIGINT NOT NULL AUTO_INCREMENT,
  `id_lote` BIGINT NOT NULL,
  `id_talla` BIGINT DEFAULT NULL,
  `id_color` BIGINT DEFAULT NULL,
  `cantidad` INT DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  UNIQUE INDEX `uq_detalle_lote_talla_color` (`id_lote`, `id_talla`, `id_color`),
  INDEX `fk_detalle_lote` (`id_lote`),
  INDEX `fk_detalle_talla` (`id_talla`),
  INDEX `fk_detalle_color` (`id_color`),
  CONSTRAINT `fk_detalle_lote` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_talla` FOREIGN KEY (`id_talla`) REFERENCES `tallas` (`id_talla`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_color` FOREIGN KEY (`id_color`) REFERENCES `colores` (`id_color`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4',
'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 2 - Fusionar `marcas` dentro de `clientes`
--
--   No habia ninguna llave entre las dos tablas: la unica pista de que
--   marca pertenece a que cliente esta dentro de `pedidos`. Se usa esa
--   pista donde exista, y donde no, la marca queda como cliente propio
--   con los datos fiscales en blanco para que alguien los complete.
--
--   `id_marca_origen` es una columna de andamio: sirve para reapuntar
--   los lotes y se elimina al final del paso.
-- =====================================================================
-- `numero_documento` se afloja aqui, no al final: una marca sin cliente
-- conocido entra sin NIT, y con la columna todavia obligatoria el INSERT
-- de mas abajo se cae.
SET @falta_nombre = 0;
SET @sql = IF(@migrar,
  'SET @falta_nombre = (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''clientes''
       AND COLUMN_NAME = ''nombre'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @falta_nombre,
  'ALTER TABLE `clientes`
     ADD COLUMN `nombre` VARCHAR(120) NULL AFTER `id_cliente`,
     ADD COLUMN `descripcion` VARCHAR(255) NULL AFTER `nombre`,
     ADD COLUMN `id_marca_origen` BIGINT NULL,
     MODIFY COLUMN `numero_documento` VARCHAR(30) NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El indice unico por documento estorba: un cliente con tres marcas son
-- ahora tres filas con el mismo NIT.
SET @tiene_uq_doc = 0;
SET @sql = IF(@migrar,
  'SET @tiene_uq_doc = (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''clientes''
       AND INDEX_NAME = ''uq_clientes_documento'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @tiene_uq_doc > 0,
  'ALTER TABLE `clientes` DROP INDEX `uq_clientes_documento`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El cliente viejo se queda como entidad: su nombre es la razon social,
-- o el nombre de la persona si era persona natural.
SET @sql = IF(@migrar,
  'UPDATE `clientes`
      SET `nombre` = COALESCE(
            NULLIF(TRIM(`razon_social`), ''''),
            NULLIF(TRIM(CONCAT(COALESCE(`nombres`, ''''), '' '', COALESCE(`apellidos`, ''''))), ''''),
            CONCAT(''Cliente '', `id_cliente`))
    WHERE `nombre` IS NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Cada marca entra como cliente, heredando los datos fiscales del
-- cliente con el que aparece en algun pedido.
SET @sql = IF(@migrar,
  'INSERT INTO `clientes`
     (`nombre`, `descripcion`, `razon_social`, `tipo_documento`, `numero_documento`,
      `telefono`, `correo`, `direccion`, `estado`, `id_marca_origen`)
   SELECT m.`nombre`, m.`descripcion`, org.`razon_social`,
          COALESCE(org.`tipo_documento`, ''NIT''), org.`numero_documento`,
          org.`telefono`, org.`correo`, org.`direccion`, m.`estado`, m.`id_marca`
     FROM `marcas` m
     LEFT JOIN (SELECT p.`id_marca`, MIN(p.`id_cliente`) AS `id_cliente`
                  FROM `pedidos` p WHERE p.`id_marca` IS NOT NULL
                 GROUP BY p.`id_marca`) pm ON pm.`id_marca` = m.`id_marca`
     LEFT JOIN (SELECT `id_cliente`, `razon_social`, `tipo_documento`, `numero_documento`,
                       `telefono`, `correo`, `direccion`
                  FROM `clientes`) org ON org.`id_cliente` = pm.`id_cliente`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El cliente viejo cuya identidad fiscal quedo absorbida por sus marcas
-- se inactiva: si no, la digitadora ve "Crystal S.A.S." y "GEF" en el
-- mismo selector y no hay forma de saber cual escoger.
--
-- Se inactiva, no se borra: sigue en la base y basta un clic para
-- revivirlo. Y solo si su NIT quedo en alguna marca; un cliente que
-- todavia no tiene marcas registradas se queda activo tal cual.
SET @sql = IF(@migrar,
  'UPDATE `clientes` c
      SET c.`estado` = ''INACTIVO'',
          c.`descripcion` = CONCAT_WS('' '', c.`descripcion`,
            ''[Migracion: sus marcas quedaron como clientes propios]'')
    WHERE c.`id_marca_origen` IS NULL
      AND c.`numero_documento` IS NOT NULL
      AND EXISTS (SELECT 1 FROM (SELECT `numero_documento`, `id_marca_origen`
                                   FROM `clientes`) m
                   WHERE m.`id_marca_origen` IS NOT NULL
                     AND m.`numero_documento` = c.`numero_documento`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Si una marca se llama igual que un cliente, el unico por nombre no
-- dejaria crearse. Se desempata con el id antes de ponerlo.
SET @sql = IF(@migrar,
  'UPDATE `clientes` c
     JOIN (SELECT `nombre`, MIN(`id_cliente`) AS `primero`
             FROM `clientes` GROUP BY `nombre` HAVING COUNT(*) > 1) d
       ON d.`nombre` = c.`nombre` AND c.`id_cliente` <> d.`primero`
      SET c.`nombre` = CONCAT(c.`nombre`, '' ('', c.`id_cliente`, '')'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 3 - El lote absorbe referencia, SAM y ficha tecnica
-- =====================================================================
SET @falta_lote = 0;
SET @sql = IF(@migrar,
  'SET @falta_lote = (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''lotes''
       AND COLUMN_NAME = ''id_cliente'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @falta_lote,
  'ALTER TABLE `lotes`
     ADD COLUMN `numero_pedido` VARCHAR(50) NULL AFTER `codigo_lote`,
     ADD COLUMN `id_cliente` BIGINT NULL AFTER `numero_pedido`,
     ADD COLUMN `codigo_referencia` VARCHAR(50) NULL AFTER `id_cliente`,
     ADD COLUMN `nombre_referencia` VARCHAR(120) NULL AFTER `codigo_referencia`,
     ADD COLUMN `id_tipo_prenda` BIGINT NULL AFTER `nombre_referencia`,
     ADD COLUMN `sam_pactado` DECIMAL(10,2) NULL AFTER `id_tipo_prenda`,
     ADD COLUMN `material_principal` VARCHAR(150) NULL AFTER `sam_pactado`,
     ADD COLUMN `ruta_imagen` VARCHAR(500) NULL AFTER `material_principal`,
     ADD COLUMN `ruta_documento_pdf` VARCHAR(500) NULL AFTER `ruta_imagen`,
     ADD COLUMN `fecha_pedido` DATE NULL AFTER `ruta_documento_pdf`,
     ADD COLUMN `fecha_entrega_programada` DATE NULL AFTER `fecha_recepcion`,
     ADD COLUMN `fecha_entrega_real` DATE NULL AFTER `fecha_entrega_programada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El estado del lote absorbe el ciclo de vida que traia `pedidos`.
-- Los cinco valores que ya existian se conservan tal cual --no hay
-- ninguna fila que remapear--; los tres nuevos (APROBADO, DESPACHADO,
-- ENTREGADO) venian del ENUM de pedidos y quedan disponibles.
SET @sql = IF(@migrar AND @falta_lote,
  'ALTER TABLE `lotes`
     MODIFY COLUMN `estado` ENUM(''REGISTRADO'', ''APROBADO'', ''EN_PROCESO'',
                                 ''DESPACHADO'', ''ENTREGADO'', ''FINALIZADO'',
                                 ''CANCELADO'', ''INACTIVO'')
              NOT NULL DEFAULT ''REGISTRADO''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'UPDATE `lotes` l JOIN `clientes` c ON c.`id_marca_origen` = l.`id_marca`
      SET l.`id_cliente` = c.`id_cliente`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'UPDATE `lotes` l JOIN `referencias` r ON r.`id_referencia` = l.`id_referencia`
      SET l.`codigo_referencia` = r.`codigo`, l.`nombre_referencia` = r.`nombre`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El SAM, el material y los archivos salen de la ficha vigente de esa
-- referencia. Si hay varias versiones se toma la ultima: es la que
-- estaba rigiendo. La imagen y el PDF mantienen su columna propia.
SET @sql = IF(@migrar,
  'UPDATE `lotes` l
     JOIN (SELECT f.`id_referencia`, f.`sam_pactado`, f.`material_principal`,
                  f.`ruta_imagen`, f.`ruta_documento_pdf`
             FROM `fichas_tecnicas` f
             JOIN (SELECT `id_referencia`, MAX(`id_ficha_tecnica`) AS `ultima`
                     FROM `fichas_tecnicas` GROUP BY `id_referencia`) u
               ON u.`ultima` = f.`id_ficha_tecnica`) fic
       ON fic.`id_referencia` = l.`id_referencia`
      SET l.`sam_pactado` = fic.`sam_pactado`,
          l.`material_principal` = fic.`material_principal`,
          l.`ruta_imagen` = fic.`ruta_imagen`,
          l.`ruta_documento_pdf` = fic.`ruta_documento_pdf`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El pedido se vuelve parte del lote: folio y fechas se copian tal cual.
SET @sql = IF(@migrar,
  'UPDATE `lotes` l JOIN `pedidos` p ON p.`id_pedido` = l.`id_pedido`
      SET l.`numero_pedido` = p.`numero_pedido`,
          l.`fecha_pedido` = p.`fecha_pedido`,
          l.`fecha_entrega_programada` = p.`fecha_entrega_programada`,
          l.`fecha_entrega_real` = p.`fecha_entrega_real`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Un pedido podia repartirse en varios lotes; el folio es unico en la
-- tabla nueva. El primer lote se queda con el numero limpio y los demas
-- lo llevan sufijado, para no perder de cual pedido venian.
SET @sql = IF(@migrar,
  'UPDATE `lotes` l
     JOIN (SELECT `numero_pedido`, MIN(`id_lote`) AS `primero`
             FROM `lotes` WHERE `numero_pedido` IS NOT NULL
            GROUP BY `numero_pedido` HAVING COUNT(*) > 1) d
       ON d.`numero_pedido` = l.`numero_pedido` AND l.`id_lote` <> d.`primero`
      SET l.`numero_pedido` = CONCAT(l.`numero_pedido`, ''-'', l.`id_lote`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El tipo de prenda del lote se deduce de las prendas que el pedido
-- pedia. Si el pedido mezclaba tipos se toma el primero: es un dato de
-- clasificacion, no de calculo, y la digitadora lo puede corregir.
SET @sql = IF(@migrar,
  'UPDATE `lotes` l
     JOIN (SELECT dp.`id_pedido`, MIN(pr.`id_tipo_prenda`) AS `id_tipo_prenda`
             FROM `detalle_pedido` dp
             JOIN `prendas` pr ON pr.`id_prenda` = dp.`id_prenda`
            GROUP BY dp.`id_pedido`) tp
       ON tp.`id_pedido` = l.`id_pedido`
      SET l.`id_tipo_prenda` = tp.`id_tipo_prenda`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El desglose por talla y color que vivia en `detalle_pedido` se rescata
-- antes de borrar esa tabla: es la unica informacion de talla/color que
-- la empresa tenia cargada, y reconstruirla a mano seria imposible.
SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `lote_detalle_talla_color` (`id_lote`, `id_talla`, `id_color`, `cantidad`)
   SELECT l.`id_lote`, pr.`id_talla`, pr.`id_color`, SUM(dp.`cantidad`)
     FROM `detalle_pedido` dp
     JOIN `prendas` pr ON pr.`id_prenda` = dp.`id_prenda`
     JOIN `lotes` l ON l.`id_pedido` = dp.`id_pedido`
    GROUP BY l.`id_lote`, pr.`id_talla`, pr.`id_color`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Red de seguridad: un lote sin cliente resoluble no puede quedar en el
-- aire, porque `id_cliente` va a ser obligatorio.
SET @sql = IF(@migrar,
  'INSERT INTO `clientes` (`nombre`, `descripcion`, `estado`)
   SELECT ''Sin asignar'', ''Creado por la migracion: revisar los lotes que quedaron aqui'', ''ACTIVO''
     FROM DUAL
    WHERE EXISTS (SELECT 1 FROM `lotes` WHERE `id_cliente` IS NULL)
      AND NOT EXISTS (SELECT 1 FROM (SELECT `nombre` FROM `clientes`) c WHERE c.`nombre` = ''Sin asignar'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'UPDATE `lotes`
      SET `id_cliente` = (SELECT `id_cliente` FROM (SELECT `id_cliente`, `nombre` FROM `clientes`) c
                           WHERE c.`nombre` = ''Sin asignar'' LIMIT 1)
    WHERE `id_cliente` IS NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 4 - Reconstruir la jornada de cada dia ya capturado
--
--   Cada pareja (modulo, fecha) que tenga registros se vuelve una
--   jornada cerrada. El lote sale de la orden que estaba corriendo;
--   las operarias, de las asignaciones vigentes ese dia.
-- =====================================================================
-- `minutos_franja` y `precio_aplicado` llegaron en la migracion de agosto de
-- 2026 y su relleno vivia en `02_seed`. Se rehace aqui para que esta
-- migracion sea autosuficiente: una base que se quedo en una version anterior
-- entra igual, y `01_schema` ya cuenta con que las dos columnas existan.
SET @falta_franja = 0;
SET @sql = IF(@migrar,
  'SET @falta_franja = (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''registros_horarios''
       AND COLUMN_NAME = ''minutos_franja'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @falta_franja,
  'ALTER TABLE `registros_horarios`
     ADD COLUMN `minutos_franja` SMALLINT NOT NULL DEFAULT 60 AFTER `hora_jornada`,
     ADD COLUMN `precio_aplicado` DECIMAL(14,2) DEFAULT NULL AFTER `sam_aplicado`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El ancho real de cada franja ya capturada. Corre solo si se acaban de
-- crear las columnas: repetirlo despues de que la empresa cambie el horario
-- reescribiria el pasado, que es justo lo que estas columnas evitan.
SET @sql = IF(@migrar AND @falta_franja,
  'UPDATE `registros_horarios` r
     JOIN `jornada_dia` jd ON jd.`dia_semana` = WEEKDAY(r.`fecha`) + 1
     JOIN `jornada_franjas` jf ON jf.`id_jornada` = jd.`id_jornada`
                              AND jf.`orden_franja` = r.`hora_jornada`
      SET r.`minutos_franja` = jf.`minutos`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @falta_franja,
  'UPDATE `registros_horarios` r
     JOIN `ordenes_produccion` o ON o.`id_orden_produccion` = r.`id_orden_produccion`
      SET r.`precio_aplicado` = o.`valor_maquila_unidad`
    WHERE r.`precio_aplicado` IS NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @falta_reg = 0;
SET @sql = IF(@migrar,
  'SET @falta_reg = (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''registros_horarios''
       AND COLUMN_NAME = ''id_jornada_modulo'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @falta_reg,
  'ALTER TABLE `registros_horarios`
     ADD COLUMN `id_jornada_modulo` BIGINT NULL AFTER `id_registro`,
     ADD COLUMN `id_lote` BIGINT NULL AFTER `hora_jornada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'INSERT INTO `jornada_modulo`
     (`id_modulo`, `fecha`, `id_lote`, `id_orden_produccion`, `cantidad_operarias`,
      `estado`, `abierta_por`, `fecha_apertura`)
   SELECT g.`id_modulo`, g.`fecha`,
          COALESCE(o.`id_lote`, (SELECT MIN(`id_lote`) FROM `lotes`)),
          g.`id_orden`, g.`personas`, ''CERRADA'', g.`usuario`, g.`desde`
     FROM (SELECT `id_modulo`, `fecha`,
                  MIN(`id_orden_produccion`) AS `id_orden`,
                  MAX(`personas_presentes`)  AS `personas`,
                  MIN(`registrado_por`)      AS `usuario`,
                  MIN(`fecha_registro`)      AS `desde`
             FROM `registros_horarios`
            GROUP BY `id_modulo`, `fecha`) g
     LEFT JOIN `ordenes_produccion` o ON o.`id_orden_produccion` = g.`id_orden`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'UPDATE `registros_horarios` r
     JOIN `jornada_modulo` jm ON jm.`id_modulo` = r.`id_modulo` AND jm.`fecha` = r.`fecha`
      SET r.`id_jornada_modulo` = jm.`id_jornada_modulo`,
          r.`id_lote` = jm.`id_lote`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'ALTER TABLE `registros_horarios`
     MODIFY COLUMN `id_jornada_modulo` BIGINT NOT NULL,
     ADD INDEX `idx_registro_jornada` (`id_jornada_modulo`),
     ADD INDEX `idx_registro_lote` (`id_lote`),
     ADD CONSTRAINT `fk_registro_jornada` FOREIGN KEY (`id_jornada_modulo`)
         REFERENCES `jornada_modulo` (`id_jornada_modulo`) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD CONSTRAINT `fk_registro_lote` FOREIGN KEY (`id_lote`)
         REFERENCES `lotes` (`id_lote`) ON DELETE SET NULL ON UPDATE CASCADE',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Las asignaciones vigentes ese dia se vuelven la nomina de la jornada.
SET @sql = IF(@migrar,
  'INSERT INTO `jornada_operaria` (`id_jornada_modulo`, `numero`, `id_operario`)
   SELECT x.`id_jornada_modulo`, x.`numero`, x.`id_operario`
     FROM (SELECT jm.`id_jornada_modulo` AS `id_jornada_modulo`,
                  a.`id_operario` AS `id_operario`,
                  ROW_NUMBER() OVER (PARTITION BY jm.`id_jornada_modulo`
                                     ORDER BY a.`id_operario`) AS `numero`
             FROM `jornada_modulo` jm
             JOIN `asignaciones_modulo` a
               ON a.`id_modulo` = jm.`id_modulo`
              AND a.`rol_asignacion` = ''OPERARIO''
              AND a.`estado` IN (''ACTIVA'', ''FINALIZADA'')
              AND DATE(a.`fecha_inicio`) <= jm.`fecha`
              AND (a.`fecha_fin` IS NULL OR DATE(a.`fecha_fin`) >= jm.`fecha`)) x
    WHERE x.`numero` <= 99',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- La cantidad declarada nunca puede ser menor que la nomina que quedo.
SET @sql = IF(@migrar,
  'UPDATE `jornada_modulo` jm
     JOIN (SELECT `id_jornada_modulo`, COUNT(*) AS `total`
             FROM `jornada_operaria` GROUP BY `id_jornada_modulo`) n
       ON n.`id_jornada_modulo` = jm.`id_jornada_modulo`
      SET jm.`cantidad_operarias` = GREATEST(jm.`cantidad_operarias`, n.`total`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 5 - Soltar las llaves viejas
-- =====================================================================
SET @sql = IF(@migrar,
  'ALTER TABLE `lotes`
     DROP FOREIGN KEY `fk_lotes_marca`,
     DROP FOREIGN KEY `fk_lotes_pedido`,
     DROP FOREIGN KEY `fk_lotes_referencia`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'ALTER TABLE `lotes`
     DROP COLUMN `id_marca`,
     DROP COLUMN `id_pedido`,
     DROP COLUMN `id_referencia`,
     MODIFY COLUMN `id_cliente` BIGINT NOT NULL,
     ADD UNIQUE INDEX `uq_lotes_numero_pedido` (`numero_pedido`),
     ADD INDEX `idx_lotes_referencia` (`codigo_referencia`),
     ADD INDEX `fk_lotes_tipo_prenda` (`id_tipo_prenda`),
     ADD CONSTRAINT `fk_lotes_cliente` FOREIGN KEY (`id_cliente`)
         REFERENCES `clientes` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD CONSTRAINT `fk_lotes_tipo_prenda` FOREIGN KEY (`id_tipo_prenda`)
         REFERENCES `tipos_prenda` (`id_tipo_prenda`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'ALTER TABLE `ordenes_produccion`
     DROP FOREIGN KEY `fk_orden_ficha`,
     DROP FOREIGN KEY `fk_orden_pedido`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'ALTER TABLE `ordenes_produccion`
     DROP COLUMN `id_ficha_tecnica`,
     DROP COLUMN `id_pedido`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 6 - Borrar lo que ya no existe conceptualmente
--   En orden de dependencia: primero las hijas.
-- =====================================================================
--   `tallas`, `colores` y `tipos_prenda` NO se borran: siguen siendo los
--   catalogos del producto, ahora usados desde el formulario del lote
--   (`lotes.id_tipo_prenda` y `lote_detalle_talla_color`). Lo que
--   desaparece es `prendas`, que era el SKU armado con los tres.
SET @sql = IF(@migrar,
  'DROP TABLE IF EXISTS
     `detalle_orden_produccion`, `detalle_pedido`, `prendas`,
     `ficha_tecnica_medidas`, `ficha_tecnica_materiales`, `ficha_tecnica_operaciones`,
     `fichas_tecnicas`, `referencias`, `asignaciones_modulo`, `pedidos`,
     `marcas`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 7 - Dejar `clientes` con la forma definitiva
-- =====================================================================
SET @sql = IF(@migrar,
  'ALTER TABLE `clientes`
     DROP COLUMN `nombres`,
     DROP COLUMN `apellidos`,
     DROP COLUMN `id_marca_origen`,
     MODIFY COLUMN `nombre` VARCHAR(120) NOT NULL,
     ADD UNIQUE INDEX `uq_clientes_nombre` (`nombre`),
     ADD INDEX `idx_clientes_documento` (`numero_documento`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- `operarios.cargo` pierde SUPERVISOR: la jornada la configura la
-- digitadora desde la app, no una supervisora por modulo.
SET @sql = IF(@migrar,
  'UPDATE `operarios` SET `cargo` = ''OTRO'' WHERE `cargo` = ''SUPERVISOR''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'ALTER TABLE `operarios`
     MODIFY COLUMN `cargo` ENUM(''OPERARIO'', ''MECANICO'', ''OTRO'') NOT NULL DEFAULT ''OPERARIO''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 8 - Permisos y roles del flujo nuevo
--   Los permisos que quedan vivos los vuelve a sembrar `02_seed`. Aqui
--   solo se retira lo que ya no tiene pantalla y se renombra el rol.
--
--   Dashboard, Indicadores y Reportes se van porque los tres se
--   fusionaron en una sola pantalla, `Panel`, que `02_seed` crea.
-- =====================================================================
SET @sql = IF(@migrar,
  'DELETE FROM `permisos`
    WHERE `modulo` IN (''Marcas'', ''Pedidos'', ''Prendas'', ''Referencias'',
                       ''Fichas Tecnicas'', ''Asignaciones'',
                       ''Dashboard'', ''Indicadores'', ''Reportes'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar,
  'UPDATE `roles`
      SET `nombre` = ''Digitadora'',
          `descripcion` = ''Configura la jornada del modulo y registra la produccion de cada hora''
    WHERE `nombre` = ''Supervisor''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- =====================================================================
-- Paso 9 - Dejar constancia
-- =====================================================================
SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-09_flujo_jornada'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET SQL_MODE = @OLD_SQL_MODE;
