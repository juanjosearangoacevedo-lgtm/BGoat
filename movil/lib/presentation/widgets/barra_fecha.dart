import 'package:flutter/material.dart';

import '../../core/fechas.dart';
import '../../core/tema.dart';

/// El selector de dia que llevan las tres pantallas por fecha.
///
/// Solo deja ir hacia atras: no se puede registrar produccion de una fecha
/// futura --el backend lo rechaza-- y ofrecer el boton para luego dar error
/// es hacerle perder el viaje a la digitadora.
class BarraFecha extends StatelessWidget {
  final String fecha;
  final ValueChanged<String> alCambiar;
  final Widget? derecha;

  const BarraFecha({
    super.key,
    required this.fecha,
    required this.alCambiar,
    this.derecha,
  });

  bool get _esHoy => fecha == hoy();

  void _mover(int dias) {
    final nueva = desdeTexto(fecha).add(Duration(days: dias));
    if (comoTexto(nueva).compareTo(hoy()) > 0) return;
    alCambiar(comoTexto(nueva));
  }

  Future<void> _escoger(BuildContext context) async {
    final elegida = await showDatePicker(
      context: context,
      initialDate: desdeTexto(fecha),
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      helpText: 'Dia de produccion',
    );

    if (elegida != null) alCambiar(comoTexto(elegida));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: const BoxDecoration(
        color: Paleta.tarjeta,
        border: Border(bottom: BorderSide(color: Paleta.borde)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => _mover(-1),
            icon: const Icon(Icons.chevron_left),
            tooltip: 'Dia anterior',
          ),
          Expanded(
            child: InkWell(
              onTap: () => _escoger(context),
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  children: [
                    Text(
                      fechaLarga(fecha),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    Text(
                      _esHoy ? 'Hoy' : desdeTexto(fecha).year.toString(),
                      style: TextStyle(
                        fontSize: 12,
                        color: _esHoy ? Paleta.morado : Paleta.textoSuave,
                        fontWeight: _esHoy ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(
            // Deshabilitado en hoy: no hay produccion del futuro que ver.
            onPressed: _esHoy ? null : () => _mover(1),
            icon: const Icon(Icons.chevron_right),
            tooltip: 'Dia siguiente',
          ),
          ?derecha,
        ],
      ),
    );
  }
}
