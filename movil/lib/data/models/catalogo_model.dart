import '../../core/conversiones.dart';
import '../../domain/entities/catalogo_entity.dart';

class ClienteModel extends ClienteEntity {
  const ClienteModel({
    required super.id,
    required super.nombre,
    super.lotesDisponibles,
  });

  factory ClienteModel.fromJson(Map<String, dynamic> json) => ClienteModel(
        id: aInt(json['id_cliente']),
        nombre: aTexto(json['nombre'], 'Sin nombre'),
        lotesDisponibles: aIntNulo(json['lotes_disponibles']),
      );
}

class OperariaModel extends OperariaEntity {
  const OperariaModel({
    required super.id,
    super.codigo,
    required super.nombres,
    required super.apellidos,
    super.especialidad,
  });

  factory OperariaModel.fromJson(Map<String, dynamic> json) => OperariaModel(
        id: aInt(json['id_operario']),
        codigo: aTextoNulo(json['codigo_operario']),
        nombres: aTexto(json['nombres']),
        apellidos: aTexto(json['apellidos']),
        especialidad: aTextoNulo(json['especialidad']),
      );
}

class CausaModel extends CausaEntity {
  const CausaModel({
    required super.id,
    required super.codigo,
    required super.nombre,
    required super.tipo,
    super.responsable,
    required super.requiereNota,
  });

  factory CausaModel.fromJson(Map<String, dynamic> json) => CausaModel(
        id: aInt(json['id_causa']),
        codigo: aTexto(json['codigo']),
        nombre: aTexto(json['nombre']),
        tipo: aTexto(json['tipo'], 'INTERNA'),
        responsable: aTextoNulo(json['responsable']),
        // MySQL guarda los TINYINT(1) como 0 y 1, no como true y false.
        requiereNota: aBool(json['requiere_nota']),
      );
}

class ModuloModel extends ModuloEntity {
  const ModuloModel({
    required super.id,
    required super.codigo,
    required super.nombre,
    super.ubicacion,
    required super.capacidadOperarios,
    required super.umbralCumplimiento,
    required super.estado,
  });

  factory ModuloModel.fromJson(Map<String, dynamic> json) => ModuloModel(
        id: aInt(json['id_modulo']),
        codigo: aTexto(json['codigo'], aTexto(json['codigo_modulo'])),
        nombre: aTexto(json['nombre'], aTexto(json['nombre_modulo'])),
        ubicacion: aTextoNulo(json['ubicacion']),
        capacidadOperarios: aInt(json['capacidad_operarios']),
        // Si el modulo no declara umbral, se usa el 80% que trae el esquema.
        umbralCumplimiento: aDouble(json['umbral_cumplimiento'], 80),
        estado: aTexto(json['estado'], 'ACTIVO'),
      );
}
