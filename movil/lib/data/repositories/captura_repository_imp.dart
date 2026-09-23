import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/registro_entity.dart';
import '../../domain/entities/tablero_entity.dart';
import '../../domain/repositories/captura_repository.dart';
import '../models/captura_model.dart';
import '../models/registro_model.dart';
import '../models/tablero_model.dart';

class CapturaRepositoryImpl implements CapturaRepository {
  final ApiCliente api;

  CapturaRepositoryImpl(this.api);

  @override
  Future<RejillaEntity> rejilla({String? fecha}) async {
    final respuesta = await api.obtener('/captura', consulta: {'fecha': fecha});
    return RejillaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<List<PendienteEntity>> pendientes({String? fecha}) async {
    final respuesta = await api.obtener('/captura/pendientes', consulta: {'fecha': fecha});
    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['pendientes']).map(PendienteModel.fromJson).toList();
  }

  @override
  Future<RegistroEntity> guardar(SolicitudCaptura solicitud) async {
    // Es PUT y no POST porque la operacion es idempotente: la celda se crea o
    // se corrige con la misma llamada (`ON DUPLICATE KEY UPDATE` en el backend).
    final respuesta = await api.actualizar('/captura', RegistroModel.aJson(solicitud));
    return RegistroModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<void> anular(int idRegistro) => api.eliminar('/captura/$idRegistro');

  @override
  Future<TableroEntity> tablero(int idModulo, {String? fecha}) async {
    final respuesta = await api.obtener('/captura/modulo/$idModulo', consulta: {'fecha': fecha});
    return TableroModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }
}
