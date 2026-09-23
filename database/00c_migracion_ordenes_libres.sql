-- =====================================================================
-- BGoat - La orden de produccion deja de pertenecer a un modulo
-- Clave: 2026-09_ordenes_libres
--
-- QUE HACE
--   Quita `ordenes_produccion.id_modulo`. La orden nace libre y la toma
--   el modulo que abre su jornada con ella; desde ese momento ningun
--   otro modulo puede tomarla.
--
-- POR QUE
--   La columna era NOT NULL: obligaba a decidir el modulo en el
--   escritorio, dias antes de que la planta supiera cual se desocupa.
--   En la practica quien decide es la digitadora, el mismo dia, al abrir
--   la jornada.
--
-- QUE SE CONSERVA
--   Antes de soltar la columna, cada jornada que ya estaba corriendo el
--   lote de una orden y no tenia la orden anotada se la anota. Asi la
--   asignacion que existia no se pierde: cambia de sitio.
--   `registros_horarios.id_orden_produccion` no se toca: las horas ya
--   capturadas siguen apuntando a su orden.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que la columna exista.
-- =====================================================================

SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

SET @col_modulo = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ordenes_produccion'
                     AND COLUMN_NAME = 'id_modulo');

SET @hay_jornada = (SELECT COUNT(*) FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jornada_modulo');

SET @migrar = (@col_modulo > 0);

-- ---------------------------------------------------------------------
-- Paso 1 - Mudar la asignacion a la jornada, antes de borrar nada
--
--   Solo se anota donde la jornada ya corre ESE lote y todavia no tiene
--   orden: es la misma asignacion que decia la columna, leida desde el
--   lado del modulo.
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar AND @hay_jornada > 0,
  'UPDATE `jornada_modulo` jm
      JOIN `ordenes_produccion` o
        ON o.id_modulo = jm.id_modulo AND o.id_lote = jm.id_lote
       SET jm.id_orden_produccion = o.id_orden_produccion
     WHERE jm.id_orden_produccion IS NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 2 - Soltar la llave foranea y el indice
--   El nombre de la FK puede variar si la base se creo a mano, asi que
--   se busca en `information_schema` en vez de asumirlo.
-- ---------------------------------------------------------------------
SET @nombre_fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'ordenes_produccion'
                    AND COLUMN_NAME = 'id_modulo'
                    AND REFERENCED_TABLE_NAME = 'modulos'
                  LIMIT 1);

SET @sql = IF(@migrar AND @nombre_fk IS NOT NULL,
  CONCAT('ALTER TABLE `ordenes_produccion` DROP FOREIGN KEY `', @nombre_fk, '`'),
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @hay_indice = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ordenes_produccion'
                     AND INDEX_NAME = 'idx_orden_modulo');

SET @sql = IF(@migrar AND @hay_indice > 0,
  'ALTER TABLE `ordenes_produccion` DROP INDEX `idx_orden_modulo`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 3 - La vista lee la columna: hay que soltarla antes que a ella
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar, 'DROP VIEW IF EXISTS `vw_avance_orden`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar, 'DROP VIEW IF EXISTS `vw_curva_arranque`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 4 - La columna
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar,
  'ALTER TABLE `ordenes_produccion` DROP COLUMN `id_modulo`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 5 - Dejar constancia
--   `01_schema` vuelve a crear las dos vistas con la forma nueva.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-09_ordenes_libres'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET SQL_MODE = @OLD_SQL_MODE;
