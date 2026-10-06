import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../core/estimacion_fecha.dart';
import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/ordenes_repository.dart';
import '../providers/ordenes_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// El formulario de una orden de produccion.
///
/// No pide modulo: la orden nace libre y la toma el modulo que abre su
/// jornada con ella. Tampoco pide ficha tecnica, pedido, cantidad ni valor de
/// maquila --todo eso vive en el lote, y un lote corre en una sola orden, asi
/// que pedirlo otra vez aqui solo abria la puerta a que las cifras se
/// desincronizaran--. El lote elegido se muestra abajo con su SAM y su valor
/// de maquila, de solo lectura. Tampoco pide el numero de orden: lo genera
/// el backend (`OP-2026-0001`...) para que no se repita entre digitadoras.
class OrdenFormScreen extends StatefulWidget {
  final OrdenEntity? orden;

  const OrdenFormScreen({super.key, this.orden});

  @override
  State<OrdenFormScreen> createState() => _OrdenFormScreenState();
}

class _OrdenFormScreenState extends State<OrdenFormScreen> {
  final _formulario = GlobalKey<FormState>();

  late final TextEditingController _observaciones;
  late final TextEditingController _eficienciaEsperada;

  int? _idLote;

  /// Lo que hace falta para calcular "Fin estimado" sin que nadie lo
  /// digite: el horario semanal de planta, los festivos y una capacidad
  /// tipica de modulo. Mismo calculo que el panel web en
  /// `useOrdenForm.js` / `estimacionFecha.js`, para que la fecha no
  /// dependa de si la orden se crea desde el celular o desde el escritorio.
  List<PatronHorario> _patrones = [];
  Set<String> _festivos = {};
  int _capacidadTipica = 0;

  bool get _editando => widget.orden != null;

  @override
  void initState() {
    super.initState();

    final orden = widget.orden;

    _observaciones = TextEditingController(text: orden?.observaciones ?? '');
    _eficienciaEsperada = TextEditingController(
      text: orden?.eficienciaEsperada == null ? '' : decimal(orden!.eficienciaEsperada, 2),
    );

    _idLote = orden?.idLote;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdenesProvider>().cargarLotes();
    });
    _cargarDatosEstimacion();
  }

  /// Trae horario, festivos y capacidad tipica en paralelo. Si alguno
  /// falla, la estimacion de fecha simplemente no se muestra -igual que
  /// en el panel web, es preferible no mostrar nada a inventar una fecha.
  Future<void> _cargarDatosEstimacion() async {
    final api = context.read<ApiCliente>();

    try {
      final respuesta = aMapaNulo(await api.obtener('/jornada/horario')) ?? const {};
      final patrones = aListaDeMapas(respuesta['patrones']).map((patron) {
        final dias = patron['dias'] is List
            ? (patron['dias'] as List).map(aInt).toList()
            : const <int>[];
        return PatronHorario(dias: dias, minutosTotales: aInt(patron['minutos_totales']));
      }).toList();
      if (mounted) setState(() => _patrones = patrones);
    } catch (_) {
      // Sin horario no hay fecha estimada que mostrar.
    }

    try {
      final respuesta = aMapaNulo(await api.obtener('/dias-no-laborales')) ?? const {};
      final festivos = aListaDeMapas(respuesta['datos'])
          .map((fila) => aFechaNula(fila['fecha']))
          .whereType<String>()
          .toSet();
      if (mounted) setState(() => _festivos = festivos);
    } catch (_) {
      // Sin festivos la estimacion sigue corriendo, solo sin restarlos.
    }

    try {
      final respuesta = aMapaNulo(await api.obtener('/modulos')) ?? const {};
      final capacidades = aListaDeMapas(respuesta['datos'])
          .where((fila) => aTexto(fila['estado']) == 'ACTIVO')
          .map((fila) => aInt(fila['capacidad_operarios']))
          .where((valor) => valor > 0)
          .toList()
        ..sort();
      if (capacidades.isNotEmpty && mounted) {
        setState(() => _capacidadTipica = capacidades[capacidades.length ~/ 2]);
      }
    } catch (_) {
      // Sin modulos activos no hay de donde sacar una capacidad tipica.
    }
  }

  @override
  void dispose() {
    _observaciones.dispose();
    _eficienciaEsperada.dispose();
    super.dispose();
  }

  LoteEntity? _lote(List<LoteEntity> lotes) {
    for (final lote in lotes) {
      if (lote.id == _idLote) return lote;
    }
    return null;
  }

  /// Ya no se digita: es la fecha en que el lote llego a la planta.
  String? _fechaInicioProgramada(LoteEntity? lote) => lote?.fechaRecepcion;

  /// La fecha en que estaria lista la orden segun la eficiencia esperada,
  /// recorriendo dias de calendario reales. Es el valor real que se
  /// manda al guardar, no solo una vista previa.
  String? _fechaFinProgramada(LoteEntity? lote) {
    if (lote == null) return null;

    return calcularFechaEstimada(
      fechaInicioISO: _fechaInicioProgramada(lote),
      cantidad: lote.cantidadProgramada ?? 0,
      sam: lote.samPactado ?? 0,
      personas: _capacidadTipica,
      eficienciaEsperadaPct: double.tryParse(_eficienciaEsperada.text.replaceAll(',', '.')),
      patrones: _patrones,
      festivos: _festivos,
    );
  }

  Future<void> _guardar() async {
    if (!_formulario.currentState!.validate()) return;

    if (_idLote == null) {
      avisar(context, 'Escoja el lote sobre el que va la orden', esError: true);
      return;
    }

    final provider = context.read<OrdenesProvider>();
    final lote = _lote(provider.lotesDisponibles);

    final solicitud = SolicitudOrden(
      idLote: _idLote!,
      eficienciaEsperada: _eficienciaEsperada.text.trim().isEmpty
          ? null
          : double.tryParse(_eficienciaEsperada.text.replaceAll(',', '.')),
      // Igual que en el panel web: se calculan aqui y se mandan ya
      // resueltas, no se digitan en ningun campo.
      fechaInicioProgramada: _fechaInicioProgramada(lote),
      fechaFinProgramada: _fechaFinProgramada(lote),
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

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrdenesProvider>();
    final lote = _lote(provider.lotesDisponibles);
    final puedeEliminar = context.read<SesionProvider>().puede('Ordenes', 'ELIMINAR');

    return Scaffold(
      appBar: AppBar(
        title: Text(_editando ? 'Editar ${widget.orden!.numeroOrden}' : 'Nueva orden'),
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
            ] else ...[
              const SizedBox(height: 6),
              const _Nota(
                'La cantidad y el valor de maquila los trae el lote: un lote '
                'corre en una sola orden, asi que no se vuelven a digitar aqui.',
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Prioridad'),
                    child: widget.orden?.prioridad != null
                        ? Row(
                            children: [
                              PrioridadChip(widget.orden!.prioridad),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'por fecha de recepcion del lote',
                                  style: TextStyle(fontSize: 11, color: Paleta.textoSuave),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          )
                        : const Text(
                            'Se asigna sola al guardar',
                            style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
                          ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Estado'),
                    child: Row(
                      children: [
                        EstadoChip(widget.orden?.estado ?? 'PENDIENTE'),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'No se edita',
                            style: const TextStyle(fontSize: 11, color: Paleta.textoSuave),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Las fechas no se escogen ni se adivinan (`backend/src/lib/plan.js`):
            // el inicio es el dia en que un modulo abre jornada con la orden, y
            // la entrega sale de la formula de German desde ese dia, fija.
            Row(
              children: [
                Expanded(
                  child: _fechaSoloLectura(
                    'Inicio',
                    widget.orden?.fechaInicioReal,
                    vacio: 'Al iniciar jornada',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _fechaSoloLectura(
                    'Entrega',
                    widget.orden?.fechaFinProgramada,
                    vacio: 'Al iniciar jornada',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _eficienciaEsperada,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              decoration: const InputDecoration(
                labelText: 'Eficiencia esperada (%)',
                prefixIcon: Icon(Icons.insights_outlined),
                helperText: 'La define German. Sin ella no se calcula la entrega.',
              ),
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

  /// Ya no se escoge: las fechas las pone el plan de produccion.
  Widget _fechaSoloLectura(String etiqueta, String? valor, {String vacio = 'Aun no definida'}) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: etiqueta,
        prefixIcon: const Icon(Icons.event_outlined, size: 19),
      ),
      child: Text(
        valor == null ? vacio : fechas.fechaCorta(valor),
        style: TextStyle(
          color: valor == null ? Paleta.textoSuave : Paleta.texto,
          fontSize: 14,
        ),
      ),
    );
  }

  /// Lo que trae el lote: el SAM fija la meta y el valor de maquila la
  /// facturacion. Se muestra de solo lectura porque una orden no los digita,
  /// los hereda -- un lote corre en una sola orden.
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
              color: lote.tieneSam ? Paleta.primario : Paleta.error,
            ),
          ]),
          const SizedBox(height: 12),
          FilaDeDatos([
            Dato(etiqueta: 'Valor de maquila', valor: pesos(lote.valorMaquilaUnidad)),
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
