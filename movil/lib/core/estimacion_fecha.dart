import 'fechas.dart' as fechas;

/// Un patron de horario semanal: en que dias aplica y cuantos minutos
/// produce la planta ese dia. Viene de `GET /jornada/horario` (vista
/// `vw_horario_jornada` + `jornada_dia`).
class PatronHorario {
  /// 1=lunes .. 7=domingo, igual que `jornada_dia.dia_semana` y que
  /// `DateTime.weekday` en Dart -no hace falta convertir nada, a
  /// diferencia de JS, donde `getDay()` devuelve 0=domingo.
  final List<int> dias;
  final int minutosTotales;

  const PatronHorario({required this.dias, required this.minutosTotales});
}

/// Cuantos minutos produce la planta un dia calendario dado.
///
/// Cero si cae en un festivo/cierre (`dias_no_laborales`) o si ningun
/// patron cubre ese dia de la semana (como el domingo, que no tiene fila).
int _minutosDelDia(DateTime fecha, List<PatronHorario> patrones, Set<String> festivos) {
  if (festivos.contains(fechas.comoTexto(fecha))) return 0;

  for (final patron in patrones) {
    if (patron.dias.contains(fecha.weekday)) return patron.minutosTotales;
  }
  return 0;
}

const _topeDias = 3650; // 10 anios: evita un bucle infinito si algo viene en cero.

/// La fecha en que estarian listas `cantidad` unidades, recorriendo dias
/// reales desde `fechaInicioISO` y saltando domingos y festivos.
///
/// Misma formula que `frontend/.../utils/estimacionFecha.js` (minutos del
/// dia x personas / SAM x eficiencia esperada = unidades reales del dia),
/// aplicada dia por dia para que la fecha sea una fecha de calendario real.
/// Null si falta algun dato: mejor no mostrar nada que una fecha inventada.
String? calcularFechaEstimada({
  required String? fechaInicioISO,
  required int cantidad,
  required double sam,
  required int personas,
  required double? eficienciaEsperadaPct,
  required List<PatronHorario> patrones,
  Set<String> festivos = const {},
}) {
  if (fechaInicioISO == null ||
      cantidad <= 0 ||
      sam <= 0 ||
      personas <= 0 ||
      eficienciaEsperadaPct == null ||
      eficienciaEsperadaPct <= 0 ||
      patrones.isEmpty) {
    return null;
  }

  final eficiencia = eficienciaEsperadaPct / 100;
  var producidas = 0.0;
  var fecha = fechas.desdeTexto(fechaInicioISO);
  var diasRecorridos = 0;

  while (producidas < cantidad && diasRecorridos < _topeDias) {
    final minutos = _minutosDelDia(fecha, patrones, festivos);
    if (minutos > 0) {
      producidas += (personas * minutos / sam) * eficiencia;
    }

    if (producidas >= cantidad) break;
    fecha = fecha.add(const Duration(days: 1));
    diasRecorridos += 1;
  }

  return diasRecorridos < _topeDias ? fechas.comoTexto(fecha) : null;
}
