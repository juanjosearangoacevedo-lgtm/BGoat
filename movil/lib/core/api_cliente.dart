import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_error.dart';

/// El unico punto por donde la app habla con la API de BGoat.
///
/// Guarda dos cosas entre sesiones: la direccion del servidor y el token JWT.
/// La direccion es configurable porque la app corre en dos sitios distintos:
/// contra el VPS (`http://144.202.34.180:8080/api`, que es el mismo panel que
/// ve la empresa) o contra el backend del PC cuando se esta desarrollando. Una
/// URL compilada en el codigo obligaria a recompilar para cambiar de una a otra.
class ApiCliente {
  /// El VPS donde ya corre BGoat. Ver `APP_BGoat/DESPLIEGUE.md`.
  static const basePorDefecto = 'http://144.202.34.180:8080/api';

  static const _claveBase = 'bgoat_base_api';
  static const _claveToken = 'bgoat_token';

  String _base = basePorDefecto;
  String? _token;

  String get base => _base;
  String? get token => _token;
  bool get haySesion => _token != null && _token!.isNotEmpty;

  /// El origen del servidor, sin el `/api`.
  ///
  /// Las fichas tecnicas de los lotes se sirven como archivos estaticos en
  /// `/uploads/fichas/...`, que cuelga de la raiz y no de la API.
  String get origen =>
      _base.endsWith('/api') ? _base.substring(0, _base.length - 4) : _base;

  /// La URL completa de una ficha tecnica a partir de lo que guarda la base.
  String? urlDeArchivo(String? ruta) {
    if (ruta == null || ruta.isEmpty) return null;
    if (ruta.startsWith('http')) return ruta;
    return '$origen${ruta.startsWith('/') ? '' : '/'}$ruta';
  }

  /// Lee lo guardado en el telefono. Se llama una vez, al arrancar.
  Future<void> cargar() async {
    final guardado = await SharedPreferences.getInstance();
    _base = guardado.getString(_claveBase) ?? basePorDefecto;
    _token = guardado.getString(_claveToken);
  }

  /// Cambia el servidor. Cierra la sesion: el token del VPS no vale en el local.
  Future<void> cambiarBase(String direccion) async {
    _base = normalizarBase(direccion);
    final guardado = await SharedPreferences.getInstance();
    await guardado.setString(_claveBase, _base);
    await guardarToken(null);
  }

  Future<void> guardarToken(String? nuevo) async {
    _token = nuevo;
    final guardado = await SharedPreferences.getInstance();
    if (nuevo == null) {
      await guardado.remove(_claveToken);
    } else {
      await guardado.setString(_claveToken, nuevo);
    }
  }

  /// Acepta lo que la persona escriba y lo deja en la forma que la API espera.
  ///
  ///   192.168.1.2:4000            -> http://192.168.1.2:4000/api
  ///   http://144.202.34.180:8080/ -> http://144.202.34.180:8080/api
  static String normalizarBase(String direccion) {
    var limpia = direccion.trim();
    if (limpia.isEmpty) return basePorDefecto;
    if (!limpia.startsWith('http://') && !limpia.startsWith('https://')) {
      limpia = 'http://$limpia';
    }
    while (limpia.endsWith('/')) {
      limpia = limpia.substring(0, limpia.length - 1);
    }
    return limpia.endsWith('/api') ? limpia : '$limpia/api';
  }

  Map<String, String> get _cabeceras => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (haySesion) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String ruta, [Map<String, dynamic>? consulta]) {
    final parametros = <String, String>{};
    consulta?.forEach((clave, valor) {
      if (valor == null) return;
      final texto = valor.toString();
      if (texto.isEmpty) return;
      parametros[clave] = texto;
    });

    return Uri.parse('$_base$ruta').replace(
      queryParameters: parametros.isEmpty ? null : parametros,
    );
  }

  Future<dynamic> obtener(String ruta, {Map<String, dynamic>? consulta}) =>
      _enviar(() => http.get(_uri(ruta, consulta), headers: _cabeceras));

  Future<dynamic> crear(String ruta, Map<String, dynamic> cuerpo) => _enviar(
        () => http.post(_uri(ruta), headers: _cabeceras, body: jsonEncode(cuerpo)),
      );

  Future<dynamic> actualizar(String ruta, Map<String, dynamic> cuerpo) => _enviar(
        () => http.put(_uri(ruta), headers: _cabeceras, body: jsonEncode(cuerpo)),
      );

  Future<dynamic> eliminar(String ruta) =>
      _enviar(() => http.delete(_uri(ruta), headers: _cabeceras));

  /// Sube la ficha tecnica de un lote (`POST /lotes/:id/ficha`, multipart).
  ///
  /// Va aparte porque es el unico sitio de la API que no manda JSON: el
  /// backend lo recibe con multer y decide si es la foto o el PDF mirando el
  /// tipo del archivo, no un parametro.
  Future<dynamic> subirFicha(
    int idLote, {
    required List<int> bytes,
    required String nombreArchivo,
  }) async {
    final peticion = http.MultipartRequest('POST', _uri('/lotes/$idLote/ficha'))
      ..headers.addAll({
        'Accept': 'application/json',
        if (haySesion) 'Authorization': 'Bearer $_token',
      })
      ..files.add(http.MultipartFile.fromBytes('ficha', bytes, filename: nombreArchivo));

    return _enviar(() async => http.Response.fromStream(await peticion.send()));
  }

  /// Dispara la peticion y traduce la respuesta o el fallo a algo usable.
  Future<dynamic> _enviar(Future<http.Response> Function() peticion) async {
    late final http.Response respuesta;

    try {
      respuesta = await peticion().timeout(const Duration(seconds: 25));
    } on SocketException catch (error) {
      throw ApiError.sinConexion('Revise la direccion en Ajustes. (${error.message})');
    } catch (error) {
      throw ApiError.sinConexion(error.toString());
    }

    // 204 (borrado sin soft delete) no trae cuerpo.
    if (respuesta.statusCode == 204 || respuesta.body.isEmpty) {
      if (respuesta.statusCode >= 400) {
        throw ApiError(respuesta.statusCode, 'El servidor respondio ${respuesta.statusCode}');
      }
      return null;
    }

    dynamic cuerpo;
    try {
      cuerpo = jsonDecode(utf8.decode(respuesta.bodyBytes));
    } catch (_) {
      // Nginx y los proxys contestan HTML cuando la ruta no llega al backend.
      throw ApiError(
        respuesta.statusCode,
        'El servidor no respondio en JSON. Revise que la direccion apunte a la API de BGoat.',
      );
    }

    if (respuesta.statusCode >= 400) {
      final mapa = cuerpo is Map ? cuerpo : const {};
      final detalle = mapa['detalle'];
      throw ApiError(
        respuesta.statusCode,
        (mapa['error'] ?? 'Error ${respuesta.statusCode}').toString(),
        detalle is Map
            ? detalle.map((clave, valor) => MapEntry(clave.toString(), valor))
            : const {},
      );
    }

    return cuerpo;
  }
}
