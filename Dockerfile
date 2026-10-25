FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json nest-cli.json jest.config.js ./
COPY src ./src
RUN npm test -- --runInBand && npm run build \
    && test -f dist/main.js \
    && test -f dist/database/data-source.js \
    && test -f dist/database/migrations/1792800000000-AddReportPhotos.js

FROM node:22-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json package-lock.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
