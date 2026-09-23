import '../../core/conversiones.dart';
import '../../domain/entities/usuario_entity.dart';

/// Modelo del usuario: la entidad mas la traduccion desde el JSON de la API.
class UsuarioModel extends UsuarioEntity {
  const UsuarioModel({
    required super.id,
    required super.idRol,
    required super.nombreRol,
    required super.nombres,
    required super.apellidos,
    required super.correo,
    super.telefono,
    required super.estado,
  });

  factory UsuarioModel.fromJson(Map<String, dynamic> json) => UsuarioModel(
        id: aInt(json['id_usuario']),
        idRol: aInt(json['id_rol']),
        nombreRol: aTexto(json['nombre_rol'], 'Sin rol'),
        nombres: aTexto(json['nombres']),
        apellidos: aTexto(json['apellidos']),
        correo: aTexto(json['correo']),
        telefono: aTextoNulo(json['telefono']),
        estado: aTexto(json['estado'], 'ACTIVO'),
      );
}

class PermisoModel extends PermisoEntity {
  const PermisoModel({required super.modulo, required super.accion});

  factory PermisoModel.fromJson(Map<String, dynamic> json) => PermisoModel(
        modulo: aTexto(json['modulo']),
        accion: aTexto(json['accion']),
      );
}

class SesionModel extends SesionEntity {
  const SesionModel({
    required super.token,
    required super.usuario,
    required super.permisos,
  });

  /// Sirve para las dos respuestas que devuelven sesion: `POST /auth/login`,
  /// que trae el token, y `GET /auth/perfil`, que no lo trae porque ya se
  /// mando en la cabecera. Por eso el token puede venir por fuera.
  factory SesionModel.fromJson(Map<String, dynamic> json, {String? token}) => SesionModel(
        token: aTexto(json['token'], token ?? ''),
        usuario: UsuarioModel.fromJson(aMapaNulo(json['usuario']) ?? const {}),
        permisos: aListaDeMapas(json['permisos']).map(PermisoModel.fromJson).toList(),
      );
}
