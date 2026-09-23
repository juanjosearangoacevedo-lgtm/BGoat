import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/conversiones.dart';
import '../../core/fechas.dart' as fechas;
import '../../core/tema.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/repositories/lotes_repository.dart';
import '../providers/lotes_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// El formulario del lote. Es el unico del producto: reemplaza a los de
/// Pedidos, Referencias, Fichas Tecnicas y Prendas.
///
/// El campo que manda es el SAM pactado: son los minutos que el cliente paga
/// por prenda, y de ahi sale la meta de cada hora. Sin el, el lote se guarda
/// pero ningun modulo puede abrir jornada con el.
class LoteFormScreen extends StatefulWidget {
  final LoteEntity? lote;

  const LoteFormScreen({super.key, this.lote});

  @override
  State<LoteFormScreen> createState() => _LoteFormScreenState();
}

class _LoteFormScreenState extends State<LoteFormScreen> {
  final _formulario = GlobalKey<FormState>();

  late final TextEditingController _codigo;
  late final TextEditingController _pedido;
  late final TextEditingController _codigoReferencia;
  late final TextEditingController _nombreReferencia;
  late final TextEditingController _sam;
  late final TextEditingController _material;
  late final TextEditingController _cantidad;
  late final TextEditingController _observaciones;

  int? _idCliente;
  int? _idTipoPrenda;
  String _estado = 'REGISTRADO';
  late String _fechaRecepcion;
  String? _fechaEntrega;

  bool get _editando => widget.lote != null;

  static const _estados = [
    'REGISTRADO', 'APROBADO', 'EN_PROCESO', 'FINALIZADO', 'ENTREGADO', 'INACTIVO',
  ];

  @override
  void initState() {
    super.initState();

    final lote = widget.lote;

    _codigo = TextEditingController(text: lote?.codigoLote ?? '');
    _pedido = TextEditingController(text: lote?.numeroPedido ?? '');
    _codigoReferencia = TextEditingController(text: lote?.codigoReferencia ?? '');
    _nombreReferencia = TextEditingController(text: lote?.nombreReferencia ?? '');
    _sam = TextEditingController(
      text: lote?.samPactado == null ? '' : '${lote!.samPactado}',
    );
    _material = TextEditingController(text: lote?.materialPrincipal ?? '');
    _cantidad = TextEditingController(
      text: lote?.cantidadProgramada == null ? '' : '${lote!.cantidadProgramada}',
    );
    _observaciones = TextEditingController(text: lote?.observaciones ?? '');

    _idCliente = lote?.idCliente;
    _idTipoPrenda = lote?.idTipoPrenda;
    _estado = lote?.estado ?? 'REGISTRADO';
    _fechaRecepcion = lote?.fechaRecepcion ?? fechas.hoy();
    _fechaEntrega = lote?.fechaEntregaProgramada;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LotesProvider>().cargarCatalogos();
    });
  }

  @override
  void dispose() {
    _codigo.dispose();
    _pedido.dispose();
    _codigoReferencia.dispose();
    _nombreReferencia.dispose();
    _sam.dispose();
    _material.dispose();
    _cantidad.dispose();
    _observaciones.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    if (!_formulario.currentState!.validate()) return;

    if (_idCliente == null) {
      avisar(context, 'Escoja el cliente del lote', esError: true);
      return;
    }

    final provider = context.read<LotesProvider>();

    final solicitud = SolicitudLote(
      codigoLote: _codigo.text.trim(),
      idCliente: _idCliente!,
      fechaRecepcion: _fechaRecepcion,
      numeroPedido: _texto(_pedido),
      codigoReferencia: _texto(_codigoReferencia),
      nombreReferencia: _texto(_nombreReferencia),
      idTipoPrenda: _idTipoPrenda,
      samPactado: _sam.text.trim().isEmpty
          ? null
          : double.tryParse(_sam.text.replaceAll(',', '.')),
      materialPrincipal: _texto(_material),
      cantidadProgramada: int.tryParse(_cantidad.text),
      fechaEntregaProgramada: _fechaEntrega,
      estado: _estado,
      observaciones: _texto(_observaciones),
    );

    final fallo = _editando
        ? await provider.actualizar(widget.lote!.id, solicitud)
        : await provider.crear(solicitud);

    if (!mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
    } else {
      avisar(context, fallo, esError: true);
    }
  }

  String? _texto(TextEditingController control) {
    final valor = control.text.trim();
    return valor.isEmpty ? null : valor;
  }

  Future<void> _eliminar() async {
    final lote = widget.lote;
    if (lote == null) return;

    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogo) => AlertDialog(
        title: const Text('Inactivar el lote'),
        content: Text(
          '${lote.codigoLote} pasa a INACTIVO. No se borra: conserva lo que ya '
          'se produjo con el.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogo, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Paleta.error),
            onPressed: () => Navigator.pop(dialogo, true),
            child: const Text('Inactivar'),
          ),
        ],
      ),
    );

    if (confirmado != true || !mounted) return;

    final fallo = await context.read<LotesProvider>().eliminar(lote.id);
    if (!mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
    } else {
      avisar(context, fallo, esError: true);
    }
  }

  Future<void> _escogerFecha(bool esRecepcion) async {
    final actual = esRecepcion ? _fechaRecepcion : _fechaEntrega;

    final elegida = await showDatePicker(
      context: context,
      initialDate: actual == null ? DateTime.now() : fechas.desdeTexto(actual),
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      helpText: esRecepcion ? 'Fecha de recepcion' : 'Entrega programada',
    );

    if (elegida == null) return;

    setState(() {
      if (esRecepcion) {
        _fechaRecepcion = fechas.comoTexto(elegida);
      } else {
        _fechaEntrega = fechas.comoTexto(elegida);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LotesProvider>();
    final puedeEliminar = context.read<SesionProvider>().puede('Lotes', 'ELIMINAR');

    return Scaffold(
      appBar: AppBar(
        title: Text(_editando ? 'Editar lote' : 'Nuevo lote'),
        actions: [
          if (_editando && puedeEliminar)
            IconButton(
              onPressed: _eliminar,
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Inactivar',
            ),
        ],
      ),
      body: Form(
        key: _formulario,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            const TituloSeccion('Identificacion'),
            TextFormField(
              controller: _codigo,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Codigo del lote *',
                prefixIcon: Icon(Icons.qr_code),
                hintText: 'LT-2026-001',
              ),
              validator: (valor) =>
                  (valor ?? '').trim().isEmpty ? 'El codigo es obligatorio' : null,
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<int>(
              initialValue: _idCliente,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Cliente *',
                prefixIcon: Icon(Icons.business_outlined),
              ),
              hint: const Text('Escoja el cliente'),
              items: provider.clientes
                  .map((cliente) => DropdownMenuItem(
                        value: cliente.id,
                        child: Text(cliente.nombre, overflow: TextOverflow.ellipsis),
                      ))
                  .toList(),
              onChanged: (valor) => setState(() => _idCliente = valor),
              validator: (valor) => valor == null ? 'Escoja el cliente' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _pedido,
              decoration: const InputDecoration(
                labelText: 'Numero de pedido',
                prefixIcon: Icon(Icons.receipt_long_outlined),
                helperText: 'El folio con el que llego el trabajo',
              ),
            ),
            const SizedBox(height: 22),
            const TituloSeccion('El producto'),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _codigoReferencia,
                    decoration: const InputDecoration(labelText: 'Cod. referencia'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _nombreReferencia,
                    decoration: const InputDecoration(labelText: 'Referencia'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<int>(
              initialValue: _idTipoPrenda,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Tipo de prenda',
                prefixIcon: Icon(Icons.checkroom_outlined),
              ),
              hint: const Text('Sin especificar'),
              items: provider.tiposPrenda
                  .map((tipo) => DropdownMenuItem(
                        value: aInt(tipo['id_tipo_prenda']),
                        child: Text(
                          aTexto(tipo['nombre']),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ))
                  .toList(),
              onChanged: (valor) => setState(() => _idTipoPrenda = valor),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _material,
              decoration: const InputDecoration(
                labelText: 'Material principal',
                prefixIcon: Icon(Icons.texture_outlined),
              ),
            ),
            const SizedBox(height: 22),
            const TituloSeccion(
              'Lo que se negocio',
              detalle: 'El SAM es el centro del sistema: fija la meta y sirve '
                  'para facturar.',
            ),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _sam,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'SAM pactado',
                      prefixIcon: Icon(Icons.timer_outlined),
                      helperText: 'Minutos por prenda',
                    ),
                    validator: (valor) {
                      final texto = (valor ?? '').trim();
                      if (texto.isEmpty) return null;
                      final numero = double.tryParse(texto.replaceAll(',', '.'));
                      if (numero == null || numero <= 0) return 'SAM invalido';
                      return null;
                    },
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _cantidad,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Cantidad',
                      prefixIcon: Icon(Icons.numbers),
                      helperText: 'Programada',
                    ),
                  ),
                ),
              ],
            ),
            if (_sam.text.trim().isEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Paleta.alerta.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.warning_amber_rounded, size: 17, color: Paleta.alerta),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'Sin SAM el lote se guarda, pero ningun modulo va a poder '
                        'abrir jornada con el: no hay meta que calcular.',
                        style: TextStyle(fontSize: 12, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 22),
            const TituloSeccion('Fechas y estado'),
            Row(
              children: [
                Expanded(
                  child: _campoFecha('Recepcion *', _fechaRecepcion, true),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _campoFecha('Entrega', _fechaEntrega, false),
                ),
              ],
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _estado,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Estado'),
              items: _estados
                  .map((valor) => DropdownMenuItem(
                        value: valor,
                        child: Text(valor.replaceAll('_', ' ').toLowerCase()),
                      ))
                  .toList(),
              onChanged: (valor) => setState(() => _estado = valor ?? 'REGISTRADO'),
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
            if (_editando) ...[
              const SizedBox(height: 14),
              // La foto y el PDF no se digitan: se suben con POST /lotes/:id/ficha,
              // y el backend decide a que columna van segun el tipo del archivo.
              const _NotaFicha(),
            ],
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
                  : Text(_editando ? 'Guardar cambios' : 'Crear el lote'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _campoFecha(String etiqueta, String? valor, bool esRecepcion) {
    return InkWell(
      onTap: () => _escogerFecha(esRecepcion),
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
}

class _NotaFicha extends StatelessWidget {
  const _NotaFicha();

  @override
  Widget build(BuildContext context) {
    return Tarjeta(
      hijo: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.attach_file, size: 18, color: Paleta.textoSuave),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'La ficha tecnica (la foto de la prenda y el PDF del cliente) se '
              'sube desde el panel web. La app la muestra donde haga falta: al '
              'escoger el lote y en el tablero del modulo.',
              style: TextStyle(fontSize: 11.5, color: Paleta.textoSuave, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
