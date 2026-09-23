import 'package:flutter/material.dart';

import '../../core/api_cliente.dart';
import '../../core/api_error.dart';
import '../../domain/entities/usuario_entity.dart';
import '../../domain/repositories/auth_repository.dart';

/// El estado de la sesion: quien entro, que puede hacer y contra que servidor.
///
/// Es el unico provider que vive por encima de los demas: los cinco modulos
/// dependen de que haya token, y cuando la sesion se cae todos tienen que
/// volver a la pantalla de entrada.
class SesionProvider extends ChangeNotifier {
  final AuthRepository repositorio;
  final ApiCliente api;

  SesionProvider(this.repositorio, this.api);

  SesionEntity? sesion;

  /// Mientras se revisa el token guardado. Arranca en true para que la app no
  /// muestre el login un instante antes de reconocer la sesion.
  bool revisandoSesion = true;
  bool cargando = false;
  String? error;

  bool get haySesion => sesion != null;
  UsuarioEntity? get usuario => sesion?.usuario;
  String get servidor => api.base;

  /// Si el rol tiene ese permiso. Es lo mismo que valida el backend en cada
  /// ruta: aqui solo sirve para no ofrecer un boton que el servidor rechazaria.
  bool puede(String modulo, String accion) => sesion?.puede(modulo, accion) ?? false;

  /// Revisa el token guardado al arrancar la app.
  Future<void> arrancar() async {
    revisandoSesion = true;
    notifyListeners();

    try {
      await api.cargar();
      sesion = await repositorio.sesionGuardada();
    } on ApiError catch (fallo) {
      // Sin red al arrancar no se borra nada: el token puede seguir bueno y la
      // planta tiene zonas sin senal. Se avisa y se deja reintentar.
      error = fallo.mensaje;
    } finally {
      revisandoSesion = false;
      notifyListeners();
    }
  }

  Future<bool> entrar(String correo, String clave) async {
    cargando = true;
    error = null;
    notifyListeners();

    try {
      sesion = await repositorio.entrar(correo: correo, clave: clave);
      return true;
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      return false;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  Future<void> salir() async {
    await repositorio.salir();
    sesion = null;
    error = null;
    notifyListeners();
  }

  /// La sesion vencio a media faena. Se cierra en silencio y la app vuelve al
  /// login; el mensaje lo pone la pantalla que recibio el 401.
  Future<void> sesionVencida() async {
    await api.guardarToken(null);
    sesion = null;
    notifyListeners();
  }

  /// Cambia el servidor y cierra la sesion: el token del VPS no vale contra el
  /// backend local, son dos bases distintas.
  Future<void> cambiarServidor(String direccion) async {
    await api.cambiarBase(direccion);
    sesion = null;
    error = null;
    notifyListeners();
  }

  Future<String?> recuperarClave(String correo) async {
    try {
      return await repositorio.recuperarClave(correo);
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      notifyListeners();
      return null;
    }
  }
}
