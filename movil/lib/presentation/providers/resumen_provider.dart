import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../domain/entities/resumen_entity.dart';
import '../../domain/repositories/resumen_repository.dart';

/// El resumen del dia que se ve al entrar: los mismos KPIs del Panel web.
class ResumenProvider extends ChangeNotifier {
  final ResumenRepository repositorio;

  ResumenProvider(this.repositorio);

  ResumenEntity? resumen;
  bool cargando = false;
  String? error;

  Future<void> cargar() async {
    cargando = true;
    notifyListeners();

    try {
      resumen = await repositorio.deHoy();
      error = null;
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }
}
