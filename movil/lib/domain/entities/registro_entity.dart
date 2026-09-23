/// Los minutos que el modulo estuvo parado por una causa concreta.
///
/// El tiempo perdido se MIDE, no se deduce. Antes el Pareto lo calculaba
/// restando lo ganado a lo disponible, y eso mezcla una parada de maquina con
/// un modulo que simplemente va lento: dos problemas distintos, dos soluciones
/// distintas, un solo numero.
class MinutosPerdidosEntity {
  final int idCausa;
  final int minutos;
  final String? codigo;
  final String? nombre;
  final String? tipo;

  const MinutosPerdidosEntity({
    required this.idCausa,
    required this.minutos,
    this.codigo,
    this.nombre,
    this.tipo,
  });
}

/// Una celda de la rejilla: lo que produjo un modulo en una franja.
///
/// Todos los calculos vienen ya hechos de la vista `vw_registro_horario`, no de
/// la app. Es a proposito: la meta, la eficiencia y el SAM observado se
/// calculan en un solo sitio, y asi el celular y el panel web no pueden
/// mostrar numeros distintos sobre la misma hora.
class RegistroEntity {
  final int id;
  final String fecha;
  final int horaJornada;
  final int minutosFranja;
  final String? etiquetaFranja;
  final String? horaInicio;
  final String? horaFin;

  final int idModulo;
  final String? codigoModulo;
  final double? umbralCumplimiento;

  final int? idLote;
  final String? codigoLote;
  final String? nombreReferencia;
  final String? nombreCliente;
  final int? idOrden;
  final String? numeroOrden;

  final int personasPresentes;
  final int unidadesProducidas;
  final int unidadesDefectuosas;
  final int unidadesConformes;

  final double? samAplicado;
  final double? precioAplicado;

  /// Personas por minutos de la franja. El ancho real, no un 60 fijo.
  final int minutosDisponibles;

  /// Minutos disponibles sobre el SAM: cuantas prendas debian salir.
  final double metaHora;

  /// Unidades sobre meta. El tablero de la empresa lo llama
  /// "% EFICIENCIA HORA REAL". La vista devuelve el mismo numero con los dos
  /// nombres porque en planta se usan las dos palabras.
  final double eficiencia;

  final double minutosGanados;

  /// Lo que la hora costo de verdad por prenda. Comparado con el SAM pactado,
  /// es el producto principal del sistema.
  final double? samObservado;

  final double facturacionMeta;
  final double facturacionReal;

  final int minutosPerdidos;
  final int minutosPerdidosPersona;
  final List<MinutosPerdidosEntity> detallePerdidas;

  final int? idCausa;
  final String? codigoCausa;
  final String? nombreCausa;
  final String? nota;
  final String estado;
  final String? nombreRegistrador;

  const RegistroEntity({
    required this.id,
    required this.fecha,
    required this.horaJornada,
    required this.minutosFranja,
    this.etiquetaFranja,
    this.horaInicio,
    this.horaFin,
    required this.idModulo,
    this.codigoModulo,
    this.umbralCumplimiento,
    this.idLote,
    this.codigoLote,
    this.nombreReferencia,
    this.nombreCliente,
    this.idOrden,
    this.numeroOrden,
    required this.personasPresentes,
    required this.unidadesProducidas,
    required this.unidadesDefectuosas,
    required this.unidadesConformes,
    this.samAplicado,
    this.precioAplicado,
    required this.minutosDisponibles,
    required this.metaHora,
    required this.eficiencia,
    required this.minutosGanados,
    this.samObservado,
    required this.facturacionMeta,
    required this.facturacionReal,
    required this.minutosPerdidos,
    required this.minutosPerdidosPersona,
    this.detallePerdidas = const [],
    this.idCausa,
    this.codigoCausa,
    this.nombreCausa,
    this.nota,
    required this.estado,
    this.nombreRegistrador,
  });

  bool get tieneIncidencia => idCausa != null;

  /// Cuantas prendas falto para la meta. Negativo = se paso.
  double get faltante => metaHora - unidadesProducidas;
}

/// Una hora que ya vencio y todavia no tiene registro.
///
/// Es lo que alimenta el recordatorio. Solo se reclama una franja que YA
/// termino: pedir la hora en curso es pedir un dato que todavia no existe.
class PendienteEntity {
  final int idJornada;
  final int idModulo;
  final String? codigoLote;
  final String? nombreCliente;
  final int horaJornada;
  final String? etiqueta;
  final String? horaFin;
  final int minutos;

  const PendienteEntity({
    required this.idJornada,
    required this.idModulo,
    this.codigoLote,
    this.nombreCliente,
    required this.horaJornada,
    this.etiqueta,
    this.horaFin,
    required this.minutos,
  });
}

/// Lo que la pantalla manda al guardar una celda.
///
/// El SAM y el precio NO van aqui: salen del lote y de la orden que la jornada
/// declaro. La digitadora no digita ninguno de los dos.
class SolicitudCaptura {
  final int idModulo;
  final String fecha;
  final int horaJornada;
  final int personasPresentes;
  final int unidadesProducidas;
  final int unidadesDefectuosas;
  final int? idCausa;
  final String? nota;
  final List<MinutosPerdidosEntity> minutosPerdidos;

  const SolicitudCaptura({
    required this.idModulo,
    required this.fecha,
    required this.horaJornada,
    required this.personasPresentes,
    required this.unidadesProducidas,
    this.unidadesDefectuosas = 0,
    this.idCausa,
    this.nota,
    this.minutosPerdidos = const [],
  });
}
