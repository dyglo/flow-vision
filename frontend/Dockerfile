# syntax=docker/dockerfile:1.6

FROM node:20.18-alpine AS base
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS build
ENV NODE_ENV=production
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
