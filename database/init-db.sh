#!/bin/bash
# ============================================================
# GoalTrack — Database Initialization Script
# Usage: bash init-db.sh [--seed]
# ============================================================

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="goaltrack_db"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  GoalTrack Database Initialization"
echo "============================================"
echo ""
echo "Host:     $DB_HOST:$DB_PORT"
echo "User:     $DB_USER"
echo "Database: $DB_NAME"
echo ""

# Build mysql command
MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
if [ -n "$DB_PASS" ]; then
  MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
fi

# Step 1: Run schema
echo "[1/3] Creating schema..."
$MYSQL_CMD < "$SCRIPT_DIR/schema.sql"
echo "  ✓ Schema created successfully"

# Step 2: Run seed data if --seed flag is passed
if [ "$1" == "--seed" ]; then
  echo "[2/3] Inserting seed data..."
  $MYSQL_CMD < "$SCRIPT_DIR/seed.sql"
  echo "  ✓ Seed data inserted"
else
  echo "[2/3] Skipping seed data (use --seed flag to include)"
fi

# Step 3: Verify
echo "[3/3] Verifying..."
TABLE_COUNT=$($MYSQL_CMD -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")
echo "  ✓ $TABLE_COUNT tables created in $DB_NAME"

echo ""
echo "============================================"
echo "  Database ready! 🚀"
echo "============================================"
