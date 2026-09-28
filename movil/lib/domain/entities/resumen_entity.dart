/// El resumen del dia: los mismos KPIs que la pestana "Resumen" del Panel
/// web, calculados por `/indicadores/resumen` sobre las mismas vistas de
/// MySQL. Nada se recalcula aqui.
class ResumenEntity {
  final int produccionPeriodo;
  final double eficiencia;
  final double cumplimientoMeta;
  final double porcentajeDefectos;

  const ResumenEntity({
    required this.produccionPeriodo,
    required this.eficiencia,
    required this.cumplimientoMeta,
    required this.porcentajeDefectos,
  });
}
