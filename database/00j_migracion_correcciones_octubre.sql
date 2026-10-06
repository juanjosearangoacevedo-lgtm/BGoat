-- =====================================================================
-- BGoat - Correcciones de la revision de octubre
-- Clave: 2026-10_correcciones_octubre
--
-- QUE HACE
--   1. Suelta `operarios.especialidad`: las operarias no tienen una
--      especialidad fija, el campo no lo llenaba nadie.
--
--   2. `causas_desviacion.nombre` pasa a ser `descripcion`, opcional:
--      el `codigo` ya es el nombre de la causa ("MAQUINA", o uno legible
--      como "Dano de maquina" para las nuevas), y la descripcion es la
--      explicacion larga. Por eso `codigo` se ensancha a 100.
--
--   3. Normaliza `causas_desviacion.responsable`: era texto libre y
--      "Produccion", "produccion" y "Produccion " eran tres responsables
--      distintos. Ahora es la tabla `responsables` y la causa apunta a
--      ella con `id_responsable`. Los valores que ya existian se
--      convierten en filas de la tabla nueva.
--
--   4. `lotes.cantidad_recibida` deja de digitarse: es la suma del
--      desglose por talla y color, el mismo numero que
--      `cantidad_programada`. Aqui se igualan los lotes que ya existen.
--
--   5. `registro_minutos_perdidos` guarda cada parada con su hora de
--      inicio y de fin (`hora_desde`, `hora_hasta`); los minutos se
--      calculan de ahi. Una causa puede tener varias paradas en la hora.
--
--   6. Plan de produccion nuevo (`backend/src/lib/plan.js`): la prioridad
--      va por fecha de recepcion del lote, el inicio es el dia en que se
--      abre jornada con la orden y la entrega sale de la formula de German
--      desde ese dia y queda fija. Columnas nuevas en la orden:
--        `personas_entrega`     con cuantas personas se calculo la entrega;
--        `personas_aviso_visto` las personas para las que German ya dijo
--                               "dejar como esta" (apaga el aviso).
--      Las fechas viejas de las ordenes sin terminar se calcularon con la
--      regla anterior (inicio = recepcion): se borran aqui y el backend
--      las vuelve a calcular al arrancar, con la regla nueva.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Cada paso va condicionado a que la columna vieja exista.
-- =====================================================================

-- --- 1. operarios.especialidad ---------------------------------------
SET @col_especialidad = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'operarios'
                           AND COLUMN_NAME = 'especialidad');

SET @sql = IF(@col_especialidad > 0,
  'ALTER TABLE `operarios` DROP COLUMN `especialidad`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- 2. causas: nombre -> descripcion -----------------------------------
SET @col_nombre_causa = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'causas_desviacion'
                           AND COLUMN_NAME = 'nombre');

SET @sql = IF(@col_nombre_causa > 0,
  'ALTER TABLE `causas_desviacion`
     MODIFY COLUMN `codigo` VARCHAR(100) NOT NULL,
     CHANGE COLUMN `nombre` `descripcion` VARCHAR(255) DEFAULT NULL',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- 3. responsables -----------------------------------------------------
SET @col_responsable = (SELECT COUNT(*) FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'causas_desviacion'
                          AND COLUMN_NAME = 'responsable');

-- Solo en una base existente: en una nueva la crea `01_schema` en su
-- sitio, antes de `causas_desviacion`.
SET @sql = IF(@col_responsable > 0,
  'CREATE TABLE IF NOT EXISTS `responsables` (
     `id_responsable` BIGINT NOT NULL AUTO_INCREMENT,
     `nombre` VARCHAR(80) NOT NULL,
     `estado` ENUM(''ACTIVO'', ''INACTIVO'') NOT NULL DEFAULT ''ACTIVO'',
     PRIMARY KEY (`id_responsable`),
     UNIQUE INDEX `uq_responsables_nombre` (`nombre`)
   ) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- TRIM: los espacios sobrantes eran justo la forma de duplicar uno. El
-- indice unico (collation sin acentos ni mayusculas) junta el resto.
SET @sql = IF(@col_responsable > 0,
  'INSERT IGNORE INTO `responsables` (`nombre`)
   SELECT DISTINCT TRIM(`responsable`) FROM `causas_desviacion`
    WHERE `responsable` IS NOT NULL AND TRIM(`responsable`) <> ''''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_responsable > 0,
  'ALTER TABLE `causas_desviacion`
     ADD COLUMN `id_responsable` BIGINT DEFAULT NULL AFTER `tipo`,
     ADD INDEX `fk_causa_responsable` (`id_responsable`),
     ADD CONSTRAINT `fk_causa_responsable`
       FOREIGN KEY (`id_responsable`) REFERENCES `responsables` (`id_responsable`)
       ON DELETE RESTRICT ON UPDATE CASCADE',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_responsable > 0,
  'UPDATE `causas_desviacion` c
     JOIN `responsables` r ON r.`nombre` = TRIM(c.`responsable`)
      SET c.`id_responsable` = r.`id_responsable`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@col_responsable > 0,
  'ALTER TABLE `causas_desviacion` DROP COLUMN `responsable`', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- 4. lotes.cantidad_recibida = suma del desglose ----------------------
-- Idempotente: correrla dos veces deja lo mismo. En una base nueva la
-- tabla todavia no existe (la crea `01_schema`, que corre despues).
SET @hay_lotes = (SELECT COUNT(*) FROM information_schema.TABLES
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lotes');

SET @sql = IF(@hay_lotes > 0,
  'UPDATE `lotes` SET `cantidad_recibida` = `cantidad_programada`
    WHERE `cantidad_recibida` <> `cantidad_programada`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- 5. minutos perdidos por intervalo ---------------------------------
-- La digitadora ya no escribe "20 minutos": escribe de que hora a que
-- hora estuvo parado el modulo, y los minutos se calculan. Una misma
-- causa puede repetirse en la hora (la maquina se trabo dos veces), asi
-- que la llave deja de ser (registro, causa) y cada parada es su fila.
-- Los registros viejos se quedan con sus minutos y sin horas.
SET @col_desde = (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registro_minutos_perdidos'
                    AND COLUMN_NAME = 'hora_desde');
SET @hay_perdidos = (SELECT COUNT(*) FROM information_schema.TABLES
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registro_minutos_perdidos');

-- El indice propio de `id_registro` va primero: la llave foranea se
-- apoyaba en la llave primaria, que se va a cambiar.
SET @sql = IF(@hay_perdidos > 0 AND @col_desde = 0,
  'ALTER TABLE `registro_minutos_perdidos` ADD INDEX `fk_perdida_registro` (`id_registro`)',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@hay_perdidos > 0 AND @col_desde = 0,
  'ALTER TABLE `registro_minutos_perdidos`
     DROP PRIMARY KEY,
     ADD COLUMN `id_perdida` BIGINT NOT NULL AUTO_INCREMENT FIRST,
     ADD PRIMARY KEY (`id_perdida`),
     ADD COLUMN `hora_desde` TIME DEFAULT NULL AFTER `id_causa`,
     ADD COLUMN `hora_hasta` TIME DEFAULT NULL AFTER `hora_desde`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- 6. plan de produccion -------------------------------------------------
SET @col_personas_entrega = (SELECT COUNT(*) FROM information_schema.COLUMNS
                             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                               AND COLUMN_NAME = 'personas_entrega');
SET @hay_ordenes = (SELECT COUNT(*) FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion');

SET @sql = IF(@hay_ordenes > 0 AND @col_personas_entrega = 0,
  'ALTER TABLE `ordenes_produccion`
     ADD COLUMN `personas_entrega` SMALLINT DEFAULT NULL AFTER `eficiencia_esperada`,
     ADD COLUMN `personas_aviso_visto` SMALLINT DEFAULT NULL AFTER `personas_entrega`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Solo la primera vez (cuando se acaban de crear las columnas).
SET @sql = IF(@hay_ordenes > 0 AND @col_personas_entrega = 0,
  'UPDATE `lotes` l
     JOIN `ordenes_produccion` o ON o.`id_lote` = l.`id_lote`
      SET l.`fecha_entrega_programada` = NULL
    WHERE o.`estado` <> ''FINALIZADO''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@hay_ordenes > 0 AND @col_personas_entrega = 0,
  'UPDATE `ordenes_produccion`
      SET `fecha_inicio_programada` = NULL, `fecha_fin_programada` = NULL, `fecha_inicio_real` = NULL
    WHERE `estado` <> ''FINALIZADO''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- --- Registro --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@col_especialidad > 0 OR @col_nombre_causa > 0 OR @col_responsable > 0
              OR (@hay_perdidos > 0 AND @col_desde = 0)
              OR (@hay_ordenes > 0 AND @col_personas_entrega = 0),
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_correcciones_octubre'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
