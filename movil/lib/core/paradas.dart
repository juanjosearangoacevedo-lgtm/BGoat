import '../domain/entities/franja_entity.dart';
import '../domain/entities/registro_entity.dart';

/// Paradas del modulo dentro de una hora: de que hora a que hora estuvo
/// parado y por que causa.
///
/// La digitadora ya no escribe "20 minutos": escribe "de 9:10 a 9:30" y los
/// minutos salen de ahi. Una causa puede repetirse en la misma hora (la
/// maquina se trabo dos veces). El backend aplica estas mismas reglas
/// (`normalizarPerdidas` en `captura.routes.js`); aqui se revisan para que la
/// digitadora vea el problema antes de guardar.

/// "HH:MM" o "HH:MM:SS" -> minutos desde la medianoche (null si no es una hora).
int? aMinutosDelDia(String? hora) {
  final partes = RegExp(r'^(\d{1,2}):(\d{2})(?::\d{2})?$').firstMatch((hora ?? '').trim());
  if (partes == null) return null;
  return int.parse(partes.group(1)!) * 60 + int.parse(partes.group(2)!);
}

/// Minutos desde la medianoche -> "HH:MM".
String aHoraTexto(int minutos) =>
    '${(minutos ~/ 60).toString().padLeft(2, '0')}:${(minutos % 60).toString().padLeft(2, '0')}';

/// "07:00:00" -> "07:00".
String horaCorta(String? hora) => hora == null || hora.length < 5 ? (hora ?? '') : hora.substring(0, 5);

/// Minutos de una parada, o 0 si le falta alguna hora o esta al reves.
int minutosDeParada(String? desde, String? hasta) {
  final inicio = aMinutosDelDia(desde);
  final fin = aMinutosDelDia(hasta);
  if (inicio == null || fin == null || fin <= inicio) return 0;
  return fin - inicio;
}

/// El primer problema de las paradas, o null si estan bien:
///   - cada parada lleva desde y hasta;
///   - hasta despues de desde;
///   - las dos horas dentro de la franja;
///   - ninguna se cruza con otra.
String? problemaParadas(List<MinutosPerdidosEntity> paradas, FranjaEntity franja) {
  final inicioFranja = aMinutosDelDia(franja.horaInicio);
  final finFranja = aMinutosDelDia(franja.horaFin);
  final rangos = <List<int>>[];

  for (final parada in paradas) {
    final desde = aMinutosDelDia(parada.horaDesde);
    final hasta = aMinutosDelDia(parada.horaHasta);
    if (desde == null || hasta == null) {
      return 'Cada parada necesita la hora en que empezo y la hora en que termino';
    }
    if (hasta <= desde) return 'En cada parada, la hora final va despues de la inicial';
    if (inicioFranja != null && finFranja != null && (desde < inicioFranja || hasta > finFranja)) {
      return 'Las paradas tienen que quedar dentro de la hora '
          '(${horaCorta(franja.horaInicio)} a ${horaCorta(franja.horaFin)})';
    }
    rangos.add([desde, hasta]);
  }

  rangos.sort((a, b) => a[0].compareTo(b[0]));
  for (var i = 1; i < rangos.length; i++) {
    if (rangos[i][0] < rangos[i - 1][1]) {
      return 'Dos paradas se cruzan: el modulo no puede estar parado dos veces en el mismo minuto';
    }
  }
  return null;
}
