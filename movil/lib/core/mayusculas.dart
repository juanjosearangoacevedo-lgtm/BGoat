import 'package:flutter/services.dart';

/// Los codigos que se guardan en MAYUSCULAS SOSTENIDA: el numero de pedido y
/// el codigo de referencia del lote.
///
/// `TextCapitalization.characters` solo le pide al teclado que arranque en
/// mayusculas: no impide pegar texto en minuscula ni escribir con un teclado
/// fisico. Este formateador si convierte lo que llega, asi el campo nunca
/// tiene una minuscula y lo que se ve es lo mismo que se manda.
class MayusculasFormatter extends TextInputFormatter {
  const MayusculasFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue anterior, TextEditingValue nuevo) {
    final texto = nuevo.text.toUpperCase();
    if (texto == nuevo.text) return nuevo;

    // Una letra como la "ß" se vuelve "SS" al subirla de caso: el cursor
    // tiene que correrse con ella, o apuntaria fuera del texto.
    int mover(int posicion) =>
        posicion < 0 ? posicion : nuevo.text.substring(0, posicion).toUpperCase().length;

    return TextEditingValue(
      text: texto,
      selection: nuevo.selection.copyWith(
        baseOffset: mover(nuevo.selection.baseOffset),
        extentOffset: mover(nuevo.selection.extentOffset),
      ),
    );
  }
}
