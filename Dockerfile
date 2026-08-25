FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.mjs openapi.json ./
COPY data ./data
COPY public ./public
ENV HOST=0.0.0.0
ENV PORT=3100
EXPOSE 3100
CMD ["node", "server.mjs"]
