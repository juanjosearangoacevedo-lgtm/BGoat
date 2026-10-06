import 'catalogo_entity.dart';
import 'lote_entity.dart';
import 'orden_entity.dart';

/// Un puesto de la jornada: una silla del modulo, con o sin nombre.
///
/// `idOperaria` en null es una operaria ANONIMA, y es el caso normal a primera
/// hora: la digitadora sabe que hay cinco maquinas andando mucho antes de saber
/// el nombre de las cinco. Cuenta igual para los minutos disponibles, solo no
/// recibe atribucion individual.
class PuestoJornadaEntity {
  final int? id;
  final int numero;
  final int? idOperaria;
  final String? codigoOperaria;
  final String? nombres;
  final String? apellidos;

  const PuestoJornadaEntity({
    this.id,
    required this.numero,
    this.idOperaria,
    this.codigoOperaria,
    this.nombres,
    this.apellidos,
  });

  bool get esAnonima => idOperaria == null;

  String get nombreMostrado {
    if (esAnonima) return 'Operaria $numero (sin identificar)';
    return '${nombres ?? ''} ${apellidos ?? ''}'.trim();
  }
}

/// La jornada de un modulo en un dia: lo que la digitadora configura al entrar.
///
/// Es el requisito de entrada de todo lo demas. Una hora solo se puede
/// registrar si su modulo tiene jornada abierta: la jornada es la que dice que
/// lote corre y con cuantas operarias, y de ahi sale el SAM.
class JornadaEntity {
  final int id;
  final int idModulo;
  final String codigoModulo;
  final String nombreModulo;
  final int? capacidadOperarios;
  final double umbralCumplimiento;

  final String fecha;
  final String estado;

  final int idLote;
  final String? codigoLote;
  final String? codigoReferencia;
  final String? nombreReferencia;
  final double? samPactado;
  final String? rutaImagen;
  final String? rutaDocumentoPdf;
  final int? cantidadProgramada;

  final int? idCliente;
  final String? nombreCliente;

  /// La orden que este modulo tomo. Puede ser null: la jornada arranca igual,
  /// con meta y facturacion completas desde la primera hora -- las dos salen
  /// del lote. Sin orden, la produccion solo queda sin contar en el avance de
  /// una orden puntual.
  final int? idOrden;
  final String? numeroOrden;

  /// Viene del lote (`valorMaquilaUnidad` en `LoteEntity`), no de la orden:
  /// se muestra aqui porque la jornada ya trae el lote resuelto.
  final double? valorMaquilaUnidad;

  final int cantidadOperarias;
  final List<PuestoJornadaEntity> puestos;

  final String? nombreDigitadora;
  final String? fechaApertura;
  final String? fechaCierre;
  final String? observaciones;

  const JornadaEntity({
    required this.id,
    required this.idModulo,
    required this.codigoModulo,
    required this.nombreModulo,
    this.capacidadOperarios,
    required this.umbralCumplimiento,
    required this.fecha,
    required this.estado,
    required this.idLote,
    this.codigoLote,
    this.codigoReferencia,
    this.nombreReferencia,
    this.samPactado,
    this.rutaImagen,
    this.rutaDocumentoPdf,
    this.cantidadProgramada,
    this.idCliente,
    this.nombreCliente,
    this.idOrden,
    this.numeroOrden,
    this.valorMaquilaUnidad,
    required this.cantidadOperarias,
    required this.puestos,
    this.nombreDigitadora,
    this.fechaApertura,
    this.fechaCierre,
    this.observaciones,
  });

  bool get estaAbierta => estado == 'ABIERTA';

  int get operariasIdentificadas => puestos.where((p) => !p.esAnonima).length;

  /// El SAM y el valor de maquila salen del lote, no de la orden: la meta y
  /// la facturacion se calculan igual sin ella. Lo unico que se pierde sin
  /// orden es que la produccion no queda contada en el avance de ninguna
  /// orden puntual.
  bool get sinOrden => idOrden == null;

  /// La meta del dia con los minutos que se le pasen, a partir del SAM pactado.
  double metaDeMinutos(int minutos) {
    final sam = samPactado;
    if (sam == null || sam <= 0) return 0;
    return (cantidadOperarias * minutos) / sam;
  }
}

/// El estado de un modulo en el paso 1 del asistente de inicio de jornada.
///
/// Un modulo sin jornada no es una fila que falta: es informacion. Aparece en
/// gris con el boton de abrirla.
class ModuloDelDiaEntity {
  final ModuloEntity modulo;
  final int? idJornada;
  final String? estadoJornada;
  final int? cantidadOperarias;
  final String? codigoLote;
  final String? nombreCliente;

  const ModuloDelDiaEntity({
    required this.modulo,
    this.idJornada,
    this.estadoJornada,
    this.cantidadOperarias,
    this.codigoLote,
    this.nombreCliente,
  });

  bool get tieneJornada => idJornada != null;
  bool get estaAbierta => estadoJornada == 'ABIERTA';
}

/// Todo lo que el asistente de inicio necesita, en una sola llamada.
///
/// Va junto a proposito: son cuatro catalogos pequenos y la digitadora abre la
/// jornada de pie, con el celular en la mano. Cuatro peticiones en serie son
/// cuatro oportunidades de que la pantalla se quede pensando.
class OpcionesJornadaEntity {
  final String fecha;
  final List<ModuloDelDiaEntity> modulos;
  final List<ClienteEntity> clientes;
  final List<LoteEntity> lotes;
  final List<OperariaEntity> operarias;
  final List<OrdenEntity> ordenes;

  const OpcionesJornadaEntity({
    required this.fecha,
    required this.modulos,
    required this.clientes,
    required this.lotes,
    required this.operarias,
    required this.ordenes,
  });

  List<LoteEntity> lotesDe(int? idCliente) {
    if (idCliente == null) return const [];
    return lotes.where((l) => l.idCliente == idCliente).toList();
  }
}

/// Lo que la pantalla manda para abrir o corregir una jornada.
///
/// `operarias` es posicional: la lista de ids en orden de puesto, con null en
/// los puestos que quedan anonimos.
class SolicitudJornada {
  final int idModulo;
  final int idLote;
  final int? idOrden;
  final String fecha;
  final int cantidadOperarias;
  final List<int?> operarias;
  final String? observaciones;

  const SolicitudJornada({
    required this.idModulo,
    required this.idLote,
    this.idOrden,
    required this.fecha,
    required this.cantidadOperarias,
    required this.operarias,
    this.observaciones,
  });
}
