import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/catalogo_entity.dart';
import '../../domain/entities/franja_entity.dart';
import '../../domain/entities/registro_entity.dart';
import '../providers/captura_provider.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// La captura de una hora: el formulario que reemplaza al tablero de pared.
///
/// Solo se digitan tres numeros --personas, producidas y defectuosas-- porque
/// el SAM y la tarifa salen del lote y de la orden que la jornada declaro. La
/// meta y la eficiencia se calculan a la vista mientras se escribe, para que la
/// digitadora vea si va a hacer falta la incidencia antes de darle a guardar.
class CeldaCapturaHoja extends StatefulWidget {
  final ModuloCapturaEntity modulo;
  final FranjaEntity franja;
  final RegistroEntity? celda;
  final String fecha;

  const CeldaCapturaHoja({
    super.key,
    required this.modulo,
    required this.franja,
    required this.celda,
    required this.fecha,
  });

  @override
  State<CeldaCapturaHoja> createState() => _CeldaCapturaHojaState();
}

class _CeldaCapturaHojaState extends State<CeldaCapturaHoja> {
  late final TextEditingController _personas;
  late final TextEditingController _producidas;
  late final TextEditingController _defectuosas;
  late final TextEditingController _nota;

  int? _idCausa;

  /// Los minutos perdidos, abiertos por causa. Es reemplazo y no suma: lo que
  /// quede en esta lista es lo que queda guardado.
  final Map<int, int> _perdidas = {};

  /// Se enciende cuando el backend rechaza el guardado por falta de incidencia.
  bool _resaltarIncidencia = false;

  @override
  void initState() {
    super.initState();

    final celda = widget.celda;

    _personas = TextEditingController(
      text: '${celda?.personasPresentes ?? widget.modulo.personasSugeridas}',
    );
    _producidas = TextEditingController(
      text: celda == null ? '' : '${celda.unidadesProducidas}',
    );
    _defectuosas = TextEditingController(
      text: celda == null || celda.unidadesDefectuosas == 0
          ? ''
          : '${celda.unidadesDefectuosas}',
    );
    _nota = TextEditingController(text: celda?.nota ?? '');
    _idCausa = celda?.idCausa;

    for (final linea in celda?.detallePerdidas ?? const <MinutosPerdidosEntity>[]) {
      _perdidas[linea.idCausa] = linea.minutos;
    }
  }

  @override
  void dispose() {
    _personas.dispose();
    _producidas.dispose();
    _defectuosas.dispose();
    _nota.dispose();
    super.dispose();
  }

  // --- Calculos en vivo -------------------------------------------------

  int get _personasN => int.tryParse(_personas.text) ?? 0;
  int get _producidasN => int.tryParse(_producidas.text) ?? 0;
  int get _defectuosasN => int.tryParse(_defectuosas.text) ?? 0;

  double get _sam => widget.modulo.samSugerido ?? widget.modulo.jornada?.samPactado ?? 0;

  double get _precio =>
      widget.modulo.precioSugerido ?? widget.modulo.jornada?.valorMaquilaUnidad ?? 0;

  double get _umbral => widget.modulo.modulo.umbralCumplimiento;

  /// La misma formula del backend: minutos-persona sobre el SAM, con el ancho
  /// REAL de la franja. Con un 60 fijo, la franja de 40 pedia causa aunque el
  /// modulo fuera bien.
  double get _meta {
    if (_sam <= 0 || _personasN <= 0) return 0;
    return (_personasN * widget.franja.minutos) / _sam;
  }

  double get _eficiencia => _meta <= 0 ? 0 : (_producidasN * 100) / _meta;

  bool get _bajoUmbral => _meta > 0 && _producidasN > 0 && _eficiencia < _umbral;

  int get _minutosPerdidos =>
      _perdidas.values.fold(0, (total, minutos) => total + minutos);

  /// La causa que se va a mandar. Si ya explico con minutos donde se fue el
  /// tiempo, se toma la que mas peso: es lo mismo que hace el backend, y asi
  /// no se le pregunta dos veces.
  int? get _causaEfectiva {
    if (_idCausa != null) return _idCausa;
    if (_perdidas.isEmpty) return null;

    var mayor = _perdidas.entries.first;
    for (final linea in _perdidas.entries) {
      if (linea.value > mayor.value) mayor = linea;
    }
    return mayor.key;
  }

  CausaEntity? _causa(int? id) {
    if (id == null) return null;
    for (final causa in context.read<CapturaProvider>().causas) {
      if (causa.id == id) return causa;
    }
    return null;
  }

  // --- Guardado ---------------------------------------------------------

  Future<void> _guardar() async {
    if (_producidas.text.trim().isEmpty) {
      avisar(context, 'Escriba cuantas unidades salieron en esa hora', esError: true);
      return;
    }

    if (_defectuosasN > _producidasN) {
      avisar(context, 'Las defectuosas no pueden superar las producidas', esError: true);
      return;
    }

    if (_minutosPerdidos > widget.franja.minutos) {
      avisar(
        context,
        'Los minutos perdidos ($_minutosPerdidos) superan los '
        '${widget.franja.minutos} de la hora',
        esError: true,
      );
      return;
    }

    final provider = context.read<CapturaProvider>();

    final resultado = await provider.guardar(SolicitudCaptura(
      idModulo: widget.modulo.modulo.id,
      fecha: widget.fecha,
      horaJornada: widget.franja.orden,
      personasPresentes: _personasN,
      unidadesProducidas: _producidasN,
      unidadesDefectuosas: _defectuosasN,
      idCausa: _idCausa,
      nota: _nota.text.trim().isEmpty ? null : _nota.text.trim(),
      minutosPerdidos: _perdidas.entries
          .map((linea) => MinutosPerdidosEntity(idCausa: linea.key, minutos: linea.value))
          .toList(),
    ));

    if (!mounted) return;

    if (resultado.guardado) {
      Navigator.pop(context, true);
      return;
    }

    // El rechazo por falta de incidencia no es un error: es una pregunta. En
    // vez de un mensaje rojo y ya, se abre el selector y se explica.
    if (resultado.pideCausa || resultado.pideNota) {
      setState(() => _resaltarIncidencia = true);
    }

    avisar(context, resultado.mensaje ?? 'No se pudo guardar', esError: true);
  }

  Future<void> _anular() async {
    final registro = widget.celda;
    if (registro == null) return;

    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogo) => AlertDialog(
        title: const Text('Anular el registro'),
        content: Text(
          'La hora ${widget.franja.orden} queda sin captura. No se borra: '
          'queda el rastro por trazabilidad.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogo, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Paleta.error),
            onPressed: () => Navigator.pop(dialogo, true),
            child: const Text('Anular'),
          ),
        ],
      ),
    );

    if (confirmado != true || !mounted) return;

    final fallo = await context.read<CapturaProvider>().anular(registro.id);
    if (!mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
    } else {
      avisar(context, fallo, esError: true);
    }
  }

  // --- Vista ------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CapturaProvider>();

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.9,
      maxChildSize: 0.96,
      builder: (_, control) => Column(
        children: [
          Expanded(
            child: ListView(
              controller: control,
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
              children: [
                _agarradera(),
                const SizedBox(height: 14),
                _encabezado(),
                const SizedBox(height: 18),
                _numeros(),
                const SizedBox(height: 14),
                _previaMeta(),
                const SizedBox(height: 20),
                _incidencia(provider.causas),
                const SizedBox(height: 18),
                _minutosPerdidosSeccion(provider.causas),
                if (widget.celda != null) ...[
                  const SizedBox(height: 22),
                  TextButton.icon(
                    onPressed: _anular,
                    style: TextButton.styleFrom(foregroundColor: Paleta.error),
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Anular este registro'),
                  ),
                ],
              ],
            ),
          ),
          _pie(provider),
        ],
      ),
    );
  }

  Widget _agarradera() => Center(
        child: Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Paleta.borde,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      );

  Widget _encabezado() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hora ${widget.franja.orden} · '
                '${fechas.rangoHorario(widget.franja.horaInicio, widget.franja.horaFin)}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 3),
              Text(
                '${widget.modulo.modulo.codigo} · '
                '${widget.modulo.jornada?.codigoLote ?? "sin lote"} · '
                '${widget.franja.minutos} minutos',
                style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
              ),
            ],
          ),
        ),
        if (widget.celda != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Paleta.info.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Corrigiendo',
              style: TextStyle(
                fontSize: 11,
                color: Paleta.info,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    );
  }

  Widget _numeros() {
    return Row(
      children: [
        Expanded(
          child: _campo(
            control: _personas,
            etiqueta: 'Operarias',
            icono: Icons.groups_outlined,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _campo(
            control: _producidas,
            etiqueta: 'Producidas',
            icono: Icons.checkroom_outlined,
            destacado: true,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _campo(
            control: _defectuosas,
            etiqueta: 'Defectuosas',
            icono: Icons.report_outlined,
          ),
        ),
      ],
    );
  }

  Widget _campo({
    required TextEditingController control,
    required String etiqueta,
    required IconData icono,
    bool destacado = false,
  }) {
    return TextField(
      controller: control,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: destacado ? 26 : 20,
        fontWeight: FontWeight.w800,
        color: destacado ? Paleta.morado : Paleta.texto,
      ),
      decoration: InputDecoration(
        labelText: etiqueta,
        prefixIcon: Icon(icono, size: 18),
        hintText: '0',
      ),
      // Recalcula la meta mientras se escribe: la digitadora ve si va a hacer
      // falta la incidencia antes de intentar guardar.
      onChanged: (_) => setState(() {}),
    );
  }

  /// La meta de esa hora y como va contra ella. Es la cuenta que la empresa
  /// hace a mano 200 veces al dia.
  Widget _previaMeta() {
    if (_sam <= 0) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Paleta.error.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          children: [
            Icon(Icons.error_outline, size: 17, color: Paleta.error),
            SizedBox(width: 9),
            Expanded(
              child: Text(
                'La jornada de este modulo no tiene SAM: sin el no hay meta que '
                'calcular.',
                style: TextStyle(fontSize: 12, height: 1.4),
              ),
            ),
          ],
        ),
      );
    }

    final color = Paleta.porEficiencia(_producidasN == 0 ? null : _eficiencia, _umbral);

    return Tarjeta(
      borde: _bajoUmbral ? Paleta.alerta : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilaDeDatos([
            Dato(
              etiqueta: 'Meta de la hora',
              valor: decimal(_meta, 1),
              destacado: true,
            ),
            Dato(
              etiqueta: 'Eficiencia',
              valor: _producidasN == 0 ? '—' : porcentaje(_eficiencia),
              color: color,
              destacado: true,
            ),
            Dato(
              etiqueta: 'Facturacion',
              valor: _precio > 0 ? pesos(_producidasN * _precio) : '—',
              color: Paleta.exito,
              destacado: true,
            ),
          ]),
          const SizedBox(height: 11),
          BarraAvance(
            valor: _meta <= 0 ? 0 : _producidasN / _meta,
            color: color,
          ),
          if (_bajoUmbral) ...[
            const SizedBox(height: 11),
            Row(
              children: [
                const Icon(Icons.warning_amber_rounded, size: 16, color: Paleta.alerta),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    'Por debajo del umbral (${_umbral.round()}%): hay que decir '
                    'que paso en esa hora.',
                    style: const TextStyle(fontSize: 11.5, height: 1.4),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _incidencia(List<CausaEntity> causas) {
    // Si ya explico con minutos donde se fue el tiempo, el backend toma la
    // causa que mas peso y no vuelve a pedirla. La pantalla hace la misma
    // cuenta para no exigir dos veces lo mismo.
    final obligatoria = (_bajoUmbral && _causaEfectiva == null) || _resaltarIncidencia;
    final causaElegida = _causa(_idCausa);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TituloSeccion(
          obligatoria ? 'Que paso (obligatorio)' : 'Incidencia (opcional)',
          detalle: obligatoria
              ? 'Sin esto el sistema no puede decir en que se van los minutos.'
              : null,
          accion: _idCausa == null
              ? null
              : TextButton(
                  onPressed: () => setState(() => _idCausa = null),
                  child: const Text('Quitar'),
                ),
        ),
        Wrap(
          spacing: 7,
          runSpacing: 7,
          children: causas.map((causa) {
            final activa = _idCausa == causa.id;

            return ChoiceChip(
              label: Text(causa.nombre),
              selected: activa,
              showCheckmark: false,
              labelStyle: TextStyle(
                fontSize: 12.5,
                color: activa ? Colors.white : Paleta.texto,
                fontWeight: activa ? FontWeight.w600 : FontWeight.normal,
              ),
              selectedColor: Paleta.morado,
              backgroundColor: obligatoria && _idCausa == null
                  ? Paleta.alerta.withValues(alpha: 0.1)
                  : Paleta.fondo,
              onSelected: (_) => setState(() => _idCausa = activa ? null : causa.id),
            );
          }).toList(),
        ),
        // Algunas incidencias exigen explicacion: el backend rechaza el
        // guardado sin ella, asi que el campo aparece solo cuando toca.
        if (causaElegida?.requiereNota ?? false) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _nota,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Explique que paso',
              helperText: '"${causaElegida!.nombre}" exige una nota',
              alignLabelWithHint: true,
            ),
          ),
        ],
      ],
    );
  }

  /// Los minutos que el modulo estuvo parado, abiertos por causa.
  ///
  /// Es lo que convierte "el modulo fue lento" en "se perdieron 20 minutos por
  /// maquina", que es lo unico con lo que se puede hacer algo.
  Widget _minutosPerdidosSeccion(List<CausaEntity> causas) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TituloSeccion(
          'Minutos perdidos',
          detalle: _minutosPerdidos > 0
              ? '$_minutosPerdidos de ${widget.franja.minutos} minutos de la hora'
              : 'Opcional. Cuanto tiempo estuvo parado el modulo y por que.',
          accion: TextButton.icon(
            onPressed: () => _agregarPerdida(causas),
            icon: const Icon(Icons.add, size: 17),
            label: const Text('Agregar'),
          ),
        ),
        if (_perdidas.isEmpty)
          const Text(
            'Sin paradas registradas en esta hora.',
            style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
          )
        else
          ..._perdidas.entries.map((linea) {
            final causa = _causa(linea.key);

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Tarjeta(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                hijo: Row(
                  children: [
                    Expanded(
                      child: Text(
                        causa?.nombre ?? 'Causa ${linea.key}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                    Text(
                      '${linea.value} min',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Paleta.error,
                      ),
                    ),
                    IconButton(
                      onPressed: () => setState(() => _perdidas.remove(linea.key)),
                      icon: const Icon(Icons.close, size: 17),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              ),
            );
          }),
        if (_minutosPerdidos > widget.franja.minutos) ...[
          const SizedBox(height: 8),
          Text(
            'Una franja de ${widget.franja.minutos} minutos no puede haber '
            'perdido $_minutosPerdidos.',
            style: const TextStyle(fontSize: 12, color: Paleta.error),
          ),
        ],
      ],
    );
  }

  Future<void> _agregarPerdida(List<CausaEntity> causas) async {
    if (causas.isEmpty) return;

    var idCausa = causas.first.id;
    final minutos = TextEditingController();

    final resultado = await showDialog<bool>(
      context: context,
      builder: (dialogo) => StatefulBuilder(
        builder: (_, refrescar) => AlertDialog(
          title: const Text('Minutos perdidos'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                initialValue: idCausa,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Causa'),
                items: causas
                    .map((causa) => DropdownMenuItem(
                          value: causa.id,
                          child: Text(causa.nombre, overflow: TextOverflow.ellipsis),
                        ))
                    .toList(),
                onChanged: (valor) => refrescar(() => idCausa = valor ?? idCausa),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: minutos,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  labelText: 'Minutos',
                  helperText: 'Maximo ${widget.franja.minutos}',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogo, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogo, true),
              child: const Text('Agregar'),
            ),
          ],
        ),
      ),
    );

    final valor = int.tryParse(minutos.text) ?? 0;
    minutos.dispose();

    if (resultado == true && valor > 0) {
      // Se suma sobre la misma causa en vez de duplicarla: es lo mismo que
      // hace el backend al normalizar.
      setState(() => _perdidas[idCausa] = (_perdidas[idCausa] ?? 0) + valor);
    }
  }

  Widget _pie(CapturaProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Paleta.tarjeta,
        border: Border(top: BorderSide(color: Paleta.borde)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: provider.guardando ? null : () => Navigator.pop(context, false),
                child: const Text('Cancelar'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: FilledButton(
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
                    : Text(widget.celda == null ? 'Guardar la hora' : 'Guardar cambios'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
