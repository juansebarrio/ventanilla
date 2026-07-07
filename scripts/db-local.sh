#!/usr/bin/env bash
set -euo pipefail

# Cluster PostgreSQL efímero para verificar migraciones, RLS y seed sin un
# proyecto Supabase real. Usa el Postgres del sistema (initdb + pg_ctl) y el
# stub de supabase/seed/local/. Comandos:
#
#   scripts/db-local.sh up       # inicializa y levanta el cluster
#   scripts/db-local.sh migrate  # roles + stub + migraciones
#   scripts/db-local.sh seed     # seed.sql (dos pasadas) + fixtures de auth
#   scripts/db-local.sh verify   # asserts de scripts/db-verify.sql
#   scripts/db-local.sh all      # todo lo anterior en orden
#   scripts/db-local.sh psql     # consola contra la base local
#   scripts/db-local.sh down     # detiene el cluster
#   scripts/db-local.sh reset    # detiene y borra el data dir

# Ubicar los binarios de servidor de Postgres. Preferimos $PGBIN si viene del
# entorno; si no, la instalación Debian (/usr/lib/postgresql/*/bin); si no,
# el PATH (Homebrew, Fedora). El `|| true` evita que set -e aborte antes del
# mensaje de ayuda cuando ningún candidato existe.
if [ -z "${PGBIN:-}" ]; then
  PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
fi
if [ -z "${PGBIN:-}" ]; then
  initdb_path="$(command -v initdb 2>/dev/null || true)"
  if [ -n "$initdb_path" ]; then PGBIN="$(dirname "$initdb_path")"; fi
fi
if [ -z "${PGBIN:-}" ] || [ ! -x "$PGBIN/initdb" ]; then
  echo "No se encontró una instalación de PostgreSQL (initdb/pg_ctl)." >&2
  echo "Instalá PostgreSQL o exportá PGBIN apuntando a su carpeta bin." >&2
  exit 1
fi

DATA_DIR="${VENTANILLA_PGDATA:-/tmp/ventanilla-pg}"
PORT="${VENTANILLA_PGPORT:-54322}"
export PGURL="postgresql://postgres@127.0.0.1:${PORT}/ventanilla"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# initdb y pg_ctl se niegan a correr como root: si hace falta, se delegan
# al usuario postgres del sistema con runuser.
if [ "$(id -u)" = "0" ]; then
  AS_PG=(runuser -u postgres --)
else
  AS_PG=()
fi

run_psql() {
  "$PGBIN/psql" "$PGURL" -v ON_ERROR_STOP=1 -q "$@"
}

up() {
  if [ ! -d "$DATA_DIR/base" ]; then
    mkdir -p "$DATA_DIR"
    if [ "$(id -u)" = "0" ]; then chown postgres "$DATA_DIR"; fi
    "${AS_PG[@]}" "$PGBIN/initdb" -D "$DATA_DIR" -U postgres --auth=trust --no-instructions >/dev/null
  fi
  if ! "${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
    "${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$DATA_DIR" -l "$DATA_DIR/server.log" \
      -o "-p $PORT -c listen_addresses=127.0.0.1 -c wal_level=logical" start >/dev/null
  fi
  local intentos=0
  until "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PORT" -q; do
    intentos=$((intentos + 1))
    if [ "$intentos" -ge 30 ]; then
      echo "El servidor no responde en el puerto $PORT tras 30 s." >&2
      echo "Revisá $DATA_DIR/server.log (¿un cluster viejo en otro puerto? probá: scripts/db-local.sh reset)." >&2
      exit 1
    fi
    sleep 1
  done
  if ! "$PGBIN/psql" "postgresql://postgres@127.0.0.1:${PORT}/postgres" -tAc \
      "select 1 from pg_database where datname = 'ventanilla'" | grep -q 1; then
    "$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" -U postgres ventanilla
  fi
  echo "Base local lista en $PGURL"
}

# Base limpia: dropea y recrea 'ventanilla' para que 'all' sea reproducible
# aunque el data dir ya tenga un schema migrado de una corrida anterior.
fresh_db() {
  "$PGBIN/psql" "postgresql://postgres@127.0.0.1:${PORT}/postgres" -q -v ON_ERROR_STOP=1 \
    -c "drop database if exists ventanilla with (force)" \
    -c "create database ventanilla"
}

migrate() {
  run_psql -f "$ROOT/supabase/seed/local/00_roles.sql"
  run_psql -f "$ROOT/supabase/seed/local/01_supabase_stub.sql"
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo "· $(basename "$f")"
    run_psql -f "$f"
  done
}

seed() {
  echo "· seed.sql (primera pasada)"
  run_psql -f "$ROOT/supabase/seed/seed.sql"
  echo "· seed.sql (segunda pasada, prueba de idempotencia)"
  run_psql -f "$ROOT/supabase/seed/seed.sql"
  echo "· fixtures de auth locales"
  run_psql -f "$ROOT/supabase/seed/local/02_auth_fixtures.sql"
}

verify() {
  run_psql -f "$ROOT/scripts/db-verify.sql"
  echo "Verificación en verde."
}

down() {
  "${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$DATA_DIR" stop -m fast >/dev/null 2>&1 || true
  echo "Cluster detenido."
}

case "${1:-all}" in
  up) up ;;
  migrate) migrate ;;
  seed) seed ;;
  verify) verify ;;
  psql) shift; exec "$PGBIN/psql" "$PGURL" "$@" ;;
  down) down ;;
  reset) down; rm -rf "$DATA_DIR"; echo "Data dir borrado." ;;
  all) up; fresh_db; migrate; seed; verify ;;
  *) echo "Comando desconocido: $1" >&2; exit 1 ;;
esac
