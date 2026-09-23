import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/tema.dart';
import '../providers/sesion_provider.dart';
import '../widgets/vistas_estado.dart';
import 'ajustes_screen.dart';

/// La entrada. El backend bloquea la cuenta a los 5 intentos fallidos y deja
/// rastro de cada intento en `sesiones_acceso`, asi que el mensaje de error
/// viene ya escrito de alla y se muestra tal cual.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formulario = GlobalKey<FormState>();
  final _correo = TextEditingController();
  final _clave = TextEditingController();
  bool _verClave = false;

  @override
  void dispose() {
    _correo.dispose();
    _clave.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (!_formulario.currentState!.validate()) return;

    final sesion = context.read<SesionProvider>();
    final entro = await sesion.entrar(_correo.text, _clave.text);

    if (!mounted) return;
    if (!entro && sesion.error != null) {
      avisar(context, sesion.error!, esError: true);
    }
  }

  Future<void> _recuperar() async {
    final correo = _correo.text.trim();
    if (correo.isEmpty) {
      avisar(context, 'Escriba su correo para enviarle las instrucciones', esError: true);
      return;
    }

    final mensaje = await context.read<SesionProvider>().recuperarClave(correo);
    if (!mounted || mensaje == null) return;
    avisar(context, mensaje);
  }

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionProvider>();

    return Scaffold(
      backgroundColor: Paleta.moradoOscuro,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _marca(),
                  const SizedBox(height: 28),
                  _tarjetaFormulario(sesion),
                  const SizedBox(height: 16),
                  _pieServidor(sesion),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _marca() {
    return Column(
      children: [
        Container(
          width: 66,
          height: 66,
          decoration: BoxDecoration(
            color: Paleta.naranja,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(Icons.precision_manufacturing_outlined,
              color: Colors.white, size: 34),
        ),
        const SizedBox(height: 14),
        const Text(
          'BGoat',
          style: TextStyle(
            color: Colors.white,
            fontSize: 30,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Produccion de planta',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
        ),
      ],
    );
  }

  Widget _tarjetaFormulario(SesionProvider sesion) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Paleta.tarjeta,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Form(
        key: _formulario,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Iniciar sesion',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _correo,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              decoration: const InputDecoration(
                labelText: 'Correo',
                prefixIcon: Icon(Icons.mail_outline),
              ),
              validator: (valor) {
                final texto = (valor ?? '').trim();
                if (texto.isEmpty) return 'Escriba su correo';
                if (!texto.contains('@')) return 'El correo no tiene un formato valido';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _clave,
              obscureText: !_verClave,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _entrar(),
              decoration: InputDecoration(
                labelText: 'Contrasena',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_verClave ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _verClave = !_verClave),
                ),
              ),
              validator: (valor) =>
                  (valor ?? '').isEmpty ? 'Escriba su contrasena' : null,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: sesion.cargando ? null : _entrar,
              child: sesion.cargando
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Entrar'),
            ),
            const SizedBox(height: 4),
            TextButton(
              onPressed: sesion.cargando ? null : _recuperar,
              child: const Text('Olvide mi contrasena'),
            ),
          ],
        ),
      ),
    );
  }

  /// Contra que servidor se esta entrando.
  ///
  /// Va a la vista porque es la causa numero uno de "no me deja entrar": el
  /// telefono apuntando al backend local mientras el PC esta apagado.
  Widget _pieServidor(SesionProvider sesion) {
    return TextButton.icon(
      onPressed: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const AjustesScreen()),
      ),
      icon: const Icon(Icons.dns_outlined, size: 16, color: Colors.white70),
      label: Text(
        sesion.servidor,
        style: const TextStyle(color: Colors.white70, fontSize: 12),
      ),
    );
  }
}
