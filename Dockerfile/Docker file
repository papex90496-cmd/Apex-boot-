FROM node:20
RUN apt-get update && apt-get install -y chromium
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
