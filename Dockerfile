FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM python:3.13.1-slim
WORKDIR /app
COPY --from=builder /app ./
COPY requirements.txt ./
RUN pip install -r requirements.txt

EXPOSE 3000
CMD ["npm", "start"]