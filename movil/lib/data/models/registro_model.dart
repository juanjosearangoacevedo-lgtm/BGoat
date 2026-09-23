import '../../core/conversiones.dart';
import '../../domain/entities/registro_entity.dart';

class MinutosPerdidosModel extends MinutosPerdidosEntity {
  const MinutosPerdidosModel({
    required super.idCausa,
    required super.minutos,
    super.codigo,
    super.nombre,
    super.tipo,
  });

  factory MinutosPerdidosModel.fromJson(Map<String, dynamic> json) => MinutosPerdidosModel(
        idCausa: aInt(json['id_causa']),
        minutos: aInt(json['minutos']),
        codigo: aTextoNulo(json['codigo']),
        nombre: aTextoNulo(json['nombre']),
        tipo: aTextoNulo(json['tipo']),
      );

  static Map<String, dynamic> aJson(MinutosPerdidosEntity linea) => {
        'id_causa': linea.idCausa,
        'minutos': linea.minutos,
      };
}

/// Modelo de la celda. Todo lo calculado --meta, eficiencia, dinero, SAM
/// observado-- viene ya resuelto de `vw_registro_horario`: la app no repite
/// ninguna de esas cuentas.
class RegistroModel extends RegistroEntity {
  const RegistroModel({
    required super.id,
    required super.fecha,
    required super.horaJornada,
    required super.minutosFranja,
    super.etiquetaFranja,
    super.horaInicio,
    super.horaFin,
    required super.idModulo,
    super.codigoModulo,
    super.umbralCumplimiento,
    super.idLote,
    super.codigoLote,
    super.nombreReferencia,
    super.nombreCliente,
    super.idOrden,
    super.numeroOrden,
    required super.personasPresentes,
    required super.unidadesProducidas,
    required super.unidadesDefectuosas,
    required super.unidadesConformes,
    super.samAplicado,
    super.precioAplicado,
    required super.minutosDisponibles,
    required super.metaHora,
    required super.eficiencia,
    required super.minutosGanados,
    super.samObservado,
    required super.facturacionMeta,
    required super.facturacionReal,
    required super.minutosPerdidos,
    required super.minutosPerdidosPersona,
    super.detallePerdidas,
    super.idCausa,
    super.codigoCausa,
    super.nombreCausa,
    super.nota,
    required super.estado,
    super.nombreRegistrador,
  });

  factory RegistroModel.fromJson(Map<String, dynamic> json) => RegistroModel(
        id: aInt(json['id_registro']),
        fecha: aFechaNula(json['fecha']) ?? '',
        horaJornada: aInt(json['hora_jornada']),
        minutosFranja: aInt(json['minutos_franja'], 60),
        etiquetaFranja: aTextoNulo(json['etiqueta_franja']),
        horaInicio: aTextoNulo(json['hora_inicio']),
        horaFin: aTextoNulo(json['hora_fin']),
        idModulo: aInt(json['id_modulo']),
        codigoModulo: aTextoNulo(json['codigo_modulo']),
        umbralCumplimiento: aDoubleNulo(json['umbral_cumplimiento']),
        idLote: aIntNulo(json['id_lote']),
        codigoLote: aTextoNulo(json['codigo_lote']),
        nombreReferencia: aTextoNulo(json['nombre_referencia']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
        idOrden: aIntNulo(json['id_orden_produccion']),
        numeroOrden: aTextoNulo(json['numero_orden']),
        personasPresentes: aInt(json['personas_presentes']),
        unidadesProducidas: aInt(json['unidades_producidas']),
        unidadesDefectuosas: aInt(json['unidades_defectuosas']),
        unidadesConformes: aInt(json['unidades_conformes']),
        samAplicado: aDoubleNulo(json['sam_aplicado']),
        precioAplicado: aDoubleNulo(json['precio_aplicado']),
        minutosDisponibles: aInt(json['minutos_disponibles']),
        metaHora: aDouble(json['meta_hora']),
        // La vista devuelve el mismo numero como `eficiencia` y como
        // `cumplimiento`: en planta se usan las dos palabras.
        eficiencia: aDouble(json['eficiencia'] ?? json['cumplimiento']),
        minutosGanados: aDouble(json['minutos_ganados']),
        samObservado: aDoubleNulo(json['sam_observado']),
        facturacionMeta: aDouble(json['facturacion_meta']),
        facturacionReal: aDouble(json['facturacion_real']),
        minutosPerdidos: aInt(json['minutos_perdidos']),
        minutosPerdidosPersona: aInt(json['minutos_perdidos_persona']),
        detallePerdidas: aListaDeMapas(json['minutos_perdidos_detalle'])
            .map(MinutosPerdidosModel.fromJson)
            .toList(),
        idCausa: aIntNulo(json['id_causa']),
        codigoCausa: aTextoNulo(json['codigo_causa']),
        nombreCausa: aTextoNulo(json['nombre_causa']),
        nota: aTextoNulo(json['nota']),
        estado: aTexto(json['estado'], 'REGISTRADO'),
        nombreRegistrador: aTextoNulo(json['nombre_registrador']),
      );

  /// El cuerpo de `PUT /captura`.
  ///
  /// No lleva SAM ni precio: salen del lote y de la orden que la jornada
  /// declaro, y la digitadora no digita ninguno de los dos.
  static Map<String, dynamic> aJson(SolicitudCaptura solicitud) => {
        'id_modulo': solicitud.idModulo,
        'fecha': solicitud.fecha,
        'hora_jornada': solicitud.horaJornada,
        'personas_presentes': solicitud.personasPresentes,
        'unidades_producidas': solicitud.unidadesProducidas,
        'unidades_defectuosas': solicitud.unidadesDefectuosas,
        'id_causa': solicitud.idCausa,
        'nota': solicitud.nota,
        'minutos_perdidos':
            solicitud.minutosPerdidos.map(MinutosPerdidosModel.aJson).toList(),
      };
}

class PendienteModel extends PendienteEntity {
  const PendienteModel({
    required super.idJornada,
    required super.idModulo,
    super.codigoLote,
    super.nombreCliente,
    required super.horaJornada,
    super.etiqueta,
    super.horaFin,
    required super.minutos,
  });

  factory PendienteModel.fromJson(Map<String, dynamic> json) => PendienteModel(
        idJornada: aInt(json['id_jornada_modulo']),
        idModulo: aInt(json['id_modulo']),
        codigoLote: aTextoNulo(json['codigo_lote']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
        horaJornada: aInt(json['hora_jornada']),
        etiqueta: aTextoNulo(json['etiqueta']),
        horaFin: aTextoNulo(json['hora_fin']),
        minutos: aInt(json['minutos'], 60),
      );
}
