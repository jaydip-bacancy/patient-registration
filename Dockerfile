FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3008

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]