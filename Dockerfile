FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM python:3.13.1-alpine
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]