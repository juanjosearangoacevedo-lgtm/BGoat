-- =====================================================================
-- BGoat - La prioridad de la orden deja de ser una etiqueta y pasa a ser
-- la posicion en la cola
-- Clave: 2026-10_prioridad_consecutivo
--
-- QUE HACE
--   `ordenes_produccion.prioridad` deja de ser ENUM('BAJA','MEDIA','ALTA',
--   'URGENTE') elegido a mano y pasa a ser un numero entero que el
--   backend asigna solo, en el momento de crear la orden: el siguiente
--   consecutivo global (no por modulo). La orden mas vieja en la cola
--   sigue siendo la numero mas baja.
--
--   Ya no se digita ni se edita: el formulario no la vuelve a pedir.
--
-- COMO SE RESUELVEN LOS VALORES VIEJOS
--   MySQL convierte un ENUM a INT con el indice interno del valor
--   (BAJA=1, MEDIA=2, ALTA=3, URGENTE=4), asi que varias ordenes
--   quedarian con el mismo numero. Para que la columna vuelva a
--   significar "posicion en la cola" se reasigna con el propio
--   `id_orden_produccion`: ya es un consecutivo global que refleja el
--   orden de creacion, exactamente lo que se necesita.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que la columna todavia sea el ENUM viejo.
-- =====================================================================

SET @prioridad_vieja = (SELECT COUNT(*) FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                          AND COLUMN_NAME = 'prioridad' AND COLUMN_TYPE LIKE '%BAJA%') > 0;

SET @sql = IF(@prioridad_vieja,
  'ALTER TABLE `ordenes_produccion` MODIFY COLUMN `prioridad` INT NOT NULL DEFAULT 1',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@prioridad_vieja,
  'UPDATE `ordenes_produccion` SET `prioridad` = `id_orden_produccion`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @hay_indice = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                     AND INDEX_NAME = 'idx_orden_prioridad');

SET @sql = IF(@prioridad_vieja AND @hay_indice = 0,
  'ALTER TABLE `ordenes_produccion` ADD INDEX `idx_orden_prioridad` (`prioridad`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@prioridad_vieja,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_prioridad_consecutivo'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
