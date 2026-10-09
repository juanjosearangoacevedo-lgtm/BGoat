import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/paradas.dart';
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
  late final TextEditingController _defectuosas;
  late final TextEditingController _nota;

  /// Cuanto de esta celda es de cada talla y color. La clave es
  /// "idTalla-idColor" (vacio = sin talla/color). Reemplaza al antiguo
  /// campo suelto de unidades producidas: el total es la suma de este mapa.
  final Map<String, int> _tallaColor = {};

  /// Un controller por combinacion, creado una sola vez en `initState`. Si se
  /// crearan de nuevo en cada `build` (por ejemplo al escribir, que dispara
  /// `setState`), el campo perderia el foco y el cursor saltaria con cada
  /// digito.
  final Map<String, TextEditingController> _controlesTallaColor = {};

  /// Las paradas de esta hora: causa, desde y hasta. Es reemplazo y no suma:
  /// lo que quede en esta lista es lo que queda guardado. Una causa puede
  /// aparecer varias veces (la maquina se trabo dos veces).
  final List<MinutosPerdidosEntity> _paradas = [];

  /// Se enciende cuando el backend rechaza el guardado por falta de incidencia.
  bool _resaltarIncidencia = false;

  /// Si la digitadora esta corrigiendo las operarias de esta hora. Por
  /// defecto se usa la de la jornada; solo se pide el numero cuando alguien
  /// dice explicitamente que cambio.
  bool _cambioPersonas = false;

  @override
  void initState() {
    super.initState();

    final celda = widget.celda;

    _personas = TextEditingController(
      text: '${celda?.personasPresentes ?? widget.modulo.personasSugeridas}',
    );
    for (final linea in celda?.detalleTallaColor ?? const <DetalleTallaColorEntity>[]) {
      _tallaColor[_clave(linea.idTalla, linea.idColor)] = linea.cantidad;
    }
    for (final combo in widget.modulo.desgloseTallaColor) {
      final clave = _clave(combo.idTalla, combo.idColor);
      _controlesTallaColor[clave] = TextEditingController(text: '${_tallaColor[clave] ?? 0}');
    }
    _defectuosas = TextEditingController(
      text: celda == null || celda.unidadesDefectuosas == 0
          ? ''
          : '${celda.unidadesDefectuosas}',
    );
    _nota = TextEditingController(text: celda?.nota ?? '');
    _cambioPersonas = celda != null && celda.personasPresentes != widget.modulo.personasSugeridas;

    _paradas.addAll(celda?.detallePerdidas ?? const <MinutosPerdidosEntity>[]);
  }

  @override
  void dispose() {
    _personas.dispose();
    _defectuosas.dispose();
    _nota.dispose();
    for (final control in _controlesTallaColor.values) {
      control.dispose();
    }
    super.dispose();
  }

  // --- Talla y color ------------------------------------------------------

  String _clave(int? idTalla, int? idColor) => '${idTalla ?? ""}-${idColor ?? ""}';

  /// Cuanto le queda a cada combinacion, pero contando esta misma celda como
  /// si no se hubiera capturado todavia -si no, al reabrir una hora ya
  /// guardada el limite se veria mas chico de lo que realmente es, porque su
  /// propio aporte ya esta contado como "capturado".
  int _restanteEditable(DesgloseTallaColorEntity combo) {
    final propio = widget.celda?.detalleTallaColor
        .where((linea) => _clave(linea.idTalla, linea.idColor) == _clave(combo.idTalla, combo.idColor))
        .fold<int>(0, (total, linea) => total + linea.cantidad) ??
        0;
    return combo.restante + propio;
  }

  void _cambiarTallaColor(String clave, int limite, String texto) {
    final limpio = (int.tryParse(texto) ?? 0).clamp(0, limite);
    setState(() {
      if (limpio > 0) {
        _tallaColor[clave] = limpio;
      } else {
        _tallaColor.remove(clave);
      }
    });

    // Si se recorto el valor (se paso del limite), el campo tiene que verlo.
    final control = _controlesTallaColor[clave];
    if (control != null && control.text != '$limpio') {
      control.text = '$limpio';
      control.selection = TextSelection.collapsed(offset: control.text.length);
    }
  }

  // --- Calculos en vivo -------------------------------------------------

  int get _personasN => int.tryParse(_personas.text) ?? 0;
  int get _producidasN => _tallaColor.values.fold(0, (total, cantidad) => total + cantidad);
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

  /// Minutos de una parada: de sus dos horas. Las de antes del cambio no
  /// tienen horas y conservan los minutos con que se guardaron.
  int _minutosDe(MinutosPerdidosEntity parada) => parada.horaDesde == null
      ? parada.minutos
      : minutosDeParada(parada.horaDesde, parada.horaHasta);

  int get _minutosPerdidos =>
      _paradas.fold(0, (total, parada) => total + _minutosDe(parada));

  /// La causa principal: la que mas minutos suma entre sus paradas. No se
  /// pregunta aparte -- es lo mismo que calcula el backend al guardar, y
  /// pedirla dos veces era la misma pregunta con otro nombre.
  int? get _causaEfectiva {
    if (_paradas.isEmpty) return null;

    final porCausa = <int, int>{};
    for (final parada in _paradas) {
      porCausa[parada.idCausa] = (porCausa[parada.idCausa] ?? 0) + _minutosDe(parada);
    }
    var mayor = porCausa.entries.first;
    for (final linea in porCausa.entries) {
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
    if (_defectuosasN > _producidasN) {
      avisar(context, 'Las defectuosas no pueden superar las producidas', esError: true);
      return;
    }

    final problema = problemaParadas(_paradas, widget.franja);
    if (problema != null) {
      avisar(context, problema, esError: true);
      return;
    }

    final provider = context.read<CapturaProvider>();

    final resultado = await provider.guardar(SolicitudCaptura(
      idModulo: widget.modulo.modulo.id,
      fecha: widget.fecha,
      horaJornada: widget.franja.orden,
      personasPresentes: _personasN,
      detalleTallaColor: widget.modulo.desgloseTallaColor
          .where((combo) => (_tallaColor[_clave(combo.idTalla, combo.idColor)] ?? 0) > 0)
          .map((combo) => DetalleTallaColorEntity(
                idTalla: combo.idTalla,
                idColor: combo.idColor,
                cantidad: _tallaColor[_clave(combo.idTalla, combo.idColor)]!,
              ))
          .toList(),
      unidadesDefectuosas: _defectuosasN,
      nota: _nota.text.trim().isEmpty ? null : _nota.text.trim(),
      minutosPerdidos: List.of(_paradas),
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
    return Column(
      children: [
        _tallaColorSeccion(),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _personasCampo()),
            const SizedBox(width: 10),
            Expanded(
              child: _campo(
                control: _defectuosas,
                etiqueta: 'Defectuosas',
                icono: Icons.report_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// El reparto de las unidades BUENAS por talla y color. Ya no hay un campo
  /// suelto de "producidas": el total es la suma de estas filas. Las filas
  /// no las inventa la digitadora -son las que el lote ya tiene asignadas-,
  /// asi que no hay boton de agregar: solo un numero por combinacion, con lo
  /// que le queda al lado.
  Widget _tallaColorSeccion() {
    final combos = widget.modulo.desgloseTallaColor;

    if (combos.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Paleta.fondo,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Paleta.borde),
        ),
        child: const Text(
          'Este lote no tiene desglose por talla y color: no se puede '
          'capturar producción.',
          style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'PRODUCIDAS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Paleta.textoSuave,
                letterSpacing: 0.4,
              ),
            ),
            Text(
              '$_producidasN',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Paleta.primario,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...combos.map((combo) {
          final clave = _clave(combo.idTalla, combo.idColor);
          final limite = _restanteEditable(combo);
          final completo = limite <= 0;
          final etiqueta = (combo.nombreTalla != null || combo.nombreColor != null)
              ? [combo.nombreTalla, combo.nombreColor].whereType<String>().join(' · ')
              : 'Sin talla / sin color';
          final control = _controlesTallaColor[clave]!;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: completo ? Paleta.fondo : Paleta.tarjeta,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Paleta.borde),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          etiqueta,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: completo ? Paleta.textoSuave : Paleta.texto,
                          ),
                        ),
                        Text(
                          completo ? 'Completa' : 'Quedan $limite',
                          style: const TextStyle(fontSize: 11, color: Paleta.textoSuave),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 64,
                    child: TextField(
                      controller: control,
                      enabled: !completo,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      decoration: const InputDecoration(isDense: true, hintText: '0'),
                      onChanged: (texto) => _cambiarTallaColor(clave, limite, texto),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  /// Las operarias de la hora. Por defecto muestra la cantidad de la jornada,
  /// de solo lectura: es lo normal, y no hay que confirmarlo cada hora. Solo
  /// se pide el numero cuando alguien dice explicitamente que cambio.
  Widget _personasCampo() {
    if (!_cambioPersonas) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: Paleta.fondo,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Paleta.borde),
        ),
        child: Column(
          children: [
            const Text(
              'OPERARIAS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Paleta.textoSuave,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '${widget.modulo.personasSugeridas}',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Paleta.secundario,
              ),
            ),
            const SizedBox(height: 2),
            TextButton(
              onPressed: () => setState(() {
                _cambioPersonas = true;
                _personas.text = '${widget.modulo.personasSugeridas}';
              }),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                visualDensity: VisualDensity.compact,
              ),
              child: const Text('¿Cambio esta hora?', style: TextStyle(fontSize: 10.5)),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        _campo(control: _personas, etiqueta: 'Operarias', icono: Icons.groups_outlined),
        TextButton(
          onPressed: () => setState(() {
            _cambioPersonas = false;
            _personas.text = '${widget.modulo.personasSugeridas}';
          }),
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: Size.zero,
            visualDensity: VisualDensity.compact,
          ),
          child: const Text('No, la de la jornada', style: TextStyle(fontSize: 10.5)),
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
        color: destacado ? Paleta.primario : Paleta.texto,
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
                'La jornada de este módulo no tiene SAM: sin él no hay meta que '
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
              etiqueta: 'Facturación',
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

  /// Las paradas del modulo en esta hora: de que hora a que hora y por que.
  ///
  /// Es lo que convierte "el modulo fue lento" en "se paro de 9:10 a 9:30 por
  /// maquina", que es lo unico con lo que se puede hacer algo. La causa
  /// principal no se pregunta aparte: sale sola de cual causa suma mas minutos
  /// aqui (`_causaEfectiva`), igual que la calcula el backend.
  Widget _minutosPerdidosSeccion(List<CausaEntity> causas) {
    final obligatoria = (_bajoUmbral && _causaEfectiva == null) || _resaltarIncidencia;
    final causaPrincipal = _causa(_causaEfectiva);
    final problema = problemaParadas(_paradas, widget.franja);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TituloSeccion(
          obligatoria ? 'Qué pasó (obligatorio)' : 'Paradas del módulo',
          detalle: _minutosPerdidos > 0
              ? '$_minutosPerdidos de ${widget.franja.minutos} minutos de la hora'
              : obligatoria
                  ? 'Sin esto el sistema no puede decir en que se van los minutos.'
                  : 'Opcional. De qué hora a qué hora estuvo parado el módulo y por qué.',
          accion: TextButton.icon(
            onPressed: () => _editarParada(causas),
            icon: const Icon(Icons.add, size: 17),
            label: const Text('Agregar'),
          ),
        ),
        if (_paradas.isEmpty)
          Text(
            'Sin paradas registradas en esta hora.',
            style: TextStyle(fontSize: 12, color: obligatoria ? Paleta.alerta : Paleta.textoSuave),
          )
        else
          ..._paradas.asMap().entries.map((entrada) {
            final indice = entrada.key;
            final parada = entrada.value;
            final causa = _causa(parada.idCausa);
            final sinHoras = parada.horaDesde == null;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Tarjeta(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                hijo: InkWell(
                  onTap: () => _editarParada(causas, indice: indice),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              causa?.nombre ?? parada.nombre ?? 'Causa ${parada.idCausa}',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            Text(
                              sinHoras
                                  ? 'Registrada antes del cambio: toca para poner las horas'
                                  : '${horaCorta(parada.horaDesde)} a ${horaCorta(parada.horaHasta)}',
                              style: TextStyle(
                                fontSize: 11,
                                color: sinHoras ? Paleta.alerta : Paleta.textoSuave,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${_minutosDe(parada)} min',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: Paleta.error,
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _paradas.removeAt(indice)),
                        icon: const Icon(Icons.close, size: 17),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        if (problema != null && _paradas.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(problema, style: const TextStyle(fontSize: 12, color: Paleta.error)),
        ],
        // Algunas incidencias exigen explicacion: el backend rechaza el
        // guardado sin ella, asi que el campo aparece solo cuando toca.
        if (causaPrincipal?.requiereNota ?? false) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _nota,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Explique que paso',
              helperText: '"${causaPrincipal!.nombre}" exige una nota',
              alignLabelWithHint: true,
            ),
          ),
        ],
      ],
    );
  }

  /// Agrega una parada, o corrige la de `indice`: causa, desde y hasta.
  ///
  /// Las horas se escogen con el reloj del telefono y arrancan en el inicio
  /// de la franja: es mas rapido mover unos minutos que escribir la hora.
  Future<void> _editarParada(List<CausaEntity> causas, {int? indice}) async {
    if (causas.isEmpty) return;

    final actual = indice == null ? null : _paradas[indice];
    final inicioFranja = aMinutosDelDia(widget.franja.horaInicio) ?? 0;
    final finFranja = aMinutosDelDia(widget.franja.horaFin) ?? inicioFranja + widget.franja.minutos;

    var idCausa = actual?.idCausa ?? causas.first.id;
    var desde = aMinutosDelDia(actual?.horaDesde) ?? inicioFranja;
    var hasta = aMinutosDelDia(actual?.horaHasta) ?? (desde + 10).clamp(desde, finFranja);

    Future<int?> elegirHora(BuildContext dialogo, int minutos) async {
      final hora = await showTimePicker(
        context: dialogo,
        initialTime: TimeOfDay(hour: minutos ~/ 60, minute: minutos % 60),
        helpText: 'Entre ${horaCorta(widget.franja.horaInicio)} y ${horaCorta(widget.franja.horaFin)}',
      );
      return hora == null ? null : hora.hour * 60 + hora.minute;
    }

    final resultado = await showDialog<bool>(
      context: context,
      builder: (dialogo) => StatefulBuilder(
        builder: (_, refrescar) {
          final minutos = hasta > desde ? hasta - desde : 0;
          return AlertDialog(
            title: Text(indice == null ? 'Nueva parada' : 'Corregir parada'),
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
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final elegida = await elegirHora(dialogo, desde);
                          if (elegida != null) refrescar(() => desde = elegida);
                        },
                        child: Text('De ${aHoraTexto(desde)}'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final elegida = await elegirHora(dialogo, hasta);
                          if (elegida != null) refrescar(() => hasta = elegida);
                        },
                        child: Text('A ${aHoraTexto(hasta)}'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  minutos > 0 ? '$minutos minutos parado' : 'La hora final va después de la inicial',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: minutos > 0 ? Paleta.texto : Paleta.error,
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
                onPressed: minutos > 0 ? () => Navigator.pop(dialogo, true) : null,
                child: Text(indice == null ? 'Agregar' : 'Guardar'),
              ),
            ],
          );
        },
      ),
    );

    if (resultado != true || !mounted) return;

    final parada = MinutosPerdidosEntity(
      idCausa: idCausa,
      horaDesde: aHoraTexto(desde),
      horaHasta: aHoraTexto(hasta),
      minutos: hasta - desde,
    );
    setState(() {
      if (indice == null) {
        _paradas.add(parada);
      } else {
        _paradas[indice] = parada;
      }
    });

    // Fuera de la franja o cruzada con otra: se avisa ya, no al guardar.
    final problema = problemaParadas(_paradas, widget.franja);
    if (problema != null) avisar(context, problema, esError: true);
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
