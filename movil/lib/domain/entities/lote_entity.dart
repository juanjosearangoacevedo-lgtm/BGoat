/// El lote: la unica entidad del producto.
///
/// Absorbio al pedido (folio y fechas), a la referencia, a la ficha tecnica
/// (SAM, material, imagen y PDF) y al tipo de prenda. Antes eso eran cinco
/// pantallas distintas para registrar un solo trabajo que llega en una sola
/// hoja de papel.
///
/// El dato que manda es `samPactado`: son los minutos que el cliente paga por
/// prenda, negociados con el. De ahi sale la meta de cada hora, y sin el no se
/// puede abrir una jornada.
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
  final String? materialPrincipal;

  /// Minutos pactados por prenda. Es el centro del sistema.
  final double? samPactado;

  final int? cantidadProgramada;
  final int? cantidadRecibida;

  final String? fechaPedido;
  final String? fechaRecepcion;
  final String? fechaEntregaProgramada;
  final String? fechaEntregaReal;
  final String? fechaInicio;
  final String? fechaFinalizacion;

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
    this.materialPrincipal,
    this.samPactado,
    this.cantidadProgramada,
    this.cantidadRecibida,
    this.fechaPedido,
    this.fechaRecepcion,
    this.fechaEntregaProgramada,
    this.fechaEntregaReal,
    this.fechaInicio,
    this.fechaFinalizacion,
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
