import '../../core/conversiones.dart';
import '../../domain/entities/franja_entity.dart';

class FranjaModel extends FranjaEntity {
  const FranjaModel({
    required super.orden,
    required super.horaInicio,
    required super.horaFin,
    required super.minutos,
    super.etiqueta,
  });

  factory FranjaModel.fromJson(Map<String, dynamic> json) => FranjaModel(
        orden: aInt(json['orden_franja'] ?? json['hora_jornada']),
        // Las columnas TIME llegan como "07:00:00".
        horaInicio: aTexto(json['hora_inicio']),
        horaFin: aTexto(json['hora_fin']),
        // Sin minutos declarados se asume la hora plena; el backend siempre
        // los manda, pero un 0 aqui dejaria la meta de la franja en cero.
        minutos: aInt(json['minutos'], 60),
        etiqueta: aTextoNulo(json['etiqueta']),
      );
}

class HorarioModel extends HorarioEntity {
  const HorarioModel({
    super.idJornada,
    super.codigo,
    super.nombre,
    required super.minutosTotales,
    required super.franjas,
  });

  factory HorarioModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const HorarioModel(minutosTotales: 0, franjas: []);
    }

    final franjas = aListaDeMapas(json['franjas']).map(FranjaModel.fromJson).toList();

    return HorarioModel(
      idJornada: aIntNulo(json['id_jornada']),
      codigo: aTextoNulo(json['codigo']),
      nombre: aTextoNulo(json['nombre']),
      // Si el backend no manda el total, se suma: es la misma cuenta que hace
      // `vw_horario_jornada`, y asi la pantalla nunca queda sin el dato.
      minutosTotales: aIntNulo(json['minutos_totales']) ??
          franjas.fold<int>(0, (total, franja) => total + franja.minutos),
      franjas: franjas,
    );
  }
}
