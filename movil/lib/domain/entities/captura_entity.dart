import 'catalogo_entity.dart';
import 'franja_entity.dart';
import 'jornada_entity.dart';
import 'registro_entity.dart';

/// El cierre del dia de un modulo, tal como lo calcula el backend.
class ResumenModuloEntity {
  final int franjasRegistradas;
  final int franjasPendientes;
  final int unidadesProducidas;
  final int unidadesDefectuosas;
  final double metaDia;
  final double eficiencia;
  final double facturacionMeta;
  final double facturacionReal;
  final double? cumplimientoFacturacion;
  final int minutosPerdidos;

  const ResumenModuloEntity({
    required this.franjasRegistradas,
    required this.franjasPendientes,
    required this.unidadesProducidas,
    required this.unidadesDefectuosas,
    required this.metaDia,
    required this.eficiencia,
    required this.facturacionMeta,
    required this.facturacionReal,
    this.cumplimientoFacturacion,
    required this.minutosPerdidos,
  });

  /// Lo que se dejo de facturar. Es lo que convierte "se perdieron 20 minutos"
  /// en "dejamos de facturar $180.000", que es el numero que la empresa mira.
  double get facturacionPerdida {
    final diferencia = facturacionMeta - facturacionReal;
    return diferencia > 0 ? diferencia : 0;
  }
}

/// Una fila de la rejilla de captura: un modulo con sus celdas del dia.
class ModuloCapturaEntity {
  final ModuloEntity modulo;

  /// La jornada del modulo ese dia, o null si nadie la abrio.
  final JornadaEntity? jornada;

  /// Sin jornada no hay nada que capturar: la pantalla manda a la digitadora a
  /// configurarla primero en vez de dejarla digitar un numero que no se puede
  /// comparar con nada.
  final bool tieneJornada;

  final double? samSugerido;
  final double? precioSugerido;

  /// Cuantas personas precargar en la siguiente franja: lo ultimo capturado.
  final int personasSugeridas;

  /// Las celdas ya guardadas, por numero de franja.
  final Map<int, RegistroEntity> celdas;

  final ResumenModuloEntity resumen;

  const ModuloCapturaEntity({
    required this.modulo,
    this.jornada,
    required this.tieneJornada,
    this.samSugerido,
    this.precioSugerido,
    required this.personasSugeridas,
    required this.celdas,
    required this.resumen,
  });

  RegistroEntity? celdaDe(int franja) => celdas[franja];

  bool get tieneAlgoCapturado => celdas.isNotEmpty;
}

/// La rejilla completa del dia: modulos por franjas.
///
/// Reemplaza el tablero de pared. Con 9 horas y 12 modulos, la empresa hace
/// unas 200 operaciones aritmeticas al dia a mano, y el tablero se borra cada
/// noche. Aqui las cuentas salen de la base y el dia queda guardado.
class RejillaEntity {
  final String fecha;
  final HorarioEntity horario;
  final List<CausaEntity> causas;
  final List<ModuloCapturaEntity> modulos;

  final int modulosConJornada;
  final int modulosSinJornada;
  final int celdasTotales;
  final int celdasRegistradas;

  const RejillaEntity({
    required this.fecha,
    required this.horario,
    required this.causas,
    required this.modulos,
    required this.modulosConJornada,
    required this.modulosSinJornada,
    required this.celdasTotales,
    required this.celdasRegistradas,
  });

  /// Cuanto lleva capturado el dia, de 0 a 1.
  double get avance {
    if (celdasTotales == 0) return 0;
    return (celdasRegistradas / celdasTotales).clamp(0, 1).toDouble();
  }

  List<ModuloCapturaEntity> get conJornada =>
      modulos.where((m) => m.tieneJornada).toList();

  ModuloCapturaEntity? moduloDe(int idModulo) {
    for (final modulo in modulos) {
      if (modulo.modulo.id == idModulo) return modulo;
    }
    return null;
  }

  CausaEntity? causaDe(int? idCausa) {
    if (idCausa == null) return null;
    for (final causa in causas) {
      if (causa.id == idCausa) return causa;
    }
    return null;
  }

  /// El total de unidades del dia en toda la planta.
  int get unidadesDelDia =>
      modulos.fold(0, (total, m) => total + m.resumen.unidadesProducidas);

  /// La eficiencia de la planta: minutos ganados sobre minutos puestos. Se pesa
  /// por los minutos de cada modulo, no es el promedio de los porcentajes.
  double get eficienciaPlanta {
    var ganados = 0.0;
    var disponibles = 0.0;

    for (final modulo in modulos) {
      for (final celda in modulo.celdas.values) {
        ganados += celda.minutosGanados;
        disponibles += celda.minutosDisponibles;
      }
    }

    return disponibles == 0 ? 0 : (ganados * 100) / disponibles;
  }
}
