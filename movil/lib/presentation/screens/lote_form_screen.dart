import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/conversiones.dart';
import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
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
  late final TextEditingController _valorMaquila;
  late final TextEditingController _observaciones;

  int? _idCliente;
  int? _idTipoPrenda;
  late String _fechaRecepcion;

  bool get _editando => widget.lote != null;

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
    _valorMaquila = TextEditingController(
      text: lote?.valorMaquilaUnidad == null ? '' : '${lote!.valorMaquilaUnidad}',
    );
    _observaciones = TextEditingController(text: lote?.observaciones ?? '');

    _idCliente = lote?.idCliente;
    _idTipoPrenda = lote?.idTipoPrenda;
    _fechaRecepcion = lote?.fechaRecepcion ?? fechas.hoy();

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
    _valorMaquila.dispose();
    _observaciones.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    if (!_formulario.currentState!.validate()) return;

    if (_idCliente == null) {
      avisar(context, 'Escoja el cliente del lote', esError: true);
      return;
    }

    // El codigo de lote ya no es obligatorio por si solo: con codigo de
    // referencia o nombre de referencia alcanza para identificar el lote.
    final sinIdentificacion = _codigo.text.trim().isEmpty &&
        _codigoReferencia.text.trim().isEmpty &&
        _nombreReferencia.text.trim().isEmpty;
    if (sinIdentificacion) {
      avisar(
        context,
        'Escriba al menos el codigo de lote, el codigo de referencia o el nombre de la referencia',
        esError: true,
      );
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
      valorMaquilaUnidad: double.tryParse(_valorMaquila.text.replaceAll(',', '.')),
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
          '${lote.codigoLote} deja de ofrecerse. No se borra: conserva lo que ya '
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

  Future<void> _abrirCalculadoraSam() async {
    final resultado = await showModalBottomSheet<({double sam, double precio})>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.tarjeta,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (_) => _CalculadoraSamHoja(precioInicial: _valorMaquila.text),
    );

    if (resultado == null || !mounted) return;
    setState(() {
      _sam.text = decimal(resultado.sam, 2);
      // El precio con el que se calculo el SAM ES el valor de maquila: si
      // se cambio dentro de la calculadora para probar un escenario, el
      // formulario tiene que quedar con ese mismo numero.
      _valorMaquila.text = decimal(resultado.precio, 2);
    });
  }

  /// La unica fecha que se escoge a mano: cuando llego la mercancia. La
  /// entrega ya no se pide aqui -se calcula sola en el panel web, cuando
  /// se crea una orden de produccion para este lote.
  Future<void> _escogerFechaRecepcion() async {
    final elegida = await showDatePicker(
      context: context,
      initialDate: fechas.desdeTexto(_fechaRecepcion),
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      helpText: 'Fecha de recepcion',
    );

    if (elegida == null) return;

    setState(() => _fechaRecepcion = fechas.comoTexto(elegida));
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
                labelText: 'Codigo del lote',
                prefixIcon: Icon(Icons.qr_code),
                hintText: 'LT-2026-001',
                helperText: 'Si lo deja vacio pero hay referencia, se genera uno solo.',
              ),
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
            const SizedBox(height: 22),
            const TituloSeccion(
              'Lo que se negocio',
              detalle: 'El SAM fija la meta y el valor de maquila la '
                  'facturacion: los dos vienen de la ficha del cliente.',
            ),
            Row(
              children: [
                Expanded(
                  // Tampoco se digita: sale del precio pactado en la
                  // calculadora (documento de German), junto con la maquila.
                  child: TextFormField(
                    controller: _sam,
                    readOnly: true,
                    onTap: _abrirCalculadoraSam,
                    decoration: InputDecoration(
                      labelText: 'SAM (acuerdo)',
                      prefixIcon: const Icon(Icons.timer_outlined),
                      helperText: 'Sale de la calculadora',
                      filled: true,
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calculate_outlined, color: Paleta.primario),
                        tooltip: 'Calcular desde el precio',
                        onPressed: _abrirCalculadoraSam,
                      ),
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
                  // No se digita: es el "precio pactado" que se escribe en la
                  // calculadora del SAM, que llena los dos campos a la vez.
                  // Asi el SAM y el precio no pueden quedar desincronizados.
                  child: TextFormField(
                    controller: _valorMaquila,
                    readOnly: true,
                    onTap: _abrirCalculadoraSam,
                    decoration: const InputDecoration(
                      labelText: 'Valor de maquila *',
                      prefixIcon: Icon(Icons.payments_outlined),
                      helperText: 'Sale de la calculadora',
                      filled: true,
                    ),
                    validator: (valor) {
                      final texto = (valor ?? '').trim();
                      if (texto.isEmpty) return 'Use la calculadora del SAM';
                      final numero = double.tryParse(texto.replaceAll(',', '.'));
                      if (numero == null || numero <= 0) return 'Valor invalido';
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _CantidadRecibidaInfo(cantidad: widget.lote?.cantidadRecibida),
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
            const TituloSeccion('Fechas'),
            Row(
              children: [
                Expanded(child: _campoFechaRecepcion()),
                const SizedBox(width: 10),
                Expanded(child: _campoEntregaSoloLectura()),
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

  Widget _campoFechaRecepcion() {
    return InkWell(
      onTap: _escogerFechaRecepcion,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Recepcion *',
          prefixIcon: Icon(Icons.event_outlined, size: 19),
        ),
        child: Text(fechas.fechaCorta(_fechaRecepcion), style: const TextStyle(fontSize: 14)),
      ),
    );
  }

  /// Ya no se escoge: se calcula sola cuando se crea una orden de produccion
  /// para este lote (SAM + eficiencia esperada + dias no laborales).
  Widget _campoEntregaSoloLectura() {
    final valor = widget.lote?.fechaEntregaProgramada;
    return InputDecorator(
      decoration: const InputDecoration(
        labelText: 'Entrega',
        prefixIcon: Icon(Icons.event_available_outlined, size: 19),
      ),
      child: Text(
        valor == null ? 'Aun no definida' : fechas.fechaCorta(valor),
        style: TextStyle(
          color: valor == null ? Paleta.textoSuave : Paleta.texto,
          fontSize: 14,
        ),
      ),
    );
  }
}

/// Como Gods Eyes SAS determina el SAM a partir del precio pactado con el
/// cliente (documento "Proyecto SENA-GODS EYES Septiembre 2026.xlsx"): se
/// descuenta la retefuente, el precio neto se convierte a minutos con el
/// valor del minuto de la empresa, y se le resta lo que ya toma terminacion
/// y empaque -- lo que queda es el SAM del modulo de confeccion.
///
/// Las dos constantes de la empresa quedan fijas aqui por ahora; si German
/// necesita ajustarlas seguido, se vuelven un parametro editable aparte.
class _CalculadoraSamHoja extends StatefulWidget {
  final String precioInicial;

  const _CalculadoraSamHoja({required this.precioInicial});

  @override
  State<_CalculadoraSamHoja> createState() => _CalculadoraSamHojaState();
}

class _CalculadoraSamHojaState extends State<_CalculadoraSamHoja> {
  static const _retefuentePct = 0.07;
  static const _valorMinutoEmpresa = 660.0;
  static const _minutosTerminacionEmpaque = 1.23;

  late final TextEditingController _precio;

  @override
  void initState() {
    super.initState();
    _precio = TextEditingController(text: widget.precioInicial);
  }

  @override
  void dispose() {
    _precio.dispose();
    super.dispose();
  }

  double get _precioN => double.tryParse(_precio.text.replaceAll(',', '.')) ?? 0;
  double get _retefuente => _precioN * _retefuentePct;
  double get _precioReal => _precioN - _retefuente;
  double get _minutosReales => _precioReal / _valorMinutoEmpresa;
  double get _samSugerido =>
      (_minutosReales - _minutosTerminacionEmpaque).clamp(0, double.infinity);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
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
            const SizedBox(height: 14),
            const Text(
              'SAM: acuerdo con el cliente',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 3),
            const Text(
              'El SAM sale del precio pactado, no se inventa aparte.',
              style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _precio,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              decoration: const InputDecoration(
                labelText: 'Precio pactado con el cliente',
                prefixIcon: Icon(Icons.payments_outlined),
                helperText: 'Pesos por unidad',
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Paleta.fondo,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Column(
                children: [
                  _filaCalculo('Retefuente (7%)', '− ${pesos(_retefuente)}'),
                  _filaCalculo('Precio real', pesos(_precioReal)),
                  _filaCalculo(
                    "÷ Valor minuto God's Eyes (${pesos(_valorMinutoEmpresa)})",
                    '${_minutosReales.toStringAsFixed(2)} min',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 6),
                    child: Divider(height: 1),
                  ),
                  _filaCalculo(
                    '− Terminacion y empaque',
                    '${_minutosTerminacionEmpaque.toStringAsFixed(2)} min',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF3DE),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF97C459), width: 2),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SAM sugerido',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF27500A),
                        ),
                      ),
                      Text(
                        'calculado del precio pactado',
                        style: TextStyle(fontSize: 10, color: Color(0xFF3B6D11)),
                      ),
                    ],
                  ),
                  Text(
                    '${_samSugerido.toStringAsFixed(2)} min',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF173404),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: _precioN > 0
                        ? () => Navigator.pop(context, (sam: _samSugerido, precio: _precioN))
                        : null,
                    child: const Text('Usar este SAM'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _filaCalculo(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              etiqueta,
              style: const TextStyle(fontSize: 12.5, color: Paleta.textoSuave),
            ),
          ),
          Text(
            valor,
            style: const TextStyle(
              fontSize: 12.5,
              color: Paleta.textoSuave,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// La cantidad recibida no se digita: es la suma del desglose por talla y
/// color (lo que llego es exactamente lo que se desgloso), que se arma desde
/// el panel web con "Agregar fila". Aqui solo se muestra de solo lectura,
/// igual que la ficha tecnica.
class _CantidadRecibidaInfo extends StatelessWidget {
  final int? cantidad;

  const _CantidadRecibidaInfo({required this.cantidad});

  @override
  Widget build(BuildContext context) {
    return Tarjeta(
      hijo: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.numbers, size: 18, color: Paleta.textoSuave),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cantidad == null || cantidad == 0
                      ? 'Cantidad recibida: sin definir'
                      : 'Cantidad recibida: $cantidad prendas',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Se arma desde el panel web agregando filas de talla, color y '
                  'cantidad (las tres obligatorias): es la suma de esas filas, no un '
                  'numero que se digite aqui. Sin eso, ningun modulo va a poder abrir '
                  'jornada con este lote.',
                  style: TextStyle(fontSize: 11.5, color: Paleta.textoSuave, height: 1.4),
                ),
              ],
            ),
          ),
        ],
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
