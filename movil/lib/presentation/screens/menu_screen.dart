import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart';
import '../../core/tema.dart';
import '../providers/captura_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/tarjetas.dart';
import 'ajustes_screen.dart';
import 'captura_screen.dart';
import 'jornada_screen.dart';
import 'lotes_screen.dart';
import 'ordenes_screen.dart';
import 'tablero_screen.dart';

/// El menu principal: los cinco modulos, en el orden en que ocurre el dia.
///
/// La orden existe suelta, un modulo la toma al abrir su jornada, se registra
/// cada hora y se mira el tablero. Ese orden no es decorativo: es la rutina de
/// la digitadora, y la pantalla la respeta.
class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  @override
  void initState() {
    super.initState();
    // Los pendientes del dia se piden al entrar: son el aviso de cuantas horas
    // vencidas estan sin registrar, y es lo primero que hay que saber.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CapturaProvider>().refrescarPendientes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionProvider>();
    final captura = context.watch<CapturaProvider>();
    final usuario = sesion.usuario;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<CapturaProvider>().refrescarPendientes(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              _encabezado(sesion, usuario?.nombres ?? ''),
              const SizedBox(height: 18),
              if (captura.totalPendientes > 0) ...[
                _avisoPendientes(captura.totalPendientes),
                const SizedBox(height: 18),
              ],
              const TituloSeccion(
                'Produccion',
                detalle: 'En el orden en que ocurre el dia',
              ),
              _opcion(
                icono: Icons.assignment_outlined,
                titulo: 'Ordenes de produccion',
                detalle: 'El compromiso sobre un lote. Nace libre y espera modulo.',
                color: Paleta.morado,
                permiso: sesion.puede('Ordenes', 'VER'),
                destino: const OrdenesScreen(),
              ),
              const SizedBox(height: 10),
              _opcion(
                icono: Icons.play_circle_outline,
                titulo: 'Inicio de jornada',
                detalle: 'Modulo, operarias y lote. Sin esto no se puede capturar.',
                color: Paleta.naranja,
                permiso: sesion.puede('Jornada', 'VER'),
                destino: const JornadaScreen(),
              ),
              const SizedBox(height: 10),
              _opcion(
                icono: Icons.grid_on_outlined,
                titulo: 'Registro de produccion',
                detalle: 'La rejilla de la hora: unidades y la incidencia si la hubo.',
                color: Paleta.exito,
                permiso: sesion.puede('Captura', 'VER'),
                insignia: captura.totalPendientes > 0 ? captura.totalPendientes : null,
                destino: const CapturaScreen(),
              ),
              const SizedBox(height: 10),
              _opcion(
                icono: Icons.dashboard_outlined,
                titulo: 'Tablero por modulo',
                detalle: 'Como le fue a un modulo hoy, franja por franja.',
                color: Paleta.info,
                permiso: sesion.puede('Captura', 'VER'),
                destino: const TableroScreen(),
              ),
              const SizedBox(height: 22),
              const TituloSeccion('Planta'),
              _opcion(
                icono: Icons.inventory_2_outlined,
                titulo: 'Lotes',
                detalle: 'El producto: referencia, SAM pactado y ficha tecnica.',
                color: Paleta.amarillo,
                permiso: sesion.puede('Lotes', 'VER'),
                destino: const LotesScreen(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _encabezado(SesionProvider sesion, String nombre) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Paleta.morado,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: Text(
            sesion.usuario?.iniciales ?? '?',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                nombre.isEmpty ? 'BGoat' : 'Hola, $nombre',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              Text(
                fechaLarga(hoy()),
                style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AjustesScreen()),
          ),
          icon: const Icon(Icons.settings_outlined),
          tooltip: 'Ajustes',
        ),
        IconButton(
          onPressed: _confirmarSalida,
          icon: const Icon(Icons.logout),
          tooltip: 'Cerrar sesion',
        ),
      ],
    );
  }

  /// El recordatorio horario, que es la unica parte del sistema que interrumpe.
  ///
  /// Lo hace por una razon: el tablero de pared se llenaba porque estaba a la
  /// vista; una pantalla que hay que acordarse de abrir se queda vacia.
  Widget _avisoPendientes(int total) {
    return Tarjeta(
      borde: Paleta.alerta,
      alTocar: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const CapturaScreen()),
      ),
      hijo: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: Paleta.alerta.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.schedule, color: Paleta.alerta),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  total == 1 ? 'Falta 1 hora por registrar' : 'Faltan $total horas por registrar',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Son franjas que ya terminaron y siguen sin captura',
                  style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Paleta.textoSuave),
        ],
      ),
    );
  }

  Widget _opcion({
    required IconData icono,
    required String titulo,
    required String detalle,
    required Color color,
    required bool permiso,
    required Widget destino,
    int? insignia,
  }) {
    // Sin permiso la tarjeta se ve pero no entra: el backend la rechazaria
    // igual, y esconderla dejaria a la digitadora sin saber que existe.
    return Opacity(
      opacity: permiso ? 1 : 0.45,
      child: Tarjeta(
        alTocar: permiso
            ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => destino))
            : null,
        hijo: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icono, color: color),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          titulo,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (insignia != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: Paleta.alerta,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '$insignia',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    permiso ? detalle : 'Su rol no tiene acceso a este modulo',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Paleta.textoSuave,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              permiso ? Icons.chevron_right : Icons.lock_outline,
              color: Paleta.textoSuave,
              size: permiso ? 24 : 18,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmarSalida() async {
    final salir = await showDialog<bool>(
      context: context,
      builder: (dialogo) => AlertDialog(
        title: const Text('Cerrar sesion'),
        content: const Text('Va a salir de BGoat en este telefono.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogo, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogo, true),
            child: const Text('Salir'),
          ),
        ],
      ),
    );

    if (salir == true && mounted) {
      await context.read<SesionProvider>().salir();
    }
  }
}
