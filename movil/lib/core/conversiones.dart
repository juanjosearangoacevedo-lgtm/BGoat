/// Conversiones defensivas de lo que llega en el JSON de la API.
///
/// MySQL devuelve las columnas DECIMAL como TEXTO (el driver `mysql2` no las
/// convierte a numero para no perder precision), asi que `sam_pactado` llega
/// como "0.850" y `valor_maquila_unidad` como "1800.00". Si el modelo hiciera
/// `json['sam_pactado'] as double` reventaria en la primera pantalla.
///
/// Por eso todo numero que venga de la API pasa por aqui.
library;

/// Un double desde numero, texto o null.
double? aDoubleNulo(dynamic valor) {
  if (valor == null) return null;
  if (valor is num) return valor.toDouble();
  return double.tryParse(valor.toString());
}

/// Igual que el anterior, pero con un valor por defecto en vez de null.
double aDouble(dynamic valor, [double porDefecto = 0]) =>
    aDoubleNulo(valor) ?? porDefecto;

/// Un int desde numero, texto o null. Trunca si viene con decimales.
int? aIntNulo(dynamic valor) {
  if (valor == null) return null;
  if (valor is int) return valor;
  if (valor is num) return valor.toInt();
  final texto = valor.toString();
  return int.tryParse(texto) ?? double.tryParse(texto)?.toInt();
}

int aInt(dynamic valor, [int porDefecto = 0]) => aIntNulo(valor) ?? porDefecto;

/// Un texto, o null si viene vacio. La API usa NULL y "" indistintamente.
String? aTextoNulo(dynamic valor) {
  if (valor == null) return null;
  final texto = valor.toString().trim();
  return texto.isEmpty ? null : texto;
}

String aTexto(dynamic valor, [String porDefecto = '']) =>
    aTextoNulo(valor) ?? porDefecto;

/// Un booleano. MySQL guarda los TINYINT(1) como 0 y 1.
bool aBool(dynamic valor) {
  if (valor == null) return false;
  if (valor is bool) return valor;
  if (valor is num) return valor != 0;
  final texto = valor.toString().toLowerCase();
  return texto == 'true' || texto == '1' || texto == 'si';
}

/// Una fecha en formato YYYY-MM-DD.
///
/// El backend configura el driver con `dateStrings: true`, asi que las fechas
/// llegan ya como texto y no hay corrimiento de zona horaria. Aun asi se
/// recortan los primeros 10 caracteres: los DATETIME traen la hora pegada.
String? aFechaNula(dynamic valor) {
  final texto = aTextoNulo(valor);
  if (texto == null) return null;
  return texto.length >= 10 ? texto.substring(0, 10) : texto;
}

/// Una lista de mapas desde lo que sea que venga (null incluido).
List<Map<String, dynamic>> aListaDeMapas(dynamic valor) {
  if (valor is! List) return const [];
  return valor.whereType<Map>().map((fila) {
    return fila.map((clave, dato) => MapEntry(clave.toString(), dato));
  }).toList();
}

/// Un mapa, o null si no lo es.
Map<String, dynamic>? aMapaNulo(dynamic valor) {
  if (valor is! Map) return null;
  return valor.map((clave, dato) => MapEntry(clave.toString(), dato));
}
