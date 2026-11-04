FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json
RUN mkdir /data && chown node:node /data
USER node
ENV HOST=0.0.0.0 PORT=4315 IPBIBLE_DATA_DIR=/data
EXPOSE 4315
VOLUME /data
CMD ["node", "server/index.mjs"]
