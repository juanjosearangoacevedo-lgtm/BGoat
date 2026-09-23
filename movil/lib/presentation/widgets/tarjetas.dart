import 'package:flutter/material.dart';

import '../../core/tema.dart';

/// Un dato con su etiqueta. Es el ladrillo de las cabeceras y los resumenes.
class Dato extends StatelessWidget {
  final String etiqueta;
  final String valor;
  final Color? color;
  final IconData? icono;
  final bool destacado;

  const Dato({
    super.key,
    required this.etiqueta,
    required this.valor,
    this.color,
    this.icono,
    this.destacado = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            if (icono != null) ...[
              Icon(icono, size: 13, color: Paleta.textoSuave),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(
                etiqueta,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11,
                  color: Paleta.textoSuave,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          valor,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: destacado ? 20 : 15,
            fontWeight: FontWeight.w700,
            color: color ?? Paleta.texto,
          ),
        ),
      ],
    );
  }
}

/// La tarjeta blanca con borde que usan todas las pantallas.
class Tarjeta extends StatelessWidget {
  final Widget hijo;
  final EdgeInsetsGeometry padding;
  final VoidCallback? alTocar;
  final Color? borde;

  const Tarjeta({
    super.key,
    required this.hijo,
    this.padding = const EdgeInsets.all(14),
    this.alTocar,
    this.borde,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Paleta.tarjeta,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: alTocar,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borde ?? Paleta.borde),
          ),
          child: hijo,
        ),
      ),
    );
  }
}

/// La barra de avance contra una meta.
///
/// Se recorta a 1 a proposito: un modulo puede producir mas de lo que la meta
/// pedia, y la barra no puede salirse de la caja.
class BarraAvance extends StatelessWidget {
  final double valor;
  final Color color;
  final double alto;

  const BarraAvance({
    super.key,
    required this.valor,
    required this.color,
    this.alto = 7,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: LinearProgressIndicator(
        value: valor.clamp(0, 1).toDouble(),
        minHeight: alto,
        backgroundColor: Paleta.borde,
        valueColor: AlwaysStoppedAnimation(color),
      ),
    );
  }
}

/// Una fila de datos que se reparte el ancho por igual.
class FilaDeDatos extends StatelessWidget {
  final List<Widget> datos;

  const FilaDeDatos(this.datos, {super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: datos
          .map((dato) => Expanded(child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: dato,
              )))
          .toList(),
    );
  }
}

/// El encabezado de una seccion dentro de una pantalla larga.
class TituloSeccion extends StatelessWidget {
  final String texto;
  final String? detalle;
  final Widget? accion;

  const TituloSeccion(this.texto, {super.key, this.detalle, this.accion});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texto,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                if (detalle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      detalle!,
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                    ),
                  ),
              ],
            ),
          ),
          ?accion,
        ],
      ),
    );
  }
}
