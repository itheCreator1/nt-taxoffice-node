FROM node:18-alpine

WORKDIR /app

# Install mysql client, netcat, and build dependencies for native modules
RUN apk add --no-cache mysql-client netcat-openbsd python3 make g++

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && npm rebuild bcrypt --build-from-source

# Copy entrypoint script and fix Windows line endings
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["docker-entrypoint.sh"]