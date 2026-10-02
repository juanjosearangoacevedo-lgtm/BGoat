-- =====================================================================
-- BGoat - Eficiencia esperada por orden y calendario de dias no laborales
-- Clave: 2026-10_eficiencia_y_festivos
--
-- QUE HACE
--   `ordenes_produccion.eficiencia_esperada` (%): el supuesto de
--   planeacion que German ajusta a mano por pedido -no una eficiencia
--   declarada de forma fija- para estimar cuando estaria listo. Puede
--   quedar vacio y se puede cambiar dia a dia; no reemplaza la eficiencia
--   real, que se sigue midiendo sola en los indicadores.
--
--   Tabla `dias_no_laborales`: el calendario de festivos y cierres que
--   el sistema no conocia hasta ahora (solo sabia que domingo no se
--   trabaja, por la ausencia de fila en `jornada_dia`). Sin esto, un 25
--   de diciembre que caiga martes se contaba como dia normal.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que las columnas/tabla no existan.
-- =====================================================================

SET @col_eficiencia = (SELECT COUNT(*) FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                         AND COLUMN_NAME = 'eficiencia_esperada');

SET @sql = IF(@col_eficiencia = 0,
  'ALTER TABLE `ordenes_produccion`
     ADD COLUMN `eficiencia_esperada` DECIMAL(5,2) DEFAULT NULL AFTER `cantidad_programada`,
     ADD CONSTRAINT `chk_orden_eficiencia_esperada`
       CHECK (`eficiencia_esperada` IS NULL OR (`eficiencia_esperada` > 0 AND `eficiencia_esperada` <= 100))',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

CREATE TABLE IF NOT EXISTS `dias_no_laborales` (
  `fecha` DATE NOT NULL,
  `descripcion` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`fecha`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@col_eficiencia = 0,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_eficiencia_y_festivos'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
