import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/tema.dart';
import '../providers/sesion_provider.dart';
import '../widgets/vistas_estado.dart';
import 'ajustes_screen.dart';

/// La entrada. El backend bloquea la cuenta a los 5 intentos fallidos y deja
/// rastro de cada intento en `sesiones_acceso`, asi que el mensaje de error
/// viene ya escrito de alla y se muestra tal cual.
///
/// El diseno es el mismo del login web (`LoginFormPanel.jsx`): la foto de la
/// planta desenfocada de fondo, la tarjeta de vidrio centrada con el logo de
/// God's Eyes y su halo, y el mismo texto. "Recordarme" tambien es decorativo
/// aqui porque lo es alla -- no queda mas fiel inventandole una funcion que
/// el original no tiene.
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
  bool _recordarme = false;

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
      backgroundColor: const Color(0xFF0F1A17),
      body: Stack(
        fit: StackFit.expand,
        children: [
          _fotoDeFondo(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _tarjetaFormulario(sesion),
                      const SizedBox(height: 16),
                      _pieServidor(sesion),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// La misma foto de la planta que usa el login web, desenfocada y con un
  /// velo verde oscuro encima para que el texto blanco se lea.
  Widget _fotoDeFondo() {
    return Stack(
      fit: StackFit.expand,
      children: [
        ImageFiltered(
          imageFilter: ImageFilter.blur(sigmaX: 7, sigmaY: 7),
          child: Transform.scale(
            scale: 1.1,
            child: Image.asset('assets/images/planta-hero.webp', fit: BoxFit.cover),
          ),
        ),
        Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -0.25),
              radius: 1.1,
              colors: [Color(0x1FFFFCF4), Color(0x570B1E18)],
            ),
          ),
        ),
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x1AFFF8EB), Color(0x4D091914)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _logoConHalo() {
    return SizedBox(
      width: 140,
      height: 130,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: -14,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                width: 130,
                height: 110,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: SweepGradient(
                    colors: [
                      Color(0xFFE14F8A),
                      Color(0xFFF2994A),
                      Color(0xFFF2C94C),
                      Color(0xFF6FCF97),
                      Color(0xFF2F80ED),
                      Color(0xFF9B51E0),
                      Color(0xFFE14F8A),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 8,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                'assets/images/logo.png',
                width: 84,
                height: 84,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tarjetaFormulario(SesionProvider sesion) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(26),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: const EdgeInsets.fromLTRB(22, 8, 22, 22),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.86),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: Colors.white.withValues(alpha: 0.6)),
          ),
          child: Form(
            key: _formulario,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _logoConHalo(),
                const Text(
                  'Bienvenido',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Color(0xFF12263B)),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Ingresa tus credenciales para acceder al sistema',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Color(0xFF55636E)),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _correo,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  decoration: _decoracionCampo(
                    sugerencia: 'usuario@empresa.com',
                    icono: Icons.mail_outline,
                  ),
                  validator: (valor) {
                    final texto = (valor ?? '').trim();
                    if (texto.isEmpty) return 'Escriba su correo';
                    if (!texto.contains('@')) return 'El correo no tiene un formato valido';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _clave,
                  obscureText: !_verClave,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _entrar(),
                  decoration: _decoracionCampo(
                    sugerencia: '••••••••••',
                    icono: Icons.lock_outline,
                    accionFinal: IconButton(
                      icon: Icon(
                        _verClave ? Icons.visibility_off : Icons.visibility,
                        color: const Color(0xFF54636C),
                      ),
                      onPressed: () => setState(() => _verClave = !_verClave),
                    ),
                  ),
                  validator: (valor) =>
                      (valor ?? '').isEmpty ? 'Escriba su contrasena' : null,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: _recordarme,
                        onChanged: (valor) => setState(() => _recordarme = valor ?? false),
                        activeColor: Paleta.secundario,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Recordarme',
                      style: TextStyle(fontSize: 13, color: Color(0xFF3D4A53)),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: sesion.cargando ? null : _recuperar,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        '¿Olvidaste tu contrasena?',
                        style: TextStyle(fontSize: 12.5, color: Color(0xFF3D4A53)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 54,
                  child: FilledButton(
                    onPressed: sesion.cargando ? null : _entrar,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFC8901F),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: sesion.cargando
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Iniciar sesion', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 19),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    const Expanded(child: Divider(color: Color(0xFFC9D1CE))),
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 30,
                      height: 3,
                      decoration: BoxDecoration(
                        color: const Color(0xFFC8901F),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const Expanded(child: Divider(color: Color(0xFFC9D1CE))),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'Al iniciar sesion, aceptas nuestros Terminos de Servicio y Politica de Privacidad',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: Color(0xFF55636E), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _decoracionCampo({
    required String sugerencia,
    required IconData icono,
    Widget? accionFinal,
  }) {
    final borde = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.7)),
    );

    return InputDecoration(
      hintText: sugerencia,
      hintStyle: const TextStyle(color: Color(0xFF93A0A7), fontSize: 14),
      prefixIcon: Icon(icono, color: const Color(0xFF54636C), size: 20),
      suffixIcon: accionFinal,
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.92),
      border: borde,
      enabledBorder: borde,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFD08E10), width: 1.6),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
