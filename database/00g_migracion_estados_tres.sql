-- =====================================================================
-- BGoat - El ciclo de vida de lote y orden baja a tres estados
-- Clave: 2026-10_estados_tres_mas_activo
--
-- QUE HACE
--   `lotes.estado` y `ordenes_produccion.estado` quedan en solo tres
--   valores: PENDIENTE, EN_PROCESO, FINALIZADO. Pendiente y En proceso
--   los escoge una persona (o los mueve el sistema al abrir jornada o
--   capturar la primera hora); Finalizado NO se escoge: lo pone el
--   sistema solo cuando lo producido alcanza la cantidad programada de
--   la orden (ver `backend/src/routes/captura.routes.js`). Cancelado
--   deja de existir.
--
--   El lote tambien gana una columna nueva, `activo` (1/0), separada del
--   estado de produccion. Antes "borrar" un lote lo mandaba a un octavo
--   estado, `INACTIVO`, mezclando dos preguntas distintas: en que va la
--   produccion, y si el lote sigue ofreciendose. Ahora son dos columnas
--   independientes: un lote puede estar Finalizado y seguir activo (para
--   consultarlo), o inactivo en cualquier estado de produccion.
--
-- COMO SE RESUELVEN LOS VALORES VIEJOS
--   Lote:
--     REGISTRADO, APROBADO, CANCELADO  -> PENDIENTE
--     DESPACHADO, ENTREGADO            -> FINALIZADO
--     INACTIVO                         -> PENDIENTE, con `activo = 0`
--   Orden:
--     PAUSADA, CANCELADA               -> PENDIENTE
--     FINALIZADA                       -> FINALIZADO
--   Son datos de prueba (la empresa todavia no opera en el sistema), asi
--   que no hay produccion real que quede mal etiquetada por este cambio.
--
--   Ninguno de los dos ENUM viejos tenia como miembro el valor nuevo que
--   le toca (lotes nunca tuvo 'PENDIENTE'; ordenes nunca tuvo
--   'FINALIZADO', solo 'FINALIZADA'), asi que no alcanza con un UPDATE
--   directo: primero se AMPLIA el enum para que el valor nuevo quepa
--   junto a los viejos, se remapean las filas, y solo entonces se achica
--   el enum a los tres valores finales.
--
-- EN UNA BASE NUEVA NO HACE NADA
--   Cada paso se detecta solo mirando el ENUM actual en
--   information_schema, asi que es seguro volver a correrlo si una vez
--   anterior se quedo a medias (por ejemplo, si ya agrego `activo` pero
--   no alcanzo a tocar el ENUM).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paso 1 - La columna que separa "borrado" de "en que va la produccion"
-- ---------------------------------------------------------------------
SET @col_activo = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'activo');

SET @sql = IF(@col_activo = 0,
  'ALTER TABLE `lotes` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `estado`',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 2 - Lote: todavia en el ENUM de ocho valores?
--   Se detecta por `REGISTRADO`, que solo existe en el enum viejo.
-- ---------------------------------------------------------------------
SET @lotes_viejo = (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lotes'
                      AND COLUMN_NAME = 'estado' AND COLUMN_TYPE LIKE '%REGISTRADO%') > 0;

-- Antes de perder la señal de INACTIVO en el remapeo, se guarda en `activo`.
SET @sql = IF(@lotes_viejo, 'UPDATE `lotes` SET `activo` = 0 WHERE `estado` = ''INACTIVO''', 'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Se amplia el enum para que quepa `PENDIENTE` junto a los ocho viejos:
-- sin esto, el UPDATE de abajo truncaria (ningun valor nuevo es miembro
-- del enum viejo todavia).
SET @sql = IF(@lotes_viejo,
  'ALTER TABLE `lotes` MODIFY COLUMN `estado`
     ENUM(''REGISTRADO'', ''APROBADO'', ''EN_PROCESO'', ''DESPACHADO'',
          ''ENTREGADO'', ''FINALIZADO'', ''CANCELADO'', ''INACTIVO'', ''PENDIENTE'')
     NOT NULL DEFAULT ''REGISTRADO''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@lotes_viejo,
  'UPDATE `lotes` SET `estado` = ''PENDIENTE''
    WHERE `estado` IN (''REGISTRADO'', ''APROBADO'', ''CANCELADO'', ''INACTIVO'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@lotes_viejo,
  'UPDATE `lotes` SET `estado` = ''FINALIZADO''
    WHERE `estado` IN (''DESPACHADO'', ''ENTREGADO'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- Ahora si, el enum se achica a los tres valores finales.
SET @sql = IF(@lotes_viejo,
  'ALTER TABLE `lotes`
     MODIFY COLUMN `estado` ENUM(''PENDIENTE'', ''EN_PROCESO'', ''FINALIZADO'')
                   NOT NULL DEFAULT ''PENDIENTE''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 3 - Orden: todavia en el ENUM de cinco valores?
--   Se detecta por `PAUSADA`, que solo existe en el enum viejo.
-- ---------------------------------------------------------------------
SET @ordenes_viejo = (SELECT COUNT(*) FROM information_schema.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes_produccion'
                        AND COLUMN_NAME = 'estado' AND COLUMN_TYPE LIKE '%PAUSADA%') > 0;

-- Se amplia para que quepa `FINALIZADO` (con O) junto a `FINALIZADA` (con A).
SET @sql = IF(@ordenes_viejo,
  'ALTER TABLE `ordenes_produccion` MODIFY COLUMN `estado`
     ENUM(''PENDIENTE'', ''EN_PROCESO'', ''PAUSADA'', ''FINALIZADA'', ''CANCELADA'', ''FINALIZADO'')
     NOT NULL DEFAULT ''PENDIENTE''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@ordenes_viejo,
  'UPDATE `ordenes_produccion` SET `estado` = ''PENDIENTE''
    WHERE `estado` IN (''PAUSADA'', ''CANCELADA'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@ordenes_viejo,
  'UPDATE `ordenes_produccion` SET `estado` = ''FINALIZADO''
    WHERE `estado` = ''FINALIZADA''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

SET @sql = IF(@ordenes_viejo,
  'ALTER TABLE `ordenes_produccion`
     MODIFY COLUMN `estado` ENUM(''PENDIENTE'', ''EN_PROCESO'', ''FINALIZADO'')
                   NOT NULL DEFAULT ''PENDIENTE''',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;

-- ---------------------------------------------------------------------
-- Paso 4 - Dejar constancia
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET @sql = IF(@lotes_viejo OR @ordenes_viejo,
  'INSERT IGNORE INTO `migraciones` (`clave`) VALUES (''2026-10_estados_tres_mas_activo'')',
  'DO 0');
PREPARE eje FROM @sql; EXECUTE eje; DEALLOCATE PREPARE eje;
