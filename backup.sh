#!/usr/bin/env bash
# Backup diario de la base de datos MySQL de BGoat.
# Programar en cron (VPS):   30 3 * * *  /opt/bgoat/backup.sh >> /var/log/bgoat-backup.log 2>&1
#
# A las 3:30 y no a las 3:00 a proposito: Bitemo respalda a las 3 en punto con
# /opt/bitemo/backup.sh y el VPS tiene un solo vCPU. Media hora de margen basta
# para que los dos mysqldump no se peleen por la maquina.
#
# Restaurar uno de estos archivos (OJO: pisa los datos actuales):
#   cd /opt/bgoat && set -a && . ./.env && set +a
#   zcat backups/bgoat_AAAAMMDD_HHMMSS.sql.gz | docker compose exec -T db mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
set -euo pipefail

cd "$(dirname "$0")"

# El volcado lleva la base entera, incluidos los hashes de contrasena de los
# usuarios del panel: que nazca legible solo por root, igual que el .env.
umask 077

# Carga DB_NAME y DB_ROOT_PASSWORD desde .env
set -a
# shellcheck disable=SC1091
source .env
set +a

# Dias que se conservan localmente. La base crece con la captura horaria, pero
# despacio: unos cientos de registros al dia comprimen a pocos MB por archivo,
# asi que 14 dias caben de sobra en el disco (32 GB libres). Subir este numero
# es cambiar esta linea y nada mas.
RETENCION_DIAS=14

STAMP=$(date +%Y%m%d_%H%M%S)
DIR="./backups"
mkdir -p "$DIR"
ARCHIVO="$DIR/bgoat_${STAMP}.sql.gz"
PARCIAL="$ARCHIVO.parcial"

# Un volcado a medias (se cae la red, se queda sin disco, muere el contenedor)
# no debe quedar con nombre de backup bueno: se escribe en .parcial y solo se
# renombra si termino y paso la revision de abajo.
trap 'rm -f "$PARCIAL"' EXIT

echo "==> Generando backup $ARCHIVO"
# --single-transaction: foto consistente sin bloquear la captura horaria.
# --routines: hoy no hay procedimientos, pero si los hubiera viajarian igual.
docker compose exec -T db \
  mysqldump -u root -p"${DB_ROOT_PASSWORD}" --single-transaction --routines "${DB_NAME}" \
  | gzip > "$PARCIAL"

# Revision antes de darlo por bueno: que el .gz no este corrupto y que
# mysqldump haya llegado al final (esa ultima linea la escribe solo al cerrar).
gzip -t "$PARCIAL"
if ! zcat "$PARCIAL" | tail -5 | grep -q 'Dump completed'; then
  echo "!!! El volcado quedo incompleto, se descarta. Backup NO generado." >&2
  exit 1
fi

mv "$PARCIAL" "$ARCHIVO"
trap - EXIT

# Conserva solo los ultimos RETENCION_DIAS dias localmente. Va despues del
# volcado a proposito: si el backup de hoy falla, los viejos siguen ahi.
find "$DIR" -name 'bgoat_*.sql.gz' -mtime +"$RETENCION_DIAS" -delete
# Restos de intentos fallidos de dias anteriores.
find "$DIR" -name 'bgoat_*.sql.gz.parcial' -mtime +1 -delete

echo "==> Backup local listo: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
echo "    Guardados $(find "$DIR" -name 'bgoat_*.sql.gz' | wc -l) respaldos en $(du -sh "$DIR" | cut -f1); quedan $(df -h --output=avail / | tail -1 | tr -d ' ') libres en el disco."
echo "    IMPORTANTE: subelo tambien a un destino OFFSITE (Backblaze B2, etc.) — ver DESPLIEGUE.md."
# Ejemplo offsite con rclone (configuralo antes):
#   rclone copy "$ARCHIVO" b2-bgoat:bgoat-backups/
