-- =====================================================================
-- BGoat - Quita fechas muertas del lote y la cantidad duplicada de la orden
-- Clave: 2026-09_lote_limpieza
--
-- QUE HACE
--   1. Suelta `lotes.fecha_inicio` y `lotes.fecha_finalizacion`: ninguna
--      vista, ruta ni reporte las lee -- se revisaron una por una. Las
--      fechas que de verdad se usan para programar y medir el avance son
--      `ordenes_produccion.fecha_inicio_programada` / `fecha_fin_programada`
--      (y sus reales), que ya alimentan `vw_avance_orden` y "Ordenes en
--      riesgo".
--   2. No toca `ordenes_produccion.cantidad_programada`: la columna sigue
--      ahi (la vista y el calculo de avance la necesitan), lo que cambia
--      es que el backend deja de aceptarla desde el formulario y la copia
--      del lote al crear la orden -- un lote siempre corre en una sola
--      orden, asi que pedirla dos veces solo abria la puerta a que las
--      dos cifras se desincronizaran.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que las columnas existan.
-- =====================================================================

SET @col_inicio = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'lotes'
                     AND COLUMN_NAME = 'fecha_inicio');

SET @col_fin = (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'lotes'
                  AND COLUMN_NAME = 'fecha_finalizacion');

SET @sql = IF(@col_inicio > 0,
  'ALTER TABLE `lotes` DROP COLUMN `fecha_inicio`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_fin > 0,
  'ALTER TABLE `lotes` DROP COLUMN `fecha_finalizacion`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

INSERT IGNORE INTO `migraciones` (`clave`) VALUES ('2026-09_lote_limpieza');
