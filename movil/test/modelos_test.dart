import 'package:bgoat_movil/core/api_cliente.dart';
import 'package:bgoat_movil/core/conversiones.dart';
import 'package:bgoat_movil/data/models/orden_model.dart';
import 'package:bgoat_movil/data/models/registro_model.dart';
import 'package:flutter_test/flutter_test.dart';

/// Lo que se prueba aqui es la traduccion del JSON de la API, que es donde
/// esta el riesgo real: MySQL manda los DECIMAL como texto y las fechas con la
/// hora pegada, y un `as double` directo revienta en la primera pantalla.
void main() {
  group('conversiones', () {
    test('un DECIMAL que llega como texto se lee como numero', () {
      // Asi llega `sam_pactado` de verdad: el driver mysql2 no convierte los
      // DECIMAL a numero para no perder precision.
      expect(aDouble('0.850'), 0.85);
      expect(aDouble('1800.00'), 1800);
      expect(aDouble(0.85), 0.85);
      expect(aDoubleNulo(null), isNull);
    });

    test('un numero invalido no tumba la pantalla', () {
      expect(aDouble('sin dato'), 0);
      expect(aInt(null, 7), 7);
      expect(aIntNulo('12.9'), 12);
    });

    test('los TINYINT(1) de MySQL se leen como booleanos', () {
      expect(aBool(1), isTrue);
      expect(aBool(0), isFalse);
      expect(aBool(null), isFalse);
    });

    test('una fecha con hora pegada queda en YYYY-MM-DD', () {
      expect(aFechaNula('2026-09-18 07:00:00'), '2026-09-18');
      expect(aFechaNula('2026-09-18'), '2026-09-18');
      expect(aFechaNula(''), isNull);
    });
  });

  group('ApiCliente.normalizarBase', () {
    test('completa el esquema y el sufijo /api', () {
      expect(
        ApiCliente.normalizarBase('192.168.1.2:4000'),
        'http://192.168.1.2:4000/api',
      );
      expect(
        ApiCliente.normalizarBase('http://144.202.34.180:8080/'),
        'http://144.202.34.180:8080/api',
      );
    });

    test('no duplica el /api si ya viene', () {
      expect(
        ApiCliente.normalizarBase('http://144.202.34.180:8080/api'),
        'http://144.202.34.180:8080/api',
      );
    });

    test('una direccion vacia cae al servidor de la empresa', () {
      expect(ApiCliente.normalizarBase('  '), ApiCliente.basePorDefecto);
    });
  });

  group('OrdenModel', () {
    test('una orden sin modulo queda LIBRE', () {
      final orden = OrdenModel.fromJson({
        'id_orden_produccion': 1,
        'numero_orden': 'OP-001',
        'id_lote': 4,
        'cantidad_programada': '500',
        'asignacion': 'LIBRE',
        'id_modulo': null,
      });

      expect(orden.estaLibre, isTrue);
      expect(orden.cantidadProgramada, 500);
    });

    test('en /jornada/opciones la asignacion se deduce de tomada_por', () {
      // Esa ruta no calcula `asignacion`: manda `tomada_por` con el modulo.
      final libre = OrdenModel.fromJson({
        'id_orden_produccion': 2,
        'numero_orden': 'OP-002',
        'id_lote': 4,
        'tomada_por': null,
      });
      final tomada = OrdenModel.fromJson({
        'id_orden_produccion': 3,
        'numero_orden': 'OP-003',
        'id_lote': 4,
        'tomada_por': 7,
        'codigo_modulo_tomador': 'M3',
      });

      expect(libre.estaLibre, isTrue);
      expect(tomada.estaLibre, isFalse);
      expect(tomada.idModulo, 7);
      expect(tomada.codigoModulo, 'M3');
    });

    test('el avance se recorta a 1 aunque se produzca de mas', () {
      final orden = OrdenModel.fromJson({
        'id_orden_produccion': 4,
        'numero_orden': 'OP-004',
        'id_lote': 4,
        'porcentaje_avance': '118.50',
      });

      expect(orden.porcentajeAvance, 118.5);
      expect(orden.avanceNormalizado, 1);
    });

    test('el SAM observado por encima del pactado sale positivo', () {
      final orden = OrdenModel.fromJson({
        'id_orden_produccion': 5,
        'numero_orden': 'OP-005',
        'id_lote': 4,
        'sam_pactado': '0.850',
        'sam_observado': '1.020',
      });

      // Positivo = la planta gasto mas minutos por prenda de los que el
      // cliente paga, y esa diferencia la absorbe la empresa.
      expect(orden.desviacionSam, closeTo(0.17, 0.0001));
    });
  });

  group('RegistroModel', () {
    test('lee la celda con sus calculos ya hechos por la vista', () {
      final registro = RegistroModel.fromJson({
        'id_registro': 10,
        'fecha': '2026-09-18',
        'hora_jornada': 9,
        // La ultima franja de martes a viernes dura 40, no 60.
        'minutos_franja': 40,
        'id_modulo': 3,
        'personas_presentes': 5,
        'unidades_producidas': 160,
        'unidades_defectuosas': 2,
        'unidades_conformes': 158,
        'sam_aplicado': '0.850',
        'meta_hora': '235.29',
        'eficiencia': '68.00',
        'minutos_disponibles': 200,
      });

      expect(registro.minutosFranja, 40);
      expect(registro.samAplicado, 0.85);
      expect(registro.metaHora, 235.29);
      expect(registro.eficiencia, 68);
    });

    test('la eficiencia tambien se lee del alias cumplimiento', () {
      // La vista devuelve el mismo numero con los dos nombres, porque en
      // planta se usan las dos palabras.
      final registro = RegistroModel.fromJson({
        'id_registro': 11,
        'id_modulo': 3,
        'hora_jornada': 1,
        'cumplimiento': '92.30',
      });

      expect(registro.eficiencia, 92.3);
    });
  });
}
