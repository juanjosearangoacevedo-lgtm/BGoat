# Backend Node/Express de BGoat.
FROM node:22-alpine

WORKDIR /app

# Las dependencias primero: mientras package-lock.json no cambie, Docker
# reutiliza esta capa y un redespliegue no vuelve a bajar node_modules.
COPY package*.json ./
RUN npm ci --omit=dev

# El codigo. El .env queda fuera por .dockerignore: en el servidor las
# variables las inyecta docker-compose desde /opt/bgoat/.env.
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
