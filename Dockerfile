FROM node:20-alpine

WORKDIR /app

# bcrypt requires native compilation — install build tools, compile, then remove
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install \
    && apk del .build-deps

COPY . .

EXPOSE 5000

# Migrations run first (idempotent), then the app starts
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node server.js"]
