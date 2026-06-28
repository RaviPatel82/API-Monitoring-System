FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p logs

EXPOSE 3000

CMD ["npm", "start"]