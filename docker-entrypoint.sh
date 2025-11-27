#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
until nc -z "$DB_HOST" 3306; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "MySQL port is open, waiting for it to accept connections..."
sleep 5

echo "MySQL is up - initializing database..."
node scripts/init-db.js

echo "Starting application..."
exec npm start
