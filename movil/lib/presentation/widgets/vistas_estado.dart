import 'package:flutter/material.dart';

import '../../core/tema.dart';

/// Lo que se muestra mientras la pantalla espera datos.
class VistaCargando extends StatelessWidget {
  final String mensaje;

  const VistaCargando({super.key, this.mensaje = 'Cargando...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(mensaje, style: const TextStyle(color: Paleta.textoSuave)),
        ],
      ),
    );
  }
}

/// Un fallo con la opcion de reintentar.
///
/// El texto viene del backend, que ya lo escribe pensando en la digitadora
/// ("El modulo M3 ya tiene la jornada abierta para esa fecha"), asi que se
/// muestra tal cual en vez de traducirlo a un "Error 409".
class VistaError extends StatelessWidget {
  final String mensaje;
  final VoidCallback? alReintentar;

  const VistaError(this.mensaje, {super.key, this.alReintentar});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 52, color: Paleta.textoSuave),
            const SizedBox(height: 16),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Paleta.texto, height: 1.45),
            ),
            if (alReintentar != null) ...[
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: alReintentar,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Una lista sin filas. No es un error: casi siempre es informacion.
class VistaVacia extends StatelessWidget {
  final IconData icono;
  final String titulo;
  final String? detalle;
  final Widget? accion;

  const VistaVacia({
    super.key,
    required this.icono,
    required this.titulo,
    this.detalle,
    this.accion,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icono, size: 52, color: Paleta.borde),
            const SizedBox(height: 16),
            Text(
              titulo,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            if (detalle != null) ...[
              const SizedBox(height: 8),
              Text(
                detalle!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Paleta.textoSuave, height: 1.45),
              ),
            ],
            if (accion != null) ...[const SizedBox(height: 20), accion!],
          ],
        ),
      ),
    );
  }
}

/// Muestra un mensaje breve abajo. Se usa despues de guardar o al fallar.
void avisar(BuildContext context, String mensaje, {bool esError = false}) {
  if (!context.mounted) return;

  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: esError ? Paleta.error : Paleta.moradoOscuro,
        duration: Duration(seconds: esError ? 5 : 3),
      ),
    );
}
