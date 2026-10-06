/// La orden de produccion: el compromiso sobre un lote.
///
/// NO NOMBRA MODULO. Nace libre y espera en el tablero a que un modulo la tome,
/// y eso pasa en un solo sitio: cuando la digitadora abre la jornada con ella.
/// Desde ese momento ningun otro modulo puede cogerla.
///
/// `idModulo` y `codigoModulo` vienen igual en el listado, pero son deducidos:
/// la vista `vw_avance_orden` los saca de quien la tomo. No se pueden escribir.
///
/// Lo unico que la orden aporta al calculo de la hora es `valorMaquilaUnidad`:
/// los pesos que el cliente paga por prenda. Con el, cada franja se lee tambien
/// en dinero, que es la columna que la empresa mira.
class OrdenEntity {
  final int id;
  final String numeroOrden;
  final String estado;

  /// Posicion en la cola global: la asigna el backend al crear, no se
  /// edita. El numero mas bajo es la orden mas vieja esperando turno.
  final int? prioridad;

  final int idLote;
  final String? codigoLote;
  final String? codigoReferencia;
  final String? nombreReferencia;
  final double? samPactado;
  final String? numeroPedido;

  final int? idCliente;
  final String? nombreCliente;

  /// El modulo que la tomo, o null si sigue libre.
  final int? idModulo;
  final String? codigoModulo;
  final String? nombreModulo;

  /// 'LIBRE' o 'TOMADA', que es lo que la vista calcula.
  final String asignacion;
  final String? tomadaEl;

  final int cantidadProgramada;

  /// El supuesto de planeacion que German ajusta a mano por pedido (no
  /// la eficiencia real, que se mide sola). Puede quedar vacio.
  final double? eficienciaEsperada;

  final int unidadesProducidas;
  final int unidadesDefectuosas;
  final int unidadesRestantes;
  final double porcentajeAvance;
  final int horasRegistradas;

  /// Eficiencia de la orden: minutos ganados sobre minutos puestos.
  final double eficiencia;

  /// Lo que el sistema midio de verdad, contra el SAM que se pacto. Esta
  /// comparacion es el producto principal de BGoat.
  final double? samObservado;

  final double? valorMaquilaUnidad;
  final double? tarifaMinutoPactada;
  final double? tarifaMinutoReal;

  final String? fechaEmision;

  /// Cuando llego el lote a la planta. Es la unica fecha de ingreso que se
  /// muestra ("Recepcion"): `fechaEmision` es solo cuando se digito la orden.
  final String? fechaRecepcion;
  final String? fechaInicioProgramada;
  final String? fechaFinProgramada;
  final String? fechaInicioReal;
  final String? fechaFinReal;

  final String? observaciones;

  const OrdenEntity({
    required this.id,
    required this.numeroOrden,
    required this.estado,
    this.prioridad,
    required this.idLote,
    this.codigoLote,
    this.codigoReferencia,
    this.nombreReferencia,
    this.samPactado,
    this.numeroPedido,
    this.idCliente,
    this.nombreCliente,
    this.idModulo,
    this.codigoModulo,
    this.nombreModulo,
    required this.asignacion,
    this.tomadaEl,
    required this.cantidadProgramada,
    this.eficienciaEsperada,
    required this.unidadesProducidas,
    required this.unidadesDefectuosas,
    required this.unidadesRestantes,
    required this.porcentajeAvance,
    required this.horasRegistradas,
    required this.eficiencia,
    this.samObservado,
    this.valorMaquilaUnidad,
    this.tarifaMinutoPactada,
    this.tarifaMinutoReal,
    this.fechaEmision,
    this.fechaRecepcion,
    this.fechaInicioProgramada,
    this.fechaFinProgramada,
    this.fechaInicioReal,
    this.fechaFinReal,
    this.observaciones,
  });

  bool get estaLibre => asignacion == 'LIBRE';

  /// El avance como fraccion, recortado a 1 para la barra de progreso: una
  /// orden puede producir mas de lo programado y la barra no puede pasarse.
  double get avanceNormalizado => (porcentajeAvance / 100).clamp(0, 1).toDouble();

  /// La orden va tarde si la fecha de fin ya paso y todavia le falta.
  bool get estaEnRiesgo {
    if (fechaFinProgramada == null) return false;
    if (unidadesRestantes <= 0) return false;
    if (estado == 'FINALIZADO') return false;
    final limite = DateTime.tryParse(fechaFinProgramada!.substring(0, 10));
    if (limite == null) return false;
    return limite.isBefore(DateTime.now());
  }

  /// El SAM real contra el pactado. Positivo = se demoro mas de lo que el
  /// cliente paga, y esa diferencia la absorbe la empresa.
  double? get desviacionSam {
    if (samObservado == null || samPactado == null || samPactado == 0) return null;
    return samObservado! - samPactado!;
  }
}
