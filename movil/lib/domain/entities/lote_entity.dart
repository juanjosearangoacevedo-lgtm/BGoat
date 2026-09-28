/// El lote: la unica entidad del producto.
///
/// Absorbio al pedido (folio y fecha de entrega), a la referencia, a la
/// ficha tecnica (SAM, valor de maquila, imagen y PDF) y al tipo de prenda.
/// Antes eso eran cinco pantallas distintas para registrar un solo trabajo
/// que llega en una sola hoja de papel.
///
/// Los dos datos que mandan son `samPactado` y `valorMaquilaUnidad`: los
/// minutos y los pesos que el cliente paga por prenda, negociados con el. De
/// ahi salen la meta y la facturacion de cada hora, y sin el SAM no se puede
/// abrir una jornada.
class LoteEntity {
  final int id;
  final String codigoLote;
  final String? numeroPedido;

  final int idCliente;
  final String? nombreCliente;

  final String? codigoReferencia;
  final String? nombreReferencia;
  final int? idTipoPrenda;
  final String? nombreTipoPrenda;

  /// Minutos pactados por prenda. Es el centro del sistema.
  final double? samPactado;

  /// Lo que el cliente paga por prenda confeccionada. Junto con el SAM arma
  /// la meta de facturacion de cada hora; sin el, la produccion se mide en
  /// unidades pero la plata que genera un modulo queda en cero.
  final double? valorMaquilaUnidad;

  final int? cantidadProgramada;
  final int? cantidadRecibida;

  final String? fechaRecepcion;
  final String? fechaEntregaProgramada;

  /// La ficha tecnica, tal como la guarda la base: una ruta relativa como
  /// `/uploads/fichas/xxx.jpg`. La foto se reconoce de un vistazo al escoger el
  /// lote; el PDF se abre para leer el detalle. Por eso son dos columnas.
  final String? rutaImagen;
  final String? rutaDocumentoPdf;

  final String? observaciones;
  final String estado;

  const LoteEntity({
    required this.id,
    required this.codigoLote,
    this.numeroPedido,
    required this.idCliente,
    this.nombreCliente,
    this.codigoReferencia,
    this.nombreReferencia,
    this.idTipoPrenda,
    this.nombreTipoPrenda,
    this.samPactado,
    this.valorMaquilaUnidad,
    this.cantidadProgramada,
    this.cantidadRecibida,
    this.fechaRecepcion,
    this.fechaEntregaProgramada,
    this.rutaImagen,
    this.rutaDocumentoPdf,
    required this.estado,
    this.observaciones,
  });

  /// Sin SAM no hay meta. La pantalla lo marca antes de que la digitadora
  /// intente abrir una jornada con el y el backend se lo rechace.
  bool get tieneSam => samPactado != null && samPactado! > 0;

  bool get tieneFicha => rutaImagen != null || rutaDocumentoPdf != null;

  /// "LT-0042 · Camiseta basica" — como se nombra el lote en una lista.
  String get titulo {
    final referencia = nombreReferencia ?? codigoReferencia;
    return referencia == null ? codigoLote : '$codigoLote · $referencia';
  }

  /// Solo estos tres estados se pueden producir.
  bool get disponibleParaProducir =>
      const ['REGISTRADO', 'APROBADO', 'EN_PROCESO'].contains(estado);
}

/// Una fila del desglose por talla y color de un lote.
///
/// Es opcional a proposito: cero filas es un estado valido y no bloquea nada.
/// El negocio todavia no decide si lo va a usar, y exigirlo bloquearia el
/// registro de un lote por un dato que a veces no viene en la hoja del cliente.
class DetalleLoteEntity {
  final int? id;
  final int? idTalla;
  final String? nombreTalla;
  final int? idColor;
  final String? nombreColor;
  final String? codigoHex;
  final int? cantidad;

  const DetalleLoteEntity({
    this.id,
    this.idTalla,
    this.nombreTalla,
    this.idColor,
    this.nombreColor,
    this.codigoHex,
    this.cantidad,
  });
}
