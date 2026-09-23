/// El usuario que entra a la app, y lo que su rol le deja hacer.
///
/// No hay una entidad "operaria que usa la app": quien digita es una sola
/// persona por turno --la digitadora-- y el sistema la identifica por su
/// usuario. Las operarias son un catalogo aparte (`OperariaEntity`), gente que
/// trabaja en el modulo pero no entra al sistema.
class UsuarioEntity {
  final int id;
  final int idRol;
  final String nombreRol;
  final String nombres;
  final String apellidos;
  final String correo;
  final String? telefono;
  final String estado;

  const UsuarioEntity({
    required this.id,
    required this.idRol,
    required this.nombreRol,
    required this.nombres,
    required this.apellidos,
    required this.correo,
    this.telefono,
    required this.estado,
  });

  String get nombreCompleto => '$nombres $apellidos'.trim();

  /// Las iniciales para el avatar del encabezado.
  String get iniciales {
    final n = nombres.isNotEmpty ? nombres[0] : '';
    final a = apellidos.isNotEmpty ? apellidos[0] : '';
    final juntas = '$n$a'.trim();
    return juntas.isEmpty ? '?' : juntas.toUpperCase();
  }
}

/// Un permiso concreto: un modulo del sistema y una accion sobre el.
///
/// El backend valida los mismos pares en cada ruta (`requierePermiso`), asi que
/// esto no es seguridad: es para no ofrecerle a la digitadora un boton que el
/// servidor le va a rechazar.
class PermisoEntity {
  final String modulo;
  final String accion;

  const PermisoEntity({required this.modulo, required this.accion});

  String get clave => '$modulo|$accion';
}

/// El resultado de entrar: el token, quien entro y que puede hacer.
class SesionEntity {
  final String token;
  final UsuarioEntity usuario;
  final List<PermisoEntity> permisos;

  const SesionEntity({
    required this.token,
    required this.usuario,
    required this.permisos,
  });

  bool puede(String modulo, String accion) =>
      permisos.any((p) => p.modulo == modulo && p.accion == accion);
}
