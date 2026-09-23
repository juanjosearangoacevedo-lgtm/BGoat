import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/fechas.dart';
import '../../domain/entities/jornada_entity.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/entities/orden_entity.dart';
import '../../domain/repositories/jornada_repository.dart';

/// El inicio de jornada: el primer paso del dia de la digitadora.
///
/// Guarda dos cosas a la vez: el estado de la planta (que modulos ya abrieron)
/// y el borrador del asistente (que esta escogiendo ahora). El borrador vive
/// aqui y no en la pantalla porque el asistente tiene cuatro pasos y volver
/// atras no puede perder lo ya escogido.
class JornadaProvider extends ChangeNotifier {
  final JornadaRepository repositorio;

  JornadaProvider(this.repositorio);

  // --- Estado de la pantalla -------------------------------------------
  String fecha = hoy();
  OpcionesJornadaEntity? opciones;
  bool cargando = false;
  bool guardando = false;
  String? error;

  /// Se llena cuando el backend rechaza por 409: la orden ya la tomo otro
  /// modulo. No es un error de red, es una regla del negocio.
  String? conflicto;

  // --- Borrador del asistente ------------------------------------------
  int paso = 0;
  int? idModulo;
  int? idCliente;
  int? idLote;
  int? idOrden;
  int cantidadOperarias = 1;
  List<int?> operarias = [null];
  String observaciones = '';

  /// La jornada que se esta corrigiendo, si el modulo ya tenia una abierta.
  JornadaEntity? enEdicion;

  bool get editando => enEdicion != null;

  static const ultimoPaso = 3;

  // --- Lecturas derivadas ----------------------------------------------

  ModuloDelDiaEntity? get moduloElegido {
    final lista = opciones?.modulos ?? const <ModuloDelDiaEntity>[];
    for (final modulo in lista) {
      if (modulo.modulo.id == idModulo) return modulo;
    }
    return null;
  }

  LoteEntity? get loteElegido {
    final lista = opciones?.lotes ?? const <LoteEntity>[];
    for (final lote in lista) {
      if (lote.id == idLote) return lote;
    }
    return null;
  }

  OrdenEntity? get ordenElegida {
    final lista = opciones?.ordenes ?? const <OrdenEntity>[];
    for (final orden in lista) {
      if (orden.id == idOrden) return orden;
    }
    return null;
  }

  List<LoteEntity> get lotesDelCliente => opciones?.lotesDe(idCliente) ?? const [];

  List<OrdenEntity> get ordenesDelLote =>
      opciones?.ordenesDisponibles(idLote, idModulo) ?? const [];

  List<ModuloDelDiaEntity> get modulosAbiertos =>
      (opciones?.modulos ?? const <ModuloDelDiaEntity>[])
          .where((m) => m.tieneJornada)
          .toList();

  List<ModuloDelDiaEntity> get modulosLibres =>
      (opciones?.modulos ?? const <ModuloDelDiaEntity>[])
          .where((m) => !m.tieneJornada)
          .toList();

  /// La meta del dia con lo que lleva escogido. Se muestra en el resumen para
  /// que la digitadora vea contra que la van a medir antes de confirmar.
  double get metaEstimadaDia {
    final sam = loteElegido?.samPactado;
    if (sam == null || sam <= 0) return 0;
    // 520 minutos es la jornada de martes a viernes, que es la normal. El dato
    // exacto lo trae la rejilla; aqui es solo una estimacion del asistente.
    return (cantidadOperarias * 520) / sam;
  }

  /// Si se puede pasar del paso actual al siguiente.
  bool get puedeAvanzar {
    switch (paso) {
      case 0:
        return idModulo != null;
      case 1:
        return idLote != null && (loteElegido?.tieneSam ?? false);
      case 2:
        // La orden es opcional: la jornada arranca sin ella y la facturacion
        // queda en cero hasta que alguien la cree.
        return true;
      case 3:
        return cantidadOperarias >= 1;
      default:
        return false;
    }
  }

  // --- Acciones ---------------------------------------------------------

  Future<void> cargar({String? nuevaFecha}) async {
    if (nuevaFecha != null) fecha = nuevaFecha;

    cargando = true;
    error = null;
    notifyListeners();

    try {
      opciones = await repositorio.opciones(fecha: fecha);
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  /// Arranca el asistente sobre un modulo que todavia no abrio jornada.
  void empezar(int modulo) {
    enEdicion = null;
    paso = 0;
    idModulo = modulo;
    idCliente = null;
    idLote = null;
    idOrden = null;
    // Se precarga la capacidad del modulo: casi siempre es el numero correcto
    // y ahorra digitarlo.
    cantidadOperarias = moduloElegido?.modulo.capacidadOperarios ?? 1;
    if (cantidadOperarias < 1) cantidadOperarias = 1;
    operarias = List<int?>.filled(cantidadOperarias, null, growable: true);
    observaciones = '';
    conflicto = null;
    notifyListeners();
  }

  /// Abre el asistente con una jornada ya existente, para corregirla.
  void editar(JornadaEntity jornada) {
    enEdicion = jornada;
    paso = 0;
    idModulo = jornada.idModulo;
    idCliente = jornada.idCliente;
    idLote = jornada.idLote;
    idOrden = jornada.idOrden;
    cantidadOperarias = jornada.cantidadOperarias;
    operarias = jornada.puestos.map((p) => p.idOperaria).toList();
    _ajustarPuestos();
    observaciones = jornada.observaciones ?? '';
    conflicto = null;
    notifyListeners();
  }

  void irAPaso(int nuevo) {
    paso = nuevo.clamp(0, ultimoPaso);
    notifyListeners();
  }

  void avanzar() => irAPaso(paso + 1);

  void retroceder() => irAPaso(paso - 1);

  void elegirModulo(int id) {
    idModulo = id;
    // La orden depende del modulo (las tomadas por otro no sirven), asi que
    // cambiar de modulo la invalida.
    idOrden = null;
    notifyListeners();
  }

  void elegirCliente(int? id) {
    idCliente = id;
    idLote = null;
    idOrden = null;
    notifyListeners();
  }

  void elegirLote(int? id) {
    idLote = id;
    idOrden = null;

    // Con una sola orden disponible no tiene sentido preguntarlo: se escoge
    // sola, igual que hace el backend cuando no se manda ninguna.
    final disponibles = ordenesDelLote;
    if (disponibles.length == 1) idOrden = disponibles.first.id;

    notifyListeners();
  }

  void elegirOrden(int? id) {
    idOrden = id;
    notifyListeners();
  }

  void cambiarCantidad(int cantidad) {
    cantidadOperarias = cantidad.clamp(1, 99);
    _ajustarPuestos();
    notifyListeners();
  }

  /// Asigna (o quita) la operaria de un puesto. null la deja anonima.
  void asignarPuesto(int indice, int? idOperaria) {
    if (indice < 0 || indice >= operarias.length) return;

    // Una misma operaria no puede ocupar dos puestos: el backend lo rechaza,
    // asi que se libera el puesto anterior en vez de dejar que falle al guardar.
    if (idOperaria != null) {
      for (var i = 0; i < operarias.length; i++) {
        if (i != indice && operarias[i] == idOperaria) operarias[i] = null;
      }
    }

    operarias[indice] = idOperaria;
    notifyListeners();
  }

  void cambiarObservaciones(String texto) {
    observaciones = texto;
  }

  /// Recorta o rellena la lista de puestos hasta la cantidad declarada.
  void _ajustarPuestos() {
    if (operarias.length > cantidadOperarias) {
      operarias = operarias.sublist(0, cantidadOperarias);
    } else {
      while (operarias.length < cantidadOperarias) {
        operarias.add(null);
      }
    }
  }

  /// Guarda la jornada. Devuelve null si salio bien, o el mensaje del fallo.
  ///
  /// Aqui es donde el modulo TOMA la orden. Si otro modulo ya la cogio entre
  /// que se abrio el asistente y se pulso guardar, el backend responde 409.
  Future<String?> guardar() async {
    if (idModulo == null || idLote == null) {
      return 'Faltan el modulo y el lote que se va a producir';
    }

    guardando = true;
    conflicto = null;
    notifyListeners();

    final solicitud = SolicitudJornada(
      idModulo: idModulo!,
      idLote: idLote!,
      idOrden: idOrden,
      fecha: fecha,
      cantidadOperarias: cantidadOperarias,
      operarias: operarias,
      observaciones: observaciones.trim().isEmpty ? null : observaciones.trim(),
    );

    try {
      if (editando) {
        await repositorio.actualizar(enEdicion!.id, solicitud);
      } else {
        await repositorio.abrir(solicitud);
      }
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      if (fallo.estado == 409) conflicto = fallo.mensaje;
      return fallo.mensaje;
    } finally {
      guardando = false;
      notifyListeners();
    }
  }

  Future<String?> cerrar(int idJornada) async {
    try {
      await repositorio.cerrar(idJornada);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    }
  }

  Future<String?> reabrir(int idJornada) async {
    try {
      await repositorio.reabrir(idJornada);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    }
  }

  /// La jornada completa de un modulo, con su nomina. La lista de opciones
  /// trae solo el resumen, asi que el detalle se pide aparte.
  Future<JornadaEntity?> detalleDeModulo(int modulo) async {
    try {
      return await repositorio.deModulo(modulo, fecha: fecha);
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
      notifyListeners();
      return null;
    }
  }
}
