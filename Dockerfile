FROM node:18-alpine

WORKDIR /app

# Install mysql client for database initialization
RUN apk add --no-cache mysql-client

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads

# Create startup script
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'set -e' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Waiting for MySQL to be ready..."' >> /app/docker-entrypoint.sh && \
    echo 'until mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; do' >> /app/docker-entrypoint.sh && \
    echo '  echo "MySQL is unavailable - sleeping"' >> /app/docker-entrypoint.sh && \
    echo '  sleep 2' >> /app/docker-entrypoint.sh && \
    echo 'done' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "MySQL is up - initializing database..."' >> /app/docker-entrypoint.sh && \
    echo 'node scripts/init-db.js' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/docker-entrypoint.sh && \
    echo 'exec npm start' >> /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "/app/docker-entrypoint.sh"]