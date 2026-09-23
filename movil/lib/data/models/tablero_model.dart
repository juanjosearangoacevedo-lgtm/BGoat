import '../../core/conversiones.dart';
import '../../domain/entities/tablero_entity.dart';
import 'catalogo_model.dart';
import 'franja_model.dart';
import 'jornada_model.dart';

class CabeceraTableroModel extends CabeceraTableroEntity {
  const CabeceraTableroModel({
    required super.personas,
    required super.sam,
    required super.precioUnidad,
    super.lote,
    super.referencia,
    super.codigoReferencia,
    super.cliente,
    super.fichaImagen,
    super.fichaPdf,
    required super.minutosJornada,
    required super.horasJornada,
    required super.metaHora,
    required super.metaDia,
    required super.facturacionMetaHora,
    required super.facturacionMetaDia,
  });

  factory CabeceraTableroModel.fromJson(Map<String, dynamic>? json) {
    final mapa = json ?? const <String, dynamic>{};
    return CabeceraTableroModel(
      personas: aInt(mapa['personas']),
      sam: aDouble(mapa['sam']),
      precioUnidad: aDouble(mapa['precio_unidad']),
      lote: aTextoNulo(mapa['lote']),
      referencia: aTextoNulo(mapa['referencia']),
      codigoReferencia: aTextoNulo(mapa['codigo_referencia']),
      cliente: aTextoNulo(mapa['cliente']),
      fichaImagen: aTextoNulo(mapa['ficha_imagen']),
      fichaPdf: aTextoNulo(mapa['ficha_pdf']),
      minutosJornada: aInt(mapa['minutos_jornada']),
      horasJornada: aDouble(mapa['horas_jornada']),
      metaHora: aDouble(mapa['meta_hora']),
      metaDia: aDouble(mapa['meta_dia']),
      facturacionMetaHora: aDouble(mapa['facturacion_meta_hora']),
      facturacionMetaDia: aDouble(mapa['facturacion_meta_dia']),
    );
  }
}

class FilaTableroModel extends FilaTableroEntity {
  const FilaTableroModel({
    required super.horaJornada,
    super.etiquetaFranja,
    required super.minutosFranja,
    required super.horaInicio,
    required super.horaFin,
    super.personasPresentes,
    super.samAplicado,
    super.precioAplicado,
    super.metaHora,
    super.unidadesProducidas,
    super.eficiencia,
    super.metaAcumulada,
    super.unidadesAcumuladas,
    super.eficienciaAcumulada,
    super.facturacionMeta,
    super.facturacionReal,
    super.cumplimientoFacturacion,
    super.facturacionMetaAcumulada,
    super.facturacionRealAcumulada,
    super.minutosPerdidos,
    super.minutosMaquina,
    super.minutosCalidad,
    super.minutosMontaje,
    super.minutosOtras,
    super.idCausa,
    super.nombreCausa,
    super.nota,
  });

  /// El backend devuelve TODAS las franjas del dia, con o sin captura: el hueco
  /// en el tablero es informacion, no una fila que falta. Por eso la franja y
  /// su registro llegan separados y el registro puede ser null.
  factory FilaTableroModel.fromJson(Map<String, dynamic> json) {
    final registro = aMapaNulo(json['registro']);

    return FilaTableroModel(
      horaJornada: aInt(json['orden_franja']),
      etiquetaFranja: aTextoNulo(json['etiqueta'] ?? registro?['etiqueta_franja']),
      minutosFranja: aInt(json['minutos'], 60),
      horaInicio: aTexto(json['hora_inicio']),
      horaFin: aTexto(json['hora_fin']),
      personasPresentes: aIntNulo(registro?['personas_presentes']),
      samAplicado: aDoubleNulo(registro?['sam_aplicado']),
      precioAplicado: aDoubleNulo(registro?['precio_aplicado']),
      metaHora: aDoubleNulo(registro?['meta_hora']),
      unidadesProducidas: aIntNulo(registro?['unidades_producidas']),
      eficiencia: aDoubleNulo(registro?['eficiencia']),
      metaAcumulada: aDoubleNulo(registro?['meta_acumulada']),
      unidadesAcumuladas: aIntNulo(registro?['unidades_acumuladas']),
      eficienciaAcumulada: aDoubleNulo(registro?['eficiencia_acumulada']),
      facturacionMeta: aDoubleNulo(registro?['facturacion_meta']),
      facturacionReal: aDoubleNulo(registro?['facturacion_real']),
      cumplimientoFacturacion: aDoubleNulo(registro?['cumplimiento_facturacion']),
      facturacionMetaAcumulada: aDoubleNulo(registro?['facturacion_meta_acumulada']),
      facturacionRealAcumulada: aDoubleNulo(registro?['facturacion_real_acumulada']),
      minutosPerdidos: aInt(registro?['minutos_perdidos']),
      minutosMaquina: aInt(registro?['minutos_maquina']),
      minutosCalidad: aInt(registro?['minutos_calidad']),
      minutosMontaje: aInt(registro?['minutos_montaje']),
      minutosOtras: aInt(registro?['minutos_otras']),
      idCausa: aIntNulo(registro?['id_causa']),
      nombreCausa: aTextoNulo(registro?['nombre_causa']),
      nota: aTextoNulo(registro?['nota']),
    );
  }
}

class TotalesDiaModel extends TotalesDiaEntity {
  const TotalesDiaModel({
    required super.horasRegistradas,
    required super.minutosJornada,
    required super.unidadesProducidas,
    required super.unidadesDefectuosas,
    required super.unidadesConformes,
    required super.metaDia,
    required super.minutosDisponibles,
    required super.minutosGanados,
    super.promedioPersonas,
    required super.eficiencia,
    required super.porcentajeDefectos,
    super.samObservado,
    required super.prendasPorHora,
    required super.facturacionMeta,
    required super.facturacionReal,
    super.cumplimientoFacturacion,
    required super.minutosPerdidos,
    required super.minutosMaquina,
    required super.minutosCalidad,
    required super.minutosMontaje,
    required super.minutosOtras,
  });

  factory TotalesDiaModel.fromJson(Map<String, dynamic> json) => TotalesDiaModel(
        horasRegistradas: aInt(json['horas_registradas']),
        minutosJornada: aInt(json['minutos_jornada']),
        unidadesProducidas: aInt(json['unidades_producidas']),
        unidadesDefectuosas: aInt(json['unidades_defectuosas']),
        unidadesConformes: aInt(json['unidades_conformes']),
        metaDia: aDouble(json['meta_dia']),
        minutosDisponibles: aInt(json['minutos_disponibles']),
        minutosGanados: aDouble(json['minutos_ganados']),
        promedioPersonas: aDoubleNulo(json['promedio_personas']),
        eficiencia: aDouble(json['eficiencia']),
        porcentajeDefectos: aDouble(json['porcentaje_defectos']),
        samObservado: aDoubleNulo(json['sam_observado']),
        prendasPorHora: aDouble(json['prendas_por_hora']),
        facturacionMeta: aDouble(json['facturacion_meta']),
        facturacionReal: aDouble(json['facturacion_real']),
        cumplimientoFacturacion: aDoubleNulo(json['cumplimiento_facturacion']),
        minutosPerdidos: aInt(json['minutos_perdidos']),
        minutosMaquina: aInt(json['minutos_maquina']),
        minutosCalidad: aInt(json['minutos_calidad']),
        minutosMontaje: aInt(json['minutos_montaje']),
        minutosOtras: aInt(json['minutos_otras']),
      );
}

class TableroModel extends TableroEntity {
  const TableroModel({
    required super.fecha,
    required super.modulo,
    required super.horario,
    super.jornada,
    required super.operarias,
    required super.cabecera,
    required super.franjas,
    super.totales,
  });

  factory TableroModel.fromJson(Map<String, dynamic> json) {
    final modulo = aMapaNulo(json['modulo']) ?? const <String, dynamic>{};
    final jornada = aMapaNulo(json['jornada_modulo']);
    final totales = aMapaNulo(json['totales']);

    return TableroModel(
      fecha: aFechaNula(json['fecha']) ?? '',
      modulo: ModuloModel.fromJson(modulo),
      horario: HorarioModel.fromJson(aMapaNulo(json['jornada'])),
      // La jornada corta del tablero tampoco trae el nombre del modulo.
      jornada: jornada == null
          ? null
          : JornadaModel.fromJson({
              ...jornada,
              'codigo_modulo': modulo['codigo'],
              'nombre_modulo': modulo['nombre'],
              'umbral_cumplimiento': modulo['umbral_cumplimiento'],
              'capacidad_operarios': modulo['capacidad_operarios'],
              'operarias': json['operarias'],
            }),
      operarias: aListaDeMapas(json['operarias']).map(PuestoJornadaModel.fromJson).toList(),
      cabecera: CabeceraTableroModel.fromJson(aMapaNulo(json['cabecera'])),
      franjas: aListaDeMapas(json['franjas']).map(FilaTableroModel.fromJson).toList(),
      totales: totales == null ? null : TotalesDiaModel.fromJson(totales),
    );
  }
}
