import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_cliente.dart';
import '../../core/tema.dart';
import '../providers/sesion_provider.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// Contra que servidor habla la app.
///
/// Existe porque la app corre en dos sitios: el VPS donde ya vive BGoat y el
/// backend del PC cuando se esta desarrollando. Son DOS BASES DISTINTAS, asi
/// que cambiar de una a otra cambia tambien los registros que se ven, y por eso
/// cambiar el servidor cierra la sesion.
class AjustesScreen extends StatefulWidget {
  const AjustesScreen({super.key});

  @override
  State<AjustesScreen> createState() => _AjustesScreenState();
}

class _AjustesScreenState extends State<AjustesScreen> {
  late final TextEditingController _direccion;

  @override
  void initState() {
    super.initState();
    _direccion = TextEditingController(text: context.read<SesionProvider>().servidor);
  }

  @override
  void dispose() {
    _direccion.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    final sesion = context.read<SesionProvider>();
    final anterior = sesion.servidor;
    final nueva = ApiCliente.normalizarBase(_direccion.text);

    if (nueva == anterior) {
      avisar(context, 'El servidor no cambio');
      return;
    }

    if (sesion.haySesion) {
      final confirmado = await _confirmarCambio(nueva);
      if (!confirmado) return;
    }

    await sesion.cambiarServidor(nueva);
    if (!mounted) return;

    _direccion.text = sesion.servidor;
    avisar(context, 'Servidor cambiado. Vuelva a iniciar sesion.');
  }

  Future<bool> _confirmarCambio(String nueva) async {
    final respuesta = await showDialog<bool>(
      context: context,
      builder: (dialogo) => AlertDialog(
        title: const Text('Cambiar de servidor'),
        content: Text(
          'La app va a apuntar a:\n\n$nueva\n\n'
          'Es una base de datos distinta, asi que va a ver otros registros. '
          'Se cerrara la sesion.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogo, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogo, true),
            child: const Text('Cambiar'),
          ),
        ],
      ),
    );

    return respuesta ?? false;
  }

  void _usar(String direccion) {
    setState(() => _direccion.text = direccion);
  }

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const TituloSeccion(
            'Servidor',
            detalle: 'La direccion de la API de BGoat',
          ),
          Tarjeta(
            hijo: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _direccion,
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Direccion',
                    hintText: '192.168.1.2:4000',
                    prefixIcon: Icon(Icons.dns_outlined),
                    helperText: 'Si no escribe http:// ni /api, se completan solos',
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: _guardar,
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('Guardar servidor'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const TituloSeccion('Atajos'),
          _atajo(
            titulo: 'Servidor de la empresa',
            detalle: ApiCliente.basePorDefecto,
            icono: Icons.cloud_outlined,
            nota: 'El mismo panel que usa la empresa. Funciona con datos moviles.',
          ),
          const SizedBox(height: 10),
          _atajo(
            titulo: 'Backend local',
            detalle: 'http://192.168.1.2:4000/api',
            icono: Icons.computer_outlined,
            nota: 'Exige el PC encendido con "npm run dev" y el mismo wifi.',
          ),
          const SizedBox(height: 24),
          if (sesion.haySesion) ...[
            const TituloSeccion('Sesion'),
            Tarjeta(
              hijo: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Dato(
                    etiqueta: 'Usuario',
                    valor: sesion.usuario?.nombreCompleto ?? '—',
                    icono: Icons.person_outline,
                  ),
                  const SizedBox(height: 10),
                  Dato(
                    etiqueta: 'Rol',
                    valor: sesion.usuario?.nombreRol ?? '—',
                    icono: Icons.badge_outlined,
                  ),
                  const SizedBox(height: 10),
                  Dato(
                    etiqueta: 'Permisos del rol',
                    valor: '${sesion.sesion?.permisos.length ?? 0}',
                    icono: Icons.key_outlined,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _atajo({
    required String titulo,
    required String detalle,
    required IconData icono,
    required String nota,
  }) {
    final activo = ApiCliente.normalizarBase(_direccion.text) ==
        ApiCliente.normalizarBase(detalle);

    return Tarjeta(
      alTocar: () => _usar(detalle),
      borde: activo ? Paleta.morado : null,
      hijo: Row(
        children: [
          Icon(icono, color: activo ? Paleta.morado : Paleta.textoSuave),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titulo, style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  detalle,
                  style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                ),
                const SizedBox(height: 4),
                Text(
                  nota,
                  style: const TextStyle(fontSize: 11, color: Paleta.textoSuave, height: 1.35),
                ),
              ],
            ),
          ),
          if (activo) const Icon(Icons.check_circle, color: Paleta.morado, size: 20),
        ],
      ),
    );
  }
}
