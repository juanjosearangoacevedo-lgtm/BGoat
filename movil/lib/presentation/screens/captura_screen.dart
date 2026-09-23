import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/franja_entity.dart';
import '../../domain/entities/registro_entity.dart';
import '../providers/captura_provider.dart';
import '../providers/sesion_provider.dart';
import '../widgets/barra_fecha.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';
import 'celda_captura.dart';
import 'tablero_screen.dart';

/// El registro de produccion: la rejilla de modulos por franjas.
///
/// En un celular la rejilla completa no cabe, asi que se parte en dos niveles:
/// primero los modulos --con cuantas horas les faltan-- y adentro las franjas
/// del modulo. Es el mismo dato que el panel web muestra como tabla.
class CapturaScreen extends StatefulWidget {
  const CapturaScreen({super.key});

  @override
  State<CapturaScreen> createState() => _CapturaScreenState();
}

class _CapturaScreenState extends State<CapturaScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CapturaProvider>().cargar();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CapturaProvider>();
    final dentroDeModulo = provider.moduloActual != null;

    return PopScope(
      // Estando dentro de un modulo, el boton de atras vuelve a la lista de
      // modulos en vez de salirse de la pantalla completa.
      canPop: !dentroDeModulo,
      onPopInvokedWithResult: (salio, _) {
        if (!salio && dentroDeModulo) provider.abrirModulo(null);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            dentroDeModulo
                ? '${provider.moduloActual!.modulo.codigo} · ${provider.moduloActual!.modulo.nombre}'
                : 'Registro de produccion',
          ),
          leading: dentroDeModulo
              ? IconButton(
                  onPressed: () => provider.abrirModulo(null),
                  icon: const Icon(Icons.arrow_back),
                )
              : null,
          actions: [
            if (dentroDeModulo)
              IconButton(
                tooltip: 'Ver el tablero',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TableroScreen(
                      idModuloInicial: provider.moduloActual!.modulo.id,
                    ),
                  ),
                ),
                icon: const Icon(Icons.dashboard_outlined),
              ),
          ],
        ),
        body: Column(
          children: [
            BarraFecha(
              fecha: provider.fecha,
              alCambiar: (nueva) => provider.cargar(nuevaFecha: nueva),
            ),
            Expanded(
              child: dentroDeModulo ? _vistaModulo(provider) : _vistaPlanta(provider),
            ),
          ],
        ),
      ),
    );
  }

  // =====================================================================
  // Nivel 1 — la planta
  // =====================================================================
  Widget _vistaPlanta(CapturaProvider provider) {
    if (provider.cargando && provider.rejilla == null) {
      return const VistaCargando(mensaje: 'Armando la rejilla del dia...');
    }

    if (provider.error != null && provider.rejilla == null) {
      return VistaError(provider.error!, alReintentar: provider.cargar);
    }

    final rejilla = provider.rejilla;
    if (rejilla == null) return const SizedBox.shrink();

    // Un domingo no tiene franjas: no es un dia laboral y no hay nada que
    // capturar. Decirlo es mejor que mostrar una rejilla vacia.
    if (!rejilla.horario.esDiaLaboral) {
      return VistaVacia(
        icono: Icons.weekend_outlined,
        titulo: 'El ${fechas.fechaLarga(provider.fecha)} no se trabaja',
        detalle: 'Ese dia no tiene jornada configurada en el horario de la planta.',
      );
    }

    final conJornada = provider.capturables;
    final sinJornada = rejilla.modulos.where((m) => !m.tieneJornada).toList();

    return RefreshIndicator(
      onRefresh: provider.cargar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          _resumenDia(rejilla, provider.totalPendientes),
          const SizedBox(height: 18),
          if (conJornada.isNotEmpty) ...[
            TituloSeccion(
              'Modulos trabajando',
              detalle: '${rejilla.horario.franjas.length} franjas · '
                  '${rejilla.horario.minutosTotales} minutos',
            ),
            ...conJornada.map((modulo) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _tarjetaModulo(provider, modulo, rejilla),
                )),
          ] else
            const VistaVacia(
              icono: Icons.play_circle_outline,
              titulo: 'Ningun modulo abrio jornada',
              detalle: 'Una hora solo se puede registrar si su modulo tiene '
                  'jornada abierta: es la que dice que lote corre y con cuantas '
                  'operarias.',
            ),
          if (sinJornada.isNotEmpty) ...[
            const SizedBox(height: 14),
            TituloSeccion(
              'Sin jornada',
              detalle: '${sinJornada.length} modulos no pueden capturar todavia',
            ),
            ...sinJornada.map((modulo) => Padding(
                  padding: const EdgeInsets.only(bottom: 9),
                  child: Opacity(
                    opacity: 0.6,
                    child: Tarjeta(
                      hijo: Row(
                        children: [
                          const Icon(Icons.lock_clock_outlined,
                              size: 19, color: Paleta.textoSuave),
                          const SizedBox(width: 11),
                          Expanded(
                            child: Text(
                              '${modulo.modulo.codigo} · ${modulo.modulo.nombre}',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                          const Text(
                            'Sin jornada',
                            style: TextStyle(fontSize: 12, color: Paleta.textoSuave),
                          ),
                        ],
                      ),
                    ),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _resumenDia(RejillaEntity rejilla, int pendientes) {
    return Tarjeta(
      borde: pendientes > 0 ? Paleta.alerta : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilaDeDatos([
            Dato(
              etiqueta: 'Unidades hoy',
              valor: entero(rejilla.unidadesDelDia),
              destacado: true,
            ),
            Dato(
              etiqueta: 'Eficiencia planta',
              valor: porcentaje(rejilla.eficienciaPlanta),
              color: Paleta.porEficiencia(rejilla.eficienciaPlanta, 80),
              destacado: true,
            ),
            Dato(
              etiqueta: 'Sin registrar',
              valor: '$pendientes',
              color: pendientes > 0 ? Paleta.alerta : Paleta.exito,
              destacado: true,
            ),
          ]),
          const SizedBox(height: 13),
          BarraAvance(
            valor: rejilla.avance,
            color: rejilla.avance >= 1 ? Paleta.exito : Paleta.morado,
          ),
          const SizedBox(height: 7),
          Text(
            '${rejilla.celdasRegistradas} de ${rejilla.celdasTotales} celdas capturadas',
            style: const TextStyle(fontSize: 11, color: Paleta.textoSuave),
          ),
        ],
      ),
    );
  }

  Widget _tarjetaModulo(
    CapturaProvider provider,
    ModuloCapturaEntity modulo,
    RejillaEntity rejilla,
  ) {
    final pendientes = provider.pendientesDe(modulo.modulo.id).length;
    final resumen = modulo.resumen;

    return Tarjeta(
      alTocar: () => provider.abrirModulo(modulo.modulo.id),
      borde: pendientes > 0 ? Paleta.alerta : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Paleta.porEficiencia(
                    resumen.franjasRegistradas == 0 ? null : resumen.eficiencia,
                    modulo.modulo.umbralCumplimiento,
                  ).withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(11),
                ),
                alignment: Alignment.center,
                child: Text(
                  modulo.modulo.codigo,
                  style: TextStyle(
                    color: Paleta.porEficiencia(
                      resumen.franjasRegistradas == 0 ? null : resumen.eficiencia,
                      modulo.modulo.umbralCumplimiento,
                    ),
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
                      modulo.jornada?.codigoLote ?? modulo.modulo.nombre,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    Text(
                      modulo.jornada?.nombreCliente ?? '—',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (pendientes > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: Paleta.alerta,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$pendientes sin captura',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              else
                EficienciaChip(
                  resumen.franjasRegistradas == 0 ? null : resumen.eficiencia,
                  umbral: modulo.modulo.umbralCumplimiento,
                ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 11),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(etiqueta: 'Unidades', valor: entero(resumen.unidadesProducidas)),
            Dato(etiqueta: 'Meta dia', valor: entero(resumen.metaDia)),
            Dato(
              etiqueta: 'Facturado',
              valor: pesos(resumen.facturacionReal),
              color: Paleta.exito,
            ),
          ]),
          const SizedBox(height: 11),
          _tiraDeFranjas(modulo, rejilla.horario.franjas),
        ],
      ),
    );
  }

  /// Una tira con un cuadrito por franja: verde si cumplio, ambar si quedo
  /// corta, gris si todavia no se captura. Es la rejilla del panel web
  /// comprimida a lo que cabe en el ancho de un telefono.
  Widget _tiraDeFranjas(ModuloCapturaEntity modulo, List<FranjaEntity> franjas) {
    return Row(
      children: franjas.map((franja) {
        final celda = modulo.celdaDe(franja.orden);
        final color = celda == null
            ? Paleta.borde
            : Paleta.porEficiencia(celda.eficiencia, modulo.modulo.umbralCumplimiento);

        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 3),
            child: Container(
              height: 26,
              decoration: BoxDecoration(
                color: celda == null ? Paleta.fondo : color.withValues(alpha: 0.17),
                border: Border.all(color: celda == null ? Paleta.borde : color),
                borderRadius: BorderRadius.circular(6),
              ),
              alignment: Alignment.center,
              child: Text(
                '${franja.orden}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: celda == null ? Paleta.textoSuave : color,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // =====================================================================
  // Nivel 2 — las franjas de un modulo
  // =====================================================================
  Widget _vistaModulo(CapturaProvider provider) {
    final modulo = provider.moduloActual!;
    final franjas = provider.franjas;
    final jornada = modulo.jornada;

    return RefreshIndicator(
      onRefresh: provider.cargar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          _cabeceraModulo(modulo),
          const SizedBox(height: 18),
          TituloSeccion(
            'Las horas del dia',
            detalle: jornada == null
                ? null
                : 'SAM ${sam(jornada.samPactado)} · '
                    '${modulo.personasSugeridas} operarias',
          ),
          ...franjas.map((franja) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: _filaFranja(provider, modulo, franja),
              )),
        ],
      ),
    );
  }

  Widget _cabeceraModulo(ModuloCapturaEntity modulo) {
    final resumen = modulo.resumen;

    return Tarjeta(
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      modulo.jornada?.codigoLote ?? 'Sin lote',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                    Text(
                      '${modulo.jornada?.nombreCliente ?? "—"} · '
                      '${modulo.jornada?.nombreReferencia ?? "sin referencia"}',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                    ),
                  ],
                ),
              ),
              EficienciaChip(
                resumen.franjasRegistradas == 0 ? null : resumen.eficiencia,
                umbral: modulo.modulo.umbralCumplimiento,
                grande: true,
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(etiqueta: 'Unidades', valor: entero(resumen.unidadesProducidas)),
            Dato(etiqueta: 'Meta del dia', valor: entero(resumen.metaDia)),
            Dato(
              etiqueta: 'Minutos perdidos',
              valor: entero(resumen.minutosPerdidos),
              color: resumen.minutosPerdidos > 0 ? Paleta.error : null,
            ),
          ]),
          const SizedBox(height: 12),
          FilaDeDatos([
            Dato(
              etiqueta: 'Facturacion meta',
              valor: pesos(resumen.facturacionMeta),
            ),
            Dato(
              etiqueta: 'Facturado real',
              valor: pesos(resumen.facturacionReal),
              color: Paleta.exito,
            ),
            Dato(
              etiqueta: 'Dejado de facturar',
              valor: pesos(resumen.facturacionPerdida),
              color: resumen.facturacionPerdida > 0 ? Paleta.error : Paleta.textoSuave,
            ),
          ]),
        ],
      ),
    );
  }

  Widget _filaFranja(
    CapturaProvider provider,
    ModuloCapturaEntity modulo,
    FranjaEntity franja,
  ) {
    final celda = modulo.celdaDe(franja.orden);
    final puedeCapturar = context.read<SesionProvider>().puede('Captura', 'CREAR');
    final vencida = provider
        .pendientesDe(modulo.modulo.id)
        .any((p) => p.horaJornada == franja.orden);

    return Tarjeta(
      alTocar: puedeCapturar ? () => _capturar(provider, modulo, franja, celda) : null,
      borde: vencida ? Paleta.alerta : null,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: celda == null
                      ? Paleta.fondo
                      : Paleta.porEficiencia(
                          celda.eficiencia,
                          modulo.modulo.umbralCumplimiento,
                        ).withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: celda == null
                        ? Paleta.borde
                        : Paleta.porEficiencia(
                            celda.eficiencia,
                            modulo.modulo.umbralCumplimiento,
                          ),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${franja.orden}',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: celda == null
                        ? Paleta.textoSuave
                        : Paleta.porEficiencia(
                            celda.eficiencia,
                            modulo.modulo.umbralCumplimiento,
                          ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          fechas.rangoHorario(franja.horaInicio, franja.horaFin),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        if (franja.esCorta) ...[
                          const SizedBox(width: 7),
                          // La franja corta se marca: su meta es menor y si no
                          // se avisa parece que el modulo produjo de menos.
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: Paleta.info.withValues(alpha: 0.13),
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Text(
                              '${franja.minutos} min',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Paleta.info,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      celda == null
                          ? (vencida ? 'Esta hora ya vencio y falta' : 'Pendiente')
                          : '${entero(celda.unidadesProducidas)} de '
                              '${decimal(celda.metaHora, 1)} · '
                              '${celda.personasPresentes} operarias',
                      style: TextStyle(
                        fontSize: 12,
                        color: vencida && celda == null ? Paleta.alerta : Paleta.textoSuave,
                        fontWeight: vencida && celda == null
                            ? FontWeight.w600
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              if (celda != null)
                EficienciaChip(
                  celda.eficiencia,
                  umbral: modulo.modulo.umbralCumplimiento,
                )
              else if (puedeCapturar)
                const Icon(Icons.add_circle_outline, color: Paleta.morado),
            ],
          ),
          if (celda != null && celda.tieneIncidencia) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Paleta.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.report_problem_outlined,
                      size: 14, color: Paleta.error),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      celda.minutosPerdidos > 0
                          ? '${celda.nombreCausa} · ${celda.minutosPerdidos} min perdidos'
                          : celda.nombreCausa ?? 'Con incidencia',
                      style: const TextStyle(fontSize: 11.5, color: Paleta.texto),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _capturar(
    CapturaProvider provider,
    ModuloCapturaEntity modulo,
    FranjaEntity franja,
    RegistroEntity? celda,
  ) async {
    final guardado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Paleta.tarjeta,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (_) => CeldaCapturaHoja(
        modulo: modulo,
        franja: franja,
        celda: celda,
        fecha: provider.fecha,
      ),
    );

    if (guardado == true && mounted) {
      avisar(context, 'Hora ${franja.orden} guardada.');
    }
  }
}
