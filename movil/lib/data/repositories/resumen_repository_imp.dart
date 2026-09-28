import '../../core/api_cliente.dart';
import '../../core/conversiones.dart';
import '../../domain/entities/resumen_entity.dart';
import '../../domain/repositories/resumen_repository.dart';
import '../models/resumen_model.dart';

class ResumenRepositoryImpl implements ResumenRepository {
  final ApiCliente api;

  ResumenRepositoryImpl(this.api);

  @override
  Future<ResumenEntity> deHoy() async {
    final respuesta = await api.obtener('/indicadores/resumen', consulta: {'periodo': 'hoy'});
    return ResumenModel.fromJson(aMapaNulo(respuesta) ?? const {});
  }
}
