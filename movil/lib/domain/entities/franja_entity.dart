/// Una franja de la jornada: el "ancho" de una hora de planta.
///
/// La franja manda, no el reloj. No todas duran 60 minutos: de martes a viernes
/// la ultima son 40 y el sabado 20. Con un 60 fijo la meta de esas franjas
/// quedaba inflada y el modulo aparecia mal sin serlo.
class FranjaEntity {
  /// El numero de la franja dentro del dia (1, 2, 3...). Es la llave con la que
  /// se guarda el registro: `hora_jornada`.
  final int orden;

  final String horaInicio;
  final String horaFin;
  final int minutos;
  final String? etiqueta;

  const FranjaEntity({
    required this.orden,
    required this.horaInicio,
    required this.horaFin,
    required this.minutos,
    this.etiqueta,
  });

  /// Una franja que no dura los 60 de siempre: la pantalla la marca porque su
  /// meta es menor y eso confunde si no se avisa.
  bool get esCorta => minutos < 60;
}

/// El horario que rige una fecha: 520 minutos de martes a viernes, 440 el
/// sabado. Un dia sin jornada (el domingo) llega con la lista vacia.
///
/// Cambiar el horario de la planta es cambiar filas en `jornada_franjas`, no
/// codigo: ningun calculo tiene el 60 escrito adentro.
class HorarioEntity {
  final int? idJornada;
  final String? codigo;
  final String? nombre;
  final int minutosTotales;
  final List<FranjaEntity> franjas;

  const HorarioEntity({
    this.idJornada,
    this.codigo,
    this.nombre,
    required this.minutosTotales,
    required this.franjas,
  });

  bool get esDiaLaboral => franjas.isNotEmpty;

  double get horasTotales => minutosTotales / 60;

  FranjaEntity? franjaDe(int orden) {
    for (final franja in franjas) {
      if (franja.orden == orden) return franja;
    }
    return null;
  }
}
