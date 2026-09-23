import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/ordenes_repository.dart';
import '../providers/ordenes_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';
import 'orden_form_screen.dart';

/// Las ordenes de produccion.
///
/// El filtro que importa en planta es LIBRE contra TOMADA: la orden nace suelta
/// y espera en el tablero a que un modulo la tome al abrir su jornada. Quien
/// sabe que modulo se desocupa es la planta, el mismo dia, no el escritorio.
class OrdenesScreen extends StatefulWidget {
  const OrdenesScreen({super.key});

  @override
  State<OrdenesScreen> createState() => _OrdenesScreenState();
}

class _OrdenesScreenState extends State<OrdenesScreen> {
  final _buscador = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdenesProvider>().cargar();
    });
  }

  @override
  void dispose() {
    _buscador.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrdenesProvider>();
    final puedeCrear = context.read<SesionProvider>().puede('Ordenes', 'CREAR');

    return Scaffold(
      appBar: AppBar(title: const Text('Ordenes de produccion')),
      floatingActionButton: puedeCrear
          ? FloatingActionButton.extended(
              onPressed: () => _abrirFormulario(),
              icon: const Icon(Icons.add),
              label: const Text('Nueva orden'),
            )
          : null,
      body: Column(
        children: [
          _filtros(provider),
          Expanded(child: _lista(provider)),
        ],
      ),
    );
  }

  Widget _filtros(OrdenesProvider provider) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      decoration: const BoxDecoration(
        color: Paleta.tarjeta,
        border: Border(bottom: BorderSide(color: Paleta.borde)),
      ),
      child: Column(
        children: [
          TextField(
            controller: _buscador,
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Numero de orden, lote, cliente...',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: _buscador.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _buscador.clear();
                        provider.cambiarBusqueda('');
                      },
                    ),
            ),
            onSubmitted: provider.cambiarBusqueda,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filtro(
                  'Todas',
                  activo: provider.asignacion == FiltroOrdenes.todos,
                  alTocar: () => provider.cambiarAsignacion(FiltroOrdenes.todos),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'Libres (${provider.totalLibres})',
                  activo: provider.asignacion == 'LIBRE',
                  color: Paleta.naranja,
                  alTocar: () => provider.cambiarAsignacion('LIBRE'),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'Tomadas',
                  activo: provider.asignacion == 'TOMADA',
                  color: Paleta.exito,
                  alTocar: () => provider.cambiarAsignacion('TOMADA'),
                ),
                const SizedBox(width: 14),
                _filtro(
                  'En proceso',
                  activo: provider.estado == 'EN_PROCESO',
                  alTocar: () => provider.cambiarEstado(
                    provider.estado == 'EN_PROCESO' ? FiltroOrdenes.todos : 'EN_PROCESO',
                  ),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'Pendientes',
                  activo: provider.estado == 'PENDIENTE',
                  alTocar: () => provider.cambiarEstado(
                    provider.estado == 'PENDIENTE' ? FiltroOrdenes.todos : 'PENDIENTE',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filtro(
    String texto, {
    required bool activo,
    required VoidCallback alTocar,
    Color color = Paleta.morado,
  }) {
    return GestureDetector(
      onTap: alTocar,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
        decoration: BoxDecoration(
          color: activo ? color : Paleta.fondo,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: activo ? color : Paleta.borde),
        ),
        child: Text(
          texto,
          style: TextStyle(
            fontSize: 12.5,
            color: activo ? Colors.white : Paleta.texto,
            fontWeight: activo ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _lista(OrdenesProvider provider) {
    if (provider.cargando && provider.ordenes.isEmpty) {
      return const VistaCargando();
    }

    if (provider.error != null && provider.ordenes.isEmpty) {
      return VistaError(provider.error!, alReintentar: provider.cargar);
    }

    if (provider.ordenes.isEmpty) {
      return const VistaVacia(
        icono: Icons.assignment_outlined,
        titulo: 'No hay ordenes con ese filtro',
        detalle: 'La orden es el compromiso sobre un lote: de ella sale el valor '
            'de maquila con el que se factura cada prenda.',
      );
    }

    return RefreshIndicator(
      onRefresh: provider.cargar,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
        itemCount: provider.ordenes.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, indice) => _tarjeta(provider.ordenes[indice]),
      ),
    );
  }

  Widget _tarjeta(OrdenEntity orden) {
    return Tarjeta(
      alTocar: () => _verDetalle(orden),
      borde: orden.estaEnRiesgo ? Paleta.error : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      orden.numeroOrden,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${orden.nombreCliente ?? "—"} · ${orden.codigoLote ?? "—"}',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              PrioridadChip(orden.prioridad),
              const SizedBox(width: 6),
              EstadoChip(orden.estado),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: BarraAvance(
                  valor: orden.avanceNormalizado,
                  color: orden.estaEnRiesgo ? Paleta.error : Paleta.morado,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${orden.porcentajeAvance.round()}%',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 11),
          FilaDeDatos([
            Dato(
              etiqueta: 'Producidas',
              valor: '${entero(orden.unidadesProducidas)} / '
                  '${entero(orden.cantidadProgramada)}',
            ),
            Dato(
              etiqueta: 'Valor unidad',
              valor: pesos(orden.valorMaquilaUnidad),
            ),
            Dato(
              etiqueta: orden.estaLibre ? 'Modulo' : 'La tomo',
              valor: orden.codigoModulo ?? 'Libre',
              color: orden.estaLibre ? Paleta.naranja : Paleta.exito,
              icono: orden.estaLibre ? Icons.lock_open : Icons.precision_manufacturing,
            ),
          ]),
          if (orden.estaEnRiesgo) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Paleta.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.schedule, size: 14, color: Paleta.error),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      'Se paso de la fecha de entrega '
                      '(${fechas.fechaCorta(orden.fechaFinProgramada)}) y le faltan '
                      '${entero(orden.unidadesRestantes)} unidades',
                      style: const TextStyle(fontSize: 11.5, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _abrirFormulario([OrdenEntity? orden]) async {
    final guardada = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => OrdenFormScreen(orden: orden)),
    );

    if (guardada == true && mounted) {
      avisar(context, orden == null ? 'Orden creada.' : 'Orden actualizada.');
    }
  }

  Future<void> _verDetalle(OrdenEntity resumen) async {
    final provider = context.read<OrdenesProvider>();
    final orden = await provider.detalle(resumen.id) ?? resumen;

    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.tarjeta,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (_) => _HojaOrden(
        orden: orden,
        alEditar: () {
          Navigator.pop(context);
          _abrirFormulario(orden);
        },
      ),
    );
  }
}

/// El detalle de una orden, con el avance real y la comparacion de SAM.
class _HojaOrden extends StatelessWidget {
  final OrdenEntity orden;
  final VoidCallback alEditar;

  const _HojaOrden({required this.orden, required this.alEditar});

  @override
  Widget build(BuildContext context) {
    final sesion = context.read<SesionProvider>();

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.8,
      maxChildSize: 0.95,
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
                  orden.numeroOrden,
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
                ),
              ),
              EstadoChip(orden.estado),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${orden.nombreCliente ?? "—"} · ${orden.codigoLote ?? "—"} · '
            '${orden.nombreReferencia ?? "sin referencia"}',
            style: const TextStyle(fontSize: 13, color: Paleta.textoSuave),
          ),
          const SizedBox(height: 18),
          Tarjeta(
            hijo: Column(
              children: [
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Producidas',
                    valor: entero(orden.unidadesProducidas),
                    destacado: true,
                  ),
                  Dato(
                    etiqueta: 'Faltan',
                    valor: entero(orden.unidadesRestantes),
                    color: orden.unidadesRestantes > 0 ? Paleta.alerta : Paleta.exito,
                    destacado: true,
                  ),
                  Dato(
                    etiqueta: 'Avance',
                    valor: porcentaje(orden.porcentajeAvance),
                    color: Paleta.morado,
                    destacado: true,
                  ),
                ]),
                const SizedBox(height: 12),
                BarraAvance(valor: orden.avanceNormalizado, color: Paleta.morado),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TituloSeccion('Como va el trabajo'),
                FilaDeDatos([
                  Dato(etiqueta: 'Horas registradas', valor: '${orden.horasRegistradas}'),
                  Dato(
                    etiqueta: 'Eficiencia',
                    valor: porcentaje(orden.eficiencia),
                    color: Paleta.porEficiencia(orden.eficiencia, 80),
                  ),
                ]),
                const SizedBox(height: 12),
                // La comparacion que cierra el ciclo: lo que se negocio contra
                // lo que la planta gasto de verdad.
                FilaDeDatos([
                  Dato(etiqueta: 'SAM pactado', valor: sam(orden.samPactado)),
                  Dato(
                    etiqueta: 'SAM observado',
                    valor: sam(orden.samObservado),
                    color: (orden.desviacionSam ?? 0) > 0 ? Paleta.error : Paleta.exito,
                  ),
                ]),
                if (orden.desviacionSam != null) ...[
                  const SizedBox(height: 9),
                  Text(
                    orden.desviacionSam! > 0
                        ? 'Cada prenda esta costando '
                            '${decimal(orden.desviacionSam!, 3)} minutos mas de los '
                            'pactados. Esa diferencia la absorbe la empresa.'
                        : 'Cada prenda esta saliendo en menos minutos de los '
                            'pactados: hay margen para renegociar el SAM.',
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Paleta.textoSuave,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TituloSeccion('El dinero'),
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Valor por prenda',
                    valor: pesos(orden.valorMaquilaUnidad),
                  ),
                  Dato(
                    etiqueta: 'Tarifa minuto pactada',
                    valor: pesos(orden.tarifaMinutoPactada),
                  ),
                  Dato(
                    etiqueta: 'Tarifa minuto real',
                    valor: pesos(orden.tarifaMinutoReal),
                    color: Paleta.morado,
                  ),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TituloSeccion('Fechas y asignacion'),
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Emitida',
                    valor: fechas.fechaCorta(orden.fechaEmision),
                  ),
                  Dato(
                    etiqueta: 'Entrega',
                    valor: fechas.fechaCorta(orden.fechaFinProgramada),
                    color: orden.estaEnRiesgo ? Paleta.error : null,
                  ),
                ]),
                const SizedBox(height: 12),
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Asignacion',
                    valor: orden.estaLibre ? 'Libre' : 'Tomada',
                    color: orden.estaLibre ? Paleta.naranja : Paleta.exito,
                  ),
                  Dato(
                    etiqueta: 'Modulo',
                    valor: orden.codigoModulo ?? 'Ninguno todavia',
                  ),
                ]),
                if (orden.estaLibre) ...[
                  const SizedBox(height: 10),
                  const Text(
                    'Esta orden esta esperando. La toma el modulo que abra su '
                    'jornada con ella, y desde ese momento ningun otro puede '
                    'cogerla.',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: Paleta.textoSuave,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (orden.observaciones != null) ...[
            const SizedBox(height: 12),
            Tarjeta(
              hijo: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const TituloSeccion('Observaciones'),
                  Text(
                    orden.observaciones!,
                    style: const TextStyle(color: Paleta.textoSuave, height: 1.45),
                  ),
                ],
              ),
            ),
          ],
          if (sesion.puede('Ordenes', 'EDITAR')) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: alEditar,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Editar la orden'),
            ),
          ],
        ],
      ),
    );
  }
}
