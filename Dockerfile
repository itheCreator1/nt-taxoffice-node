FROM node:18-alpine

WORKDIR /app

# Install mysql client and netcat for database initialization and health checks
RUN apk add --no-cache mysql-client netcat-openbsd

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --production

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["docker-entrypoint.sh"]