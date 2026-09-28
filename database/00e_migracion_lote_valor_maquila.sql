-- =====================================================================
-- BGoat - El valor de maquila pasa de la orden al lote
-- Clave: 2026-09_lote_valor_maquila
--
-- QUE HACE
--   Mueve `valor_maquila_unidad` de `ordenes_produccion` a `lotes`, junto
--   al SAM pactado. Las dos son la misma clase de dato -- una constante
--   del acuerdo con el cliente que no se digita cada hora, se copia al
--   registro (ver `sam_aplicado` / `precio_aplicado` de
--   `registros_horarios`) -- y un lote corre en una sola orden, asi que
--   tenerla en la orden solo la duplicaba.
--
--   De paso, hoy la facturacion de un modulo quedaba en cero mientras
--   nadie creara la orden (el valor solo vivia ahi). Con el valor en el
--   lote, la facturacion arranca el mismo dia que la meta: con el lote.
--
-- QUE SE CONSERVA
--   El valor de la orden vigente de cada lote se copia antes de soltar
--   la columna. Un lote con mas de una orden historica (cancelada,
--   finalizada) se queda con el valor de la mas reciente -- es una
--   situacion que hoy no se da en la operacion (un lote, una orden).
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que la columna todavia este en `ordenes_produccion`.
-- =====================================================================

SET @col_en_orden = (SELECT COUNT(*) FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME = 'ordenes_produccion'
                       AND COLUMN_NAME = 'valor_maquila_unidad');

SET @col_en_lote = (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'lotes'
                      AND COLUMN_NAME = 'valor_maquila_unidad');

SET @migrar = (@col_en_orden > 0);

-- ---------------------------------------------------------------------
-- Paso 1 - La columna en lotes, si todavia no existe
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar AND @col_en_lote = 0,
  'ALTER TABLE `lotes` ADD COLUMN `valor_maquila_unidad` DECIMAL(14,2) DEFAULT NULL AFTER `sam_pactado`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @tiene_check = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'lotes'
                      AND CONSTRAINT_NAME = 'chk_lotes_valor_maquila');

SET @sql = IF(@migrar AND @tiene_check = 0,
  'ALTER TABLE `lotes` ADD CONSTRAINT `chk_lotes_valor_maquila` CHECK (`valor_maquila_unidad` IS NULL OR `valor_maquila_unidad` > 0)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 2 - Copiar el valor de la orden vigente de cada lote
--   "Vigente" es la mas reciente por fecha de emision: si un lote
--   acumulo mas de una orden con el tiempo, la ultima es la que manda.
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar,
  'UPDATE `lotes` l
     JOIN (
       SELECT o1.id_lote, o1.valor_maquila_unidad
       FROM `ordenes_produccion` o1
       WHERE o1.valor_maquila_unidad IS NOT NULL
         AND o1.fecha_emision = (
           SELECT MAX(o2.fecha_emision) FROM `ordenes_produccion` o2
           WHERE o2.id_lote = o1.id_lote AND o2.valor_maquila_unidad IS NOT NULL
         )
     ) o ON o.id_lote = l.id_lote
      SET l.valor_maquila_unidad = o.valor_maquila_unidad
    WHERE l.valor_maquila_unidad IS NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 3 - La vista lee la columna: hay que soltarla antes que a ella
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar, 'DROP VIEW IF EXISTS `vw_avance_orden`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 4 - La columna en ordenes_produccion
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar,
  'ALTER TABLE `ordenes_produccion` DROP COLUMN `valor_maquila_unidad`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 5 - Dejar constancia
--   `01_schema` vuelve a crear las vistas con la forma nueva.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-09_lote_valor_maquila'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
