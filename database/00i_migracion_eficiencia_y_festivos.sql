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
--   Corre ANTES de `01_schema_bgoat.sql`, asi que en una base nueva
--   `ordenes_produccion` todavia no existe: no hay a que agregarle la
--   columna, y `01` la crea ya con ella (igual que `dias_no_laborales`).
--   Por eso no basta con preguntar si falta la columna --en una base
--   nueva tambien falta--: el ALTER y el calendario se condicionan a que
--   la tabla exista, y la columna se agrega solo si ademas le falta.
--   (`migraciones`, la tabla de constancia, se crea siempre, como en el
--   resto de las migraciones; la clave solo se anota si hubo cambio.)
-- =====================================================================

SET @hay_ordenes = (SELECT COUNT(*) FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion');

SET @col_eficiencia = (SELECT COUNT(*) FROM information_schema.COLUMNS
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                         AND COLUMN_NAME = 'eficiencia_esperada');

-- Hay que migrar si la tabla ya existe (modelo anterior) y le falta la columna.
SET @migrar = (@hay_ordenes > 0 AND @col_eficiencia = 0);

SET @sql = IF(@migrar,
  'ALTER TABLE `ordenes_produccion`
     ADD COLUMN `eficiencia_esperada` DECIMAL(5,2) DEFAULT NULL AFTER `cantidad_programada`,
     ADD CONSTRAINT `chk_orden_eficiencia_esperada`
       CHECK (`eficiencia_esperada` IS NULL OR (`eficiencia_esperada` > 0 AND `eficiencia_esperada` <= 100))',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- El calendario se crea solo si ya hay un modelo al que sumarselo: en una
-- base nueva lo crea `01_schema` con todo lo demas. Crearlo aqui primero
-- dejaria dos copias del mismo DDL, y un cambio futuro en `01` no llegaria
-- a las bases nuevas (su `CREATE TABLE IF NOT EXISTS` ya no tendria efecto).
SET @sql = IF(@hay_ordenes > 0,
  'CREATE TABLE IF NOT EXISTS `dias_no_laborales` (
     `fecha` DATE NOT NULL,
     `descripcion` VARCHAR(100) DEFAULT NULL,
     PRIMARY KEY (`fecha`)
   ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@migrar,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_eficiencia_y_festivos'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
