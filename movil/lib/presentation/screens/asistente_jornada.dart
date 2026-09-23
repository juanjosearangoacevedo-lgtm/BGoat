import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_cliente.dart';
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/catalogo_entity.dart';
import '../../domain/entities/jornada_entity.dart';
import '../../domain/entities/lote_entity.dart';
import '../../domain/entities/orden_entity.dart';
import '../providers/jornada_provider.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// El asistente de inicio de jornada, en cuatro pasos.
///
/// Sigue la rutina real: escoge el modulo, escoge cliente y lote --que trae la
/// referencia y el SAM--, confirma la orden y declara cuantas operarias hay.
/// Se parte en pasos porque la digitadora lo hace de pie, con el celular en la
/// mano, y un formulario de veinte campos en esa posicion no se llena.
class AsistenteJornadaScreen extends StatelessWidget {
  const AsistenteJornadaScreen({super.key});

  static const _titulos = ['Modulo', 'Trabajo', 'Orden', 'Operarias'];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<JornadaProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(provider.editando ? 'Corregir jornada' : 'Abrir jornada'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: _pasos(provider),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(child: _contenido(context, provider)),
            _pie(context, provider),
          ],
        ),
      ),
    );
  }

  Widget _pasos(JornadaProvider provider) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: List.generate(_titulos.length, (indice) {
          final hecho = indice < provider.paso;
          final actual = indice == provider.paso;

          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: indice == _titulos.length - 1 ? 0 : 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: hecho || actual
                          ? Paleta.naranja
                          : Colors.white.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    _titulos[indice],
                    style: TextStyle(
                      fontSize: 11,
                      color: actual ? Colors.white : Colors.white.withValues(alpha: 0.6),
                      fontWeight: actual ? FontWeight.w700 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _contenido(BuildContext context, JornadaProvider provider) {
    switch (provider.paso) {
      case 0:
        return _PasoModulo(provider: provider);
      case 1:
        return _PasoTrabajo(provider: provider);
      case 2:
        return _PasoOrden(provider: provider);
      default:
        return _PasoOperarias(provider: provider);
    }
  }

  Widget _pie(BuildContext context, JornadaProvider provider) {
    final esUltimo = provider.paso == JornadaProvider.ultimoPaso;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Paleta.tarjeta,
        border: Border(top: BorderSide(color: Paleta.borde)),
      ),
      child: Row(
        children: [
          if (provider.paso > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: provider.guardando ? null : provider.retroceder,
                child: const Text('Atras'),
              ),
            ),
          if (provider.paso > 0) const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: FilledButton(
              onPressed: !provider.puedeAvanzar || provider.guardando
                  ? null
                  : () => esUltimo ? _guardar(context, provider) : provider.avanzar(),
              child: provider.guardando
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    )
                  : Text(esUltimo
                      ? (provider.editando ? 'Guardar cambios' : 'Iniciar jornada')
                      : 'Siguiente'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _guardar(BuildContext context, JornadaProvider provider) async {
    final fallo = await provider.guardar();

    if (!context.mounted) return;

    if (fallo == null) {
      Navigator.pop(context, true);
      return;
    }

    // El 409 es la regla de negocio, no un error tecnico: otro modulo se llevo
    // la orden mientras el asistente estaba abierto. Se explica y se deja
    // volver al paso de la orden para escoger otra.
    if (provider.conflicto != null) {
      await showDialog<void>(
        context: context,
        builder: (dialogo) => AlertDialog(
          title: const Text('Esa orden ya la tomaron'),
          content: Text(
            '${provider.conflicto}\n\n'
            'Una orden la trabaja un solo modulo. Escoja otra, o siga sin orden: '
            'la meta se calcula igual con el SAM del lote.',
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogo);
                provider.irAPaso(2);
              },
              child: const Text('Escoger otra'),
            ),
          ],
        ),
      );
      return;
    }

    avisar(context, fallo, esError: true);
  }
}

// =====================================================================
// Paso 1 — el modulo
// =====================================================================
class _PasoModulo extends StatelessWidget {
  final JornadaProvider provider;

  const _PasoModulo({required this.provider});

  @override
  Widget build(BuildContext context) {
    final libres = provider.modulosLibres;
    final ocupados = provider.modulosAbiertos;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _Enunciado(
          titulo: 'Que modulo va a trabajar',
          detalle: 'Un modulo abre una sola jornada por dia.',
        ),
        ...libres.map((modulo) => Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: _opcionModulo(modulo, habilitado: true),
            )),
        if (ocupados.isNotEmpty) ...[
          const SizedBox(height: 14),
          const TituloSeccion(
            'Ya abrieron hoy',
            detalle: 'Se pueden corregir desde la lista de jornadas',
          ),
          ...ocupados.map((modulo) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                // En edicion si se deja escoger el que ya tiene jornada: es
                // justamente el que se esta corrigiendo.
                child: _opcionModulo(
                  modulo,
                  habilitado: provider.editando && modulo.modulo.id == provider.idModulo,
                ),
              )),
        ],
      ],
    );
  }

  Widget _opcionModulo(ModuloDelDiaEntity modulo, {required bool habilitado}) {
    final elegido = provider.idModulo == modulo.modulo.id;

    return Opacity(
      opacity: habilitado ? 1 : 0.5,
      child: Tarjeta(
        alTocar: habilitado ? () => provider.elegirModulo(modulo.modulo.id) : null,
        borde: elegido ? Paleta.morado : null,
        hijo: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (elegido ? Paleta.morado : Paleta.textoSuave).withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(11),
              ),
              alignment: Alignment.center,
              child: Text(
                modulo.modulo.codigo,
                style: TextStyle(
                  color: elegido ? Paleta.morado : Paleta.textoSuave,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    modulo.modulo.nombre,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    modulo.tieneJornada
                        ? 'Corriendo ${modulo.codigoLote ?? "un lote"}'
                        : '${modulo.modulo.capacidadOperarios} puestos · umbral '
                            '${modulo.modulo.umbralCumplimiento.round()}%',
                    style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                  ),
                ],
              ),
            ),
            if (elegido) const Icon(Icons.check_circle, color: Paleta.morado),
          ],
        ),
      ),
    );
  }
}

// =====================================================================
// Paso 2 — cliente y lote
// =====================================================================
class _PasoTrabajo extends StatelessWidget {
  final JornadaProvider provider;

  const _PasoTrabajo({required this.provider});

  @override
  Widget build(BuildContext context) {
    final clientes = provider.opciones?.clientes ?? const <ClienteEntity>[];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _Enunciado(
          titulo: 'Que se va a producir',
          detalle: 'El lote trae la referencia, el SAM pactado y su ficha tecnica.',
        ),
        DropdownButtonFormField<int>(
          initialValue: provider.idCliente,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Cliente',
            prefixIcon: Icon(Icons.business_outlined),
          ),
          hint: const Text('Escoja el cliente'),
          items: clientes
              .map((cliente) => DropdownMenuItem(
                    value: cliente.id,
                    child: Text(
                      '${cliente.nombre}  (${cliente.lotesDisponibles ?? 0})',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ))
              .toList(),
          onChanged: provider.elegirCliente,
        ),
        const SizedBox(height: 16),
        if (provider.idCliente == null)
          const _Nota('Solo aparecen clientes que tienen al menos un lote utilizable.')
        else if (provider.lotesDelCliente.isEmpty)
          const _Nota('Este cliente no tiene lotes disponibles para producir.')
        else ...[
          const TituloSeccion('Lote'),
          ...provider.lotesDelCliente.map((lote) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: _opcionLote(context, lote),
              )),
        ],
      ],
    );
  }

  Widget _opcionLote(BuildContext context, LoteEntity lote) {
    final elegido = provider.idLote == lote.id;
    final api = context.read<ApiCliente>();
    final foto = api.urlDeArchivo(lote.rutaImagen);

    return Tarjeta(
      // Sin SAM no se puede abrir la jornada: el backend lo rechaza porque sin
      // el no hay meta que calcular. Se bloquea aqui para no hacerle perder el
      // viaje a la digitadora.
      alTocar: lote.tieneSam ? () => provider.elegirLote(lote.id) : null,
      borde: elegido ? Paleta.morado : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(9),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: foto != null
                      ? Image.network(
                          foto,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _sinFoto(),
                        )
                      : _sinFoto(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lote.codigoLote,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      lote.nombreReferencia ?? lote.codigoReferencia ?? 'Sin referencia',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (elegido) const Icon(Icons.check_circle, color: Paleta.morado),
            ],
          ),
          const SizedBox(height: 11),
          FilaDeDatos([
            Dato(
              etiqueta: 'SAM pactado',
              valor: lote.tieneSam ? sam(lote.samPactado) : 'Sin SAM',
              color: lote.tieneSam ? Paleta.morado : Paleta.error,
            ),
            Dato(
              etiqueta: 'Programado',
              valor: entero(lote.cantidadProgramada),
            ),
            Dato(etiqueta: 'Estado', valor: EstadoChip.legible(lote.estado)),
          ]),
          if (!lote.tieneSam) ...[
            const SizedBox(height: 9),
            const _Nota(
              'Este lote no tiene SAM pactado. Sin el no se puede calcular la '
              'meta de la hora, asi que no se puede abrir jornada con el.',
              esError: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _sinFoto() => Container(
        color: Paleta.fondo,
        child: const Icon(Icons.checkroom_outlined, color: Paleta.borde, size: 22),
      );
}

// =====================================================================
// Paso 3 — la orden
// =====================================================================
class _PasoOrden extends StatelessWidget {
  final JornadaProvider provider;

  const _PasoOrden({required this.provider});

  @override
  Widget build(BuildContext context) {
    final disponibles = provider.ordenesDelLote;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _Enunciado(
          titulo: 'Con que orden',
          detalle: 'De la orden sale el valor de maquila, que es lo que convierte '
              'la produccion en pesos. Es opcional.',
        ),
        if (disponibles.isEmpty)
          const _Nota(
            'Este lote no tiene ordenes libres. La jornada arranca igual: la meta '
            'sale del SAM del lote, y la facturacion queda en cero hasta que '
            'alguien cree la orden.',
          )
        else
          ...disponibles.map((orden) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: _opcionOrden(orden),
              )),
        const SizedBox(height: 10),
        Tarjeta(
          alTocar: () => provider.elegirOrden(null),
          borde: provider.idOrden == null ? Paleta.morado : null,
          hijo: Row(
            children: [
              Icon(
                provider.idOrden == null
                    ? Icons.radio_button_checked
                    : Icons.radio_button_unchecked,
                color: provider.idOrden == null ? Paleta.morado : Paleta.textoSuave,
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Seguir sin orden',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _opcionOrden(OrdenEntity orden) {
    final elegida = provider.idOrden == orden.id;

    return Tarjeta(
      alTocar: () => provider.elegirOrden(orden.id),
      borde: elegida ? Paleta.morado : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                elegida ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                color: elegida ? Paleta.morado : Paleta.textoSuave,
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Text(
                  orden.numeroOrden,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              PrioridadChip(orden.prioridad),
            ],
          ),
          const SizedBox(height: 11),
          FilaDeDatos([
            Dato(
              etiqueta: 'Valor maquila',
              valor: pesos(orden.valorMaquilaUnidad),
              color: Paleta.exito,
            ),
            Dato(etiqueta: 'Programado', valor: entero(orden.cantidadProgramada)),
            Dato(etiqueta: 'Estado', valor: EstadoChip.legible(orden.estado)),
          ]),
        ],
      ),
    );
  }
}

// =====================================================================
// Paso 4 — las operarias
// =====================================================================
class _PasoOperarias extends StatelessWidget {
  final JornadaProvider provider;

  const _PasoOperarias({required this.provider});

  @override
  Widget build(BuildContext context) {
    final catalogo = provider.opciones?.operarias ?? const <OperariaEntity>[];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _Enunciado(
          titulo: 'Cuantas operarias hay',
          detalle: 'De aqui sale la meta: personas por minutos de la franja, '
              'dividido el SAM.',
        ),
        Tarjeta(
          hijo: Row(
            children: [
              const Expanded(
                child: Text(
                  'Operarias en el modulo',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              IconButton.filledTonal(
                onPressed: provider.cantidadOperarias > 1
                    ? () => provider.cambiarCantidad(provider.cantidadOperarias - 1)
                    : null,
                icon: const Icon(Icons.remove),
              ),
              SizedBox(
                width: 46,
                child: Text(
                  '${provider.cantidadOperarias}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
              ),
              IconButton.filledTonal(
                onPressed: provider.cantidadOperarias < 99
                    ? () => provider.cambiarCantidad(provider.cantidadOperarias + 1)
                    : null,
                icon: const Icon(Icons.add),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _resumenMeta(),
        const SizedBox(height: 18),
        const TituloSeccion(
          'Quienes son',
          detalle: 'Se puede dejar en blanco: una operaria anonima cuenta igual '
              'para los minutos, solo no recibe atribucion individual.',
        ),
        ...List.generate(provider.cantidadOperarias, (indice) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: _puesto(indice, catalogo),
          );
        }),
        const SizedBox(height: 14),
        TextFormField(
          initialValue: provider.observaciones,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Observaciones (opcional)',
            alignLabelWithHint: true,
          ),
          onChanged: provider.cambiarObservaciones,
        ),
      ],
    );
  }

  /// Lo que la digitadora va a tener que cumplir. Se muestra antes de
  /// confirmar: es contra esto que el sistema va a medir al modulo todo el dia.
  Widget _resumenMeta() {
    final lote = provider.loteElegido;
    final meta = provider.metaEstimadaDia;

    return Tarjeta(
      borde: Paleta.morado,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Con esta configuracion',
            style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
          ),
          const SizedBox(height: 10),
          FilaDeDatos([
            Dato(etiqueta: 'SAM', valor: sam(lote?.samPactado)),
            Dato(
              etiqueta: 'Meta del dia',
              valor: meta > 0 ? entero(meta) : '—',
              color: Paleta.morado,
              destacado: true,
            ),
            Dato(
              etiqueta: 'Meta por hora',
              valor: meta > 0 ? decimal(meta / 8.67, 1) : '—',
            ),
          ]),
          const SizedBox(height: 8),
          const Text(
            'Estimada sobre los 520 minutos de martes a viernes. El dato exacto '
            'lo pone la rejilla segun el horario del dia.',
            style: TextStyle(fontSize: 11, color: Paleta.textoSuave, height: 1.35),
          ),
        ],
      ),
    );
  }

  Widget _puesto(int indice, List<OperariaEntity> catalogo) {
    final asignada = provider.operarias.length > indice ? provider.operarias[indice] : null;

    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: asignada == null
              ? Paleta.borde
              : Paleta.morado.withValues(alpha: 0.13),
          child: Text(
            '${indice + 1}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: asignada == null ? Paleta.textoSuave : Paleta.morado,
            ),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: DropdownButtonFormField<int?>(
            initialValue: asignada,
            isExpanded: true,
            decoration: const InputDecoration(
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
            hint: const Text('Sin identificar'),
            items: [
              const DropdownMenuItem<int?>(
                value: null,
                child: Text(
                  'Sin identificar',
                  style: TextStyle(fontStyle: FontStyle.italic, color: Paleta.textoSuave),
                ),
              ),
              ...catalogo.map((operaria) => DropdownMenuItem<int?>(
                    value: operaria.id,
                    child: Text(operaria.nombreCompleto, overflow: TextOverflow.ellipsis),
                  )),
            ],
            onChanged: (valor) => provider.asignarPuesto(indice, valor),
          ),
        ),
      ],
    );
  }
}

// =====================================================================
// Piezas compartidas del asistente
// =====================================================================
class _Enunciado extends StatelessWidget {
  final String titulo;
  final String detalle;

  const _Enunciado({required this.titulo, required this.detalle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titulo, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
          const SizedBox(height: 5),
          Text(
            detalle,
            style: const TextStyle(color: Paleta.textoSuave, height: 1.45, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _Nota extends StatelessWidget {
  final String texto;
  final bool esError;

  const _Nota(this.texto, {this.esError = false});

  @override
  Widget build(BuildContext context) {
    final tono = esError ? Paleta.error : Paleta.info;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tono.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(esError ? Icons.error_outline : Icons.info_outline, size: 17, color: tono),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              texto,
              style: const TextStyle(fontSize: 12, height: 1.4, color: Paleta.texto),
            ),
          ),
        ],
      ),
    );
  }
}
