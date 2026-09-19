#!/usr/bin/env bash
# Creates the local Cultural Night database, imports the dump, applies the
# schema migrations, and seeds an admin login.
#
# Needs sudo once: MariaDB's root account uses unix_socket auth, so only root
# (or sudo) can create a database. Everything after that runs as $DB_USER.
#
# Safe to re-run: the import and migrations tolerate already-applied statements.
set -euo pipefail

DB_NAME="${DB_NAME:-ptci_cultural}"
DB_USER="${DB_USER:-cultural}"
DB_PASS="${DB_PASS:-cultural}"
ADMIN_USER="${ADMIN_USER:-admin1}"
ADMIN_PASS="${ADMIN_PASS:-test1234}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Creating database '$DB_NAME' and user '$DB_USER'"
sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

run_sql() { mariadb --force -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"; }

echo "==> Importing the dump (tables + seed data)"
run_sql < "$HERE/u378403689_ptci_cultural.sql"

echo "==> Applying migrations (keys, unique constraints, is_active)"
run_sql < "$HERE/migrations.sql" 2>&1 | grep -v "Duplicate key name\|Multiple primary key\|Duplicate column name" || true

echo "==> Seeding admin account '$ADMIN_USER'"
# Hash with PHP so it matches password_verify() in api/auth/login.php exactly.
HASH="$(php -r 'echo password_hash($argv[1], PASSWORD_DEFAULT);' "$ADMIN_PASS")"
mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<SQL
INSERT INTO users (id, username, password, role, has_submitted, has_agreed, is_active)
VALUES (100001, '$ADMIN_USER', '$HASH', 'admin', 0, 0, 1)
ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin', is_active = 1;
SQL

echo
echo "==> Tables:"
mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"

cat <<MSG

Done.

Start the API (from the repo root):
  DB_USER=$DB_USER DB_PASS=$DB_PASS php -S localhost:3000 -t Backend/api

Log in at http://localhost:5173 with:
  username: $ADMIN_USER
  password: $ADMIN_PASS
MSG
