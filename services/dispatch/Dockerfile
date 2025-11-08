FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || true
COPY . .
RUN npm run build --silent || true
EXPOSE 4003
CMD ["node", "dist/index.js"]
