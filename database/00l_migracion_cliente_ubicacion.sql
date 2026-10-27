-- =====================================================================
-- BGoat - Departamento y municipio del cliente
-- Clave: 2026-10_cliente_ubicacion
--
-- QUE HACE
--   Agrega a `clientes` dos columnas, `departamento` y `municipio`, para
--   que la direccion se elija de la lista de Colombia (el formulario las
--   pide con dos listas encadenadas y `direccion` queda solo con la calle).
--   Vienen vacias: los clientes que ya existen no tienen ubicacion hasta
--   que alguien se la ponga al editarlos.
--
--   NO toca `razon_social`: "Nombre o razon social" es ahora un solo campo
--   (`nombre`) y la columna vieja deja de escribirse y de mostrarse, pero
--   se conserva para no perder lo que ya estaba guardado. Esta migracion no
--   borra ni cambia ningun dato.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Va condicionada a que la tabla `clientes` ya exista (en una base nueva
--   la crea `01_schema`, que ya trae las columnas) y a que las columnas no
--   esten. Correrla dos veces deja lo mismo.
-- =====================================================================

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @hay_clientes = (SELECT COUNT(*) FROM information_schema.TABLES
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes');

SET @col_departamento = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes'
                           AND COLUMN_NAME = 'departamento');

SET @aplicar = (@hay_clientes > 0 AND @col_departamento = 0);

SET @sql = IF(@aplicar,
  'ALTER TABLE `clientes`
     ADD COLUMN `departamento` VARCHAR(60) DEFAULT NULL AFTER `direccion`,
     ADD COLUMN `municipio` VARCHAR(80) DEFAULT NULL AFTER `departamento`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@aplicar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_cliente_ubicacion'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
