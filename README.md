# BGoat

Sistema de gestión de producción textil para **Confecciones God's Eyes SAS**
(maquila de confección, Medellín). Proyecto de formación del SENA — Tecnología
en Análisis y Desarrollo de Software.

> **Qué es este sistema, en una frase:**
> BGoat existe para que una empresa de confección por maquila sepa cuánta
> capacidad productiva real tiene y pueda venderla sin equivocarse.

---

## El problema

Cada módulo de la planta tiene un tablero de pared donde la supervisora anota,
franja por franja, cuánto se produjo, y **hace las cuentas a mano**. Con 12
módulos y una jornada de 520 minutos son cerca de 200 operaciones aritméticas
al día — y el tablero se borra cada noche.

El sistema reemplaza ese tablero. La supervisora solo digita unidades,
personas y los minutos de parada; el resto lo calcula la base de datos:

```
minutos_disponibles = personas_presentes × minutos_franja
meta_hora           = minutos_disponibles / sam_pactado
cumplimiento        = unidades_producidas / meta_hora
sam_observado       = minutos_disponibles / unidades_producidas
facturacion_real    = unidades_producidas × precio_aplicado
```

Comparar el **SAM pactado** (lo que el cliente paga por prenda) contra el
**SAM observado** (lo que de verdad cuesta) es el producto principal: dice en
qué contratos la empresa gana y en cuáles pierde.

---

## Estructura

| Carpeta | Qué contiene |
| --- | --- |
| [`database/`](database) | Esquema MySQL 8, catálogos base, datos de demostración y el mapeo con el frontend |
| [`backend/`](backend) | API en Node + Express + MySQL — ver [README](backend/README.md) |
| [`frontend/`](frontend) | Panel web en React + Vite + Tailwind — ver [README](frontend/README.md) |

---

## Puesta en marcha

Necesitas **MySQL 8** corriendo y **Node 18+**.

```bash
cd backend && npm install
```

Copia `backend/.env.example` a `backend/.env` y completa `DB_PASSWORD` con tu
contraseña de MySQL y `JWT_SECRET` con una cadena larga y aleatoria.

```bash
cd backend && npm run db:setup -- --demo
```

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

El panel queda en http://localhost:5173 y la API en http://localhost:4000/api.
El seed crea el usuario administrador inicial; las credenciales están en
[`backend/README.md`](backend/README.md) y **deben cambiarse en el primer
ingreso**.

---

## Notas

- Los archivos `.env` no se versionan. Los `.env.example` sí, sin valores reales.
- El análisis del problema y la justificación de cada tabla e indicador están en
  el documento de diseño conceptual, que se mantiene fuera de este repositorio.
