/// Los catalogos que las pantallas necesitan para armar sus formularios.
///
/// Van juntos porque los tres son listas planas de nombre e identificador, y
/// ninguno tiene pantalla propia en la app: se escogen dentro de otra cosa.
library;

/// Para quien se confecciona. El lote siempre cuelga de un cliente.
class ClienteEntity {
  final int id;
  final String nombre;

  /// Cuantos lotes utilizables tiene. Solo viene en `GET /jornada/opciones`,
  /// que no ofrece clientes sin lotes para no dejar a la digitadora en un
  /// paso sin salida.
  final int? lotesDisponibles;

  const ClienteEntity({required this.id, required this.nombre, this.lotesDisponibles});
}

/// Una operaria del catalogo de la planta.
///
/// En la jornada puede no aparecer ninguna: una operaria anonima cuenta igual
/// para los minutos disponibles, solo no recibe atribucion individual.
class OperariaEntity {
  final int id;
  final String? codigo;
  final String nombres;
  final String apellidos;
  final String? especialidad;

  const OperariaEntity({
    required this.id,
    this.codigo,
    required this.nombres,
    required this.apellidos,
    this.especialidad,
  });

  String get nombreCompleto => '$nombres $apellidos'.trim();
}

/// Una incidencia del catalogo: por que se perdio tiempo en esa hora.
///
/// `tipo` separa lo planeado, lo interno y lo externo (del cliente). El ultimo
/// es tiempo perdido negociable, que es justo lo que la empresa hoy absorbe sin
/// medirlo.
class CausaEntity {
  final int id;
  final String codigo;
  final String nombre;
  final String tipo;
  final String? responsable;

  /// Si es true, el backend rechaza el guardado sin una nota que explique.
  final bool requiereNota;

  const CausaEntity({
    required this.id,
    required this.codigo,
    required this.nombre,
    required this.tipo,
    this.responsable,
    required this.requiereNota,
  });
}

/// Un modulo de confeccion: la fila del tablero de pared.
class ModuloEntity {
  final int id;
  final String codigo;
  final String nombre;
  final String? ubicacion;
  final int capacidadOperarios;

  /// Bajo este porcentaje la incidencia deja de ser opcional.
  final double umbralCumplimiento;
  final String estado;

  const ModuloEntity({
    required this.id,
    required this.codigo,
    required this.nombre,
    this.ubicacion,
    required this.capacidadOperarios,
    required this.umbralCumplimiento,
    required this.estado,
  });
}
