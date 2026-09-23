import 'catalogo_entity.dart';
import 'franja_entity.dart';
import 'jornada_entity.dart';

/// La cabecera del tablero de un modulo: lo que va arriba de la hoja.
///
/// En el tablero de pared de la empresa varias de estas celdas quedan vacias (la
/// meta del dia) y otras dicen "dia" pero traen una sola hora. Aqui todas se
/// calculan.
class CabeceraTableroEntity {
  final int personas;
  final double sam;
  final double precioUnidad;

  final String? lote;
  final String? referencia;
  final String? codigoReferencia;
  final String? cliente;
  final String? fichaImagen;
  final String? fichaPdf;

  final int minutosJornada;
  final double horasJornada;

  /// La meta de una hora plena de 60 minutos. Es la que la empresa escribe
  /// arriba del tablero.
  final double metaHora;

  /// La meta del dia completo, sumando cada franja con su ancho real. No es
  /// metaHora por el numero de franjas: la ultima no dura 60.
  final double metaDia;

  final double facturacionMetaHora;
  final double facturacionMetaDia;

  const CabeceraTableroEntity({
    required this.personas,
    required this.sam,
    required this.precioUnidad,
    this.lote,
    this.referencia,
    this.codigoReferencia,
    this.cliente,
    this.fichaImagen,
    this.fichaPdf,
    required this.minutosJornada,
    required this.horasJornada,
    required this.metaHora,
    required this.metaDia,
    required this.facturacionMetaHora,
    required this.facturacionMetaDia,
  });
}

/// Una fila del tablero: una franja con sus acumulados hasta ese momento.
class FilaTableroEntity {
  final int horaJornada;
  final String? etiquetaFranja;
  final int minutosFranja;
  final String horaInicio;
  final String horaFin;

  /// null cuando la franja todavia no se capturo. El hueco en el tablero es
  /// informacion, no una fila que falta.
  final int? personasPresentes;
  final double? samAplicado;
  final double? precioAplicado;
  final double? metaHora;
  final int? unidadesProducidas;
  final double? eficiencia;

  final double? metaAcumulada;
  final int? unidadesAcumuladas;
  final double? eficienciaAcumulada;

  final double? facturacionMeta;
  final double? facturacionReal;
  final double? cumplimientoFacturacion;
  final double? facturacionMetaAcumulada;
  final double? facturacionRealAcumulada;

  final int minutosPerdidos;
  final int minutosMaquina;
  final int minutosCalidad;
  final int minutosMontaje;
  final int minutosOtras;

  final int? idCausa;
  final String? nombreCausa;
  final String? nota;

  const FilaTableroEntity({
    required this.horaJornada,
    this.etiquetaFranja,
    required this.minutosFranja,
    required this.horaInicio,
    required this.horaFin,
    this.personasPresentes,
    this.samAplicado,
    this.precioAplicado,
    this.metaHora,
    this.unidadesProducidas,
    this.eficiencia,
    this.metaAcumulada,
    this.unidadesAcumuladas,
    this.eficienciaAcumulada,
    this.facturacionMeta,
    this.facturacionReal,
    this.cumplimientoFacturacion,
    this.facturacionMetaAcumulada,
    this.facturacionRealAcumulada,
    this.minutosPerdidos = 0,
    this.minutosMaquina = 0,
    this.minutosCalidad = 0,
    this.minutosMontaje = 0,
    this.minutosOtras = 0,
    this.idCausa,
    this.nombreCausa,
    this.nota,
  });

  /// La franja existe en el horario pero nadie la capturo todavia.
  bool get estaVacia => unidadesProducidas == null;

  bool get esCorta => minutosFranja < 60;
}

/// Los totales del dia del modulo, desde `vw_estado_modulo_dia`.
class TotalesDiaEntity {
  final int horasRegistradas;
  final int minutosJornada;
  final int unidadesProducidas;
  final int unidadesDefectuosas;
  final int unidadesConformes;
  final double metaDia;
  final int minutosDisponibles;
  final double minutosGanados;
  final double? promedioPersonas;
  final double eficiencia;
  final double porcentajeDefectos;

  /// El SAM que el modulo gasto de verdad. Contra el pactado, dice si la
  /// empresa esta absorbiendo perdida o si puede cotizar mas barato.
  final double? samObservado;
  final double prendasPorHora;

  final double facturacionMeta;
  final double facturacionReal;
  final double? cumplimientoFacturacion;

  final int minutosPerdidos;
  final int minutosMaquina;
  final int minutosCalidad;
  final int minutosMontaje;
  final int minutosOtras;

  const TotalesDiaEntity({
    required this.horasRegistradas,
    required this.minutosJornada,
    required this.unidadesProducidas,
    required this.unidadesDefectuosas,
    required this.unidadesConformes,
    required this.metaDia,
    required this.minutosDisponibles,
    required this.minutosGanados,
    this.promedioPersonas,
    required this.eficiencia,
    required this.porcentajeDefectos,
    this.samObservado,
    required this.prendasPorHora,
    required this.facturacionMeta,
    required this.facturacionReal,
    this.cumplimientoFacturacion,
    required this.minutosPerdidos,
    required this.minutosMaquina,
    required this.minutosCalidad,
    required this.minutosMontaje,
    required this.minutosOtras,
  });

  /// Los minutos perdidos abiertos por causa, ya ordenados de mayor a menor.
  /// Es el Pareto del dia del modulo: en que se nos van los minutos.
  List<MapEntry<String, int>> get perdidasPorCausa {
    final lineas = <MapEntry<String, int>>[
      MapEntry('Maquina', minutosMaquina),
      MapEntry('Calidad', minutosCalidad),
      MapEntry('Montaje e insumos', minutosMontaje),
      MapEntry('Otras', minutosOtras),
    ]..removeWhere((linea) => linea.value <= 0);

    lineas.sort((a, b) => b.value.compareTo(a.value));
    return lineas;
  }
}

/// El tablero de un modulo en un dia: la hoja de calculo de la empresa, ya
/// cuadrada. Cabecera, una fila por franja con acumulados y dinero, y la fila
/// de totales.
class TableroEntity {
  final String fecha;
  final ModuloEntity modulo;
  final HorarioEntity horario;
  final JornadaEntity? jornada;
  final List<PuestoJornadaEntity> operarias;
  final CabeceraTableroEntity cabecera;
  final List<FilaTableroEntity> franjas;
  final TotalesDiaEntity? totales;

  const TableroEntity({
    required this.fecha,
    required this.modulo,
    required this.horario,
    this.jornada,
    required this.operarias,
    required this.cabecera,
    required this.franjas,
    this.totales,
  });

  bool get tieneJornada => jornada != null;

  bool get tieneProduccion => franjas.any((f) => !f.estaVacia);

  int get franjasPendientes => franjas.where((f) => f.estaVacia).length;

  /// Cuanto lleva el dia contra la meta, de 0 a 1.
  double get avanceContraMeta {
    final meta = cabecera.metaDia;
    if (meta <= 0) return 0;
    final producido = totales?.unidadesProducidas ?? 0;
    return (producido / meta).clamp(0, 1).toDouble();
  }
}
