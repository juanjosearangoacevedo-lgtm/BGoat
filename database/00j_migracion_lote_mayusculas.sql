-- =====================================================================
-- BGoat - El codigo de lote, el codigo de referencia y el numero de
-- pedido quedan en MAYUSCULAS
-- Clave: 2026-10_lote_mayusculas
--
-- QUE HACE
--   Sube a mayusculas lo que ya esta guardado en `lotes.codigo_lote`,
--   `lotes.codigo_referencia` y `lotes.numero_pedido`. Desde ahora el
--   backend los guarda asi (ver `backend/src/lib/lotes.js`), pero los lotes
--   que ya existian pueden traerlos en minuscula: sin esto el listado
--   mostraria "ped-12" al lado de "PED-13".
--
--   No toca ninguna otra columna: el nombre de la referencia, las
--   observaciones y el resto se quedan como se escribieron.
--
-- NO PUEDE CHOCAR CON LOS INDICES UNICOS
--   `uq_lotes_codigo` y `uq_lotes_numero_pedido` comparan sin distinguir
--   mayusculas (la collation de esas columnas es `_ci`): dos valores que
--   solo se diferenciaran por el caso ya estaban rechazados, asi que
--   subirlos no puede crear un duplicado.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que la tabla `lotes` ya exista (en una base nueva la
--   crea `01_schema` mas adelante) y a que no se haya aplicado antes.
-- =====================================================================

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @hay_lotes = (SELECT COUNT(*) FROM information_schema.TABLES
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lotes') > 0;

SET @ya_aplicada = (SELECT COUNT(*) FROM `migraciones`
                    WHERE `clave` = '2026-10_lote_mayusculas') > 0;

SET @aplicar = (@hay_lotes AND NOT @ya_aplicada);

SET @sql = IF(@aplicar,
  'UPDATE `lotes`
      SET `codigo_lote` = UPPER(`codigo_lote`),
          `codigo_referencia` = UPPER(`codigo_referencia`),
          `numero_pedido` = UPPER(`numero_pedido`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@aplicar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_lote_mayusculas'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
