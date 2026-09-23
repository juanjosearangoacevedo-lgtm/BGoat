import '../../core/conversiones.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/registro_entity.dart';
import 'catalogo_model.dart';
import 'franja_model.dart';
import 'jornada_model.dart';
import 'registro_model.dart';

class ResumenModuloModel extends ResumenModuloEntity {
  const ResumenModuloModel({
    required super.franjasRegistradas,
    required super.franjasPendientes,
    required super.unidadesProducidas,
    required super.unidadesDefectuosas,
    required super.metaDia,
    required super.eficiencia,
    required super.facturacionMeta,
    required super.facturacionReal,
    super.cumplimientoFacturacion,
    required super.minutosPerdidos,
  });

  factory ResumenModuloModel.fromJson(Map<String, dynamic>? json) {
    final mapa = json ?? const <String, dynamic>{};
    return ResumenModuloModel(
      franjasRegistradas: aInt(mapa['franjas_registradas']),
      franjasPendientes: aInt(mapa['franjas_pendientes']),
      unidadesProducidas: aInt(mapa['unidades_producidas']),
      unidadesDefectuosas: aInt(mapa['unidades_defectuosas']),
      metaDia: aDouble(mapa['meta_dia']),
      eficiencia: aDouble(mapa['eficiencia']),
      facturacionMeta: aDouble(mapa['facturacion_meta']),
      facturacionReal: aDouble(mapa['facturacion_real']),
      cumplimientoFacturacion: aDoubleNulo(mapa['cumplimiento_facturacion']),
      minutosPerdidos: aInt(mapa['minutos_perdidos']),
    );
  }
}

class ModuloCapturaModel extends ModuloCapturaEntity {
  const ModuloCapturaModel({
    required super.modulo,
    super.jornada,
    required super.tieneJornada,
    super.samSugerido,
    super.precioSugerido,
    required super.personasSugeridas,
    required super.celdas,
    required super.resumen,
  });

  factory ModuloCapturaModel.fromJson(Map<String, dynamic> json) {
    // `celdas` llega como objeto con el numero de franja por clave: { "1": {...} }.
    final crudas = aMapaNulo(json['celdas']) ?? const <String, dynamic>{};
    final celdas = <int, RegistroEntity>{};

    crudas.forEach((clave, valor) {
      final franja = int.tryParse(clave);
      final mapa = aMapaNulo(valor);
      if (franja == null || mapa == null) return;
      celdas[franja] = RegistroModel.fromJson(mapa);
    });

    final jornada = aMapaNulo(json['jornada']);

    return ModuloCapturaModel(
      modulo: ModuloModel.fromJson(json),
      // La jornada que viene dentro de la rejilla es la version corta
      // (`SELECT_JORNADA_MODULO`): no trae la nomina ni el nombre del modulo,
      // asi que se completan con lo que ya tiene la fila.
      jornada: jornada == null
          ? null
          : JornadaModel.fromJson({
              ...jornada,
              'codigo_modulo': json['codigo'],
              'nombre_modulo': json['nombre'],
              'umbral_cumplimiento': json['umbral_cumplimiento'],
              'capacidad_operarios': json['capacidad_operarios'],
            }),
      tieneJornada: aBool(json['tiene_jornada']),
      samSugerido: aDoubleNulo(json['sam_sugerido']),
      precioSugerido: aDoubleNulo(json['precio_sugerido']),
      personasSugeridas: aInt(json['personas_sugeridas']),
      celdas: celdas,
      resumen: ResumenModuloModel.fromJson(aMapaNulo(json['resumen'])),
    );
  }
}

class RejillaModel extends RejillaEntity {
  const RejillaModel({
    required super.fecha,
    required super.horario,
    required super.causas,
    required super.modulos,
    required super.modulosConJornada,
    required super.modulosSinJornada,
    required super.celdasTotales,
    required super.celdasRegistradas,
  });

  factory RejillaModel.fromJson(Map<String, dynamic> json) {
    final resumen = aMapaNulo(json['resumen']) ?? const <String, dynamic>{};

    return RejillaModel(
      fecha: aFechaNula(json['fecha']) ?? '',
      horario: HorarioModel.fromJson(aMapaNulo(json['jornada'])),
      causas: aListaDeMapas(json['causas']).map(CausaModel.fromJson).toList(),
      modulos: aListaDeMapas(json['modulos']).map(ModuloCapturaModel.fromJson).toList(),
      modulosConJornada: aInt(resumen['modulos_con_jornada']),
      modulosSinJornada: aInt(resumen['modulos_sin_jornada']),
      celdasTotales: aInt(resumen['celdas_totales']),
      celdasRegistradas: aInt(resumen['celdas_registradas']),
    );
  }
}
