-- =====================================================================
-- BGoat - Sistema de Gestion de Produccion Textil
-- Confecciones God's Eyes SAS
--
-- Script de creacion de la base de datos (DDL)
-- Motor: MySQL 8.0 / InnoDB / utf8mb4
--
-- Contenido: 32 tablas, 8 vistas
-- Schema  : `bgoat`
--
-- El modelo gira alrededor de `registros_horarios`: una fila por
-- (modulo, fecha, franja de jornada). Es la digitalizacion exacta del
-- tablero fisico de planta, que es la fuente de todo el sistema.
--
--   minutos_disp  = personas_presentes * minutos_franja
--   meta_hora     = minutos_disp / sam_pactado
--   eficiencia    = unidades_producidas / meta_hora
--   sam_observado = minutos_disp / unidades_producidas
--   fact_meta     = meta_hora * precio_aplicado
--   fact_real     = unidades_producidas * precio_aplicado
--
-- `minutos_franja` no siempre es 60: la planta trabaja 520 minutos de
-- martes a viernes (8 franjas de 60 y una de 40) y 440 el sabado (7 de
-- 60 y una de 20). El horario vive en `jornadas` / `jornada_franjas`,
-- no en el codigo, y se copia a cada registro para que el historico no
-- cambie si manana se reconfigura.
--
-- `precio_aplicado` sale de `ordenes_produccion.valor_maquila_unidad`:
-- lo que el cliente paga por prenda. Con el, cada franja se puede leer
-- en pesos y no solo en unidades.
--
-- Ver `DISENO_CONCEPTUAL.md` en la raiz del proyecto para el porque de
-- cada tabla y cada indicador.
--
-- Orden: las tablas se emiten en orden de dependencia; una tabla siempre
-- aparece despues de todas las que referencia.
-- =====================================================================

SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `bgoat`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE `bgoat`;

-- ---------------------------------------------------------------------
-- Tabla `clientes`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` BIGINT NOT NULL AUTO_INCREMENT,
  `tipo_documento` ENUM('CC', 'CE', 'NIT', 'PASAPORTE', 'OTRO') NOT NULL DEFAULT 'NIT',
  `numero_documento` VARCHAR(30) NOT NULL,
  `razon_social` VARCHAR(160) DEFAULT NULL,
  `nombres` VARCHAR(100) DEFAULT NULL,
  `apellidos` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(150) DEFAULT NULL,
  `direccion` VARCHAR(200) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`),
  UNIQUE INDEX `uq_clientes_documento` (`tipo_documento`, `numero_documento`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `colores`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `colores` (
  `id_color` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `codigo_hex` CHAR(7) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_color`),
  UNIQUE INDEX `uq_colores_nombre` (`nombre`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `marcas`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcas` (
  `id_marca` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_marca`),
  UNIQUE INDEX `uq_marcas_nombre` (`nombre`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `modulos`
--   `horas_jornada`  -> cifra de planeacion para estimar cuanto rinde el
--                       modulo en un dia. YA NO define el alto de la
--                       rejilla de captura: eso lo dan las franjas de la
--                       jornada del dia (`jornada_franjas`), que cambian
--                       entre semana y sabado.
--   `umbral_cumplimiento` -> por debajo de este %, la app le pide la causa
--                            a la supervisora.
--   Capacidad = capacidad_operarios * horas_semanales * 60 * eficiencia/100
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `modulos` (
  `id_modulo` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(30) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `ubicacion` VARCHAR(150) DEFAULT NULL,
  `capacidad_operarios` SMALLINT NOT NULL DEFAULT '1',
  `horas_jornada` TINYINT NOT NULL DEFAULT '9',
  `horas_semanales` DECIMAL(5,2) NOT NULL DEFAULT '44.00',
  `eficiencia_esperada` DECIMAL(5,2) NOT NULL DEFAULT '80.00',
  `umbral_cumplimiento` DECIMAL(5,2) NOT NULL DEFAULT '85.00',
  `orden_visual` SMALLINT NOT NULL DEFAULT '1',
  `estado` ENUM('ACTIVO', 'INACTIVO', 'MANTENIMIENTO') NOT NULL DEFAULT 'ACTIVO',
  `observaciones` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id_modulo`),
  UNIQUE INDEX `uq_modulos_codigo` (`codigo`),
  CONSTRAINT `chk_modulos_eficiencia` CHECK (`eficiencia_esperada` BETWEEN 0 AND 100),
  CONSTRAINT `chk_modulos_umbral` CHECK (`umbral_cumplimiento` BETWEEN 0 AND 100),
  CONSTRAINT `chk_modulos_jornada` CHECK (`horas_jornada` BETWEEN 1 AND 24)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `permisos`
--   `modulo` + `accion` reproducen la matriz de permisos del panel.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permisos` (
  `id_permiso` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `modulo` VARCHAR(80) NOT NULL,
  `accion` ENUM('VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'EXPORTAR') NOT NULL DEFAULT 'VER',
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_permiso`),
  UNIQUE INDEX `uq_permisos_nombre` (`nombre`),
  UNIQUE INDEX `uq_permisos_modulo_accion` (`modulo`, `accion`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `roles`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`),
  UNIQUE INDEX `uq_roles_nombre` (`nombre`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `tallas`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tallas` (
  `id_talla` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(20) NOT NULL,
  `orden_visual` SMALLINT NOT NULL DEFAULT '1',
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_talla`),
  UNIQUE INDEX `uq_tallas_nombre` (`nombre`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `tipos_prenda`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipos_prenda` (
  `id_tipo_prenda` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(80) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_tipo_prenda`),
  UNIQUE INDEX `uq_tipos_prenda_nombre` (`nombre`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `causas_desviacion`
--   Catalogo de motivos por los que una hora no alcanza la meta.
--   `tipo` separa el tiempo perdido imputable al cliente (EXTERNA) del
--   propio (INTERNA) y del planeado (montaje, curva de aprendizaje).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `causas_desviacion` (
  `id_causa` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(30) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` ENUM('PLANEADA', 'INTERNA', 'EXTERNA') NOT NULL DEFAULT 'INTERNA',
  `responsable` VARCHAR(80) DEFAULT NULL,
  `requiere_nota` TINYINT(1) NOT NULL DEFAULT '0',
  `orden_visual` SMALLINT NOT NULL DEFAULT '1',
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_causa`),
  UNIQUE INDEX `uq_causas_codigo` (`codigo`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `jornadas`
--   La planta no trabaja el mismo horario todos los dias: de martes a
--   viernes son 520 minutos y el sabado 440. Cada jornada es un patron
--   de franjas; `jornada_dia` dice que dia de la semana usa cual.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jornadas` (
  `id_jornada` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(30) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_jornada`),
  UNIQUE INDEX `uq_jornadas_codigo` (`codigo`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `jornada_franjas`
--   Una franja = una columna de la rejilla de captura.
--
--   `minutos` es el ancho REAL de la franja y es el dato que fija la
--   meta. La ultima franja del dia casi nunca dura 60: de martes a
--   viernes son 40 (2:00pm-2:40pm) y el sabado 20 (1:00pm-1:20pm).
--   Calcular la meta con un 60 fijo la infla justo en la franja donde
--   el modulo ya viene cansado.
--
--   Las franjas de 0 minutos del tablero de pared no se cargan: una
--   franja que no existe no se captura.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jornada_franjas` (
  `id_franja` BIGINT NOT NULL AUTO_INCREMENT,
  `id_jornada` BIGINT NOT NULL,
  `orden_franja` TINYINT NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `minutos` SMALLINT NOT NULL,
  `etiqueta` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id_franja`),
  UNIQUE INDEX `uq_franja_jornada_orden` (`id_jornada`, `orden_franja`),
  CONSTRAINT `fk_franja_jornada`
    FOREIGN KEY (`id_jornada`) REFERENCES `jornadas` (`id_jornada`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_franja_minutos` CHECK (`minutos` BETWEEN 1 AND 120),
  CONSTRAINT `chk_franja_orden` CHECK (`orden_franja` BETWEEN 1 AND 24)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `jornada_dia`
--   Que jornada rige cada dia (1 = lunes ... 7 = domingo).
--   Un dia sin fila es un dia que no se trabaja.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jornada_dia` (
  `dia_semana` TINYINT NOT NULL,
  `id_jornada` BIGINT NOT NULL,
  PRIMARY KEY (`dia_semana`),
  INDEX `fk_jornada_dia_jornada` (`id_jornada`),
  CONSTRAINT `fk_jornada_dia_jornada`
    FOREIGN KEY (`id_jornada`) REFERENCES `jornadas` (`id_jornada`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_jornada_dia_semana` CHECK (`dia_semana` BETWEEN 1 AND 7)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `pedidos`
--   Compromiso de entrega con el cliente. No es un modulo de ventas:
--   lo que importa es la cantidad y la fecha comprometida.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` BIGINT NOT NULL AUTO_INCREMENT,
  `numero_pedido` VARCHAR(50) NOT NULL,
  `id_cliente` BIGINT NOT NULL,
  `id_marca` BIGINT DEFAULT NULL,
  `fecha_pedido` DATE NOT NULL,
  `fecha_entrega_programada` DATE DEFAULT NULL,
  `fecha_entrega_real` DATE DEFAULT NULL,
  `estado` ENUM('REGISTRADO', 'APROBADO', 'EN_PRODUCCION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'REGISTRADO',
  `observaciones` VARCHAR(500) DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pedido`),
  UNIQUE INDEX `uq_pedidos_numero` (`numero_pedido`),
  INDEX `fk_pedidos_cliente` (`id_cliente`),
  INDEX `fk_pedidos_marca` (`id_marca`),
  CONSTRAINT `fk_pedidos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pedidos_marca`
    FOREIGN KEY (`id_marca`) REFERENCES `marcas` (`id_marca`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `referencias`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referencias` (
  `id_referencia` BIGINT NOT NULL AUTO_INCREMENT,
  `id_marca` BIGINT NOT NULL,
  `codigo` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_referencia`),
  UNIQUE INDEX `uq_referencias_codigo` (`codigo`),
  INDEX `fk_referencias_marca` (`id_marca`),
  CONSTRAINT `fk_referencias_marca`
    FOREIGN KEY (`id_marca`) REFERENCES `marcas` (`id_marca`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `lotes`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lotes` (
  `id_lote` BIGINT NOT NULL AUTO_INCREMENT,
  `codigo_lote` VARCHAR(50) NOT NULL,
  `id_marca` BIGINT NOT NULL,
  `id_pedido` BIGINT DEFAULT NULL,
  `id_referencia` BIGINT DEFAULT NULL,
  `fecha_recepcion` DATE NOT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_finalizacion` DATE DEFAULT NULL,
  `cantidad_programada` INT NOT NULL DEFAULT '0',
  `cantidad_recibida` INT NOT NULL DEFAULT '0',
  `observaciones` VARCHAR(500) DEFAULT NULL,
  `estado` ENUM('REGISTRADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO', 'INACTIVO') NOT NULL DEFAULT 'REGISTRADO',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_lote`),
  UNIQUE INDEX `uq_lotes_codigo` (`codigo_lote`),
  INDEX `fk_lotes_marca` (`id_marca`),
  INDEX `fk_lotes_pedido` (`id_pedido`),
  INDEX `fk_lotes_referencia` (`id_referencia`),
  INDEX `idx_lotes_estado_fecha` (`estado`, `fecha_recepcion`),
  CONSTRAINT `fk_lotes_marca`
    FOREIGN KEY (`id_marca`) REFERENCES `marcas` (`id_marca`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lotes_pedido`
    FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lotes_referencia`
    FOREIGN KEY (`id_referencia`) REFERENCES `referencias` (`id_referencia`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_lotes_cantidades` CHECK (`cantidad_programada` >= 0 AND `cantidad_recibida` >= 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `rol_permiso`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rol_permiso` (
  `id_rol` BIGINT NOT NULL,
  `id_permiso` BIGINT NOT NULL,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  INDEX `fk_rol_permiso_permiso` (`id_permiso`),
  CONSTRAINT `fk_rol_permiso_permiso`
    FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rol_permiso_rol`
    FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `usuarios`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` BIGINT NOT NULL AUTO_INCREMENT,
  `id_rol` BIGINT NOT NULL,
  `tipo_documento` ENUM('CC', 'CE', 'TI', 'NIT', 'PASAPORTE', 'OTRO') NOT NULL DEFAULT 'CC',
  `numero_documento` VARCHAR(30) NOT NULL,
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `clave_hash` VARCHAR(255) NOT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') NOT NULL DEFAULT 'ACTIVO',
  `intentos_fallidos` SMALLINT NOT NULL DEFAULT '0',
  `bloqueado_hasta` DATETIME DEFAULT NULL,
  `ultimo_acceso` DATETIME DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `uq_usuarios_documento` (`tipo_documento`, `numero_documento`),
  UNIQUE INDEX `uq_usuarios_correo` (`correo`),
  INDEX `fk_usuarios_rol` (`id_rol`),
  CONSTRAINT `fk_usuarios_rol`
    FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `fichas_tecnicas`
--   `sam_pactado` es el tiempo estandar negociado con el cliente:
--   minutos que se pagan por cada unidad. Es la linea de rentabilidad.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fichas_tecnicas` (
  `id_ficha_tecnica` BIGINT NOT NULL AUTO_INCREMENT,
  `id_referencia` BIGINT NOT NULL,
  `codigo_ficha` VARCHAR(50) NOT NULL,
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0',
  `descripcion` TEXT NULL,
  `material_principal` VARCHAR(150) DEFAULT NULL,
  `ruta_imagen` VARCHAR(500) DEFAULT NULL,
  `ruta_documento_pdf` VARCHAR(500) DEFAULT NULL,
  `sam_pactado` DECIMAL(10,2) DEFAULT NULL,
  `personal_requerido` SMALLINT DEFAULT NULL,
  `estado` ENUM('BORRADOR', 'VIGENTE', 'OBSOLETA', 'INACTIVA') NOT NULL DEFAULT 'BORRADOR',
  `fecha_vigencia` DATE DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ficha_tecnica`),
  UNIQUE INDEX `uq_fichas_codigo_version` (`codigo_ficha`, `version`),
  INDEX `fk_fichas_referencia` (`id_referencia`),
  CONSTRAINT `fk_fichas_referencia`
    FOREIGN KEY (`id_referencia`) REFERENCES `referencias` (`id_referencia`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ficha_sam` CHECK (`sam_pactado` IS NULL OR `sam_pactado` > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `operarios`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `operarios` (
  `id_operario` BIGINT NOT NULL AUTO_INCREMENT,
  `id_usuario` BIGINT DEFAULT NULL,
  `codigo_operario` VARCHAR(30) NOT NULL,
  `tipo_documento` ENUM('CC', 'CE', 'TI', 'PASAPORTE', 'OTRO') NOT NULL DEFAULT 'CC',
  `numero_documento` VARCHAR(30) NOT NULL,
  `nombres` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(150) DEFAULT NULL,
  `fecha_ingreso` DATE NOT NULL,
  `cargo` ENUM('OPERARIO', 'SUPERVISOR', 'MECANICO', 'OTRO') NOT NULL DEFAULT 'OPERARIO',
  `especialidad` VARCHAR(100) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO', 'RETIRADO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_operario`),
  UNIQUE INDEX `uq_operarios_codigo` (`codigo_operario`),
  UNIQUE INDEX `uq_operarios_documento` (`tipo_documento`, `numero_documento`),
  UNIQUE INDEX `uq_operarios_usuario` (`id_usuario`),
  CONSTRAINT `fk_operarios_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `prendas`
--   Combinacion referencia + tipo + talla + color (SKU). Catalogo:
--   la produccion se mide por referencia, no por SKU.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prendas` (
  `id_prenda` BIGINT NOT NULL AUTO_INCREMENT,
  `id_referencia` BIGINT NOT NULL,
  `id_tipo_prenda` BIGINT NOT NULL,
  `id_talla` BIGINT NOT NULL,
  `id_color` BIGINT NOT NULL,
  `sku` VARCHAR(80) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(500) DEFAULT NULL,
  `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_prenda`),
  UNIQUE INDEX `uq_prendas_sku` (`sku`),
  UNIQUE INDEX `uq_prendas_combinacion` (`id_referencia`, `id_tipo_prenda`, `id_talla`, `id_color`),
  INDEX `fk_prendas_referencia` (`id_referencia`),
  INDEX `fk_prendas_tipo` (`id_tipo_prenda`),
  INDEX `fk_prendas_talla` (`id_talla`),
  INDEX `fk_prendas_color` (`id_color`),
  CONSTRAINT `fk_prendas_color`
    FOREIGN KEY (`id_color`) REFERENCES `colores` (`id_color`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prendas_referencia`
    FOREIGN KEY (`id_referencia`) REFERENCES `referencias` (`id_referencia`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prendas_talla`
    FOREIGN KEY (`id_talla`) REFERENCES `tallas` (`id_talla`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prendas_tipo`
    FOREIGN KEY (`id_tipo_prenda`) REFERENCES `tipos_prenda` (`id_tipo_prenda`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `recuperacion_claves`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recuperacion_claves` (
  `id_recuperacion` BIGINT NOT NULL AUTO_INCREMENT,
  `id_usuario` BIGINT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `fecha_solicitud` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` DATETIME NOT NULL,
  `fecha_uso` DATETIME DEFAULT NULL,
  `estado` ENUM('PENDIENTE', 'UTILIZADO', 'VENCIDO', 'ANULADO') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id_recuperacion`),
  UNIQUE INDEX `uq_recuperacion_token` (`token_hash`),
  INDEX `fk_recuperacion_usuario` (`id_usuario`),
  CONSTRAINT `fk_recuperacion_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `sesiones_acceso`
--   Registro de accesos para control y auditoria.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sesiones_acceso` (
  `id_sesion` BIGINT NOT NULL AUTO_INCREMENT,
  `id_usuario` BIGINT DEFAULT NULL,
  `correo_intento` VARCHAR(150) NOT NULL,
  `evento` ENUM('LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT', 'BLOQUEO', 'DESBLOQUEO', 'CAMBIO_CLAVE') NOT NULL,
  `direccion_ip` VARCHAR(45) DEFAULT NULL,
  `agente_usuario` VARCHAR(255) DEFAULT NULL,
  `detalle` VARCHAR(255) DEFAULT NULL,
  `fecha_evento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sesion`),
  INDEX `idx_sesiones_usuario_fecha` (`id_usuario`, `fecha_evento`),
  INDEX `idx_sesiones_evento_fecha` (`evento`, `fecha_evento`),
  CONSTRAINT `fk_sesiones_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `asignaciones_modulo`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asignaciones_modulo` (
  `id_asignacion` BIGINT NOT NULL AUTO_INCREMENT,
  `id_modulo` BIGINT NOT NULL,
  `id_operario` BIGINT NOT NULL,
  `fecha_inicio` DATETIME NOT NULL,
  `fecha_fin` DATETIME DEFAULT NULL,
  `turno` ENUM('MANANA', 'TARDE', 'NOCHE', 'MIXTO') NOT NULL DEFAULT 'MANANA',
  `rol_asignacion` ENUM('OPERARIO', 'SUPERVISOR', 'MECANICO') NOT NULL DEFAULT 'OPERARIO',
  `estado` ENUM('PROGRAMADA', 'ACTIVA', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PROGRAMADA',
  `observaciones` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id_asignacion`),
  UNIQUE INDEX `uq_asignacion_modulo_operario` (`id_modulo`, `id_operario`, `fecha_inicio`),
  INDEX `idx_asignaciones_modulo_fecha` (`id_modulo`, `fecha_inicio`),
  INDEX `idx_asignaciones_operario_fecha` (`id_operario`, `fecha_inicio`),
  INDEX `idx_asignaciones_estado` (`estado`),
  CONSTRAINT `fk_asignacion_modulo`
    FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_asignacion_operario`
    FOREIGN KEY (`id_operario`) REFERENCES `operarios` (`id_operario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `detalle_pedido`
--   `valor_maquila_unidad`: lo que el cliente paga por confeccionar
--   una unidad. Con el SAM da la tarifa por minuto del contrato.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_pedido` (
  `id_detalle_pedido` BIGINT NOT NULL AUTO_INCREMENT,
  `id_pedido` BIGINT NOT NULL,
  `id_prenda` BIGINT NOT NULL,
  `cantidad` INT NOT NULL,
  `valor_maquila_unidad` DECIMAL(14,2) NOT NULL DEFAULT '0.00',
  `subtotal` DECIMAL(16,2) AS (`cantidad` * `valor_maquila_unidad`) STORED,
  `observaciones` VARCHAR(300) DEFAULT NULL,
  PRIMARY KEY (`id_detalle_pedido`),
  UNIQUE INDEX `uq_detalle_pedido_prenda` (`id_pedido`, `id_prenda`),
  INDEX `fk_detalle_pedido_prenda` (`id_prenda`),
  CONSTRAINT `fk_detalle_pedido_pedido`
    FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_pedido_prenda`
    FOREIGN KEY (`id_prenda`) REFERENCES `prendas` (`id_prenda`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_detalle_pedido_cantidad` CHECK (`cantidad` > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `ficha_tecnica_operaciones`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ficha_tecnica_operaciones` (
  `id_operacion` BIGINT NOT NULL AUTO_INCREMENT,
  `id_ficha_tecnica` BIGINT NOT NULL,
  `numero_operacion` SMALLINT NOT NULL,
  `nombre_operacion` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(500) DEFAULT NULL,
  `maquina_requerida` VARCHAR(100) DEFAULT NULL,
  `tiempo_estandar_minutos` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_operacion`),
  UNIQUE INDEX `uq_ficha_numero_operacion` (`id_ficha_tecnica`, `numero_operacion`),
  CONSTRAINT `fk_operacion_ficha`
    FOREIGN KEY (`id_ficha_tecnica`) REFERENCES `fichas_tecnicas` (`id_ficha_tecnica`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `ficha_tecnica_materiales`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ficha_tecnica_materiales` (
  `id_material` BIGINT NOT NULL AUTO_INCREMENT,
  `id_ficha_tecnica` BIGINT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `tipo` ENUM('TELA', 'INSUMO', 'ACCESORIO', 'ETIQUETA', 'EMPAQUE', 'OTRO') NOT NULL DEFAULT 'INSUMO',
  `descripcion` VARCHAR(300) DEFAULT NULL,
  `cantidad_por_prenda` DECIMAL(12,4) NOT NULL DEFAULT '1.0000',
  `unidad_medida` VARCHAR(20) NOT NULL DEFAULT 'UND',
  `obligatorio` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_material`),
  UNIQUE INDEX `uq_ficha_material` (`id_ficha_tecnica`, `nombre`),
  CONSTRAINT `fk_material_ficha`
    FOREIGN KEY (`id_ficha_tecnica`) REFERENCES `fichas_tecnicas` (`id_ficha_tecnica`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `ficha_tecnica_medidas`
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ficha_tecnica_medidas` (
  `id_medida` BIGINT NOT NULL AUTO_INCREMENT,
  `id_ficha_tecnica` BIGINT NOT NULL,
  `id_talla` BIGINT NOT NULL,
  `punto_medida` VARCHAR(120) NOT NULL,
  `valor_cm` DECIMAL(8,2) NOT NULL,
  `tolerancia_cm` DECIMAL(6,2) NOT NULL DEFAULT '0.50',
  PRIMARY KEY (`id_medida`),
  UNIQUE INDEX `uq_ficha_talla_punto` (`id_ficha_tecnica`, `id_talla`, `punto_medida`),
  INDEX `fk_medida_talla` (`id_talla`),
  CONSTRAINT `fk_medida_ficha`
    FOREIGN KEY (`id_ficha_tecnica`) REFERENCES `fichas_tecnicas` (`id_ficha_tecnica`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_medida_talla`
    FOREIGN KEY (`id_talla`) REFERENCES `tallas` (`id_talla`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `ordenes_produccion`
--   Asigna un lote a un modulo con una ficha tecnica. Es lo que el
--   modulo esta confeccionando, y de ahi sale el SAM de la rejilla.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ordenes_produccion` (
  `id_orden_produccion` BIGINT NOT NULL AUTO_INCREMENT,
  `numero_orden` VARCHAR(50) NOT NULL,
  `id_pedido` BIGINT DEFAULT NULL,
  `id_lote` BIGINT NOT NULL,
  `id_modulo` BIGINT NOT NULL,
  `id_ficha_tecnica` BIGINT NOT NULL,
  `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio_programada` DATE DEFAULT NULL,
  `fecha_fin_programada` DATE DEFAULT NULL,
  `fecha_inicio_real` DATE DEFAULT NULL,
  `fecha_fin_real` DATE DEFAULT NULL,
  `cantidad_programada` INT NOT NULL,
  `valor_maquila_unidad` DECIMAL(14,2) DEFAULT NULL,
  `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
  `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'PAUSADA', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` VARCHAR(500) DEFAULT NULL,
  `creado_por` BIGINT NOT NULL,
  PRIMARY KEY (`id_orden_produccion`),
  UNIQUE INDEX `uq_ordenes_numero` (`numero_orden`),
  INDEX `fk_orden_pedido` (`id_pedido`),
  INDEX `fk_orden_lote` (`id_lote`),
  INDEX `fk_orden_ficha` (`id_ficha_tecnica`),
  INDEX `fk_orden_creador` (`creado_por`),
  INDEX `idx_orden_estado_fecha` (`estado`, `fecha_emision`),
  INDEX `idx_orden_modulo` (`id_modulo`),
  CONSTRAINT `fk_orden_creador`
    FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_ficha`
    FOREIGN KEY (`id_ficha_tecnica`) REFERENCES `fichas_tecnicas` (`id_ficha_tecnica`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_lote`
    FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_modulo`
    FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_pedido`
    FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_orden_cantidad` CHECK (`cantidad_programada` > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `detalle_orden_produccion`
--   Distribucion de la orden por prenda (talla / color).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_orden_produccion` (
  `id_detalle_orden` BIGINT NOT NULL AUTO_INCREMENT,
  `id_orden_produccion` BIGINT NOT NULL,
  `id_prenda` BIGINT NOT NULL,
  `cantidad_programada` INT NOT NULL,
  `observaciones` VARCHAR(300) DEFAULT NULL,
  PRIMARY KEY (`id_detalle_orden`),
  UNIQUE INDEX `uq_detalle_orden_prenda` (`id_orden_produccion`, `id_prenda`),
  INDEX `fk_detalle_orden_prenda` (`id_prenda`),
  CONSTRAINT `fk_detalle_orden_orden`
    FOREIGN KEY (`id_orden_produccion`) REFERENCES `ordenes_produccion` (`id_orden_produccion`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_orden_prenda`
    FOREIGN KEY (`id_prenda`) REFERENCES `prendas` (`id_prenda`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_detalle_orden_cantidad` CHECK (`cantidad_programada` > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- =====================================================================
-- Tabla `registros_horarios`  <- EL CORAZON DEL SISTEMA
--
--   Una fila = una celda del tablero = un modulo en una hora de la jornada.
--   El indice unico (id_modulo, fecha, hora_jornada) garantiza que la
--   rejilla no tenga celdas duplicadas.
--
--   `sam_aplicado` se guarda con el registro (no se lee de la ficha al
--   consultar) para que el historico no cambie si el SAM se renegocia.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `registros_horarios` (
  `id_registro` BIGINT NOT NULL AUTO_INCREMENT,
  `id_modulo` BIGINT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora_jornada` TINYINT NOT NULL,
  `id_orden_produccion` BIGINT DEFAULT NULL,
  `personas_presentes` SMALLINT NOT NULL DEFAULT '0',
  `unidades_producidas` INT NOT NULL DEFAULT '0',
  `unidades_defectuosas` INT NOT NULL DEFAULT '0',
  `sam_aplicado` DECIMAL(10,2) DEFAULT NULL,
  `id_causa` BIGINT DEFAULT NULL,
  `nota` VARCHAR(300) DEFAULT NULL,
  `registrado_por` BIGINT NOT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `estado` ENUM('REGISTRADO', 'VALIDADO', 'ANULADO') NOT NULL DEFAULT 'REGISTRADO',
  PRIMARY KEY (`id_registro`),
  UNIQUE INDEX `uq_registro_celda` (`id_modulo`, `fecha`, `hora_jornada`),
  INDEX `idx_registro_fecha` (`fecha`),
  INDEX `idx_registro_orden` (`id_orden_produccion`),
  INDEX `idx_registro_causa` (`id_causa`),
  INDEX `fk_registro_usuario` (`registrado_por`),
  CONSTRAINT `fk_registro_modulo`
    FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_registro_orden`
    FOREIGN KEY (`id_orden_produccion`) REFERENCES `ordenes_produccion` (`id_orden_produccion`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_registro_causa`
    FOREIGN KEY (`id_causa`) REFERENCES `causas_desviacion` (`id_causa`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_registro_usuario`
    FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_registro_hora` CHECK (`hora_jornada` BETWEEN 1 AND 24),
  CONSTRAINT `chk_registro_defectuosas` CHECK (`unidades_defectuosas` <= `unidades_producidas`),
  CONSTRAINT `chk_registro_personas` CHECK (`personas_presentes` >= 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- =====================================================================
-- Tabla `registro_minutos_perdidos`
--
--   Los minutos que el modulo estuvo detenido en esa hora, abiertos por
--   causa. El tablero de la empresa trae tres columnas fijas (maquina,
--   calidad, montaje/insumos); aqui son N causas del catalogo, para que
--   se pueda agregar un motivo sin volver a tocar el esquema.
--
--   `minutos` son minutos DE MODULO: es lo que la supervisora observa
--   ("la maquina estuvo 20 minutos parada"). Multiplicados por las
--   personas presentes dan los minutos-persona perdidos, que es la
--   unidad comparable contra `minutos_disponibles`.
--
--   Registrar minutos NO baja la meta: la meta la fija la franja. Los
--   minutos perdidos explican el hueco, no lo perdonan.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `registro_minutos_perdidos` (
  `id_registro` BIGINT NOT NULL,
  `id_causa` BIGINT NOT NULL,
  `minutos` SMALLINT NOT NULL,
  PRIMARY KEY (`id_registro`, `id_causa`),
  INDEX `fk_perdida_causa` (`id_causa`),
  CONSTRAINT `fk_perdida_registro`
    FOREIGN KEY (`id_registro`) REFERENCES `registros_horarios` (`id_registro`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_perdida_causa`
    FOREIGN KEY (`id_causa`) REFERENCES `causas_desviacion` (`id_causa`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_perdida_minutos` CHECK (`minutos` > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla `migraciones`
--   Deja constancia de los ajustes que solo pueden correr una vez.
--   `npm run db:setup` se ejecuta muchas veces sobre la misma base: sin
--   esta marca, un relleno de datos historicos se volveria a aplicar y
--   pisaria justo lo que se queria conservar.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migraciones` (
  `clave` VARCHAR(80) NOT NULL,
  `aplicada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- =====================================================================
-- Columnas agregadas a tablas que ya existian
--
--   `CREATE TABLE IF NOT EXISTS` no toca una tabla ya creada, asi que
--   las columnas nuevas se agregan aqui con guarda sobre
--   information_schema. Correr el script dos veces no falla.
--
--   `minutos_franja` y `precio_aplicado` se copian AL REGISTRO, igual
--   que `sam_aplicado`: si manana cambia el horario o se renegocia la
--   tarifa, lo que ya paso no se recalcula solo.
-- =====================================================================
SET @sql_col = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registros_horarios'
      AND COLUMN_NAME = 'minutos_franja') = 0,
  'ALTER TABLE `registros_horarios`
     ADD COLUMN `minutos_franja` SMALLINT NOT NULL DEFAULT 60 AFTER `hora_jornada`',
  'DO 0'));
PREPARE ejecutar FROM @sql_col; EXECUTE ejecutar; DEALLOCATE PREPARE ejecutar;

SET @sql_col = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registros_horarios'
      AND COLUMN_NAME = 'precio_aplicado') = 0,
  'ALTER TABLE `registros_horarios`
     ADD COLUMN `precio_aplicado` DECIMAL(14,2) DEFAULT NULL AFTER `sam_aplicado`',
  'DO 0'));
PREPARE ejecutar FROM @sql_col; EXECUTE ejecutar; DEALLOCATE PREPARE ejecutar;

-- =====================================================================
-- Vistas
-- =====================================================================

-- ---------------------------------------------------------------------
-- vw_registro_horario
--   La rejilla con todos los calculos hechos. Es la vista base de la que
--   se derivan casi todas las demas.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_registro_horario` AS
SELECT
  r.id_registro                                    AS id_registro,
  r.fecha                                          AS fecha,
  r.hora_jornada                                   AS hora_jornada,
  r.minutos_franja                                 AS minutos_franja,
  jf.etiqueta                                      AS etiqueta_franja,
  jf.hora_inicio                                   AS hora_inicio,
  jf.hora_fin                                      AS hora_fin,
  jd.id_jornada                                    AS id_jornada,
  j.codigo                                         AS codigo_jornada,
  r.id_modulo                                      AS id_modulo,
  m.codigo                                         AS codigo_modulo,
  m.nombre                                         AS nombre_modulo,
  m.umbral_cumplimiento                            AS umbral_cumplimiento,
  r.id_orden_produccion                            AS id_orden_produccion,
  o.numero_orden                                   AS numero_orden,
  ref.codigo                                       AS codigo_referencia,
  ref.nombre                                       AS nombre_referencia,
  mar.nombre                                       AS nombre_marca,
  cli.razon_social                                 AS nombre_cliente,
  r.personas_presentes                             AS personas_presentes,
  r.unidades_producidas                            AS unidades_producidas,
  r.unidades_defectuosas                           AS unidades_defectuosas,
  (r.unidades_producidas - r.unidades_defectuosas) AS unidades_conformes,
  r.sam_aplicado                                   AS sam_aplicado,
  r.precio_aplicado                                AS precio_aplicado,

  -- Minutos-persona que la empresa puso en esa franja. Antes se asumia
  -- que toda franja duraba 60; ahora manda el ancho real de la franja.
  (r.personas_presentes * r.minutos_franja)        AS minutos_disponibles,

  -- Meta con dos decimales a proposito: el total del dia se arma
  -- sumando estas metas, y redondear cada hora desviaba el total.
  -- La pantalla redondea al mostrar la celda.
  ROUND(
    CASE WHEN COALESCE(r.sam_aplicado, 0) = 0 THEN 0
         ELSE (r.personas_presentes * r.minutos_franja) / r.sam_aplicado
    END, 2)                                        AS meta_hora,

  -- `cumplimiento` y `eficiencia` son el mismo numero: unidades sobre
  -- meta. El tablero de la empresa lo llama "% EFICIENCIA HORA REAL".
  -- Se dejan los dos nombres porque las dos palabras se usan en planta.
  ROUND(
    CASE WHEN COALESCE(r.sam_aplicado, 0) = 0 OR r.personas_presentes = 0 THEN 0
         ELSE r.unidades_producidas * r.sam_aplicado * 100.0
              / (r.personas_presentes * r.minutos_franja)
    END, 2)                                        AS cumplimiento,
  ROUND(
    CASE WHEN COALESCE(r.sam_aplicado, 0) = 0 OR r.personas_presentes = 0 THEN 0
         ELSE r.unidades_producidas * r.sam_aplicado * 100.0
              / (r.personas_presentes * r.minutos_franja)
    END, 2)                                        AS eficiencia,

  ROUND(r.unidades_producidas * COALESCE(r.sam_aplicado, 0), 2) AS minutos_ganados,
  ROUND(
    CASE WHEN r.unidades_producidas = 0 THEN NULL
         ELSE (r.personas_presentes * r.minutos_franja) / r.unidades_producidas
    END, 2)                                        AS sam_observado,

  -- Dinero. `precio_aplicado` sale de `ordenes_produccion.valor_maquila_unidad`:
  -- lo que el cliente paga por prenda confeccionada.
  ROUND(
    CASE WHEN COALESCE(r.sam_aplicado, 0) = 0 THEN 0
         ELSE (r.personas_presentes * r.minutos_franja) / r.sam_aplicado
    END * COALESCE(r.precio_aplicado, 0), 2)       AS facturacion_meta,
  ROUND(r.unidades_producidas * COALESCE(r.precio_aplicado, 0), 2) AS facturacion_real,

  -- Meta y real de la MISMA franja. El tablero de pared divide contra la
  -- meta de la primera hora, y por eso una franja de 40 minutos le
  -- aparece en 48% cuando su eficiencia real es 72%.
  ROUND(
    CASE WHEN COALESCE(r.sam_aplicado, 0) = 0
           OR COALESCE(r.precio_aplicado, 0) = 0
           OR r.personas_presentes = 0 THEN NULL
         ELSE r.unidades_producidas * r.sam_aplicado * 100.0
              / (r.personas_presentes * r.minutos_franja)
    END, 2)                                        AS cumplimiento_facturacion,

  -- Tiempo perdido. `minutos_perdidos` es tiempo de modulo (lo que ve la
  -- supervisora); `minutos_perdidos_persona` lo lleva a minutos-persona,
  -- que es la unidad de `minutos_disponibles`.
  COALESCE(perd.minutos_perdidos, 0)               AS minutos_perdidos,
  COALESCE(perd.minutos_perdidos, 0) * r.personas_presentes AS minutos_perdidos_persona,
  COALESCE(perd.minutos_maquina, 0)                AS minutos_maquina,
  COALESCE(perd.minutos_calidad, 0)                AS minutos_calidad,
  COALESCE(perd.minutos_montaje, 0)                AS minutos_montaje,
  COALESCE(perd.minutos_otras, 0)                  AS minutos_otras,

  r.id_causa                                       AS id_causa,
  c.codigo                                         AS codigo_causa,
  c.nombre                                         AS nombre_causa,
  c.tipo                                           AS tipo_causa,
  r.nota                                           AS nota,
  r.estado                                         AS estado,
  r.registrado_por                                 AS registrado_por,
  CONCAT(u.nombres, ' ', u.apellidos)              AS nombre_registrador,
  r.fecha_registro                                 AS fecha_registro
FROM registros_horarios r
JOIN modulos  m   ON m.id_modulo = r.id_modulo
JOIN usuarios u   ON u.id_usuario = r.registrado_por
LEFT JOIN causas_desviacion c ON c.id_causa = r.id_causa
LEFT JOIN ordenes_produccion o ON o.id_orden_produccion = r.id_orden_produccion
LEFT JOIN fichas_tecnicas f ON f.id_ficha_tecnica = o.id_ficha_tecnica
LEFT JOIN referencias ref ON ref.id_referencia = f.id_referencia
LEFT JOIN marcas mar ON mar.id_marca = ref.id_marca
LEFT JOIN pedidos ped ON ped.id_pedido = o.id_pedido
LEFT JOIN clientes cli ON cli.id_cliente = ped.id_cliente
-- WEEKDAY() devuelve 0 = lunes, y `jornada_dia` usa 1 = lunes.
LEFT JOIN jornada_dia jd ON jd.dia_semana = WEEKDAY(r.fecha) + 1
LEFT JOIN jornada_franjas jf
       ON jf.id_jornada = jd.id_jornada AND jf.orden_franja = r.hora_jornada
LEFT JOIN jornadas j ON j.id_jornada = jd.id_jornada
-- Los minutos perdidos llegan agregados por registro: las tres columnas
-- del tablero de pared salen del catalogo, no de columnas fijas, y
-- `minutos_otras` recoge cualquier causa que la empresa agregue despues.
LEFT JOIN (
  SELECT
    p.id_registro                                                        AS id_registro,
    SUM(p.minutos)                                                       AS minutos_perdidos,
    SUM(CASE WHEN cd.codigo = 'MAQUINA' THEN p.minutos ELSE 0 END)       AS minutos_maquina,
    SUM(CASE WHEN cd.codigo = 'CALIDAD' THEN p.minutos ELSE 0 END)       AS minutos_calidad,
    SUM(CASE WHEN cd.codigo IN ('MONTAJE', 'INSUMO') THEN p.minutos ELSE 0 END) AS minutos_montaje,
    SUM(CASE WHEN cd.codigo NOT IN ('MAQUINA', 'CALIDAD', 'MONTAJE', 'INSUMO')
             THEN p.minutos ELSE 0 END)                                  AS minutos_otras
  FROM registro_minutos_perdidos p
  JOIN causas_desviacion cd ON cd.id_causa = p.id_causa
  GROUP BY p.id_registro
) perd ON perd.id_registro = r.id_registro
WHERE r.estado <> 'ANULADO';

-- ---------------------------------------------------------------------
-- vw_estado_modulo_dia
--   Un renglon por modulo y dia: lo que ve el jefe de produccion.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_estado_modulo_dia` AS
SELECT
  v.fecha                                          AS fecha,
  v.id_modulo                                      AS id_modulo,
  v.codigo_modulo                                  AS codigo_modulo,
  v.nombre_modulo                                  AS nombre_modulo,
  COUNT(*)                                         AS horas_registradas,
  SUM(v.minutos_franja)                            AS minutos_jornada,
  SUM(v.unidades_producidas)                       AS unidades_producidas,
  SUM(v.unidades_defectuosas)                      AS unidades_defectuosas,
  SUM(v.unidades_conformes)                        AS unidades_conformes,
  ROUND(SUM(v.meta_hora), 2)                       AS meta_dia,
  SUM(v.minutos_disponibles)                       AS minutos_disponibles,
  SUM(v.minutos_ganados)                           AS minutos_ganados,
  ROUND(AVG(v.personas_presentes), 1)              AS promedio_personas,

  -- Minutos ganados sobre minutos puestos. Con un solo SAM en el dia da
  -- exactamente lo mismo que unidades/meta, que es como lo saca el
  -- tablero de pared; con dos referencias en el dia esta es la correcta,
  -- porque pesa cada hora por los minutos que realmente valia.
  ROUND(
    CASE WHEN SUM(v.minutos_disponibles) = 0 THEN 0
         ELSE SUM(v.minutos_ganados) * 100.0 / SUM(v.minutos_disponibles)
    END, 2)                                        AS eficiencia,

  ROUND(
    CASE WHEN SUM(v.unidades_producidas) = 0 THEN 0
         ELSE SUM(v.unidades_defectuosas) * 100.0 / SUM(v.unidades_producidas)
    END, 2)                                        AS porcentaje_defectos,
  ROUND(
    CASE WHEN SUM(v.unidades_producidas) = 0 THEN NULL
         ELSE SUM(v.minutos_disponibles) / SUM(v.unidades_producidas)
    END, 2)                                        AS sam_observado,
  ROUND(
    CASE WHEN SUM(v.minutos_disponibles) = 0 THEN 0
         ELSE SUM(v.unidades_producidas) * 60.0 / SUM(v.minutos_disponibles)
    END, 2)                                        AS prendas_por_hora,

  -- Cierre en pesos del dia: es la fila de totales del tablero.
  ROUND(SUM(v.facturacion_meta), 2)                AS facturacion_meta,
  ROUND(SUM(v.facturacion_real), 2)                AS facturacion_real,
  ROUND(
    CASE WHEN SUM(v.facturacion_meta) = 0 THEN NULL
         ELSE SUM(v.facturacion_real) * 100.0 / SUM(v.facturacion_meta)
    END, 2)                                        AS cumplimiento_facturacion,

  SUM(v.minutos_perdidos)                          AS minutos_perdidos,
  SUM(v.minutos_perdidos_persona)                  AS minutos_perdidos_persona,
  SUM(v.minutos_maquina)                           AS minutos_maquina,
  SUM(v.minutos_calidad)                           AS minutos_calidad,
  SUM(v.minutos_montaje)                           AS minutos_montaje,
  SUM(v.minutos_otras)                             AS minutos_otras
FROM vw_registro_horario v
GROUP BY v.fecha, v.id_modulo, v.codigo_modulo, v.nombre_modulo;

-- ---------------------------------------------------------------------
-- vw_estado_planta_hora
--   La foto de la planta hora por hora. Permite distinguir un problema
--   de un modulo de un problema general de la planta.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_estado_planta_hora` AS
SELECT
  v.fecha                                          AS fecha,
  v.hora_jornada                                   AS hora_jornada,
  MAX(v.etiqueta_franja)                           AS etiqueta_franja,
  MAX(v.minutos_franja)                            AS minutos_franja,
  COUNT(DISTINCT v.id_modulo)                      AS modulos_registrados,
  SUM(v.personas_presentes)                        AS personas_totales,
  SUM(v.unidades_producidas)                       AS unidades_producidas,
  SUM(v.unidades_defectuosas)                      AS unidades_defectuosas,
  ROUND(SUM(v.meta_hora), 2)                       AS meta_hora,
  SUM(v.minutos_disponibles)                       AS minutos_disponibles,
  SUM(v.minutos_ganados)                           AS minutos_ganados,
  SUM(v.minutos_perdidos_persona)                  AS minutos_perdidos_persona,
  ROUND(SUM(v.facturacion_meta), 2)                AS facturacion_meta,
  ROUND(SUM(v.facturacion_real), 2)                AS facturacion_real,
  ROUND(
    CASE WHEN SUM(v.minutos_disponibles) = 0 THEN 0
         ELSE SUM(v.minutos_ganados) * 100.0 / SUM(v.minutos_disponibles)
    END, 2)                                        AS eficiencia
FROM vw_registro_horario v
GROUP BY v.fecha, v.hora_jornada;

-- ---------------------------------------------------------------------
-- vw_avance_orden
--   Estado de cada orden de produccion con su avance real.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_avance_orden` AS
SELECT
  o.id_orden_produccion                            AS id_orden_produccion,
  o.numero_orden                                   AS numero_orden,
  o.estado                                         AS estado,
  o.prioridad                                      AS prioridad,
  o.id_pedido                                      AS id_pedido,
  ped.numero_pedido                                AS numero_pedido,
  ped.fecha_entrega_programada                     AS fecha_entrega_programada,
  cli.id_cliente                                   AS id_cliente,
  COALESCE(cli.razon_social, CONCAT(COALESCE(cli.nombres, ''), ' ', COALESCE(cli.apellidos, ''))) AS nombre_cliente,
  o.id_lote                                        AS id_lote,
  lot.codigo_lote                                  AS codigo_lote,
  o.id_modulo                                      AS id_modulo,
  mdl.codigo                                       AS codigo_modulo,
  mdl.nombre                                       AS nombre_modulo,
  o.id_ficha_tecnica                               AS id_ficha_tecnica,
  fic.codigo_ficha                                 AS codigo_ficha,
  fic.sam_pactado                                  AS sam_pactado,
  ref.id_referencia                                AS id_referencia,
  ref.codigo                                       AS codigo_referencia,
  ref.nombre                                       AS nombre_referencia,
  mar.id_marca                                     AS id_marca,
  mar.nombre                                       AS nombre_marca,
  o.cantidad_programada                            AS cantidad_programada,
  COALESCE(p.unidades_producidas, 0)               AS unidades_producidas,
  COALESCE(p.unidades_defectuosas, 0)              AS unidades_defectuosas,
  GREATEST(o.cantidad_programada - COALESCE(p.unidades_producidas, 0), 0) AS unidades_restantes,
  ROUND(
    CASE WHEN o.cantidad_programada = 0 THEN 0
         ELSE COALESCE(p.unidades_producidas, 0) * 100.0 / o.cantidad_programada
    END, 2)                                        AS porcentaje_avance,
  COALESCE(p.horas_registradas, 0)                 AS horas_registradas,
  ROUND(
    CASE WHEN COALESCE(p.minutos_disponibles, 0) = 0 THEN 0
         ELSE p.minutos_ganados * 100.0 / p.minutos_disponibles
    END, 2)                                        AS eficiencia,
  ROUND(
    CASE WHEN COALESCE(p.unidades_producidas, 0) = 0 THEN NULL
         ELSE p.minutos_disponibles / p.unidades_producidas
    END, 2)                                        AS sam_observado,
  o.valor_maquila_unidad                           AS valor_maquila_unidad,
  ROUND(
    CASE WHEN COALESCE(fic.sam_pactado, 0) = 0 THEN NULL
         ELSE o.valor_maquila_unidad / fic.sam_pactado
    END, 2)                                        AS tarifa_minuto_pactada,
  ROUND(
    CASE WHEN COALESCE(p.unidades_producidas, 0) = 0 OR o.valor_maquila_unidad IS NULL THEN NULL
         ELSE o.valor_maquila_unidad / (p.minutos_disponibles / p.unidades_producidas)
    END, 2)                                        AS tarifa_minuto_real,
  o.fecha_emision                                  AS fecha_emision,
  o.fecha_inicio_programada                        AS fecha_inicio_programada,
  o.fecha_fin_programada                           AS fecha_fin_programada,
  o.fecha_inicio_real                              AS fecha_inicio_real,
  o.fecha_fin_real                                 AS fecha_fin_real,
  o.creado_por                                     AS creado_por,
  CONCAT(usr.nombres, ' ', usr.apellidos)          AS nombre_creador,
  o.observaciones                                  AS observaciones
FROM ordenes_produccion o
JOIN lotes           lot ON lot.id_lote = o.id_lote
JOIN modulos         mdl ON mdl.id_modulo = o.id_modulo
JOIN fichas_tecnicas fic ON fic.id_ficha_tecnica = o.id_ficha_tecnica
JOIN referencias     ref ON ref.id_referencia = fic.id_referencia
JOIN marcas          mar ON mar.id_marca = ref.id_marca
JOIN usuarios        usr ON usr.id_usuario = o.creado_por
LEFT JOIN pedidos    ped ON ped.id_pedido = o.id_pedido
LEFT JOIN clientes   cli ON cli.id_cliente = ped.id_cliente
LEFT JOIN (
  SELECT
    id_orden_produccion,
    COUNT(*)                            AS horas_registradas,
    SUM(unidades_producidas)            AS unidades_producidas,
    SUM(unidades_defectuosas)           AS unidades_defectuosas,
    SUM(personas_presentes * 60)        AS minutos_disponibles,
    SUM(unidades_producidas * COALESCE(sam_aplicado, 0)) AS minutos_ganados
  FROM registros_horarios
  WHERE estado <> 'ANULADO' AND id_orden_produccion IS NOT NULL
  GROUP BY id_orden_produccion
) p ON p.id_orden_produccion = o.id_orden_produccion;

-- ---------------------------------------------------------------------
-- vw_perdidas_por_causa
--   Pareto del tiempo perdido: cuantos minutos se fueron por cada causa.
--   minutos_perdidos = minutos disponibles - minutos ganados.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_perdidas_por_causa` AS
SELECT
  v.fecha                                          AS fecha,
  v.id_modulo                                      AS id_modulo,
  v.codigo_modulo                                  AS codigo_modulo,
  cd.id_causa                                      AS id_causa,
  cd.codigo                                        AS codigo_causa,
  cd.nombre                                        AS nombre_causa,
  cd.tipo                                          AS tipo_causa,
  cd.responsable                                   AS responsable,
  COUNT(*)                                         AS horas_afectadas,

  -- Minutos de modulo: lo que la supervisora anoto en el tablero.
  SUM(p.minutos)                                   AS minutos_modulo,

  -- Minutos-persona: la unidad comparable contra la capacidad. Es la
  -- columna "Total Minutos" del tablero, (maquina+calidad+montaje) x
  -- personas. Se llama `minutos_perdidos` porque es la que manda al
  -- Pareto y es la que cuesta plata.
  SUM(p.minutos * v.personas_presentes)            AS minutos_perdidos,

  -- Lo que esos minutos habrian producido y facturado al SAM y al
  -- precio de la orden que estaba corriendo.
  ROUND(SUM(
    CASE WHEN COALESCE(v.sam_aplicado, 0) = 0 THEN 0
         ELSE (p.minutos * v.personas_presentes) / v.sam_aplicado
    END), 2)                                       AS unidades_no_producidas,
  ROUND(SUM(
    CASE WHEN COALESCE(v.sam_aplicado, 0) = 0 THEN 0
         ELSE (p.minutos * v.personas_presentes) / v.sam_aplicado
              * COALESCE(v.precio_aplicado, 0)
    END), 2)                                       AS facturacion_no_realizada
FROM registro_minutos_perdidos p
JOIN vw_registro_horario v ON v.id_registro = p.id_registro
JOIN causas_desviacion cd  ON cd.id_causa = p.id_causa
GROUP BY v.fecha, v.id_modulo, v.codigo_modulo,
         cd.id_causa, cd.codigo, cd.nombre, cd.tipo, cd.responsable;

-- ---------------------------------------------------------------------
-- vw_tablero_modulo_dia
--   El tablero de pared de un modulo, franja por franja: es la hoja que
--   la empresa llena a mano, ya cuadrada.
--
--   Lo que aporta sobre `vw_registro_horario` son los acumulados: la
--   supervisora no quiere saber solo como le fue en la hora, quiere
--   saber como va el dia mientras todavia puede reaccionar. En la hoja
--   de calculo eso es una formula distinta en cada fila, que crece
--   sola y que nadie revisa; aqui es una ventana.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_tablero_modulo_dia` AS
SELECT
  v.fecha                                          AS fecha,
  v.id_modulo                                      AS id_modulo,
  v.codigo_modulo                                  AS codigo_modulo,
  v.hora_jornada                                   AS hora_jornada,
  v.etiqueta_franja                                AS etiqueta_franja,
  v.minutos_franja                                 AS minutos_franja,
  v.personas_presentes                             AS personas_presentes,
  v.sam_aplicado                                   AS sam_aplicado,
  v.precio_aplicado                                AS precio_aplicado,
  v.meta_hora                                      AS meta_hora,
  v.unidades_producidas                            AS unidades_producidas,
  v.eficiencia                                     AS eficiencia,

  ROUND(SUM(v.meta_hora) OVER dia, 2)              AS meta_acumulada,
  SUM(v.unidades_producidas) OVER dia              AS unidades_acumuladas,
  ROUND(
    CASE WHEN SUM(v.minutos_disponibles) OVER dia = 0 THEN 0
         ELSE SUM(v.minutos_ganados) OVER dia * 100.0
              / SUM(v.minutos_disponibles) OVER dia
    END, 2)                                        AS eficiencia_acumulada,

  v.facturacion_meta                               AS facturacion_meta,
  v.facturacion_real                               AS facturacion_real,
  v.cumplimiento_facturacion                       AS cumplimiento_facturacion,
  ROUND(SUM(v.facturacion_meta) OVER dia, 2)       AS facturacion_meta_acumulada,
  ROUND(SUM(v.facturacion_real) OVER dia, 2)       AS facturacion_real_acumulada,

  v.minutos_maquina                                AS minutos_maquina,
  v.minutos_calidad                                AS minutos_calidad,
  v.minutos_montaje                                AS minutos_montaje,
  v.minutos_otras                                  AS minutos_otras,
  v.minutos_perdidos                               AS minutos_perdidos,
  v.minutos_perdidos_persona                       AS minutos_perdidos_persona,

  v.id_causa                                       AS id_causa,
  v.nombre_causa                                   AS nombre_causa,
  v.nota                                           AS nota,
  v.numero_orden                                   AS numero_orden,
  v.codigo_referencia                              AS codigo_referencia,
  v.nombre_referencia                              AS nombre_referencia,
  v.nombre_cliente                                 AS nombre_cliente
FROM vw_registro_horario v
WINDOW dia AS (PARTITION BY v.id_modulo, v.fecha ORDER BY v.hora_jornada);

-- ---------------------------------------------------------------------
-- vw_curva_arranque
--   Eficiencia hora a hora desde que la orden arranco. Muestra cuanto
--   tarda un modulo en llegar a regimen con una referencia nueva.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_curva_arranque` AS
SELECT
  v.id_orden_produccion                            AS id_orden_produccion,
  v.numero_orden                                   AS numero_orden,
  v.codigo_referencia                              AS codigo_referencia,
  v.codigo_modulo                                  AS codigo_modulo,
  ROW_NUMBER() OVER (
    PARTITION BY v.id_orden_produccion
    ORDER BY v.fecha, v.hora_jornada
  )                                                AS hora_desde_inicio,
  v.fecha                                          AS fecha,
  v.hora_jornada                                   AS hora_jornada,
  v.unidades_producidas                            AS unidades_producidas,
  v.eficiencia                                     AS eficiencia,
  v.codigo_causa                                   AS codigo_causa
FROM vw_registro_horario v
WHERE v.id_orden_produccion IS NOT NULL;

-- ---------------------------------------------------------------------
-- vw_productividad_operario
--   Produccion ATRIBUIDA a cada operario: el modulo se mide completo, y
--   su produccion se reparte entre las personas asignadas esa hora.
--   No es una medicion individual, es una atribucion proporcional.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_productividad_operario` AS
SELECT
  v.fecha                                          AS fecha,
  a.id_operario                                    AS id_operario,
  op.codigo_operario                               AS codigo_operario,
  CONCAT(op.nombres, ' ', op.apellidos)            AS nombre_operario,
  op.cargo                                         AS cargo,
  v.id_modulo                                      AS id_modulo,
  v.codigo_modulo                                  AS codigo_modulo,
  COUNT(*)                                         AS horas_participadas,
  ROUND(SUM(v.unidades_producidas / NULLIF(v.personas_presentes, 0)), 2) AS unidades_atribuidas,
  ROUND(AVG(v.eficiencia), 2)                      AS eficiencia_promedio
FROM vw_registro_horario v
JOIN asignaciones_modulo a
  ON a.id_modulo = v.id_modulo
 AND a.rol_asignacion = 'OPERARIO'
 AND a.estado IN ('ACTIVA', 'FINALIZADA')
 AND DATE(a.fecha_inicio) <= v.fecha
 AND (a.fecha_fin IS NULL OR DATE(a.fecha_fin) >= v.fecha)
JOIN operarios op ON op.id_operario = a.id_operario
WHERE v.personas_presentes > 0
GROUP BY v.fecha, a.id_operario, op.codigo_operario, op.nombres, op.apellidos,
         op.cargo, v.id_modulo, v.codigo_modulo;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
SET SQL_MODE = @OLD_SQL_MODE;
