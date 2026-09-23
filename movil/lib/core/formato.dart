import 'package:intl/intl.dart';

/// Como se ven los numeros del tablero.
///
/// El tablero de pared de la empresa escribe pesos sin decimales y porcentajes
/// enteros; las metas si llevan decimales porque una meta de 31.5 prendas
/// redondeada a 32 desvia el total del dia.

final _pesos = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);
final _miles = NumberFormat.decimalPattern('es_CO');

/// "$ 1.800" — el valor de maquila, la facturacion.
String pesos(num? valor) => valor == null ? '—' : _pesos.format(valor);

/// "1.240" — unidades, minutos.
String entero(num? valor) => valor == null ? '—' : _miles.format(valor.round());

/// "31,5" — metas y SAM observado, donde el decimal si importa.
String decimal(num? valor, [int decimales = 2]) {
  if (valor == null) return '—';
  return NumberFormat.decimalPatternDigits(
    locale: 'es_CO',
    decimalDigits: decimales,
  ).format(valor);
}

/// "87%" — eficiencia y cumplimiento.
String porcentaje(num? valor, [int decimales = 0]) {
  if (valor == null) return '—';
  return '${decimal(valor, decimales)}%';
}

/// "0,850 min" — el SAM, que se negocia con tres decimales.
String sam(num? valor) => valor == null ? '—' : '${decimal(valor, 3)} min';
