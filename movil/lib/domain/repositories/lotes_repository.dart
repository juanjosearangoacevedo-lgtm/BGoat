import '../entities/catalogo_entity.dart';
import '../entities/lote_entity.dart';

/// Filtros del listado de lotes.
class FiltroLotes {
  final String? buscar;
  final String? estado;
  final int? idCliente;

  const FiltroLotes({this.buscar, this.estado, this.idCliente});

  static const todos = 'todos';
}

/// Lo que la pantalla manda al crear o editar un lote.
///
/// El lote es la unica entidad del producto: trae el folio del pedido, la
/// referencia, el SAM pactado y el material. `rutaImagen` y `rutaDocumentoPdf`
/// no estan aqui a proposito: no se digitan, las escribe la subida de la ficha.
class SolicitudLote {
  final String codigoLote;
  final int idCliente;
  final String fechaRecepcion;
  final String? numeroPedido;
  final String? codigoReferencia;
  final String? nombreReferencia;
  final int? idTipoPrenda;
  final double? samPactado;
  final String? materialPrincipal;
  final int? cantidadProgramada;
  final String? fechaEntregaProgramada;
  final String? estado;
  final String? observaciones;

  const SolicitudLote({
    required this.codigoLote,
    required this.idCliente,
    required this.fechaRecepcion,
    this.numeroPedido,
    this.codigoReferencia,
    this.nombreReferencia,
    this.idTipoPrenda,
    this.samPactado,
    this.materialPrincipal,
    this.cantidadProgramada,
    this.fechaEntregaProgramada,
    this.estado,
    this.observaciones,
  });
}

/// Contrato de los lotes y de los catalogos que su formulario necesita.
abstract class LotesRepository {
  Future<List<LoteEntity>> listar([FiltroLotes filtro = const FiltroLotes()]);

  Future<LoteEntity> detalle(int idLote);

  Future<LoteEntity> crear(SolicitudLote solicitud);

  Future<LoteEntity> actualizar(int idLote, SolicitudLote solicitud);

  /// Inactiva el lote. No se borra: conserva la trazabilidad de lo producido.
  Future<void> eliminar(int idLote);

  /// Los clientes activos, para el selector del formulario.
  Future<List<ClienteEntity>> clientes();

  /// Los tipos de prenda. No tienen pantalla propia: viven dentro del lote.
  Future<List<Map<String, dynamic>>> tiposPrenda();

  /// El desglose por talla y color. Cero filas es un estado valido.
  Future<List<DetalleLoteEntity>> detalleTallaColor(int idLote);

  /// Sube la foto o el PDF de la ficha tecnica. El backend decide a que
  /// columna va mirando el tipo del archivo, no un parametro.
  Future<String> subirFicha(int idLote, {required List<int> bytes, required String nombreArchivo});
}
