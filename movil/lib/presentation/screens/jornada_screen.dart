import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/jornada_entity.dart';
import '../providers/jornada_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/barra_fecha.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';
import 'asistente_jornada.dart';
import 'tablero_screen.dart';

/// Como esta la planta hoy: que modulos ya abrieron jornada y cuales no.
///
/// Un modulo sin jornada aparece en gris con el boton de abrirla. No es una
/// fila que falta: es informacion.
class JornadaScreen extends StatefulWidget {
  const JornadaScreen({super.key});

  @override
  State<JornadaScreen> createState() => _JornadaScreenState();
}

class _JornadaScreenState extends State<JornadaScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JornadaProvider>().cargar();
    });
  }

  Future<void> _abrirAsistente(int idModulo) async {
    final provider = context.read<JornadaProvider>();
    provider.empezar(idModulo);

    final guardada = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const AsistenteJornadaScreen()),
    );

    if (guardada == true && mounted) {
      avisar(context, 'Jornada abierta. Ya se puede registrar la produccion.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<JornadaProvider>();
    final puedeCrear = context.read<SesionProvider>().puede('Jornada', 'CREAR');

    return Scaffold(
      appBar: AppBar(title: const Text('Inicio de jornada')),
      body: Column(
        children: [
          BarraFecha(
            fecha: provider.fecha,
            alCambiar: (nueva) => provider.cargar(nuevaFecha: nueva),
          ),
          Expanded(child: _cuerpo(provider, puedeCrear)),
        ],
      ),
    );
  }

  Widget _cuerpo(JornadaProvider provider, bool puedeCrear) {
    if (provider.cargando && provider.opciones == null) {
      return const VistaCargando(mensaje: 'Leyendo el estado de la planta...');
    }

    if (provider.error != null && provider.opciones == null) {
      return VistaError(provider.error!, alReintentar: provider.cargar);
    }

    final abiertos = provider.modulosAbiertos;
    final libres = provider.modulosLibres;

    if (abiertos.isEmpty && libres.isEmpty) {
      return const VistaVacia(
        icono: Icons.factory_outlined,
        titulo: 'No hay modulos activos',
        detalle: 'Registre los modulos de la planta desde el panel web.',
      );
    }

    return RefreshIndicator(
      onRefresh: provider.cargar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          _resumenPlanta(abiertos.length, libres.length),
          const SizedBox(height: 18),
          if (abiertos.isNotEmpty) ...[
            TituloSeccion(
              'Trabajando',
              detalle: '${abiertos.length} de ${abiertos.length + libres.length} modulos',
            ),
            ...abiertos.map((modulo) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _tarjetaAbierto(modulo),
                )),
            const SizedBox(height: 12),
          ],
          if (libres.isNotEmpty) ...[
            const TituloSeccion(
              'Sin jornada',
              detalle: 'Estos modulos todavia no pueden registrar produccion',
            ),
            ...libres.map((modulo) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _tarjetaLibre(modulo, puedeCrear),
                )),
          ],
        ],
      ),
    );
  }

  Widget _resumenPlanta(int abiertos, int libres) {
    final total = abiertos + libres;

    return Tarjeta(
      hijo: Column(
        children: [
          FilaDeDatos([
            Dato(
              etiqueta: 'Trabajando',
              valor: '$abiertos',
              color: Paleta.exito,
              destacado: true,
            ),
            Dato(
              etiqueta: 'Sin abrir',
              valor: '$libres',
              color: libres > 0 ? Paleta.alerta : Paleta.textoSuave,
              destacado: true,
            ),
            Dato(etiqueta: 'Modulos', valor: '$total', destacado: true),
          ]),
          const SizedBox(height: 12),
          BarraAvance(
            valor: total == 0 ? 0 : abiertos / total,
            color: Paleta.exito,
          ),
        ],
      ),
    );
  }

  Widget _tarjetaAbierto(ModuloDelDiaEntity modulo) {
    return Tarjeta(
      alTocar: () => _verDetalle(modulo),
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _insignia(modulo.modulo.codigo, Paleta.exito),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      modulo.modulo.nombre,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    if (modulo.nombreCliente != null)
                      Text(
                        modulo.nombreCliente!,
                        style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                      ),
                  ],
                ),
              ),
              EstadoChip(modulo.estadoJornada),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 11),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(
              etiqueta: 'Lote',
              valor: modulo.codigoLote ?? '—',
              icono: Icons.inventory_2_outlined,
            ),
            Dato(
              etiqueta: 'Operarias',
              valor: '${modulo.cantidadOperarias ?? 0}',
              icono: Icons.groups_outlined,
            ),
          ]),
        ],
      ),
    );
  }

  Widget _tarjetaLibre(ModuloDelDiaEntity modulo, bool puedeCrear) {
    return Tarjeta(
      alTocar: puedeCrear ? () => _abrirAsistente(modulo.modulo.id) : null,
      hijo: Row(
        children: [
          _insignia(modulo.modulo.codigo, Paleta.textoSuave),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  modulo.modulo.nombre,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                ),
                Text(
                  '${modulo.modulo.capacidadOperarios} puestos'
                  '${modulo.modulo.ubicacion != null ? ' · ${modulo.modulo.ubicacion}' : ''}',
                  style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                ),
              ],
            ),
          ),
          if (puedeCrear)
            FilledButton.tonal(
              onPressed: () => _abrirAsistente(modulo.modulo.id),
              style: FilledButton.styleFrom(
                minimumSize: const Size(0, 38),
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
              child: const Text('Abrir'),
            )
          else
            const Icon(Icons.lock_outline, size: 18, color: Paleta.textoSuave),
        ],
      ),
    );
  }

  Widget _insignia(String codigo, Color color) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(11),
      ),
      alignment: Alignment.center,
      child: Text(
        codigo,
        style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13),
      ),
    );
  }

  /// El detalle de una jornada abierta, con la nomina y lo que se puede hacer.
  Future<void> _verDetalle(ModuloDelDiaEntity modulo) async {
    final provider = context.read<JornadaProvider>();
    final jornada = await provider.detalleDeModulo(modulo.modulo.id);

    if (!mounted || jornada == null) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.tarjeta,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (hoja) => _HojaJornada(jornada: jornada),
    );
  }
}

/// La hoja de detalle de una jornada: que corre, con quien, y que se puede
/// hacer con ella.
class _HojaJornada extends StatelessWidget {
  final JornadaEntity jornada;

  const _HojaJornada({required this.jornada});

  @override
  Widget build(BuildContext context) {
    final puedeEditar = context.read<SesionProvider>().puede('Jornada', 'EDITAR');

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.72,
      maxChildSize: 0.94,
      builder: (_, control) => ListView(
        controller: control,
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Paleta.borde,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${jornada.codigoModulo} · ${jornada.nombreModulo}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              EstadoChip(jornada.estado),
            ],
          ),
          const SizedBox(height: 18),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FilaDeDatos([
                  Dato(etiqueta: 'Cliente', valor: jornada.nombreCliente ?? '—'),
                  Dato(etiqueta: 'Lote', valor: jornada.codigoLote ?? '—'),
                ]),
                const SizedBox(height: 12),
                FilaDeDatos([
                  Dato(etiqueta: 'Referencia', valor: jornada.nombreReferencia ?? '—'),
                  Dato(etiqueta: 'SAM pactado', valor: sam(jornada.samPactado)),
                ]),
                const SizedBox(height: 12),
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Orden',
                    valor: jornada.numeroOrden ?? 'Sin orden',
                    color: jornada.sinOrden ? Paleta.alerta : null,
                  ),
                  Dato(
                    etiqueta: 'Valor maquila',
                    valor: pesos(jornada.valorMaquilaUnidad),
                  ),
                ]),
              ],
            ),
          ),
          if (jornada.sinOrden) ...[
            const SizedBox(height: 10),
            _aviso(
              'Sin orden, la facturacion del dia queda en cero. La meta si se '
              'calcula, porque sale del SAM del lote.',
            ),
          ],
          const SizedBox(height: 18),
          TituloSeccion(
            'Nomina',
            detalle: '${jornada.operariasIdentificadas} identificadas de '
                '${jornada.cantidadOperarias} puestos',
          ),
          ...jornada.puestos.map((puesto) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  radius: 15,
                  backgroundColor: puesto.esAnonima
                      ? Paleta.borde
                      : Paleta.morado.withValues(alpha: 0.13),
                  child: Text(
                    '${puesto.numero}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: puesto.esAnonima ? Paleta.textoSuave : Paleta.morado,
                    ),
                  ),
                ),
                title: Text(
                  puesto.nombreMostrado,
                  style: TextStyle(
                    fontSize: 14,
                    fontStyle: puesto.esAnonima ? FontStyle.italic : FontStyle.normal,
                    color: puesto.esAnonima ? Paleta.textoSuave : Paleta.texto,
                  ),
                ),
                subtitle: puesto.especialidad == null
                    ? null
                    : Text(puesto.especialidad!, style: const TextStyle(fontSize: 11)),
              )),
          if (jornada.observaciones != null) ...[
            const SizedBox(height: 12),
            const TituloSeccion('Observaciones'),
            Text(
              jornada.observaciones!,
              style: const TextStyle(color: Paleta.textoSuave, height: 1.45),
            ),
          ],
          const SizedBox(height: 22),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TableroScreen(idModuloInicial: jornada.idModulo),
                ),
              );
            },
            icon: const Icon(Icons.dashboard_outlined),
            label: const Text('Ver el tablero del modulo'),
          ),
          if (puedeEditar) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () async {
                final provider = context.read<JornadaProvider>();
                provider.editar(jornada);
                Navigator.pop(context);
                await Navigator.push<bool>(
                  context,
                  MaterialPageRoute(builder: (_) => const AsistenteJornadaScreen()),
                );
              },
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Corregir la jornada'),
            ),
            const SizedBox(height: 10),
            if (jornada.estaAbierta)
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: Paleta.moradoOscuro),
                onPressed: () => _cerrar(context),
                icon: const Icon(Icons.lock_outline),
                label: const Text('Cerrar la jornada'),
              )
            else
              FilledButton.icon(
                onPressed: () => _reabrir(context),
                icon: const Icon(Icons.lock_open_outlined),
                label: const Text('Reabrir la jornada'),
              ),
          ],
        ],
      ),
    );
  }

  Widget _aviso(String texto) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Paleta.alerta.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 17, color: Paleta.alerta),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              texto,
              style: const TextStyle(fontSize: 12, height: 1.4, color: Paleta.texto),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _cerrar(BuildContext context) async {
    final provider = context.read<JornadaProvider>();
    final fallo = await provider.cerrar(jornada.id);

    if (!context.mounted) return;
    Navigator.pop(context);
    avisar(
      context,
      fallo ?? 'Jornada cerrada. El modulo sale de los recordatorios.',
      esError: fallo != null,
    );
  }

  Future<void> _reabrir(BuildContext context) async {
    final provider = context.read<JornadaProvider>();
    final fallo = await provider.reabrir(jornada.id);

    if (!context.mounted) return;
    Navigator.pop(context);
    avisar(context, fallo ?? 'Jornada reabierta.', esError: fallo != null);
  }
}
