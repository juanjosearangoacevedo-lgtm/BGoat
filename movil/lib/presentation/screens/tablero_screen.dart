import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_cliente.dart';
import '../../core/fechas.dart' as fechas;
import '../../core/formato.dart';
import '../../core/tema.dart';
import '../../domain/entities/captura_entity.dart';
import '../../domain/entities/tablero_entity.dart';
import '../providers/captura_provider.dart';
import '../providers/tablero_provider.dart';
import '../widgets/barra_fecha.dart';
import '../widgets/estado_chip.dart';
import '../widgets/tarjetas.dart';
import '../widgets/vistas_estado.dart';

/// El tablero de un modulo: la hoja de calculo de la empresa, ya cuadrada.
///
/// Cabecera, una fila por franja con acumulados corriendo, y la fila de
/// totales. En la hoja de pared varias de esas celdas quedan vacias --la meta
/// del dia-- y otras dicen "dia" pero traen una sola hora; aqui todas se
/// calculan en la base.
class TableroScreen extends StatefulWidget {
  final int? idModuloInicial;

  const TableroScreen({super.key, this.idModuloInicial});

  @override
  State<TableroScreen> createState() => _TableroScreenState();
}

class _TableroScreenState extends State<TableroScreen> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.idModuloInicial != null) {
        context.read<TableroProvider>().cargar(widget.idModuloInicial!);
      } else if (context.read<CapturaProvider>().rejilla == null) {
        // Sin modulo elegido hay que ofrecer la lista, y la lista de modulos
        // del dia ya la trae la rejilla de captura.
        context.read<CapturaProvider>().cargar();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TableroProvider>();
    final tablero = provider.tablero;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          tablero == null
              ? 'Tablero por modulo'
              : '${tablero.modulo.codigo} · ${tablero.modulo.nombre}',
        ),
        actions: [
          if (tablero != null)
            IconButton(
              tooltip: 'Cambiar de modulo',
              onPressed: provider.limpiar,
              icon: const Icon(Icons.swap_horiz),
            ),
        ],
      ),
      body: provider.idModulo == null ? _selector() : _tablero(provider),
    );
  }

  // =====================================================================
  // Escoger el modulo
  // =====================================================================
  Widget _selector() {
    final captura = context.watch<CapturaProvider>();

    if (captura.cargando && captura.rejilla == null) {
      return const VistaCargando(mensaje: 'Leyendo los modulos...');
    }

    if (captura.error != null && captura.rejilla == null) {
      return VistaError(captura.error!, alReintentar: captura.cargar);
    }

    final modulos = captura.modulos;
    if (modulos.isEmpty) {
      return const VistaVacia(
        icono: Icons.dashboard_outlined,
        titulo: 'No hay modulos para mostrar',
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
      children: [
        const TituloSeccion(
          'De que modulo',
          detalle: 'Se puede ver el tablero de cualquier dia, con o sin jornada.',
        ),
        ...modulos.map((modulo) => Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: _opcionModulo(modulo),
            )),
      ],
    );
  }

  Widget _opcionModulo(ModuloCapturaEntity modulo) {
    final resumen = modulo.resumen;
    final color = modulo.tieneJornada ? Paleta.morado : Paleta.textoSuave;

    return Tarjeta(
      alTocar: () => context.read<TableroProvider>().cargar(modulo.modulo.id),
      hijo: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(11),
            ),
            alignment: Alignment.center,
            child: Text(
              modulo.modulo.codigo,
              style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13),
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
                      ? '${modulo.jornada?.codigoLote ?? "—"} · '
                          '${entero(resumen.unidadesProducidas)} unidades'
                      : 'Sin jornada hoy',
                  style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Paleta.textoSuave),
        ],
      ),
    );
  }

  // =====================================================================
  // El tablero
  // =====================================================================
  Widget _tablero(TableroProvider provider) {
    return Column(
      children: [
        BarraFecha(
          fecha: provider.fecha,
          alCambiar: provider.cambiarFecha,
        ),
        Expanded(child: _contenido(provider)),
      ],
    );
  }

  Widget _contenido(TableroProvider provider) {
    if (provider.cargando && provider.tablero == null) {
      return const VistaCargando(mensaje: 'Cuadrando el tablero...');
    }

    if (provider.error != null) {
      return VistaError(provider.error!, alReintentar: provider.recargar);
    }

    final tablero = provider.tablero;
    if (tablero == null) return const SizedBox.shrink();

    if (!tablero.horario.esDiaLaboral) {
      return VistaVacia(
        icono: Icons.weekend_outlined,
        titulo: 'El ${fechas.fechaLarga(tablero.fecha)} no se trabaja',
        detalle: 'Ese dia no tiene franjas en el horario de la planta.',
      );
    }

    return RefreshIndicator(
      onRefresh: provider.recargar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          _cabecera(tablero),
          const SizedBox(height: 16),
          _selectorVista(provider),
          const SizedBox(height: 14),
          _tabla(tablero, provider.vista),
          if (tablero.totales != null) ...[
            const SizedBox(height: 18),
            _totales(tablero, tablero.totales!),
          ],
          if (tablero.operarias.isNotEmpty) ...[
            const SizedBox(height: 18),
            _nomina(tablero),
          ],
        ],
      ),
    );
  }

  Widget _cabecera(TableroEntity tablero) {
    final cabecera = tablero.cabecera;
    final api = context.read<ApiCliente>();
    final foto = api.urlDeArchivo(cabecera.fichaImagen);

    if (!tablero.tieneJornada) {
      return const Tarjeta(
        hijo: Row(
          children: [
            Icon(Icons.lock_clock_outlined, color: Paleta.textoSuave),
            SizedBox(width: 11),
            Expanded(
              child: Text(
                'Este modulo no abrio jornada ese dia, asi que no hay nada que '
                'capturar ni que medir.',
                style: TextStyle(fontSize: 13, height: 1.4, color: Paleta.textoSuave),
              ),
            ),
          ],
        ),
      );
    }

    return Tarjeta(
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (foto != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    foto,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cabecera.lote ?? 'Sin lote',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${cabecera.cliente ?? "—"} · '
                      '${cabecera.referencia ?? "sin referencia"}',
                      style: const TextStyle(fontSize: 12, color: Paleta.textoSuave),
                    ),
                  ],
                ),
              ),
              EstadoChip(tablero.jornada?.estado),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(etiqueta: 'Operarias', valor: '${cabecera.personas}'),
            Dato(etiqueta: 'SAM pactado', valor: sam(cabecera.sam)),
            Dato(etiqueta: 'Valor unidad', valor: pesos(cabecera.precioUnidad)),
          ]),
          const SizedBox(height: 12),
          FilaDeDatos([
            Dato(
              etiqueta: 'Meta por hora',
              valor: decimal(cabecera.metaHora, 1),
            ),
            Dato(
              etiqueta: 'Meta del dia',
              valor: decimal(cabecera.metaDia, 0),
              color: Paleta.morado,
              destacado: true,
            ),
            Dato(
              etiqueta: 'Jornada',
              valor: '${cabecera.horasJornada.toStringAsFixed(2)} h',
            ),
          ]),
          const SizedBox(height: 13),
          BarraAvance(
            valor: tablero.avanceContraMeta,
            color: tablero.avanceContraMeta >= 1 ? Paleta.exito : Paleta.morado,
          ),
          const SizedBox(height: 7),
          Text(
            '${entero(tablero.totales?.unidadesProducidas ?? 0)} de '
            '${decimal(cabecera.metaDia, 0)} unidades · '
            '${tablero.franjasPendientes} franjas sin capturar',
            style: const TextStyle(fontSize: 11, color: Paleta.textoSuave),
          ),
        ],
      ),
    );
  }

  /// En un celular no caben las tres lecturas a la vez, asi que se alternan.
  /// Encogerlas hasta que quepan es dejarlas ilegibles.
  Widget _selectorVista(TableroProvider provider) {
    return SegmentedButton<VistaTablero>(
      segments: VistaTablero.values
          .map((vista) => ButtonSegment(
                value: vista,
                label: Text(vista.titulo, style: const TextStyle(fontSize: 12)),
                icon: Icon(vista.icono, size: 16),
              ))
          .toList(),
      selected: {provider.vista},
      showSelectedIcon: false,
      onSelectionChanged: (seleccion) => provider.cambiarVista(seleccion.first),
    );
  }

  Widget _tabla(TableroEntity tablero, VistaTablero vista) {
    return Tarjeta(
      padding: EdgeInsets.zero,
      hijo: Column(
        children: [
          _filaCabeceraTabla(vista),
          ...tablero.franjas.map((fila) => _filaTabla(tablero, fila, vista)),
        ],
      ),
    );
  }

  Widget _filaCabeceraTabla(VistaTablero vista) {
    final columnas = switch (vista) {
      VistaTablero.produccion => ['Meta', 'Real', 'Acum.', '%'],
      VistaTablero.dinero => ['Meta \$', 'Real \$', 'Acum. \$', '%'],
      VistaTablero.perdidas => ['Maq.', 'Cal.', 'Mont.', 'Total'],
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: const BoxDecoration(
        color: Paleta.fondo,
        borderRadius: BorderRadius.vertical(top: Radius.circular(11)),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 52,
            child: Text(
              'Hora',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Paleta.textoSuave,
              ),
            ),
          ),
          ...columnas.map((columna) => Expanded(
                child: Text(
                  columna,
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Paleta.textoSuave,
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _filaTabla(TableroEntity tablero, FilaTableroEntity fila, VistaTablero vista) {
    final umbral = tablero.modulo.umbralCumplimiento;
    final color = Paleta.porEficiencia(fila.eficiencia, umbral);

    final valores = switch (vista) {
      VistaTablero.produccion => [
          decimal(fila.metaHora, 1),
          entero(fila.unidadesProducidas),
          entero(fila.unidadesAcumuladas),
          fila.eficiencia == null ? '—' : '${fila.eficiencia!.round()}%',
        ],
      VistaTablero.dinero => [
          pesos(fila.facturacionMeta),
          pesos(fila.facturacionReal),
          pesos(fila.facturacionRealAcumulada),
          fila.cumplimientoFacturacion == null
              ? '—'
              : '${fila.cumplimientoFacturacion!.round()}%',
        ],
      VistaTablero.perdidas => [
          fila.minutosMaquina == 0 ? '—' : '${fila.minutosMaquina}',
          fila.minutosCalidad == 0 ? '—' : '${fila.minutosCalidad}',
          fila.minutosMontaje == 0 ? '—' : '${fila.minutosMontaje}',
          fila.minutosPerdidos == 0 ? '—' : '${fila.minutosPerdidos}',
        ],
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Paleta.borde)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 52,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '${fila.horaJornada}',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: fila.estaVacia ? Paleta.textoSuave : color,
                          ),
                        ),
                        if (fila.esCorta)
                          Padding(
                            padding: const EdgeInsets.only(left: 3),
                            child: Text(
                              '${fila.minutosFranja}m',
                              style: const TextStyle(fontSize: 9, color: Paleta.info),
                            ),
                          ),
                      ],
                    ),
                    Text(
                      fechas.hora(fila.horaInicio),
                      style: const TextStyle(fontSize: 10, color: Paleta.textoSuave),
                    ),
                  ],
                ),
              ),
              ...List.generate(valores.length, (indice) {
                final esUltima = indice == valores.length - 1;

                return Expanded(
                  child: Text(
                    fila.estaVacia ? '—' : valores[indice],
                    textAlign: TextAlign.end,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: esUltima ? FontWeight.w700 : FontWeight.w500,
                      color: fila.estaVacia
                          ? Paleta.borde
                          : (esUltima && vista != VistaTablero.perdidas
                              ? color
                              : Paleta.texto),
                    ),
                  ),
                );
              }),
            ],
          ),
          if (fila.nombreCausa != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const SizedBox(width: 52),
                const Icon(Icons.subdirectory_arrow_right, size: 12, color: Paleta.error),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    fila.nota == null
                        ? fila.nombreCausa!
                        : '${fila.nombreCausa} — ${fila.nota}',
                    style: const TextStyle(fontSize: 11, color: Paleta.textoSuave),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _totales(TableroEntity tablero, TotalesDiaEntity totales) {
    return Tarjeta(
      borde: Paleta.morado,
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TituloSeccion('Cierre del dia'),
          FilaDeDatos([
            Dato(
              etiqueta: 'Unidades',
              valor: entero(totales.unidadesProducidas),
              destacado: true,
            ),
            Dato(
              etiqueta: 'Eficiencia',
              valor: porcentaje(totales.eficiencia),
              color: Paleta.porEficiencia(
                totales.eficiencia,
                tablero.modulo.umbralCumplimiento,
              ),
              destacado: true,
            ),
            Dato(
              etiqueta: 'Defectos',
              valor: porcentaje(totales.porcentajeDefectos, 1),
              color: totales.porcentajeDefectos > 0 ? Paleta.alerta : null,
              destacado: true,
            ),
          ]),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 13),
            child: Divider(height: 1),
          ),
          // La comparacion que es el producto principal del sistema: lo que se
          // pacto contra lo que costo de verdad.
          const Text(
            'SAM pactado contra observado',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 9),
          FilaDeDatos([
            Dato(etiqueta: 'Pactado', valor: sam(tablero.cabecera.sam)),
            Dato(
              etiqueta: 'Observado',
              valor: sam(totales.samObservado),
              color: _colorSam(tablero.cabecera.sam, totales.samObservado),
            ),
            Dato(
              etiqueta: 'Prendas / hora',
              valor: decimal(totales.prendasPorHora, 1),
            ),
          ]),
          if (totales.samObservado != null && tablero.cabecera.sam > 0) ...[
            const SizedBox(height: 8),
            Text(
              totales.samObservado! > tablero.cabecera.sam
                  ? 'El modulo gasto ${decimal(totales.samObservado! - tablero.cabecera.sam, 3)} '
                      'minutos mas por prenda de los que el cliente paga: esa '
                      'diferencia la absorbe la empresa.'
                  : 'El modulo gasto menos minutos por prenda de los pactados: '
                      'hay margen para cotizar mejor.',
              style: const TextStyle(fontSize: 11, color: Paleta.textoSuave, height: 1.4),
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 13),
            child: Divider(height: 1),
          ),
          FilaDeDatos([
            Dato(etiqueta: 'Facturacion meta', valor: pesos(totales.facturacionMeta)),
            Dato(
              etiqueta: 'Facturado',
              valor: pesos(totales.facturacionReal),
              color: Paleta.exito,
            ),
            Dato(
              etiqueta: 'Cumplimiento',
              valor: porcentaje(totales.cumplimientoFacturacion),
            ),
          ]),
          if (totales.minutosPerdidos > 0) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 13),
              child: Divider(height: 1),
            ),
            Text(
              'Se perdieron ${totales.minutosPerdidos} minutos',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 9),
            // El Pareto del dia: en que se nos van los minutos, de mayor a menor.
            ...totales.perdidasPorCausa.map((linea) => Padding(
                  padding: const EdgeInsets.only(bottom: 7),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          linea.key,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: BarraAvance(
                          valor: linea.value / totales.minutosPerdidos,
                          color: Paleta.error,
                          alto: 6,
                        ),
                      ),
                      SizedBox(
                        width: 54,
                        child: Text(
                          '${linea.value} min',
                          textAlign: TextAlign.end,
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Color? _colorSam(double pactado, double? observado) {
    if (observado == null || pactado <= 0) return null;
    return observado > pactado ? Paleta.error : Paleta.exito;
  }

  Widget _nomina(TableroEntity tablero) {
    final identificadas = tablero.operarias.where((o) => !o.esAnonima).length;

    return Tarjeta(
      hijo: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TituloSeccion(
            'Quien trabajo',
            detalle: '$identificadas identificadas de ${tablero.operarias.length} puestos',
          ),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: tablero.operarias.map((puesto) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: puesto.esAnonima
                      ? Paleta.fondo
                      : Paleta.morado.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: puesto.esAnonima ? Paleta.borde : Colors.transparent,
                  ),
                ),
                child: Text(
                  puesto.esAnonima ? 'Puesto ${puesto.numero}' : puesto.nombreMostrado,
                  style: TextStyle(
                    fontSize: 12,
                    color: puesto.esAnonima ? Paleta.textoSuave : Paleta.morado,
                    fontStyle: puesto.esAnonima ? FontStyle.italic : FontStyle.normal,
                    fontWeight: puesto.esAnonima ? FontWeight.normal : FontWeight.w600,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
