import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/catalogo_entity.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/repositories/lotes_repository.dart';
import '../models/catalogo_model.dart';
import '../models/lote_model.dart';

class LotesRepositoryImpl implements LotesRepository {
  final ApiCliente api;

  LotesRepositoryImpl(this.api);

  @override
  Future<List<LoteEntity>> listar([FiltroLotes filtro = const FiltroLotes()]) async {
    final respuesta = await api.obtener('/lotes', consulta: {
      'buscar': filtro.buscar,
      'estado': filtro.estado,
      'id_cliente': filtro.idCliente,
      'porPagina': 200,
    });

    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']).map(LoteModel.fromJson).toList();
  }

  @override
  Future<LoteEntity> detalle(int idLote) async {
    final respuesta = await api.obtener('/lotes/$idLote');
    return LoteModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<LoteEntity> crear(SolicitudLote solicitud) async {
    final respuesta = await api.crear('/lotes', LoteModel.aJson(solicitud));
    return LoteModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<LoteEntity> actualizar(int idLote, SolicitudLote solicitud) async {
    final respuesta = await api.actualizar('/lotes/$idLote', LoteModel.aJson(solicitud));
    return LoteModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }

  @override
  Future<void> eliminar(int idLote) => api.eliminar('/lotes/$idLote');

  @override
  Future<List<ClienteEntity>> clientes() async {
    final respuesta = await api.obtener('/clientes', consulta: {
      'estado': 'ACTIVO',
      'porPagina': 200,
    });

    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']).map(ClienteModel.fromJson).toList();
  }

  @override
  Future<List<Map<String, dynamic>>> tiposPrenda() async {
    final respuesta = await api.obtener('/tipos-prenda', consulta: {'estado': 'ACTIVO'});
    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']);
  }

  @override
  Future<List<DetalleLoteEntity>> detalleTallaColor(int idLote) async {
    final respuesta = await api.obtener('/lotes/$idLote/detalle');
    final mapa = aMapaNulo(respuesta) ?? const {};
    return aListaDeMapas(mapa['datos']).map(DetalleLoteModel.fromJson).toList();
  }

  @override
  Future<String> subirFicha(
    int idLote, {
    required List<int> bytes,
    required String nombreArchivo,
  }) async {
    final respuesta = await api.subirFicha(
      idLote,
      bytes: bytes,
      nombreArchivo: nombreArchivo,
    );

    final mapa = aMapaNulo(respuesta) ?? const {};
    return aTexto(mapa['ruta']);
  }
}
