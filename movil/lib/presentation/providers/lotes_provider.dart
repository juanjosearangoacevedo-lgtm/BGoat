import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../domain/entities/catalogo_entity.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/repositories/lotes_repository.dart';

/// Los lotes: la unica entidad del producto.
///
/// El formulario de aqui reemplaza a los de Pedidos, Referencias, Fichas
/// Tecnicas y Prendas del modelo viejo. Un trabajo que llega en una sola hoja
/// se registra en una sola pantalla.
class LotesProvider extends ChangeNotifier {
  final LotesRepository repositorio;

  LotesProvider(this.repositorio);

  List<LoteEntity> lotes = const [];
  List<ClienteEntity> clientes = const [];
  List<Map<String, dynamic>> tiposPrenda = const [];

  bool cargando = false;
  bool guardando = false;
  String? error;

  // --- Filtros ----------------------------------------------------------
  String buscar = '';
  String estado = FiltroLotes.todos;
  int? idCliente;

  /// Los lotes sin SAM pactado. Es un aviso, no un adorno: con ese lote no se
  /// puede abrir una jornada, porque sin SAM no hay meta que calcular.
  int get sinSam => lotes.where((l) => !l.tieneSam).length;

  Future<void> cargar() async {
    cargando = true;
    error = null;
    notifyListeners();

    try {
      lotes = await repositorio.listar(FiltroLotes(
        buscar: buscar.trim().isEmpty ? null : buscar.trim(),
        estado: estado,
        idCliente: idCliente,
      ));
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  /// Los catalogos del formulario. Van juntos porque el formulario los necesita
  /// los dos y ninguno tiene pantalla propia.
  Future<void> cargarCatalogos() async {
    try {
      final resultados = await Future.wait([
        repositorio.clientes(),
        repositorio.tiposPrenda(),
      ]);

      clientes = resultados[0] as List<ClienteEntity>;
      tiposPrenda = resultados[1] as List<Map<String, dynamic>>;
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

  void cambiarCliente(int? id) {
    idCliente = id;
    cargar();
  }

  Future<String?> crear(SolicitudLote solicitud) async {
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

  Future<String?> actualizar(int idLote, SolicitudLote solicitud) async {
    guardando = true;
    notifyListeners();

    try {
      await repositorio.actualizar(idLote, solicitud);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    } finally {
      guardando = false;
      notifyListeners();
    }
  }

  /// Inactiva el lote. No se borra: conserva lo que ya se produjo con el.
  Future<String?> eliminar(int idLote) async {
    try {
      await repositorio.eliminar(idLote);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    }
  }

  Future<List<DetalleLoteEntity>> detalleTallaColor(int idLote) async {
    try {
      return await repositorio.detalleTallaColor(idLote);
    } on ApiError {
      // El desglose es opcional: que falle no puede tumbar la ficha del lote.
      return const [];
    }
  }
}
