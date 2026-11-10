FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages/shared/package.json packages/shared/package-lock.json packages/shared/
COPY apps/api/package.json apps/api/package-lock.json apps/api/

RUN npm install --omit=dev --ignore-scripts --prefix packages/shared \
  && npm install --omit=dev --ignore-scripts --prefix apps/api \
  && npm install --ignore-scripts --prefix apps/api prisma tsx

COPY packages/shared packages/shared
COPY apps/api/prisma apps/api/prisma
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.json

WORKDIR /app/apps/api
RUN npx prisma generate

ENV NODE_ENV=production
ENV EMBEDDED_POSTGRES=false
EXPOSE 3333

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
