import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_cliente.dart';
import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/repositories/lotes_repository.dart';
import '../providers/lotes_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';
import 'lote_form_screen.dart';

/// Los lotes: la unica entidad del producto.
///
/// Trae el folio del pedido, la referencia, el tipo de prenda, el SAM pactado,
/// el material y su ficha tecnica. Antes eso eran cinco formularios para
/// registrar un trabajo que llega en una sola hoja.
class LotesScreen extends StatefulWidget {
  const LotesScreen({super.key});

  @override
  State<LotesScreen> createState() => _LotesScreenState();
}

class _LotesScreenState extends State<LotesScreen> {
  final _buscador = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<LotesProvider>();
      provider.cargar();
      provider.cargarCatalogos();
    });
  }

  @override
  void dispose() {
    _buscador.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LotesProvider>();
    final puedeCrear = context.read<SesionProvider>().puede('Lotes', 'CREAR');

    return Scaffold(
      appBar: AppBar(title: const Text('Lotes')),
      floatingActionButton: puedeCrear
          ? FloatingActionButton.extended(
              onPressed: () => _abrirFormulario(),
              icon: const Icon(Icons.add),
              label: const Text('Nuevo lote'),
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

  Widget _filtros(LotesProvider provider) {
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
              hintText: 'Lote, referencia, pedido, material...',
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
                  'Todos',
                  activo: provider.estado == FiltroLotes.todos,
                  alTocar: () => provider.cambiarEstado(FiltroLotes.todos),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'En proceso',
                  activo: provider.estado == 'EN_PROCESO',
                  color: Paleta.exito,
                  alTocar: () => provider.cambiarEstado('EN_PROCESO'),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'Registrados',
                  activo: provider.estado == 'REGISTRADO',
                  color: Paleta.alerta,
                  alTocar: () => provider.cambiarEstado('REGISTRADO'),
                ),
                const SizedBox(width: 7),
                _filtro(
                  'Aprobados',
                  activo: provider.estado == 'APROBADO',
                  alTocar: () => provider.cambiarEstado('APROBADO'),
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

  Widget _lista(LotesProvider provider) {
    if (provider.cargando && provider.lotes.isEmpty) {
      return const VistaCargando();
    }

    if (provider.error != null && provider.lotes.isEmpty) {
      return VistaError(provider.error!, alReintentar: provider.cargar);
    }

    if (provider.lotes.isEmpty) {
      return const VistaVacia(
        icono: Icons.inventory_2_outlined,
        titulo: 'No hay lotes con ese filtro',
        detalle: 'El lote es lo que trae el SAM pactado: sin el no se puede '
            'calcular la meta de ninguna hora.',
      );
    }

    return RefreshIndicator(
      onRefresh: provider.cargar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
        children: [
          if (provider.sinSam > 0) ...[
            _avisoSinSam(provider.sinSam),
            const SizedBox(height: 12),
          ],
          ...provider.lotes.map((lote) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _tarjeta(lote),
              )),
        ],
      ),
    );
  }

  Widget _avisoSinSam(int cuantos) {
    return Tarjeta(
      borde: Paleta.alerta,
      hijo: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Paleta.alerta),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              cuantos == 1
                  ? '1 lote no tiene SAM pactado: ningun modulo puede abrir '
                      'jornada con el.'
                  : '$cuantos lotes no tienen SAM pactado: ningun modulo puede '
                      'abrir jornada con ellos.',
              style: const TextStyle(fontSize: 12.5, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tarjeta(LoteEntity lote) {
    final api = context.read<ApiCliente>();
    final foto = api.urlDeArchivo(lote.rutaImagen);

    return Tarjeta(
      alTocar: () => _verDetalle(lote),
      borde: lote.tieneSam ? null : Paleta.alerta,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 54,
                  height: 54,
                  child: foto != null
                      ? Image.network(
                          foto,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _sinFoto(),
                        )
                      : _sinFoto(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            lote.codigoLote,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        EstadoChip(lote.estado),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      lote.nombreReferencia ?? lote.codigoReferencia ?? 'Sin referencia',
                      style: const TextStyle(fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      lote.nombreCliente ?? '—',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 11),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(
              etiqueta: 'SAM pactado',
              valor: lote.tieneSam ? sam(lote.samPactado) : 'Falta',
              color: lote.tieneSam ? Paleta.morado : Paleta.alerta,
            ),
            Dato(etiqueta: 'Programado', valor: entero(lote.cantidadProgramada)),
            Dato(
              etiqueta: 'Entrega',
              valor: fechas.fechaCorta(lote.fechaEntregaProgramada),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _sinFoto() => Container(
        color: Paleta.fondo,
        child: const Icon(Icons.checkroom_outlined, color: Paleta.borde, size: 24),
      );

  Future<void> _abrirFormulario([LoteEntity? lote]) async {
    final guardado = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => LoteFormScreen(lote: lote)),
    );

    if (guardado == true && mounted) {
      avisar(context, lote == null ? 'Lote creado.' : 'Lote actualizado.');
    }
  }

  Future<void> _verDetalle(LoteEntity lote) async {
    final detalle = await context.read<LotesProvider>().detalleTallaColor(lote.id);

    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.tarjeta,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (_) => _HojaLote(
        lote: lote,
        desglose: detalle,
        alEditar: () {
          Navigator.pop(context);
          _abrirFormulario(lote);
        },
      ),
    );
  }
}

/// El detalle de un lote, con su ficha tecnica y el desglose si lo tiene.
class _HojaLote extends StatelessWidget {
  final LoteEntity lote;
  final List<DetalleLoteEntity> desglose;
  final VoidCallback alEditar;

  const _HojaLote({
    required this.lote,
    required this.desglose,
    required this.alEditar,
  });

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiCliente>();
    final foto = api.urlDeArchivo(lote.rutaImagen);
    final pdf = api.urlDeArchivo(lote.rutaDocumentoPdf);
    final puedeEditar = context.read<SesionProvider>().puede('Lotes', 'EDITAR');

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.82,
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
          if (foto != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                foto,
                height: 190,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(height: 14),
          ],
          Row(
            children: [
              Expanded(
                child: Text(
                  lote.codigoLote,
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
                ),
              ),
              EstadoChip(lote.estado),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            '${lote.nombreCliente ?? "—"} · '
            '${lote.nombreReferencia ?? lote.codigoReferencia ?? "sin referencia"}',
            style: const TextStyle(fontSize: 13, color: Paleta.textoSuave),
          ),
          const SizedBox(height: 18),
          Tarjeta(
            borde: lote.tieneSam ? Paleta.morado : Paleta.error,
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FilaDeDatos([
                  Dato(
                    etiqueta: 'SAM pactado',
                    valor: lote.tieneSam ? sam(lote.samPactado) : 'Sin SAM',
                    color: lote.tieneSam ? Paleta.morado : Paleta.error,
                    destacado: true,
                  ),
                  Dato(
                    etiqueta: 'Programado',
                    valor: entero(lote.cantidadProgramada),
                    destacado: true,
                  ),
                  Dato(
                    etiqueta: 'Recibido',
                    valor: entero(lote.cantidadRecibida),
                    destacado: true,
                  ),
                ]),
                const SizedBox(height: 9),
                Text(
                  lote.tieneSam
                      ? 'El SAM son los minutos que el cliente paga por prenda. '
                          'De ahi sale la meta de cada hora.'
                      : 'Sin SAM no se puede abrir jornada con este lote: no hay '
                          'meta que calcular ni contra que medir al modulo.',
                  style: TextStyle(
                    fontSize: 11.5,
                    height: 1.4,
                    color: lote.tieneSam ? Paleta.textoSuave : Paleta.error,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TituloSeccion('El producto'),
                FilaDeDatos([
                  Dato(etiqueta: 'Tipo de prenda', valor: lote.nombreTipoPrenda ?? '—'),
                  Dato(etiqueta: 'Material', valor: lote.materialPrincipal ?? '—'),
                ]),
                const SizedBox(height: 12),
                FilaDeDatos([
                  Dato(etiqueta: 'Pedido', valor: lote.numeroPedido ?? '—'),
                  Dato(etiqueta: 'Referencia', valor: lote.codigoReferencia ?? '—'),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TituloSeccion('Fechas'),
                FilaDeDatos([
                  Dato(
                    etiqueta: 'Recepcion',
                    valor: fechas.fechaCorta(lote.fechaRecepcion),
                  ),
                  Dato(
                    etiqueta: 'Entrega',
                    valor: fechas.fechaCorta(lote.fechaEntregaProgramada),
                  ),
                ]),
                const SizedBox(height: 12),
                FilaDeDatos([
                  Dato(etiqueta: 'Inicio', valor: fechas.fechaCorta(lote.fechaInicio)),
                  Dato(
                    etiqueta: 'Finalizacion',
                    valor: fechas.fechaCorta(lote.fechaFinalizacion),
                  ),
                ]),
              ],
            ),
          ),
          if (desglose.isNotEmpty) ...[
            const SizedBox(height: 12),
            Tarjeta(
              hijo: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const TituloSeccion(
                    'Desglose por talla y color',
                    detalle: 'Es opcional: el negocio todavia no define si lo usa.',
                  ),
                  ...desglose.map((fila) => Padding(
                        padding: const EdgeInsets.only(bottom: 7),
                        child: Row(
                          children: [
                            if (fila.codigoHex != null) ...[
                              Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  color: _color(fila.codigoHex!),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Paleta.borde),
                                ),
                              ),
                              const SizedBox(width: 8),
                            ],
                            Expanded(
                              child: Text(
                                '${fila.nombreTalla ?? "—"} · ${fila.nombreColor ?? "—"}',
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                            Text(
                              entero(fila.cantidad),
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ],
          if (lote.observaciones != null) ...[
            const SizedBox(height: 12),
            Tarjeta(
              hijo: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const TituloSeccion('Observaciones'),
                  Text(
                    lote.observaciones!,
                    style: const TextStyle(color: Paleta.textoSuave, height: 1.45),
                  ),
                ],
              ),
            ),
          ],
          if (pdf != null) ...[
            const SizedBox(height: 14),
            Tarjeta(
              hijo: Row(
                children: [
                  const Icon(Icons.picture_as_pdf_outlined, color: Paleta.error),
                  const SizedBox(width: 11),
                  const Expanded(
                    child: Text(
                      'Ficha tecnica en PDF adjunta',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    'Se abre en el panel',
                    style: TextStyle(fontSize: 11, color: Paleta.textoSuave),
                  ),
                ],
              ),
            ),
          ],
          if (puedeEditar) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: alEditar,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Editar el lote'),
            ),
          ],
        ],
      ),
    );
  }

  Color _color(String hex) {
    final limpio = hex.replaceAll('#', '');
    final valor = int.tryParse(limpio, radix: 16);
    if (valor == null) return Paleta.borde;
    return Color(limpio.length == 6 ? 0xFF000000 + valor : valor);
  }
}
