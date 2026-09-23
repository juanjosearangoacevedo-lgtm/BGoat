import '../entities/captura_entity.dart';
import '../entities/registro_entity.dart';
import '../entities/tablero_entity.dart';

/// Contrato del registro de produccion y del tablero por modulo.
///
/// Los dos leen lo mismo --las horas capturadas-- pero responden preguntas
/// distintas: la rejilla es "que falta por digitar en toda la planta" y el
/// tablero es "como le fue a ESTE modulo hoy". Por eso comparten repositorio.
abstract class CapturaRepository {
  /// La rejilla del dia: modulos por franjas, con lo capturado y lo pendiente.
  /// Trae tambien el catalogo de incidencias, que la pantalla usa como botones.
  Future<RejillaEntity> rejilla({String? fecha});

  /// Que horas ya se cerraron y todavia no tienen registro.
  ///
  /// Va aparte de la rejilla porque la pantalla lo consulta cada pocos minutos
  /// para el recordatorio, y traer la rejilla completa cada vez es caro.
  Future<List<PendienteEntity>> pendientes({String? fecha});

  /// Guarda una celda. Es idempotente: si ya existe se actualiza, asi que la
  /// digitadora puede corregir lo que digito y llenar hacia atras.
  ///
  /// Puede fallar con `requiereCausa` si el cumplimiento cae bajo el umbral
  /// del modulo: sin la incidencia el backend rechaza el guardado, porque si
  /// no el Pareto de tiempo perdido no existiria.
  Future<RegistroEntity> guardar(SolicitudCaptura solicitud);

  /// Anula un registro. No lo borra: queda el rastro por trazabilidad.
  Future<void> anular(int idRegistro);

  /// El tablero de un solo modulo, con cabecera, franjas y totales del dia.
  Future<TableroEntity> tablero(int idModulo, {String? fecha});
}
