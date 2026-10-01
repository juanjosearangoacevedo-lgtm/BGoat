import 'package:flutter/material.dart';

/// La paleta de BGoat, la misma del panel web.
///
/// Los valores salen literal de `frontend/src/shared/styles/theme.css`:
/// `primario` es `--primary`, `primarioOscuro` es `--sidebar` (el verde mas
/// oscuro de la barra lateral web, aqui hace de fondo del AppBar), `secundario`
/// es `--secondary` y `terciario` es `--tertiary`. Los tres de estado (verde,
/// ambar, rojo) son los que la pantalla usa para decir de un vistazo como va
/// un modulo, y tambien coinciden con `--success`/`--warning`/`--destructive`.
class Paleta {
  static const primario = Color(0xFF0F4C3F);
  static const primarioOscuro = Color(0xFF0A3A2F);
  static const secundario = Color(0xFFD08E10);
  static const terciario = Color(0xFFE3A81B);

  static const fondo = Color(0xFFFAFAFA);
  static const tarjeta = Color(0xFFFFFFFF);
  static const texto = Color(0xFF1A1A1A);
  static const textoSuave = Color(0xFF6B7280);
  static const borde = Color(0xFFE5E7EB);

  static const exito = Color(0xFF10B981);
  static const alerta = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);

  /// El color de una eficiencia contra el umbral del modulo.
  ///
  /// Es la regla del tablero de pared: verde si llego a la meta, ambar si esta
  /// en la franja de tolerancia, rojo si se quedo corto. El umbral no es fijo,
  /// sale de `modulos.umbral_cumplimiento`, porque no todos los modulos se
  /// miden igual.
  static Color porEficiencia(double? eficiencia, double umbral) {
    if (eficiencia == null) return textoSuave;
    if (eficiencia >= 100) return exito;
    if (eficiencia >= umbral) return alerta;
    return error;
  }

  /// El color de un estado de lote, orden o jornada.
  static Color porEstado(String? estado) {
    switch (estado?.toUpperCase()) {
      case 'ABIERTA':
      case 'EN_PROCESO':
      case 'APROBADO':
        return exito;
      case 'PENDIENTE':
      case 'REGISTRADO':
      case 'PAUSADA':
        return alerta;
      case 'CANCELADA':
      case 'INACTIVO':
        return error;
      case 'CERRADA':
      case 'FINALIZADA':
      case 'FINALIZADO':
      case 'ENTREGADO':
        return primario;
      default:
        return textoSuave;
    }
  }

}

ThemeData temaBGoat() {
  final base = ColorScheme.fromSeed(
    seedColor: Paleta.primario,
    primary: Paleta.primario,
    secondary: Paleta.secundario,
    error: Paleta.error,
    surface: Paleta.tarjeta,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: base,
    scaffoldBackgroundColor: Paleta.fondo,
    appBarTheme: const AppBarTheme(
      backgroundColor: Paleta.primario,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: Paleta.tarjeta,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Paleta.borde),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Paleta.borde),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Paleta.borde),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Paleta.primario, width: 1.6),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    chipTheme: const ChipThemeData(side: BorderSide.none),
    dividerTheme: const DividerThemeData(color: Paleta.borde, space: 1, thickness: 1),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
