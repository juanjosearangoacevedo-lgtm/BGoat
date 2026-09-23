import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api_cliente.dart';
import 'core/tema.dart';
import 'data/repositories/auth_repository_imp.dart';
import 'data/repositories/captura_repository_imp.dart';
import 'data/repositories/jornada_repository_imp.dart';
import 'data/repositories/lotes_repository_imp.dart';
import 'data/repositories/ordenes_repository_imp.dart';
import 'presentation/providers/captura_provider.dart';
import 'presentation/providers/jornada_provider.dart';
import 'presentation/providers/lotes_provider.dart';
import 'presentation/providers/ordenes_provider.dart';
import 'presentation/providers/sesion_provider.dart';
import 'presentation/providers/tablero_provider.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/menu_screen.dart';

/// BGoat movil — las funcionalidades de planta en el telefono.
///
/// Arquitectura limpia, la misma de los otros proyectos:
///   domain/       las entidades y los contratos. No saben que existe una API.
///   data/         los modelos (JSON) y las implementaciones de los contratos.
///   presentation/ los providers (estado) y las pantallas.
///   core/         lo transversal: cliente HTTP, tema, formatos, conversiones.
///
/// Habla con la MISMA API y la MISMA base de datos que el panel web. No hay
/// logica de negocio duplicada aqui: la meta, la eficiencia, el SAM observado y
/// la facturacion se calculan en las vistas de MySQL y la app las pinta. Asi el
/// celular y el panel no pueden mostrar numeros distintos sobre la misma hora.
void main() {
  runApp(const BGoatApp());
}

class BGoatApp extends StatefulWidget {
  const BGoatApp({super.key});

  @override
  State<BGoatApp> createState() => _BGoatAppState();
}

class _BGoatAppState extends State<BGoatApp> {
  /// Un solo cliente HTTP para toda la app: es el que guarda el token y la
  /// direccion del servidor, y los cinco repositorios comparten los dos.
  final _api = ApiCliente();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiCliente>.value(value: _api),

        // La sesion arranca sola: revisa el token guardado contra el servidor
        // antes de decidir si muestra el login o el menu.
        ChangeNotifierProvider(
          create: (_) => SesionProvider(AuthRepositoryImpl(_api), _api)..arrancar(),
        ),

        ChangeNotifierProvider(
          create: (_) => JornadaProvider(JornadaRepositoryImpl(_api)),
        ),

        // La captura y el tablero usan el mismo repositorio pero llevan estado
        // aparte: uno es la planta entera y el otro un solo modulo.
        ChangeNotifierProvider(
          create: (_) => CapturaProvider(CapturaRepositoryImpl(_api)),
        ),
        ChangeNotifierProvider(
          create: (_) => TableroProvider(CapturaRepositoryImpl(_api)),
        ),

        ChangeNotifierProvider(
          create: (_) => OrdenesProvider(
            OrdenesRepositoryImpl(_api),
            LotesRepositoryImpl(_api),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => LotesProvider(LotesRepositoryImpl(_api)),
        ),
      ],
      child: MaterialApp(
        title: 'BGoat',
        debugShowCheckedModeBanner: false,
        theme: temaBGoat(),
        home: const _Raiz(),
      ),
    );
  }
}

/// Decide que se ve: la pantalla de entrada o el menu.
///
/// Mientras revisa el token guardado muestra la marca, no el login: enseñar el
/// login un instante y cambiarlo al menu se ve como un parpadeo.
class _Raiz extends StatelessWidget {
  const _Raiz();

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionProvider>();

    if (sesion.revisandoSesion) return const _Arranque();
    if (!sesion.haySesion) return const LoginScreen();
    return const MenuScreen();
  }
}

class _Arranque extends StatelessWidget {
  const _Arranque();

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionProvider>();

    return Scaffold(
      backgroundColor: Paleta.moradoOscuro,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 66,
              height: 66,
              decoration: BoxDecoration(
                color: Paleta.naranja,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(
                Icons.precision_manufacturing_outlined,
                color: Colors.white,
                size: 34,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'BGoat',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 22),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white54),
            ),
            if (sesion.error != null) ...[
              const SizedBox(height: 26),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  sesion.error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
