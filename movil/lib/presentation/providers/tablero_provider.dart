import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/fechas.dart';
import '../../domain/entities/tablero_entity.dart';
import '../../domain/repositories/captura_repository.dart';

/// El tablero de un modulo: la hoja de calculo de la empresa, ya cuadrada.
///
/// Lee lo mismo que la rejilla pero responde otra pregunta: no es "que falta
/// por digitar" sino "como le fue a ESTE modulo hoy", franja por franja y con
/// los acumulados corriendo.
class TableroProvider extends ChangeNotifier {
  final CapturaRepository repositorio;

  TableroProvider(this.repositorio);

  String fecha = hoy();
  int? idModulo;
  TableroEntity? tablero;

  bool cargando = false;
  String? error;

  /// Que columna de la tabla se esta mirando. En un celular no caben las tres
  /// a la vez, asi que se alternan en vez de encogerlas hasta que no se lean.
  VistaTablero vista = VistaTablero.produccion;

  Future<void> cargar(int modulo, {String? nuevaFecha}) async {
    idModulo = modulo;
    if (nuevaFecha != null) fecha = nuevaFecha;

    cargando = true;
    error = null;
    notifyListeners();

    try {
      tablero = await repositorio.tablero(modulo, fecha: fecha);
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      tablero = null;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  Future<void> recargar() async {
    if (idModulo != null) await cargar(idModulo!);
  }

  Future<void> cambiarFecha(String nueva) async {
    if (idModulo != null) await cargar(idModulo!, nuevaFecha: nueva);
  }

  void cambiarVista(VistaTablero nueva) {
    vista = nueva;
    notifyListeners();
  }

  /// Suelta el modulo para volver al selector.
  void limpiar() {
    idModulo = null;
    tablero = null;
    error = null;
    notifyListeners();
  }
}

/// Las tres lecturas del mismo tablero.
enum VistaTablero {
  /// Unidades contra meta, que es lo que la digitadora mira mientras captura.
  produccion,

  /// Meta y real en pesos. Es la columna que la empresa mira.
  dinero,

  /// Minutos perdidos por causa: el Pareto del dia del modulo.
  perdidas;

  String get titulo {
    switch (this) {
      case VistaTablero.produccion:
        return 'Produccion';
      case VistaTablero.dinero:
        return 'Facturacion';
      case VistaTablero.perdidas:
        return 'Tiempo perdido';
    }
  }

  IconData get icono {
    switch (this) {
      case VistaTablero.produccion:
        return Icons.inventory_2_outlined;
      case VistaTablero.dinero:
        return Icons.payments_outlined;
      case VistaTablero.perdidas:
        return Icons.timer_off_outlined;
    }
  }
}
