import '../entities/orden_entity.dart';

/// Filtros del listado de ordenes.
///
/// `asignacion` es el que importa en planta: separa las ordenes LIBRES --las
/// que estan esperando a que un modulo las tome-- de las TOMADAS.
class FiltroOrdenes {
  final String? buscar;
  final String? estado;
  final String? prioridad;
  final String? asignacion;
  final int? idCliente;
  final int? idLote;
  final int? idModulo;

  const FiltroOrdenes({
    this.buscar,
    this.estado,
    this.prioridad,
    this.asignacion,
    this.idCliente,
    this.idLote,
    this.idModulo,
  });

  /// El centinela que el backend entiende como "sin filtrar".
  static const todos = 'todos';
}

/// Lo que la pantalla manda al crear o editar una orden.
///
/// NO lleva modulo: la orden nace libre y la toma el modulo que abre su
/// jornada con ella. Tampoco lleva ficha tecnica, pedido, cantidad ni valor
/// de maquila --eso vive en el lote--: un lote corre en una sola orden, asi
/// que la cantidad y el valor se copian del lote al crear la orden, nunca
/// se digitan aqui.
class SolicitudOrden {
  final String numeroOrden;
  final int idLote;
  final String? prioridad;
  final String? estado;
  final String? fechaInicioProgramada;
  final String? fechaFinProgramada;
  final String? observaciones;

  const SolicitudOrden({
    required this.numeroOrden,
    required this.idLote,
    this.prioridad,
    this.estado,
    this.fechaInicioProgramada,
    this.fechaFinProgramada,
    this.observaciones,
  });
}

/// Contrato de las ordenes de produccion.
abstract class OrdenesRepository {
  /// El listado con el avance real ya calculado por la vista.
  Future<List<OrdenEntity>> listar([FiltroOrdenes filtro = const FiltroOrdenes()]);

  /// El detalle de una orden.
  Future<OrdenEntity> detalle(int idOrden);

  Future<OrdenEntity> crear(SolicitudOrden solicitud);

  Future<OrdenEntity> actualizar(int idOrden, SolicitudOrden solicitud);

  /// Elimina la orden. El backend lo rechaza si ya tiene produccion registrada
  /// o jornadas configuradas: en ese caso se cancela, no se borra.
  Future<void> eliminar(int idOrden);
}
