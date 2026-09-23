import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/jornada_entity.dart';
import '../../domain/repositories/jornada_repository.dart';
import '../models/jornada_model.dart';

class JornadaRepositoryImpl implements JornadaRepository {
  final ApiCliente api;

  JornadaRepositoryImpl(this.api);

  @override
  Future<OpcionesJornadaEntity> opciones({String? fecha}) async {
    final respuesta = await api.obtener('/jornada/opciones', consulta: {'fecha': fecha});
    return OpcionesJornadaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<List<JornadaEntity>> delDia({String? fecha}) async {
    final respuesta = await api.obtener('/jornada', consulta: {'fecha': fecha});
    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']).map(JornadaModel.fromJson).toList();
  }

  @override
  Future<JornadaEntity?> deModulo(int idModulo, {String? fecha}) async {
    // Esta ruta devuelve `null` tal cual cuando el modulo no ha abierto
    // jornada: no es un 404, es una respuesta valida.
    final respuesta = await api.obtener('/jornada/modulo/$idModulo', consulta: {'fecha': fecha});
    final mapa = aMapaNulo(respuesta);
    return mapa == null ? null : JornadaModel.fromJson(mapa);
  }

  @override
  Future<JornadaEntity> abrir(SolicitudJornada solicitud) async {
    final respuesta = await api.crear('/jornada', JornadaModel.aJson(solicitud));
    return JornadaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<JornadaEntity> actualizar(int idJornada, SolicitudJornada solicitud) async {
    final respuesta = await api.actualizar('/jornada/$idJornada', JornadaModel.aJson(solicitud));
    return JornadaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<JornadaEntity> cerrar(int idJornada) async {
    final respuesta = await api.crear('/jornada/$idJornada/cerrar', const {});
    return JornadaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<JornadaEntity> reabrir(int idJornada) async {
    final respuesta = await api.crear('/jornada/$idJornada/reabrir', const {});
    return JornadaModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }
}
