FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install --no-fund --no-audit

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
