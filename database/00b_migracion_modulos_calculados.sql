-- =====================================================================
-- BGoat - Los parametros del modulo que en realidad son calculos
-- Clave: 2026-09_modulos_calculados
--
-- QUE HACE
--   Quita de `modulos` las tres cifras que se digitaban a mano y que el
--   sistema ya sabe calcular:
--
--     horas_jornada        -> la suma de `jornada_franjas` del dia
--                             (520 minutos entre semana, 440 el sabado).
--                             La columna decia 9; la planta trabaja 8.67.
--     horas_semanales      -> no la usaba ningun calculo real.
--     eficiencia_esperada  -> la eficiencia se MIDE (unidades contra
--                             meta). Declararla a mano solo servia para
--                             que el numero escrito contradijera al
--                             numero calculado.
--
--   Las tres solo alimentaban una "capacidad semanal teorica" que no
--   aparece en ningun tablero de la empresa.
--
-- QUE SE CONSERVA
--   `capacidad_operarios` (cuantos puestos tiene el modulo) y
--   `umbral_cumplimiento` (bajo ese %, la app pide la incidencia). Esas
--   dos SI son decisiones del negocio y ningun calculo las deduce.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Cada paso va condicionado a que la columna exista. En una base
--   recien creada `modulos` todavia no existe y todo queda en `DO 0`.
--
-- NO SE PIERDE NADA QUE NO SE PUEDA RECONSTRUIR
--   Los tres valores eran configuracion, no historia: ningun registro
--   horario los guardo nunca. Lo capturado no se toca.
-- =====================================================================

SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ---------------------------------------------------------------------
-- Hay que migrar si la tabla `modulos` todavia tiene alguna de las tres.
-- ---------------------------------------------------------------------
SET @hay_modulos = (SELECT COUNT(*) FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'modulos');

SET @col_horas_jornada = (SELECT COUNT(*) FROM information_schema.COLUMNS
                          WHERE TABLE_SCHEMA = DATABASE()
                            AND TABLE_NAME = 'modulos'
                            AND COLUMN_NAME = 'horas_jornada');

SET @col_horas_semanales = (SELECT COUNT(*) FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'modulos'
                              AND COLUMN_NAME = 'horas_semanales');

SET @col_eficiencia = (SELECT COUNT(*) FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA = DATABASE()
                         AND TABLE_NAME = 'modulos'
                         AND COLUMN_NAME = 'eficiencia_esperada');

SET @migrar = (@hay_modulos > 0 AND
               (@col_horas_jornada > 0 OR @col_horas_semanales > 0 OR @col_eficiencia > 0));

-- ---------------------------------------------------------------------
-- Paso 1 - Los CHECK primero
--   MySQL no deja soltar una columna que una restriccion todavia
--   menciona, asi que el orden importa.
-- ---------------------------------------------------------------------
SET @chk_eficiencia = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                       WHERE TABLE_SCHEMA = DATABASE()
                         AND TABLE_NAME = 'modulos'
                         AND CONSTRAINT_NAME = 'chk_modulos_eficiencia');

SET @sql = IF(@migrar AND @chk_eficiencia > 0,
  'ALTER TABLE `modulos` DROP CHECK `chk_modulos_eficiencia`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @chk_jornada = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'modulos'
                      AND CONSTRAINT_NAME = 'chk_modulos_jornada');

SET @sql = IF(@migrar AND @chk_jornada > 0,
  'ALTER TABLE `modulos` DROP CHECK `chk_modulos_jornada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 2 - Las columnas
-- ---------------------------------------------------------------------
SET @sql = IF(@migrar AND @col_horas_jornada > 0,
  'ALTER TABLE `modulos` DROP COLUMN `horas_jornada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @col_horas_semanales > 0,
  'ALTER TABLE `modulos` DROP COLUMN `horas_semanales`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@migrar AND @col_eficiencia > 0,
  'ALTER TABLE `modulos` DROP COLUMN `eficiencia_esperada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 3 - Dejar constancia
--   `migraciones` la crea `01_schema`, que corre despues. Si todavia no
--   existe se crea aqui: la marca tiene que quedar en la misma corrida
--   que hizo el cambio.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-09_modulos_calculados'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET SQL_MODE = @OLD_SQL_MODE;
