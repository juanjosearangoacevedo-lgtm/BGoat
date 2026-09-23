import '../../core/conversiones.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/repositories/lotes_repository.dart';

class LoteModel extends LoteEntity {
  const LoteModel({
    required super.id,
    required super.codigoLote,
    super.numeroPedido,
    required super.idCliente,
    super.nombreCliente,
    super.codigoReferencia,
    super.nombreReferencia,
    super.idTipoPrenda,
    super.nombreTipoPrenda,
    super.materialPrincipal,
    super.samPactado,
    super.cantidadProgramada,
    super.cantidadRecibida,
    super.fechaPedido,
    super.fechaRecepcion,
    super.fechaEntregaProgramada,
    super.fechaEntregaReal,
    super.fechaInicio,
    super.fechaFinalizacion,
    super.rutaImagen,
    super.rutaDocumentoPdf,
    required super.estado,
    super.observaciones,
  });

  factory LoteModel.fromJson(Map<String, dynamic> json) => LoteModel(
        id: aInt(json['id_lote']),
        codigoLote: aTexto(json['codigo_lote']),
        numeroPedido: aTextoNulo(json['numero_pedido']),
        idCliente: aInt(json['id_cliente']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
        codigoReferencia: aTextoNulo(json['codigo_referencia']),
        nombreReferencia: aTextoNulo(json['nombre_referencia']),
        idTipoPrenda: aIntNulo(json['id_tipo_prenda']),
        nombreTipoPrenda: aTextoNulo(json['nombre_tipo_prenda']),
        materialPrincipal: aTextoNulo(json['material_principal']),
        // DECIMAL: llega como texto ("0.850"), nunca como numero.
        samPactado: aDoubleNulo(json['sam_pactado']),
        cantidadProgramada: aIntNulo(json['cantidad_programada']),
        cantidadRecibida: aIntNulo(json['cantidad_recibida']),
        fechaPedido: aFechaNula(json['fecha_pedido']),
        fechaRecepcion: aFechaNula(json['fecha_recepcion']),
        fechaEntregaProgramada: aFechaNula(json['fecha_entrega_programada']),
        fechaEntregaReal: aFechaNula(json['fecha_entrega_real']),
        fechaInicio: aFechaNula(json['fecha_inicio']),
        fechaFinalizacion: aFechaNula(json['fecha_finalizacion']),
        rutaImagen: aTextoNulo(json['ruta_imagen']),
        rutaDocumentoPdf: aTextoNulo(json['ruta_documento_pdf']),
        estado: aTexto(json['estado'], 'REGISTRADO'),
        observaciones: aTextoNulo(json['observaciones']),
      );

  /// El cuerpo del POST y del PUT.
  ///
  /// Solo van los campos que `resources.js` declara: lo demas el backend lo
  /// descarta. Los nulos se omiten para no pisar con null lo que ya existe.
  static Map<String, dynamic> aJson(SolicitudLote solicitud) {
    final cuerpo = <String, dynamic>{
      'codigo_lote': solicitud.codigoLote,
      'id_cliente': solicitud.idCliente,
      'fecha_recepcion': solicitud.fechaRecepcion,
    };

    void agregar(String clave, dynamic valor) {
      if (valor != null) cuerpo[clave] = valor;
    }

    agregar('numero_pedido', solicitud.numeroPedido);
    agregar('codigo_referencia', solicitud.codigoReferencia);
    agregar('nombre_referencia', solicitud.nombreReferencia);
    agregar('id_tipo_prenda', solicitud.idTipoPrenda);
    agregar('sam_pactado', solicitud.samPactado);
    agregar('material_principal', solicitud.materialPrincipal);
    agregar('cantidad_programada', solicitud.cantidadProgramada);
    agregar('fecha_entrega_programada', solicitud.fechaEntregaProgramada);
    agregar('estado', solicitud.estado);
    agregar('observaciones', solicitud.observaciones);

    return cuerpo;
  }
}

class DetalleLoteModel extends DetalleLoteEntity {
  const DetalleLoteModel({
    super.id,
    super.idTalla,
    super.nombreTalla,
    super.idColor,
    super.nombreColor,
    super.codigoHex,
    super.cantidad,
  });

  factory DetalleLoteModel.fromJson(Map<String, dynamic> json) => DetalleLoteModel(
        id: aIntNulo(json['id_detalle']),
        idTalla: aIntNulo(json['id_talla']),
        nombreTalla: aTextoNulo(json['nombre_talla']),
        idColor: aIntNulo(json['id_color']),
        nombreColor: aTextoNulo(json['nombre_color']),
        codigoHex: aTextoNulo(json['codigo_hex']),
        cantidad: aIntNulo(json['cantidad']),
      );
}
