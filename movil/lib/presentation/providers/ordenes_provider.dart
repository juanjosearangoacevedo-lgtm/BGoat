import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/lotes_repository.dart';
import '../../domain/repositories/ordenes_repository.dart';

/// Las ordenes de produccion: el compromiso sobre un lote.
///
/// El filtro que importa en planta es `asignacion`: separa las LIBRES --las que
/// estan esperando a que un modulo las tome-- de las TOMADAS. Quien sabe que
/// modulo se desocupa es la planta, el mismo dia, no el escritorio.
class OrdenesProvider extends ChangeNotifier {
  final OrdenesRepository repositorio;

  /// Para el selector de lote del formulario. La orden siempre cuelga de uno.
  final LotesRepository lotes;

  OrdenesProvider(this.repositorio, this.lotes);

  List<OrdenEntity> ordenes = const [];
  List<LoteEntity> lotesDisponibles = const [];

  bool cargando = false;
  bool guardando = false;
  String? error;

  // --- Filtros ----------------------------------------------------------
  String buscar = '';
  String estado = FiltroOrdenes.todos;
  String asignacion = FiltroOrdenes.todos;

  int get totalLibres => ordenes.where((o) => o.estaLibre).length;

  int get totalEnRiesgo => ordenes.where((o) => o.estaEnRiesgo).length;

  Future<void> cargar() async {
    cargando = true;
    error = null;
    notifyListeners();

    try {
      ordenes = await repositorio.listar(FiltroOrdenes(
        buscar: buscar.trim().isEmpty ? null : buscar.trim(),
        estado: estado,
        asignacion: asignacion,
      ));
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  /// Los lotes para el selector del formulario. Se piden aparte porque el
  /// listado de ordenes no los necesita y son una consulta distinta.
  Future<void> cargarLotes() async {
    try {
      lotesDisponibles = await lotes.listar(const FiltroLotes(estado: 'todos'));
      notifyListeners();
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      notifyListeners();
    }
  }

  void cambiarBusqueda(String texto) {
    buscar = texto;
    cargar();
  }

  void cambiarEstado(String nuevo) {
    estado = nuevo;
    cargar();
  }

  void cambiarAsignacion(String nueva) {
    asignacion = nueva;
    cargar();
  }

  Future<String?> crear(SolicitudOrden solicitud) async {
    guardando = true;
    notifyListeners();

    try {
      await repositorio.crear(solicitud);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    } finally {
      guardando = false;
      notifyListeners();
    }
  }

  Future<String?> actualizar(int idOrden, SolicitudOrden solicitud) async {
    guardando = true;
    notifyListeners();

    try {
      await repositorio.actualizar(idOrden, solicitud);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    } finally {
      guardando = false;
      notifyListeners();
    }
  }

  /// Elimina la orden. El backend lo rechaza con 409 si ya tiene produccion
  /// registrada o jornadas configuradas: en ese caso se cancela, no se borra.
  Future<String?> eliminar(int idOrden) async {
    try {
      await repositorio.eliminar(idOrden);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    }
  }

  Future<OrdenEntity?> detalle(int idOrden) async {
    try {
      return await repositorio.detalle(idOrden);
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      notifyListeners();
      return null;
    }
  }
}
