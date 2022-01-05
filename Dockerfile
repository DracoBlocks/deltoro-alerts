FROM node:17-alpine

COPY . /app
WORKDIR /app

RUN npm install

ENTRYPOINT [ "npm run start" ]