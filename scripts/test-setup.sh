#!/bin/bash
# Automated Test Database Setup Script
# One-command setup for integration testing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NT TaxOffice Test Database Setup ===${NC}\n"

# Step 1: Check if Docker is running
echo -e "${YELLOW}[1/5]${NC} Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}\n"

# Step 2: Check if docker-compose.yml exists
echo -e "${YELLOW}[2/5]${NC} Checking docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}ERROR: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose.yml found${NC}\n"

# Step 3: Start MySQL container
echo -e "${YELLOW}[3/5]${NC} Starting MySQL container..."
docker-compose up -d mysql
echo -e "${GREEN}✓ MySQL container started${NC}\n"

# Step 4: Wait for MySQL to be healthy
echo -e "${YELLOW}[4/5]${NC} Waiting for MySQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword --silent > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MySQL is ready${NC}\n"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}ERROR: MySQL failed to become ready after 30 seconds${NC}"
        echo "Check Docker logs: docker-compose logs mysql"
        exit 1
    fi

    echo -n "."
    sleep 1
done

# Step 5: Initialize test database
echo -e "${YELLOW}[5/5]${NC} Initializing test database..."
if npm run test:db:init; then
    echo -e "${GREEN}✓ Test database initialized${NC}\n"
else
    echo -e "${RED}ERROR: Database initialization failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

# Success message
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Test database is ready! You can now run:"
echo "  npm test              - Run all tests"
echo "  npm run test:unit     - Run unit tests only"
echo "  npm run test:integration - Run integration tests only"
echo ""
echo "To stop the MySQL container:"
echo "  docker-compose down"
echo ""
