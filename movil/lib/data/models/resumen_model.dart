import '../../core/conversiones.dart';
import '../../domain/entities/resumen_entity.dart';

class ResumenModel extends ResumenEntity {
  const ResumenModel({
    required super.produccionPeriodo,
    required super.eficiencia,
    required super.cumplimientoMeta,
    required super.porcentajeDefectos,
  });

  factory ResumenModel.fromJson(Map<String, dynamic> json) => ResumenModel(
        produccionPeriodo: aInt(json['produccion_periodo']),
        eficiencia: aDouble(json['eficiencia']),
        cumplimientoMeta: aDouble(json['cumplimiento_meta']),
        porcentajeDefectos: aDouble(json['porcentaje_defectos']),
      );
}
