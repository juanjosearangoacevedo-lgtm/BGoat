import 'package:bgoat_movil/core/formato.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('leerDecimal', () {
    test('lee lo que escribe la calculadora (formato colombiano)', () {
      expect(leerDecimal('2.600,00'), 2600);
      expect(leerDecimal('10,83'), 10.83);
      expect(leerDecimal('1.234.567,5'), 1234567.5);
    });

    test('lee lo que se digita a mano', () {
      expect(leerDecimal('2600'), 2600);
      expect(leerDecimal('6.58'), 6.58);
    });

    test('vacio o texto no es un numero', () {
      expect(leerDecimal(''), isNull);
      expect(leerDecimal('   '), isNull);
      expect(leerDecimal('abc'), isNull);
    });
  });
}
