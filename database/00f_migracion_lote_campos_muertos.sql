-- =====================================================================
-- BGoat - Quita campos del lote que ninguna vista, ruta ni pantalla usa
-- Clave: 2026-09_lote_campos_muertos
--
-- QUE HACE
--   Suelta `lotes.material_principal`, `lotes.fecha_pedido` y
--   `lotes.fecha_entrega_real`. Se revisaron una por una: ninguna
--   alimenta un calculo, un reporte, ni siquiera se muestra en la tabla
--   de lotes.
--
--   Las fechas que si hacen falta se quedan: `fecha_recepcion` (cuando
--   llego la mercancia) y `fecha_entrega_programada` (el compromiso con
--   el cliente). Cuando empieza y termina la produccion vive en la orden.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que las columnas existan.
-- =====================================================================

SET @col_material = (SELECT COUNT(*) FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'material_principal');
SET @col_fecha_pedido = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'fecha_pedido');
SET @col_entrega_real = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'fecha_entrega_real');

-- La vista lee `fecha_entrega_real`: hay que soltarla antes que a ella.
SET @sql = IF(@col_entrega_real > 0, 'DROP VIEW IF EXISTS `vw_avance_orden`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_material > 0,
  'ALTER TABLE `lotes` DROP COLUMN `material_principal`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_fecha_pedido > 0,
  'ALTER TABLE `lotes` DROP COLUMN `fecha_pedido`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_entrega_real > 0,
  'ALTER TABLE `lotes` DROP COLUMN `fecha_entrega_real`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@col_material > 0 OR @col_fecha_pedido > 0 OR @col_entrega_real > 0,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-09_lote_campos_muertos'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
