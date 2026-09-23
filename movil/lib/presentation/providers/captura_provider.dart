import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/fechas.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/catalogo_entity.dart';
import '../../domain/entities/franja_entity.dart';
import '../../domain/entities/registro_entity.dart';
import '../../domain/repositories/captura_repository.dart';

/// El resultado de intentar guardar una celda.
///
/// No basta con "salio bien" o "fallo": el backend rechaza el guardado cuando
/// la eficiencia cae bajo el umbral y no se dijo que paso, y eso no es un error
/// sino una pregunta. La pantalla necesita distinguirlo para abrir el selector
/// de incidencias en vez de mostrar un mensaje rojo.
class ResultadoCaptura {
  final bool guardado;
  final String? mensaje;
  final bool pideCausa;
  final bool pideNota;
  final bool pideJornada;

  const ResultadoCaptura({
    required this.guardado,
    this.mensaje,
    this.pideCausa = false,
    this.pideNota = false,
    this.pideJornada = false,
  });

  const ResultadoCaptura.ok() : this(guardado: true);
}

/// El registro de produccion: la rejilla de modulos por franjas.
///
/// Reemplaza el tablero de pared, que se borra cada noche y obliga a unas 200
/// cuentas a mano al dia. Aqui la meta, la eficiencia y el dinero salen de la
/// base ya calculados.
class CapturaProvider extends ChangeNotifier {
  final CapturaRepository repositorio;

  CapturaProvider(this.repositorio);

  String fecha = hoy();
  RejillaEntity? rejilla;
  List<PendienteEntity> pendientes = const [];

  bool cargando = false;
  bool guardando = false;
  String? error;

  /// El modulo que la pantalla tiene abierto. null = la vista de toda la planta.
  int? moduloAbierto;

  HorarioEntity get horario =>
      rejilla?.horario ?? const HorarioEntity(minutosTotales: 0, franjas: []);

  List<FranjaEntity> get franjas => horario.franjas;

  List<ModuloCapturaEntity> get modulos => rejilla?.modulos ?? const [];

  /// Solo los modulos con jornada: son los unicos donde se puede capturar.
  List<ModuloCapturaEntity> get capturables => rejilla?.conJornada ?? const [];

  List<CausaEntity> get causas => rejilla?.causas ?? const [];

  ModuloCapturaEntity? get moduloActual =>
      moduloAbierto == null ? null : rejilla?.moduloDe(moduloAbierto!);

  /// Cuantas horas vencidas estan sin registrar en todo el dia.
  int get totalPendientes => pendientes.length;

  /// Las horas pendientes de un modulo, que es como las mira la digitadora.
  List<PendienteEntity> pendientesDe(int idModulo) =>
      pendientes.where((p) => p.idModulo == idModulo).toList();

  Future<void> cargar({String? nuevaFecha}) async {
    if (nuevaFecha != null) fecha = nuevaFecha;

    cargando = true;
    error = null;
    notifyListeners();

    try {
      // Las dos van juntas: la rejilla dice que hay y los pendientes dicen que
      // falta. Pedirlas en paralelo ahorra un viaje completo.
      final resultados = await Future.wait([
        repositorio.rejilla(fecha: fecha),
        repositorio.pendientes(fecha: fecha),
      ]);

      rejilla = resultados[0] as RejillaEntity;
      pendientes = resultados[1] as List<PendienteEntity>;
    } on ApiError catch (fallo) {
      error = fallo.mensaje;
    } finally {
      cargando = false;
      notifyListeners();
    }
  }

  /// Solo los pendientes. Es la consulta barata del recordatorio: la pantalla
  /// la repite cada pocos minutos y traer la rejilla entera cada vez es caro.
  Future<void> refrescarPendientes() async {
    try {
      pendientes = await repositorio.pendientes(fecha: fecha);
      notifyListeners();
    } on ApiError {
      // Un fallo del recordatorio no puede tumbar la pantalla de captura.
    }
  }

  void abrirModulo(int? idModulo) {
    moduloAbierto = idModulo;
    notifyListeners();
  }

  /// Guarda una celda de la rejilla.
  ///
  /// Es idempotente: si la celda ya existe se corrige. La digitadora a veces va
  /// atrasada y se desatrasa, y la rejilla se lo permite dentro del mismo dia.
  Future<ResultadoCaptura> guardar(SolicitudCaptura solicitud) async {
    guardando = true;
    notifyListeners();

    try {
      await repositorio.guardar(solicitud);
      await cargar();
      return const ResultadoCaptura.ok();
    } on ApiError catch (fallo) {
      return ResultadoCaptura(
        guardado: false,
        mensaje: fallo.mensaje,
        pideCausa: fallo.requiereCausa,
        pideNota: fallo.requiereNota,
        pideJornada: fallo.requiereJornada,
      );
    } finally {
      guardando = false;
      notifyListeners();
    }
  }

  Future<String?> anular(int idRegistro) async {
    try {
      await repositorio.anular(idRegistro);
      await cargar();
      return null;
    } on ApiError catch (fallo) {
      return fallo.mensaje;
    }
  }
}
