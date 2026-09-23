import '../../core/conversiones.dart';
import '../../domain/entities/jornada_entity.dart';
import 'catalogo_model.dart';
import 'lote_model.dart';
import 'orden_model.dart';

class PuestoJornadaModel extends PuestoJornadaEntity {
  const PuestoJornadaModel({
    super.id,
    required super.numero,
    super.idOperaria,
    super.codigoOperaria,
    super.nombres,
    super.apellidos,
    super.especialidad,
  });

  factory PuestoJornadaModel.fromJson(Map<String, dynamic> json) => PuestoJornadaModel(
        id: aIntNulo(json['id_jornada_operaria']),
        numero: aInt(json['numero']),
        // null es una operaria anonima, no un error: es el caso normal a
        // primera hora y cuenta igual para los minutos disponibles.
        idOperaria: aIntNulo(json['id_operario']),
        codigoOperaria: aTextoNulo(json['codigo_operario']),
        nombres: aTextoNulo(json['nombres']),
        apellidos: aTextoNulo(json['apellidos']),
        especialidad: aTextoNulo(json['especialidad']),
      );
}

class JornadaModel extends JornadaEntity {
  const JornadaModel({
    required super.id,
    required super.idModulo,
    required super.codigoModulo,
    required super.nombreModulo,
    super.capacidadOperarios,
    required super.umbralCumplimiento,
    required super.fecha,
    required super.estado,
    required super.idLote,
    super.codigoLote,
    super.codigoReferencia,
    super.nombreReferencia,
    super.samPactado,
    super.rutaImagen,
    super.rutaDocumentoPdf,
    super.cantidadProgramada,
    super.idCliente,
    super.nombreCliente,
    super.idOrden,
    super.numeroOrden,
    super.valorMaquilaUnidad,
    required super.cantidadOperarias,
    required super.puestos,
    super.nombreDigitadora,
    super.fechaApertura,
    super.fechaCierre,
    super.observaciones,
  });

  factory JornadaModel.fromJson(Map<String, dynamic> json) => JornadaModel(
        id: aInt(json['id_jornada_modulo']),
        idModulo: aInt(json['id_modulo']),
        codigoModulo: aTexto(json['codigo_modulo']),
        nombreModulo: aTexto(json['nombre_modulo']),
        capacidadOperarios: aIntNulo(json['capacidad_operarios']),
        umbralCumplimiento: aDouble(json['umbral_cumplimiento'], 80),
        fecha: aFechaNula(json['fecha']) ?? '',
        estado: aTexto(json['estado'], 'ABIERTA'),
        idLote: aInt(json['id_lote']),
        codigoLote: aTextoNulo(json['codigo_lote']),
        codigoReferencia: aTextoNulo(json['codigo_referencia']),
        nombreReferencia: aTextoNulo(json['nombre_referencia']),
        samPactado: aDoubleNulo(json['sam_pactado']),
        rutaImagen: aTextoNulo(json['ruta_imagen']),
        rutaDocumentoPdf: aTextoNulo(json['ruta_documento_pdf']),
        cantidadProgramada: aIntNulo(json['cantidad_programada']),
        idCliente: aIntNulo(json['id_cliente']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
        idOrden: aIntNulo(json['id_orden_produccion']),
        numeroOrden: aTextoNulo(json['numero_orden']),
        valorMaquilaUnidad: aDoubleNulo(json['valor_maquila_unidad']),
        cantidadOperarias: aInt(json['cantidad_operarias']),
        puestos: aListaDeMapas(json['operarias']).map(PuestoJornadaModel.fromJson).toList(),
        nombreDigitadora: aTextoNulo(json['nombre_digitadora']),
        fechaApertura: aTextoNulo(json['fecha_apertura']),
        fechaCierre: aTextoNulo(json['fecha_cierre']),
        observaciones: aTextoNulo(json['observaciones']),
      );

  /// El cuerpo de `POST /jornada` y `PUT /jornada/:id`.
  ///
  /// `operarias` va como lista posicional de ids con null en los puestos
  /// anonimos, que es una de las tres formas que el backend acepta.
  static Map<String, dynamic> aJson(SolicitudJornada solicitud) => {
        'id_modulo': solicitud.idModulo,
        'id_lote': solicitud.idLote,
        'id_orden_produccion': solicitud.idOrden,
        'fecha': solicitud.fecha,
        'cantidad_operarias': solicitud.cantidadOperarias,
        'operarias': solicitud.operarias,
        'observaciones': solicitud.observaciones,
      };
}

/// Un modulo en el paso 1 del asistente.
///
/// El JSON viene aplanado: las columnas del modulo y las de su jornada de hoy
/// llegan en el mismo objeto, porque el backend las trae con un LEFT JOIN.
class ModuloDelDiaModel extends ModuloDelDiaEntity {
  const ModuloDelDiaModel({
    required super.modulo,
    super.idJornada,
    super.estadoJornada,
    super.cantidadOperarias,
    super.codigoLote,
    super.nombreCliente,
  });

  factory ModuloDelDiaModel.fromJson(Map<String, dynamic> json) => ModuloDelDiaModel(
        modulo: ModuloModel.fromJson(json),
        idJornada: aIntNulo(json['id_jornada_modulo']),
        estadoJornada: aTextoNulo(json['estado_jornada']),
        cantidadOperarias: aIntNulo(json['cantidad_operarias']),
        codigoLote: aTextoNulo(json['codigo_lote']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
      );
}

class OpcionesJornadaModel extends OpcionesJornadaEntity {
  const OpcionesJornadaModel({
    required super.fecha,
    required super.modulos,
    required super.clientes,
    required super.lotes,
    required super.operarias,
    required super.ordenes,
  });

  factory OpcionesJornadaModel.fromJson(Map<String, dynamic> json) => OpcionesJornadaModel(
        fecha: aFechaNula(json['fecha']) ?? '',
        modulos: aListaDeMapas(json['modulos']).map(ModuloDelDiaModel.fromJson).toList(),
        clientes: aListaDeMapas(json['clientes']).map(ClienteModel.fromJson).toList(),
        lotes: aListaDeMapas(json['lotes']).map(LoteModel.fromJson).toList(),
        operarias: aListaDeMapas(json['operarias']).map(OperariaModel.fromJson).toList(),
        ordenes: aListaDeMapas(json['ordenes']).map(OrdenModel.fromJson).toList(),
      );
}
