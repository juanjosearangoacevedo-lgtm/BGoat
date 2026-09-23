import '../../core/conversiones.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/ordenes_repository.dart';

/// Modelo de la orden. Lee `vw_avance_orden`, que ya trae el avance, la
/// eficiencia y el SAM observado calculados contra la produccion real.
class OrdenModel extends OrdenEntity {
  const OrdenModel({
    required super.id,
    required super.numeroOrden,
    required super.estado,
    super.prioridad,
    required super.idLote,
    super.codigoLote,
    super.codigoReferencia,
    super.nombreReferencia,
    super.samPactado,
    super.numeroPedido,
    super.idCliente,
    super.nombreCliente,
    super.idModulo,
    super.codigoModulo,
    super.nombreModulo,
    required super.asignacion,
    super.tomadaEl,
    required super.cantidadProgramada,
    required super.unidadesProducidas,
    required super.unidadesDefectuosas,
    required super.unidadesRestantes,
    required super.porcentajeAvance,
    required super.horasRegistradas,
    required super.eficiencia,
    super.samObservado,
    super.valorMaquilaUnidad,
    super.tarifaMinutoPactada,
    super.tarifaMinutoReal,
    super.fechaEmision,
    super.fechaInicioProgramada,
    super.fechaFinProgramada,
    super.fechaInicioReal,
    super.fechaFinReal,
    super.observaciones,
  });

  factory OrdenModel.fromJson(Map<String, dynamic> json) => OrdenModel(
        id: aInt(json['id_orden_produccion']),
        numeroOrden: aTexto(json['numero_orden']),
        estado: aTexto(json['estado'], 'PENDIENTE'),
        prioridad: aTextoNulo(json['prioridad']),
        idLote: aInt(json['id_lote']),
        codigoLote: aTextoNulo(json['codigo_lote']),
        codigoReferencia: aTextoNulo(json['codigo_referencia']),
        nombreReferencia: aTextoNulo(json['nombre_referencia']),
        samPactado: aDoubleNulo(json['sam_pactado']),
        numeroPedido: aTextoNulo(json['numero_pedido']),
        idCliente: aIntNulo(json['id_cliente']),
        nombreCliente: aTextoNulo(json['nombre_cliente']),
        // El modulo es deducido: viene de quien tomo la orden, no de un campo
        // que alguien escribio. Queda null mientras la orden sigue libre.
        idModulo: aIntNulo(json['id_modulo'] ?? json['tomada_por']),
        codigoModulo: aTextoNulo(json['codigo_modulo'] ?? json['codigo_modulo_tomador']),
        nombreModulo: aTextoNulo(json['nombre_modulo']),
        asignacion: aTexto(
          json['asignacion'],
          // `GET /jornada/opciones` no calcula `asignacion`: manda `tomada_por`.
          (json['tomada_por'] ?? json['id_modulo']) == null ? 'LIBRE' : 'TOMADA',
        ),
        tomadaEl: aFechaNula(json['tomada_el']),
        cantidadProgramada: aInt(json['cantidad_programada']),
        unidadesProducidas: aInt(json['unidades_producidas']),
        unidadesDefectuosas: aInt(json['unidades_defectuosas']),
        unidadesRestantes: aInt(json['unidades_restantes']),
        porcentajeAvance: aDouble(json['porcentaje_avance']),
        horasRegistradas: aInt(json['horas_registradas']),
        eficiencia: aDouble(json['eficiencia']),
        samObservado: aDoubleNulo(json['sam_observado']),
        valorMaquilaUnidad: aDoubleNulo(json['valor_maquila_unidad']),
        tarifaMinutoPactada: aDoubleNulo(json['tarifa_minuto_pactada']),
        tarifaMinutoReal: aDoubleNulo(json['tarifa_minuto_real']),
        fechaEmision: aFechaNula(json['fecha_emision']),
        fechaInicioProgramada: aFechaNula(json['fecha_inicio_programada']),
        fechaFinProgramada: aFechaNula(json['fecha_fin_programada']),
        fechaInicioReal: aFechaNula(json['fecha_inicio_real']),
        fechaFinReal: aFechaNula(json['fecha_fin_real']),
        observaciones: aTextoNulo(json['observaciones']),
      );

  /// El cuerpo del POST y del PUT.
  ///
  /// `creado_por` no va: lo pone el backend desde la sesion, no el formulario.
  /// El modulo tampoco: la orden no lo nombra.
  static Map<String, dynamic> aJson(SolicitudOrden solicitud) {
    final cuerpo = <String, dynamic>{
      'numero_orden': solicitud.numeroOrden,
      'id_lote': solicitud.idLote,
      'cantidad_programada': solicitud.cantidadProgramada,
    };

    void agregar(String clave, dynamic valor) {
      if (valor != null) cuerpo[clave] = valor;
    }

    agregar('valor_maquila_unidad', solicitud.valorMaquilaUnidad);
    agregar('prioridad', solicitud.prioridad);
    agregar('estado', solicitud.estado);
    agregar('fecha_inicio_programada', solicitud.fechaInicioProgramada);
    agregar('fecha_fin_programada', solicitud.fechaFinProgramada);
    agregar('observaciones', solicitud.observaciones);

    return cuerpo;
  }
}
