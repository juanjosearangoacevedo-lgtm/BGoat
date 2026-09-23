import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/ordenes_repository.dart';
import '../models/orden_model.dart';

class OrdenesRepositoryImpl implements OrdenesRepository {
  final ApiCliente api;

  OrdenesRepositoryImpl(this.api);

  @override
  Future<List<OrdenEntity>> listar([FiltroOrdenes filtro = const FiltroOrdenes()]) async {
    final respuesta = await api.obtener('/ordenes-produccion', consulta: {
      'buscar': filtro.buscar,
      'estado': filtro.estado,
      'prioridad': filtro.prioridad,
      'asignacion': filtro.asignacion,
      'id_cliente': filtro.idCliente,
      'id_lote': filtro.idLote,
      'id_modulo': filtro.idModulo,
    });

    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']).map(OrdenModel.fromJson).toList();
  }

  @override
  Future<OrdenEntity> detalle(int idOrden) async {
    final respuesta = await api.obtener('/ordenes-produccion/$idOrden');
    return OrdenModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<OrdenEntity> crear(SolicitudOrden solicitud) async {
    final respuesta = await api.crear('/ordenes-produccion', OrdenModel.aJson(solicitud));
    return OrdenModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<OrdenEntity> actualizar(int idOrden, SolicitudOrden solicitud) async {
    final respuesta = await api.actualizar(
      '/ordenes-produccion/$idOrden',
      OrdenModel.aJson(solicitud),
    );
    return OrdenModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<void> eliminar(int idOrden) => api.eliminar('/ordenes-produccion/$idOrden');
}
