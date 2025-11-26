FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["npm", "start"]