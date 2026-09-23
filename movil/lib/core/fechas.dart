/// Fechas del dia de planta.
///
/// La misma regla que `backend/src/lib/fechas.js`: el dia es el LOCAL, no el
/// UTC. Colombia es UTC-5, asi que a partir de las 7:00pm un `toIso8601String()`
/// sobre la fecha en UTC ya devuelve el dia siguiente, y la digitadora que
/// captura la ultima hora a las 7:30pm la guardaria con la fecha equivocada.
String hoy() => comoTexto(DateTime.now());

/// Una fecha en el formato que la API entiende sin traducir: YYYY-MM-DD.
String comoTexto(DateTime fecha) {
  final mes = fecha.month.toString().padLeft(2, '0');
  final dia = fecha.day.toString().padLeft(2, '0');
  return '${fecha.year}-$mes-$dia';
}

/// De YYYY-MM-DD a DateTime local. Devuelve hoy si el texto no sirve.
DateTime desdeTexto(String? texto) {
  if (texto == null || texto.length < 10) return DateTime.now();
  return DateTime.tryParse(texto.substring(0, 10)) ?? DateTime.now();
}

const _diasSemana = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
];

const _meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/// "martes 18 de septiembre" — el encabezado de las pantallas por dia.
String fechaLarga(String? texto) {
  final fecha = desdeTexto(texto);
  return '${_diasSemana[fecha.weekday - 1]} ${fecha.day} de ${_meses[fecha.month - 1]}';
}

/// "18 sep 2026" — para las tablas, donde no cabe la larga.
String fechaCorta(String? texto) {
  if (texto == null || texto.isEmpty) return '—';
  final fecha = desdeTexto(texto);
  final mes = _meses[fecha.month - 1].substring(0, 3);
  return '${fecha.day} $mes ${fecha.year}';
}

/// "07:00" desde el "07:00:00" que devuelve una columna TIME.
String hora(String? texto) {
  if (texto == null || texto.length < 5) return '';
  return texto.substring(0, 5);
}

/// "07:00 - 08:00" para el titulo de una franja.
String rangoHorario(String? inicio, String? fin) => '${hora(inicio)} - ${hora(fin)}';
