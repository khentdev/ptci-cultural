#!/usr/bin/env bash
# Creates the local database for the Fastify API and writes .env.
#
# The API owns its own database (default: cultural_api) so the legacy PHP backend's
# `ptci_cultural` stays intact as a fallback. Tables are created by the API itself
# on first boot (initDatabaseSchema), so nothing is imported here.
#
# Needs sudo once: MariaDB's root account uses unix_socket auth.
set -euo pipefail

DB_NAME="${DB_NAME:-cultural_api}"
DB_USER="${DB_USER:-cultural}"
DB_PASS="${DB_PASS:-cultural}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Creating database '$DB_NAME' and user '$DB_USER'"
sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}_test\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}_test\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

if [ ! -f "$HERE/.env" ]; then
  echo "==> Writing .env"
  JWT="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  cat > "$HERE/.env" <<ENV
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=
TRUST_PROXY=auto

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=$DB_USER
MYSQL_PASSWORD=$DB_PASS
MYSQL_DATABASE=$DB_NAME
MYSQL_SSL=false

JWT_SECRET=$JWT
JWT_EXPIRES_IN=1d

COOKIE_NAME=cultural_token
COOKIE_SECURE=auto
COOKIE_SAME_SITE=auto
COOKIE_DOMAIN=

SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=test1234
SEED_JUDGES=2
SEED_JUDGE_PASSWORD=judge1234
SEED_SAMPLE_CONTESTANTS=true
ENV
else
  echo "==> .env already exists, left alone"
fi

echo "==> Seeding teams, accounts and sample contestants"
cd "$HERE" && npm run seed

cat <<MSG

Done. Start the API with:
  cd Backend-Node && npm run dev

Then log in at http://localhost:5173 as admin / test1234
MSG
