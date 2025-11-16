FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

EXPOSE 6001

CMD ["npm", "start"]
