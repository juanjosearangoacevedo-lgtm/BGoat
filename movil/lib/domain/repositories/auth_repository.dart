import '../entities/usuario_entity.dart';

/// Contrato de la sesion: define QUE se puede hacer, no COMO.
///
/// La capa de datos es la que sabe que detras hay un JWT, un bcrypt y una
/// tabla de auditoria. Aqui solo existe "entrar", "salir" y "quien soy".
abstract class AuthRepository {
  /// Entra con correo y contrasena. Devuelve el token, el usuario y sus
  /// permisos. El backend bloquea la cuenta a los 5 intentos fallidos.
  Future<SesionEntity> entrar({required String correo, required String clave});

  /// Recupera la sesion guardada en el telefono validando el token contra el
  /// servidor. Devuelve null si el token ya vencio.
  Future<SesionEntity?> sesionGuardada();

  /// Cierra la sesion. Deja el rastro en `sesiones_acceso` y borra el token.
  Future<void> salir();

  /// Pide el enlace de recuperacion. El backend responde igual exista o no la
  /// cuenta: no se filtra quien esta registrado.
  Future<String> recuperarClave(String correo);
}
