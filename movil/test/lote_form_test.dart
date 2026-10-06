import 'package:bgoat_movil/core/api_cliente.dart';
import 'package:bgoat_movil/data/models/lote_model.dart';
import 'package:bgoat_movil/domain/entities/catalogo_entity.dart';
import 'package:bgoat_movil/domain/entities/lote_entity.dart';
import 'package:bgoat_movil/domain/repositories/auth_repository.dart';
import 'package:bgoat_movil/domain/repositories/lotes_repository.dart';
import 'package:bgoat_movil/presentation/providers/lotes_provider.dart';
import 'package:bgoat_movil/presentation/providers/sesion_provider.dart';
import 'package:bgoat_movil/presentation/screens/lote_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

/// El formulario del lote: el codigo lo asigna el sistema, el pedido y el
/// codigo de referencia van en MAYUSCULAS, y hace falta al menos uno de los
/// tres datos que identifican al lote (pedido, codigo de referencia o nombre
/// de la referencia).

class _AuthFalso implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => throw UnimplementedError();
}

/// Un usuario que puede todo: aqui no se prueban los permisos.
class _SesionFalsa extends SesionProvider {
  _SesionFalsa() : super(_AuthFalso(), ApiCliente());

  @override
  bool puede(String modulo, String accion) => true;
}

/// Guarda lo que la pantalla intento mandar, en vez de llamar a la API.
class RepositorioLotesFalso implements LotesRepository {
  SolicitudLote? creada;
  SolicitudLote? actualizada;

  static const _guardado = LoteEntity(
    id: 1,
    codigoLote: 'LT-2026-0001',
    idCliente: 1,
    estado: 'PENDIENTE',
  );

  @override
  Future<List<ClienteEntity>> clientes() async => const [ClienteEntity(id: 1, nombre: 'GEF')];

  @override
  Future<List<Map<String, dynamic>>> tiposPrenda() async => const [];

  @override
  Future<List<LoteEntity>> listar([FiltroLotes filtro = const FiltroLotes()]) async => const [];

  @override
  Future<LoteEntity> crear(SolicitudLote solicitud) async {
    creada = solicitud;
    return _guardado;
  }

  @override
  Future<LoteEntity> actualizar(int idLote, SolicitudLote solicitud) async {
    actualizada = solicitud;
    return _guardado;
  }

  @override
  Future<LoteEntity> detalle(int idLote) async => _guardado;

  @override
  Future<void> eliminar(int idLote) async {}

  @override
  Future<List<DetalleLoteEntity>> detalleTallaColor(int idLote) async => const [];

  @override
  Future<String> subirFicha(int idLote, {required List<int> bytes, required String nombreArchivo}) async =>
      '';
}

const _loteExistente = LoteEntity(
  id: 7,
  codigoLote: 'LT-2026-0007',
  idCliente: 1,
  nombreCliente: 'GEF',
  numeroPedido: 'ped-viejo',
  estado: 'PENDIENTE',
);

/// Abre el formulario como lo hace la app: empujado encima de otra pantalla,
/// para que guardar pueda cerrarlo.
Future<RepositorioLotesFalso> abrirFormulario(WidgetTester tester, {LoteEntity? lote}) async {
  // Alto de sobra: el formulario es una lista larga y lo que queda fuera de la
  // pantalla ni siquiera se construye.
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  final repositorio = RepositorioLotesFalso();

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<SesionProvider>(create: (_) => _SesionFalsa()),
        ChangeNotifierProvider<LotesProvider>(create: (_) => LotesProvider(repositorio)),
      ],
      child: MaterialApp(
        home: Builder(
          builder: (contexto) => Scaffold(
            body: TextButton(
              onPressed: () => Navigator.push(
                contexto,
                MaterialPageRoute(builder: (_) => LoteFormScreen(lote: lote)),
              ),
              child: const Text('abrir'),
            ),
          ),
        ),
      ),
    ),
  );

  await tester.tap(find.text('abrir'));
  await tester.pumpAndSettle();

  return repositorio;
}

Finder campo(String etiqueta) => find.widgetWithText(TextFormField, etiqueta);

String textoDe(WidgetTester tester, String etiqueta) =>
    tester.widget<TextFormField>(campo(etiqueta)).controller!.text;

/// El valor de maquila ya no se digita: es el precio pactado que se escribe
/// en la calculadora del SAM, y "Usar este SAM" llena los dos campos.
Future<void> llenarMaquilaConCalculadora(WidgetTester tester, String precio) async {
  await tester.ensureVisible(campo('Valor de maquila *'));
  await tester.tap(campo('Valor de maquila *'));
  await tester.pumpAndSettle();
  await tester.enterText(find.widgetWithText(TextField, 'Precio pactado con el cliente'), precio);
  await tester.pumpAndSettle();
  await tester.ensureVisible(find.text('Usar este SAM'));
  await tester.tap(find.text('Usar este SAM'));
  await tester.pumpAndSettle();
}

/// Llena lo que el formulario exige siempre (cliente y valor de maquila) para
/// que lo unico que decida el resultado sea la regla de identificacion.
Future<void> llenarLoQueSiempreSeExige(WidgetTester tester) async {
  await tester.tap(find.byType(DropdownButtonFormField<int>).first);
  await tester.pumpAndSettle();
  await tester.tap(find.text('GEF').last);
  await tester.pumpAndSettle();

  await llenarMaquilaConCalculadora(tester, '2600');
}

Future<void> guardar(WidgetTester tester) async {
  await tester.tap(find.text('Crear el lote'));
  await tester.pumpAndSettle();
}

void main() {
  group('el codigo del lote', () {
    testWidgets('al crear no se digita: avisa que lo asigna el sistema', (tester) async {
      await abrirFormulario(tester);

      expect(find.text('Se asigna solo al guardar'), findsOneWidget);
      // No es un campo de texto: no hay donde escribirlo.
      expect(campo('Codigo del lote'), findsNothing);
    });

    testWidgets('al editar se muestra el que tiene, sin poder cambiarlo', (tester) async {
      await abrirFormulario(tester, lote: _loteExistente);

      // En el titulo y en el campo de solo lectura.
      expect(find.text('Editar LT-2026-0007'), findsOneWidget);
      expect(find.text('LT-2026-0007'), findsOneWidget);
      expect(campo('Codigo del lote'), findsNothing);
    });
  });

  group('mayusculas', () {
    testWidgets('el pedido y el codigo de referencia suben a mayuscula al escribirlos', (tester) async {
      await abrirFormulario(tester);

      await tester.enterText(campo('Numero de pedido'), 'ped-2026-ab');
      await tester.enterText(campo('Cod. referencia'), 'pb-450');

      expect(textoDe(tester, 'Numero de pedido'), 'PED-2026-AB');
      expect(textoDe(tester, 'Cod. referencia'), 'PB-450');
    });

    testWidgets('el nombre de la referencia conserva su caso', (tester) async {
      await abrirFormulario(tester);

      await tester.enterText(campo('Referencia'), 'Camiseta cuello Redondo');

      expect(textoDe(tester, 'Referencia'), 'Camiseta cuello Redondo');
    });

    testWidgets('un valor viejo en minuscula se carga ya en mayuscula', (tester) async {
      await abrirFormulario(tester, lote: _loteExistente);

      expect(textoDe(tester, 'Numero de pedido'), 'PED-VIEJO');
    });
  });

  group('al menos uno de pedido, codigo de referencia o nombre', () {
    testWidgets('sin ninguno no guarda y lo dice', (tester) async {
      final repositorio = await abrirFormulario(tester);
      await llenarLoQueSiempreSeExige(tester);

      await guardar(tester);

      expect(
        find.text(
          'Escriba al menos el numero de pedido, el codigo de referencia o el nombre de la referencia',
        ),
        findsOneWidget,
      );
      expect(repositorio.creada, isNull);
    });

    testWidgets('solo con espacios tampoco cuenta', (tester) async {
      final repositorio = await abrirFormulario(tester);
      await llenarLoQueSiempreSeExige(tester);
      await tester.enterText(campo('Numero de pedido'), '   ');

      await guardar(tester);

      expect(repositorio.creada, isNull);
    });

    testWidgets('con solo el nombre de la referencia guarda', (tester) async {
      final repositorio = await abrirFormulario(tester);
      await llenarLoQueSiempreSeExige(tester);
      await tester.enterText(campo('Referencia'), 'Camiseta cuello redondo');

      await guardar(tester);

      expect(repositorio.creada, isNotNull);
      expect(repositorio.creada!.nombreReferencia, 'Camiseta cuello redondo');
      expect(repositorio.creada!.numeroPedido, isNull);
    });

    testWidgets('con el pedido guarda en mayusculas y sin codigo de lote', (tester) async {
      final repositorio = await abrirFormulario(tester);
      await llenarLoQueSiempreSeExige(tester);
      await tester.enterText(campo('Numero de pedido'), 'ped-77');

      await guardar(tester);

      final solicitud = repositorio.creada!;
      expect(solicitud.numeroPedido, 'PED-77');

      // Lo que viaja al backend: el codigo de lote lo pone el servidor.
      expect(LoteModel.aJson(solicitud).containsKey('codigo_lote'), isFalse);
    });

    testWidgets('al editar, el pedido de siempre ya cumple la regla', (tester) async {
      final repositorio = await abrirFormulario(tester, lote: _loteExistente);
      await llenarMaquilaConCalculadora(tester, '2600');

      await tester.tap(find.text('Guardar cambios'));
      await tester.pumpAndSettle();

      expect(repositorio.actualizada, isNotNull);
      expect(repositorio.actualizada!.numeroPedido, 'PED-VIEJO');
    });
  });
}
