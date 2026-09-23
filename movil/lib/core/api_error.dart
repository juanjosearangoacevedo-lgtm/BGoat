/// Un error de la API, con el cuerpo que manda el backend.
///
/// Todas las rutas responden los errores igual (`server.js`):
///   { "error": "mensaje para el usuario", "detalle": ... }
///
/// El `detalle` no es decoracion: la captura lo usa para saber POR QUE fue
/// rechazado el guardado. Cuando la eficiencia cae bajo el umbral el backend
/// contesta 400 con `detalle.requiere_causa = true`, y la pantalla tiene que
/// abrir el selector de incidencias en vez de mostrar un error rojo y ya.
class ApiError implements Exception {
  /// El codigo HTTP. 0 significa que la peticion ni siquiera salio.
  final int estado;

  /// El mensaje del backend, ya escrito para que lo lea la digitadora.
  final String mensaje;

  /// El `detalle` de la respuesta, cuando es un mapa.
  final Map<String, dynamic> detalle;

  const ApiError(this.estado, this.mensaje, [this.detalle = const {}]);

  /// No hubo respuesta: sin señal, backend apagado o URL equivocada.
  factory ApiError.sinConexion(String causa) => ApiError(
        0,
        'No se pudo conectar con el servidor de BGoat.\n$causa',
      );

  /// La sesion vencio o el token ya no sirve (401).
  bool get esSesionVencida => estado == 401;

  /// El rol no tiene el permiso que pide la ruta (403).
  bool get esSinPermiso => estado == 403;

  /// El modulo no tiene jornada abierta: hay que configurarla primero.
  bool get requiereJornada => detalle['requiere_jornada'] == true;

  /// El cumplimiento cayo bajo el umbral: la incidencia es obligatoria.
  bool get requiereCausa => detalle['requiere_causa'] == true;

  /// La incidencia escogida exige que se explique que paso.
  bool get requiereNota => detalle['requiere_nota'] == true;

  @override
  String toString() => mensaje;
}
