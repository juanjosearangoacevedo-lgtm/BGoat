# BGoat — App móvil

App móvil de BGoat para la planta: inicio de jornada, registro de producción, tablero por módulo y consulta de lotes y órdenes.

**Flutter (Dart).** Habla con la misma API que el panel web — no duplica lógica de negocio, todo sale de las mismas vistas de MySQL.

> Necesita el backend corriendo. Ver [`../backend/README.md`](../backend/README.md).

---

## Puesta en marcha

```bash
flutter pub get
```

Sin dispositivo conectado, se puede correr directo en el navegador:

```bash
flutter run -d chrome
```

O en un celular Android por USB (con depuración USB activada y autorizada):

```bash
flutter run -d <id-del-dispositivo>
```

`flutter devices` lista los dispositivos conectados y sus ids.

## Contra qué servidor habla

Por defecto la app apunta al servidor de producción. Para probar contra tu backend local, entra a **Ajustes** dentro de la app (ícono de engranaje en el menú) y cambia la dirección por la IP de tu computador en la red local, por ejemplo `http://192.168.1.X:4000/api`.

El celular y el computador deben estar en la **misma red WiFi** — con datos móviles no va a alcanzar una IP privada. Si Windows tiene el firewall bloqueando conexiones entrantes a Node.js, tampoco va a conectar aunque estén en la misma red.

Usuario inicial: el mismo del panel web, `admin@bgoat.com` / `Bgoat2026*`.

## Estructura

Arquitectura limpia, la misma de los otros proyectos:

| Carpeta | Qué contiene |
|---|---|
| `domain/` | Entidades y contratos. No saben que existe una API. |
| `data/` | Modelos (JSON) e implementaciones de los contratos. |
| `presentation/` | Providers (estado) y pantallas. |
| `core/` | Cliente HTTP, tema, formatos, conversiones. |
