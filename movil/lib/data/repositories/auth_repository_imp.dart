import '../../core/api_cliente.dart';
import '../../core/api_error.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/usuario_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/usuario_model.dart';

/// Implementacion concreta del contrato de sesion.
///
/// Aqui si sabemos que detras hay una API REST con JWT: el token se guarda en
/// el telefono y se manda en la cabecera `Authorization` de cada peticion.
class AuthRepositoryImpl implements AuthRepository {
  final ApiCliente api;

  AuthRepositoryImpl(this.api);

  @override
  Future<SesionEntity> entrar({required String correo, required String clave}) async {
    final respuesta = await api.crear('/auth/login', {
      'correo': correo.trim().toLowerCase(),
      'clave': clave,
    });

    final sesion = SesionModel.fromJson(aMapaNulo(respuesta) ?? const {});
    await api.guardarToken(sesion.token);
    return sesion;
  }

  @override
  Future<SesionEntity?> sesionGuardada() async {
    if (!api.haySesion) return null;

    try {
      // `/auth/perfil` es la forma barata de saber si el token sigue vivo:
      // devuelve el usuario y sus permisos, o 401 si ya vencio.
      final respuesta = await api.obtener('/auth/perfil');
      return SesionModel.fromJson(
        aMapaNulo(respuesta) ?? const {},
        token: api.token,
      );
    } on ApiError catch (error) {
      // Token vencido o revocado: se borra y se manda a la pantalla de entrada.
      // Un fallo de red NO borra la sesion: el token puede seguir siendo bueno
      // y la planta tiene zonas sin senal.
      if (error.esSesionVencida) {
        await api.guardarToken(null);
        return null;
      }
      rethrow;
    }
  }

  @override
  Future<void> salir() async {
    try {
      await api.crear('/auth/logout', const {});
    } on ApiError {
      // Que el servidor no conteste no puede dejar la sesion abierta en el
      // telefono: el token se borra igual.
    }
    await api.guardarToken(null);
  }

  @override
  Future<String> recuperarClave(String correo) async {
    final respuesta = await api.crear('/auth/recuperar', {
      'correo': correo.trim().toLowerCase(),
    });

    final mapa = aMapaNulo(respuesta) ?? const {};
    return aTexto(
      mapa['mensaje'],
      'Si el correo existe, se enviaron las instrucciones de recuperacion.',
    );
  }
}
