#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE authdb;
    CREATE DATABASE accountdb;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname authdb -f /docker-entrypoint-initdb.d/sql/auth.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname accountdb -f /docker-entrypoint-initdb.d/sql/account.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname accountdb -f /docker-entrypoint-initdb.d/sql/transfer.sql
