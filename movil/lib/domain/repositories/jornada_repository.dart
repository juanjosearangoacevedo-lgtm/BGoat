import '../entities/jornada_entity.dart';

/// Contrato del inicio de jornada.
///
/// La jornada es la puerta de entrada del dia: sin ella no se puede registrar
/// una sola hora. Dice que modulo trabaja, con cuantas operarias, sobre que
/// lote --de donde sale el SAM-- y con que orden --de donde sale la tarifa--.
abstract class JornadaRepository {
  /// Todo lo que el asistente necesita en una sola llamada: modulos con su
  /// estado de hoy, clientes con lotes utilizables, esos lotes, las operarias
  /// del catalogo y las ordenes vivas con el modulo que las tomo.
  Future<OpcionesJornadaEntity> opciones({String? fecha});

  /// Como esta la planta ese dia: las jornadas ya abiertas.
  Future<List<JornadaEntity>> delDia({String? fecha});

  /// La jornada de un modulo, o null si todavia no se ha abierto.
  Future<JornadaEntity?> deModulo(int idModulo, {String? fecha});

  /// Abre la jornada. Aqui es donde el modulo TOMA la orden: si otro ya la
  /// tiene, el backend responde 409 y la operacion se rechaza.
  Future<JornadaEntity> abrir(SolicitudJornada solicitud);

  /// Cambia lote, orden, cantidad de operarias, nomina u observaciones.
  ///
  /// Cambiar el lote a mitad del dia es normal (es la incidencia "cambio de
  /// referencia"). Las horas ya capturadas guardan su propio lote y no se
  /// tocan: esto rige de la siguiente hora en adelante.
  Future<JornadaEntity> actualizar(int idJornada, SolicitudJornada solicitud);

  /// Cierra el dia del modulo. No borra nada: deja de pedir las horas
  /// pendientes y lo saca de la lista de recordatorios.
  Future<JornadaEntity> cerrar(int idJornada);

  /// Se cerro por error, o entro una hora mas. Es reversible a proposito.
  Future<JornadaEntity> reabrir(int idJornada);
}
