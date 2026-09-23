import 'package:flutter/material.dart';

import '../../core/tema.dart';

/// La etiqueta de color de un estado (ABIERTA, EN_PROCESO, LIBRE...).
///
/// El guion bajo del enum de MySQL no se muestra: "EN_PROCESO" se lee
/// "En proceso", que es como lo dice la gente en planta.
class EstadoChip extends StatelessWidget {
  final String? estado;
  final Color? color;
  final IconData? icono;

  const EstadoChip(this.estado, {super.key, this.color, this.icono});

  static String legible(String? estado) {
    if (estado == null || estado.isEmpty) return 'Sin estado';
    final texto = estado.replaceAll('_', ' ').toLowerCase();
    return texto[0].toUpperCase() + texto.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final tono = color ?? Paleta.porEstado(estado);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: tono.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icono != null) ...[
            Icon(icono, size: 13, color: tono),
            const SizedBox(width: 4),
          ],
          Text(
            legible(estado),
            style: TextStyle(color: tono, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

/// La etiqueta de prioridad de una orden.
class PrioridadChip extends StatelessWidget {
  final String? prioridad;

  const PrioridadChip(this.prioridad, {super.key});

  @override
  Widget build(BuildContext context) {
    if (prioridad == null) return const SizedBox.shrink();

    return EstadoChip(
      prioridad,
      color: Paleta.porPrioridad(prioridad),
      icono: prioridad?.toUpperCase() == 'URGENTE' ? Icons.priority_high : null,
    );
  }
}

/// El porcentaje de eficiencia con el color que le corresponde contra el
/// umbral del modulo: verde si llego, ambar si esta cerca, rojo si no.
class EficienciaChip extends StatelessWidget {
  final double? eficiencia;
  final double umbral;
  final bool grande;

  const EficienciaChip(
    this.eficiencia, {
    super.key,
    this.umbral = 80,
    this.grande = false,
  });

  @override
  Widget build(BuildContext context) {
    final tono = Paleta.porEficiencia(eficiencia, umbral);
    final texto = eficiencia == null ? '—' : '${eficiencia!.round()}%';

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: grande ? 14 : 10,
        vertical: grande ? 7 : 4,
      ),
      decoration: BoxDecoration(
        color: tono.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        texto,
        style: TextStyle(
          color: tono,
          fontSize: grande ? 18 : 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
