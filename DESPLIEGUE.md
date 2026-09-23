# Despliegue de BGoat

BGoat corre en el VPS de Vultr (Miami) **compartiendo maquina con Bitemo**, pero
como dos proyectos independientes: cada uno tiene su carpeta, su proyecto de
Docker Compose, su red, su base de datos y su puerto. Nada de lo que se haga
aqui toca a Bitemo.

| | BGoat | Bitemo |
| --- | --- | --- |
| Carpeta | `/opt/bgoat` | `/opt/bitemo` |
| Proyecto Compose | `bgoat` | `bitemo` |
| Puerto publico | **8080** | 80 y 443 |
| Volumen de datos | `bgoat_db_data` | `bitemo_db_data` |
| URL | http://144.202.34.180:8080 | https://bitemo.co |

Acceso al servidor: `ssh bitemo` (el alias esta en `~/.ssh/config`; el nombre es
del servidor, no del proyecto).

Usuario inicial del panel: `admin@bgoat.com` / `Bgoat2026*` — **cambiala en el
primer ingreso**, es publica en este repositorio.

## Las tres piezas

```
Internet :8080 -> bgoat-web-1      Nginx: sirve el panel compilado
                                   y enruta /api al backend
                  bgoat-backend-1  Node/Express, puerto 3000 interno
                  bgoat-db-1       MySQL 8, sin puerto publicado
```

Solo `bgoat-web-1` esta expuesto. MySQL no es visible desde Internet: vive en la
red privada del proyecto.

## Actualizar despues de cambiar codigo

Desde tu maquina, en la raiz del repo:

```bash
tar -czf /tmp/bgoat.tar.gz --exclude=node_modules --exclude=dist --exclude=.git --exclude=.env backend frontend database docker-compose.yml && scp /tmp/bgoat.tar.gz bitemo:/tmp/ && ssh bitemo 'tar -xzf /tmp/bgoat.tar.gz -C /opt/bgoat && cd /opt/bgoat && docker compose up -d --build'
```

El `.env` del servidor **no viaja en ese paquete** y no se pisa.

Los scripts (`*.sh`), los `Dockerfile` y `nginx.conf` tienen que llegar con fin
de linea LF. `.gitattributes` lo fuerza en el checkout; si un `.sh` falla en el
VPS con `bash\r: No such file or directory`, se arregla con
`sed -i 's/\r$//' archivo.sh`.

Si solo cambio el frontend, reconstruir uno solo es mas rapido:
`ssh bitemo 'cd /opt/bgoat && docker compose up -d --build web'`

## Operaciones del dia a dia

```bash
ssh bitemo 'cd /opt/bgoat && docker compose ps'          # estado
ssh bitemo 'cd /opt/bgoat && docker compose logs -f'     # logs en vivo
ssh bitemo 'cd /opt/bgoat && docker compose restart'     # reiniciar
ssh bitemo 'cd /opt/bgoat && docker compose down'        # apagar (los datos quedan)
```

Cambiar `docker compose` por `docker compose -p bgoat` fuera de `/opt/bgoat`.

## La base de datos

El esquema y los catalogos se cargaron **solo en el primer arranque**, cuando el
volumen estaba vacio: `database/00_migracion_flujo_jornada.sql`,
`01_schema_bgoat.sql` y `02_seed_bgoat.sql`, en ese orden, montados en
`/docker-entrypoint-initdb.d`. Editar esos archivos y redesplegar **no** vuelve
a ejecutarlos: MySQL los ignora si ya hay datos.

### Migrar una base que ya estaba en produccion

Si la base ya existe con el modelo anterior (supervisora por modulo, cliente y
marca separados, fichas tecnicas como catalogo), el archivo `00_migracion` NO
se aplica solo: MySQL solo corre `/docker-entrypoint-initdb.d` con el volumen
vacio. Hay que lanzarlo a mano, y **con respaldo previo**:

```bash
ssh bitemo 'cd /opt/bgoat && ./backup.sh'
```

```bash
ssh bitemo 'set -e; cd /opt/bgoat && set -a && . ./.env && set +a && export MYSQL_PWD="$DB_ROOT_PASSWORD" && for f in 00_migracion_flujo_jornada 00b_migracion_modulos_calculados 00c_migracion_ordenes_libres 01_schema_bgoat 02_seed_bgoat; do echo "==> $f"; docker compose exec -T -e MYSQL_PWD db mysql -u root bgoat < database/$f.sql; done'
```

Los cinco en ese orden (el mismo de `backend/scripts/setup-db.js`): las
migraciones preparan las columnas, el esquema recrea las vistas sobre ellas y el
seed repone los catalogos. Cada migracion corre una sola vez --queda anotada en
la tabla `migraciones`-- y es inofensiva si ya se aplico.

El `set -e` es obligatorio: sin el, si una migracion falla el bucle sigue con
la siguiente y la base queda a medio camino. No meter la salida de `mysql` en
una tuberia (`| grep`), porque eso tapa el codigo de error.

**Antes de migrar produccion, probar en local con sus datos.** Bajar el ultimo
respaldo, cargarlo en una base aparte y correr los cinco archivos contra ella.
Ojo: `00` y `01` traen `USE bgoat;`, asi que hay que cambiarlo, o se aplican
sobre la base de desarrollo:

```bash
sed -e 's/^USE `bgoat`;/USE `bgoat_prod_prueba`;/' -e '/^CREATE DATABASE IF NOT EXISTS `bgoat`/d' database/00_migracion_flujo_jornada.sql | mysql -u root -p bgoat_prod_prueba
```

Asi aparecio el caso de las horas capturadas sin orden y sin ningun lote en la
base. La migracion `00` ahora lo cubre con un lote marcador,
`SIN-LOTE-MIGRACION`, a nombre del cliente "Sin asignar".

### Las fichas tecnicas

Las imagenes que se suben con cada lote viven en el volumen `fichas`, montado
en `/app/uploads/fichas` del contenedor del backend. **No estan en la base**:
`backup.sh` saca el SQL, no los archivos. Para respaldarlas:

```bash
ssh bitemo 'cd /opt/bgoat && docker compose cp backend:/app/uploads/fichas ./respaldo-fichas'
```

Los datos de demostracion (`03_demo_bgoat.sql`) quedaron fuera a proposito:
esta es la base real de la empresa. Cargarlos, si hiciera falta para mostrar el
sistema:

```bash
ssh bitemo 'cd /opt/bgoat && set -a && . ./.env && set +a && docker compose exec -T db mysql -u root -p"$DB_ROOT_PASSWORD" bgoat < database/03_demo_bgoat.sql'
```

La planta arranca **sin modulos**: los 12 modulos son datos de operacion y se
crean desde el panel. Hasta que existan, la pantalla de Captura no tiene donde
registrar.

### Respaldos

`backup.sh` (en la raiz de este repo, desplegado en `/opt/bgoat/backup.sh`)
vuelca la base comprimida en `/opt/bgoat/backups/`, comprueba que el volcado
quedo completo y borra los que pasan de 14 dias. Corre solo, por cron, todas
las noches:

```
30 3 * * * /opt/bgoat/backup.sh >> /var/log/bgoat-backup.log 2>&1
```

Son las 3:30 **UTC** (el VPS esta en UTC), o sea las 10:30 pm en Colombia, con
la planta cerrada. Media hora despues de Bitemo a proposito: la maquina tiene
un solo vCPU y los dos `mysqldump` no deben coincidir.

A mano, para tener uno fresco antes de un despliegue grande, es el mismo
comando:

```bash
ssh bitemo '/opt/bgoat/backup.sh'
```

Y para comprobar que la cosa sigue viva:

```bash
ssh bitemo 'tail -5 /var/log/bgoat-backup.log && ls -la /opt/bgoat/backups/'
```

Los `.sql.gz` quedan con permisos `600`: llevan la base entera, con los hashes
de contrasena de los usuarios del panel.

### Restaurar un respaldo

**Pisa los datos que haya**, asi que revisar dos veces la fecha del archivo:

```bash
ssh bitemo 'cd /opt/bgoat && set -a && . ./.env && set +a && zcat backups/bgoat_AAAAMMDD_HHMMSS.sql.gz | docker compose exec -T db mysql -u root -p"$DB_ROOT_PASSWORD" bgoat'
```

El volcado no trae `CREATE DATABASE`: la base `bgoat` tiene que existir. Si se
perdio el volumen entero, primero `docker compose up -d db` (que la crea vacia)
y despues restaurar.

## Secretos

Viven en `/opt/bgoat/.env` (permisos `600`, solo root), generados aleatoriamente
en el despliegue: contrasena de MySQL, la de root de MySQL y el `JWT_SECRET`.
No estan en el repositorio ni en ningun otro lado — si se pierde ese archivo,
hay que regenerar las claves y recrear el volumen.

## Lo que falta

1. **HTTPS.** Hoy el panel se sirve por HTTP plano: la contrasena del login
   viaja en claro. Para arreglarlo hace falta un dominio apuntando al VPS; con
   el se monta un proxy compartido al frente (Bitemo es dueno del 80/443, asi
   que no se puede pedir un certificado para BGoat sin reorganizar esa parte).
   Mientras tanto, no usar contrasenas que se repitan en otros servicios.
2. **Copia offsite.** Los respaldos automaticos ya existen, pero viven en el
   mismo disco que la base: cubren un borrado accidental o una migracion que
   sale mal, no la perdida del VPS. Falta subirlos a un destino externo
   (Backblaze B2 con `rclone`, por ejemplo); `backup.sh` deja ese comando
   comentado al final. Bitemo tiene exactamente el mismo pendiente.
