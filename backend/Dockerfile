FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY migrations ./migrations

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/educative_tracker.db

EXPOSE 4000

CMD ["npm", "run", "start"]
