# Panel React/Vite de BGoat: build estatico servido por Nginx, que ademas
# hace de reverse proxy hacia la API en /api.

# --- Etapa 1: build del SPA ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# En produccion el panel llama a la API en el MISMO origen, via /api (Nginx la
# enruta al contenedor del backend). Sin esta variable, apiClient.js cae en su
# valor por defecto http://localhost:4000/api, que en el navegador del usuario
# apunta a la maquina del usuario y no al servidor.
ENV VITE_API_URL=/api
# El VPS tiene 1 vCPU y 1.9 GB de RAM compartidos con Bitemo. Sin este techo el
# build de Vite puede pedir mas memoria de la que hay y morir por OOM a mitad
# del despliegue.
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build

# --- Etapa 2: Nginx sirviendo el build + proxy /api ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Las cabeceras van aparte porque Nginx obliga a repetirlas en cada location
# que declare su propio add_header; ver el comentario dentro del archivo.
COPY cabeceras-seguridad.conf /etc/nginx/cabeceras-seguridad.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
