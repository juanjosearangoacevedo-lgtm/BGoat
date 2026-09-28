import '../entities/resumen_entity.dart';

/// Contrato del resumen del dia.
abstract class ResumenRepository {
  Future<ResumenEntity> deHoy();
}
