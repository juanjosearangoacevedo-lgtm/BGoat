import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/ordenes_repository.dart';
import '../providers/ordenes_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// El formulario de una orden de produccion.
///
/// No pide modulo: la orden nace libre y la toma el modulo que abre su jornada
/// con ella. Tampoco pide ficha tecnica ni pedido --eso vive en el lote--. Lo
/// unico que aporta al calculo de la hora es el valor de maquila.
class OrdenFormScreen extends StatefulWidget {
  final OrdenEntity? orden;

  const OrdenFormScreen({super.key, this.orden});

  @override
  State<OrdenFormScreen> createState() => _OrdenFormScreenState();
}

class _OrdenFormScreenState extends State<OrdenFormScreen> {
  final _formulario = GlobalKey<FormState>();

  late final TextEditingController _numero;
  late final TextEditingController _cantidad;
  late final TextEditingController _valor;
  late final TextEditingController _observaciones;

  int? _idLote;
  String _prioridad = 'MEDIA';
  String _estado = 'PENDIENTE';
  String? _fechaInicio;
  String? _fechaFin;

  bool get _editando => widget.orden != null;

  static const _prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
  static const _estados = ['PENDIENTE', 'EN_PROCESO', 'PAUSADA', 'FINALIZADA', 'CANCELADA'];

  @override
  void initState() {
    super.initState();

    final orden = widget.orden;

    _numero = TextEditingController(text: orden?.numeroOrden ?? '');
    _cantidad = TextEditingController(
      text: orden == null ? '' : '${orden.cantidadProgramada}',
    );
    _valor = TextEditingController(
      text: orden?.valorMaquilaUnidad == null
          ? ''
          : orden!.valorMaquilaUnidad!.toStringAsFixed(0),
    );
    _observaciones = TextEditingController(text: orden?.observaciones ?? '');

    _idLote = orden?.idLote;
    _prioridad = orden?.prioridad ?? 'MEDIA';
    _estado = orden?.estado ?? 'PENDIENTE';
    _fechaInicio = orden?.fechaInicioProgramada;
    _fechaFin = orden?.fechaFinProgramada;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdenesProvider>().cargarLotes();
    });
  }

  @override
  void dispose() {
    _numero.dispose();
    _cantidad.dispose();
    _valor.dispose();
    _observaciones.dispose();
    super.dispose();
  }

  LoteEntity? _lote(List<LoteEntity> lotes) {
    for (final lote in lotes) {
      if (lote.id == _idLote) return lote;
    }
    return null;
  }

  Future<void> _guardar() async {
    if (!_formulario.currentState!.validate()) return;

    if (_idLote == null) {
      avisar(context, 'Escoja el lote sobre el que va la orden', esError: true);
      return;
    }

    final provider = context.read<OrdenesProvider>();

    final solicitud = SolicitudOrden(
      numeroOrden: _numero.text.trim(),
      idLote: _idLote!,
      cantidadProgramada: int.parse(_cantidad.text),
      valorMaquilaUnidad: _valor.text.trim().isEmpty ? null : double.parse(_valor.text),
      prioridad: _prioridad,
      estado: _estado,
      fechaInicioProgramada: _fechaInicio,
      fechaFinProgramada: _fechaFin,
      observaciones:
          _observaciones.text.trim().isEmpty ? null : _observaciones.text.trim(),
    );

    final fallo = _editando
        ? await provider.actualizar(widget.orden!.id, solicitud)
        : await provider.crear(solicitud);

    if (!mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
    } else {
      avisar(context, fallo, esError: true);
    }
  }

  Future<void> _eliminar() async {
    final orden = widget.orden;
    if (orden == null) return;

    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogo) => AlertDialog(
        title: const Text('Eliminar la orden'),
        content: Text(
          'Se va a eliminar ${orden.numeroOrden}.\n\n'
          'Si ya tiene produccion registrada o jornadas configuradas, el sistema '
          'no la deja borrar: en ese caso hay que cancelarla.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogo, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Paleta.error),
            onPressed: () => Navigator.pop(dialogo, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmado != true || !mounted) return;

    final fallo = await context.read<OrdenesProvider>().eliminar(orden.id);
    if (!mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
    } else {
      avisar(context, fallo, esError: true);
    }
  }

  Future<void> _escogerFecha(bool esInicio) async {
    final actual = esInicio ? _fechaInicio : _fechaFin;

    final elegida = await showDatePicker(
      context: context,
      initialDate: actual == null ? DateTime.now() : fechas.desdeTexto(actual),
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      helpText: esInicio ? 'Inicio programado' : 'Entrega programada',
    );

    if (elegida == null) return;

    setState(() {
      if (esInicio) {
        _fechaInicio = fechas.comoTexto(elegida);
      } else {
        _fechaFin = fechas.comoTexto(elegida);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrdenesProvider>();
    final lote = _lote(provider.lotesDisponibles);
    final puedeEliminar = context.read<SesionProvider>().puede('Ordenes', 'ELIMINAR');

    return Scaffold(
      appBar: AppBar(
        title: Text(_editando ? 'Editar orden' : 'Nueva orden'),
        actions: [
          if (_editando && puedeEliminar)
            IconButton(
              onPressed: _eliminar,
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Eliminar',
            ),
        ],
      ),
      body: Form(
        key: _formulario,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            TextFormField(
              controller: _numero,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Numero de orden *',
                prefixIcon: Icon(Icons.tag),
                hintText: 'OP-2026-001',
              ),
              validator: (valor) =>
                  (valor ?? '').trim().isEmpty ? 'El numero es obligatorio' : null,
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<int>(
              initialValue: _idLote,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Lote *',
                prefixIcon: Icon(Icons.inventory_2_outlined),
              ),
              hint: const Text('Escoja el lote'),
              items: provider.lotesDisponibles
                  .map((lote) => DropdownMenuItem(
                        value: lote.id,
                        child: Text(
                          '${lote.codigoLote} · ${lote.nombreCliente ?? ""}',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ))
                  .toList(),
              onChanged: (valor) => setState(() => _idLote = valor),
              validator: (valor) => valor == null ? 'Escoja el lote' : null,
            ),
            if (lote != null) ...[
              const SizedBox(height: 12),
              _resumenLote(lote),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cantidad,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Cantidad *',
                      prefixIcon: Icon(Icons.numbers),
                    ),
                    validator: (valor) {
                      final numero = int.tryParse(valor ?? '');
                      if (numero == null || numero <= 0) return 'Cantidad invalida';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _valor,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Valor maquila',
                      prefixIcon: Icon(Icons.payments_outlined),
                      helperText: 'Por prenda',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const _Nota(
              'El valor de maquila es lo que el cliente paga por prenda. Con el, '
              'cada hora se lee tambien en pesos. Sin el, la facturacion del '
              'modulo queda en cero.',
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _prioridad,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Prioridad'),
                    items: _prioridades
                        .map((valor) => DropdownMenuItem(
                              value: valor,
                              child: Text(valor[0] + valor.substring(1).toLowerCase()),
                            ))
                        .toList(),
                    onChanged: (valor) => setState(() => _prioridad = valor ?? 'MEDIA'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _estado,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Estado'),
                    items: _estados
                        .map((valor) => DropdownMenuItem(
                              value: valor,
                              child: Text(
                                valor.replaceAll('_', ' ').toLowerCase(),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ))
                        .toList(),
                    onChanged: (valor) => setState(() => _estado = valor ?? 'PENDIENTE'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(child: _campoFecha('Inicio programado', _fechaInicio, true)),
                const SizedBox(width: 10),
                Expanded(child: _campoFecha('Entrega programada', _fechaFin, false)),
              ],
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _observaciones,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Observaciones',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: provider.guardando ? null : _guardar,
              child: provider.guardando
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Colors.white,
                      ),
                    )
                  : Text(_editando ? 'Guardar cambios' : 'Crear la orden'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _campoFecha(String etiqueta, String? valor, bool esInicio) {
    return InkWell(
      onTap: () => _escogerFecha(esInicio),
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: etiqueta,
          prefixIcon: const Icon(Icons.event_outlined, size: 19),
        ),
        child: Text(
          valor == null ? 'Sin fecha' : fechas.fechaCorta(valor),
          style: TextStyle(
            color: valor == null ? Paleta.textoSuave : Paleta.texto,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  /// El lote trae el SAM, que es lo que fija la meta. Se muestra aqui porque
  /// una orden sobre un lote sin SAM no se va a poder trabajar.
  Widget _resumenLote(LoteEntity lote) {
    return Tarjeta(
      borde: lote.tieneSam ? null : Paleta.error,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilaDeDatos([
            Dato(etiqueta: 'Cliente', valor: lote.nombreCliente ?? '—'),
            Dato(
              etiqueta: 'SAM pactado',
              valor: lote.tieneSam ? sam(lote.samPactado) : 'Sin SAM',
              color: lote.tieneSam ? Paleta.morado : Paleta.error,
            ),
            Dato(etiqueta: 'Programado', valor: entero(lote.cantidadProgramada)),
          ]),
          if (!lote.tieneSam) ...[
            const SizedBox(height: 9),
            const Text(
              'Este lote no tiene SAM pactado. La orden se puede crear, pero '
              'ningun modulo va a poder abrir jornada con el hasta que se le '
              'ponga el SAM.',
              style: TextStyle(fontSize: 11.5, color: Paleta.error, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }
}

class _Nota extends StatelessWidget {
  final String texto;

  const _Nota(this.texto);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.info_outline, size: 15, color: Paleta.textoSuave),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            texto,
            style: const TextStyle(fontSize: 11.5, color: Paleta.textoSuave, height: 1.4),
          ),
        ),
      ],
    );
  }
}
