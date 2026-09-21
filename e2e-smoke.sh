#!/usr/bin/env bash
# Teste end-to-end do sistema (API + chat + web) sobre os dados migrados do SAC.
#
# Uso: ./e2e-smoke.sh   (requer api-ts:8001, chat-backend:8002, web:3000 e o
# Postgres de desenvolvimento no ar, com o workspace "quality" migrado).
# Variaveis: API, CHAT, WEB podem ser sobrescritas por env.
set -u
API=${API:-http://localhost:8001}
CHAT=${CHAT:-http://localhost:8002}
WEB=${WEB:-http://localhost:3000}
# How to query the database under test. SQL goes via STDIN (not as
# argumento) porque, atravessando ssh, o shell remoto reparte os argumentos e o
# psql receives the query in pieces.
# Remoto: PSQL="ssh root@host docker exec -i plane-plane-db psql -U plane -d plane -tA"
PSQL=${PSQL:-"docker exec -i plane-dev-db psql -U plane -d plane -tA"}
db() { echo "$1" | $PSQL 2>/dev/null; }
# Support user credentials (checks D2 rule). Empty = skip.
ATEND_EMAIL=${ATEND_EMAIL:-atendimento@quality.local}
ATEND_PASS=${ATEND_PASS:-atendimento}
PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
check(){ [ "$2" = "$3" ] && ok "$1 ($2)" || bad "$1 (esperado $3, obtido $2)"; }

echo "── 1. Authentication ────────────────────────────────────"
ADMIN=$(curl -s -X POST $API/auth/sign-in/ -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"admin@plane.so","password":"admin"}')
ADMIN_TOKEN=$(echo "$ADMIN" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
[ -n "$ADMIN_TOKEN" ] && ok "login admin" || bad "login admin"

ATEND=$(curl -s -X POST $API/auth/sign-in/ -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d "{\"email\":\"$ATEND_EMAIL\",\"password\":\"$ATEND_PASS\"}")
ATEND_TOKEN=$(echo "$ATEND" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
[ -n "$ATEND_TOKEN" ] && ok "login atendimento" || bad "login atendimento"

BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/sign-in/ -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"admin@plane.so","password":"senha-errada"}')
# API responds 403 "Invalid email or password." (without distinguishing missing user).
check "login with wrong password is rejected" "$BAD" "403"

AC="Cookie: plane_auth=$ADMIN_TOKEN"
TC="Cookie: plane_auth=$ATEND_TOKEN"

# Frontend calls /api/... (proxy rewrites to /api/v1/). A deploy once
# broke this path alone — the entire site crashed to "instance not
# iniciada" enquanto /api/v1/ respondia 200 e o e2e passava.
REWRITE=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/instances/")
check "proxy rewrites /api/ to /api/v1/" "$REWRITE" "200"

echo "── 2. Dados migrados do legado ────────────────────────"
PROJ=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/projects/")
NPROJ=$(echo "$PROJ" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d) if isinstance(d,list) else -1)" 2>/dev/null)
[ "${NPROJ:-0}" -gt 100 ] && ok "projetos migrados: $NPROJ" || bad "projetos migrados: ${NPROJ:-erro}"

ENT=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/entities/?cursor=1000:0:0")
NENT=$(echo "$ENT" | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_count',-1))" 2>/dev/null)
[ "${NENT:-0}" -gt 200 ] && ok "entidades migradas: $NENT" || bad "entidades migradas: ${NENT:-erro}"

ENT_FIELDS=$(echo "$ENT" | python3 -c "
import sys,json
r=json.load(sys.stdin)['results'][0]
print('ok' if 'entity_type' in r and 'is_active' in r else 'faltando')" 2>/dev/null)
check "entidade serializada em snake_case" "$ENT_FIELDS" "ok"

echo "── 3. Chamados + filtro de entidade ───────────────────"
ISSUES=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/issues/")
TOTAL=$(echo "$ISSUES" | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_count',-1))" 2>/dev/null)
[ "${TOTAL:-0}" -gt 0 ] && ok "chamados: $TOTAL" || bad "chamados: ${TOTAL:-erro}"

EID=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/issues/?cursor=100:0:0" | python3 -c "
import sys,json
rs=json.load(sys.stdin).get('results',[])
print(next((i.get('entity_id') for i in rs if i.get('entity_id')), ''))" 2>/dev/null)
if [ -n "$EID" ]; then
  FILTERED=$(curl -s -H "$AC" -G "$API/api/v1/workspaces/quality/issues/" \
    --data-urlencode "filters={\"and\":[{\"entity_id__in\":\"$EID\"}]}" \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_count',-1))" 2>/dev/null)
  [ "${FILTERED:-0}" -gt 0 ] && [ "${FILTERED:-0}" -le "${TOTAL:-0}" ] \
    && ok "filtro por entidade restringe ($FILTERED de $TOTAL)" || bad "filtro por entidade ($FILTERED de $TOTAL)"
else
  bad "nenhum item com entidade para testar o filtro"
fi

echo "── 4. Comments and attachments migrated ───────────────────"
COMMENTS=$(db "SELECT count(*) FROM issue_comments WHERE external_source='sac_migration';")
[ "${COMMENTS:-0}" -gt 100 ] && ok "comments migrated: $COMMENTS" || bad "comments migrated: ${COMMENTS:-error}"
ATT=$(db "SELECT count(*) FROM issue_attachments WHERE external_source='sac_migration_file';")
[ "${ATT:-0}" -gt 100 ] && ok "anexos catalogados: $ATT" || bad "anexos catalogados: ${ATT:-erro}"
VIS=$(db "SELECT count(*) FROM technical_visits WHERE entity_id IS NOT NULL;")
[ "${VIS:-0}" -gt 100 ] && ok "visitas com entidade: $VIS" || bad "visitas com entidade: ${VIS:-erro}"

echo "── 5. Permissions ──────────────────────────────────────"
PID=$(echo "$PROJ" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if d else '')" 2>/dev/null)
if [ -n "$ATEND_TOKEN" ]; then
  CREATE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$TC" -H 'Content-Type: application/json' \
    "$API/api/v1/workspaces/quality/projects/$PID/issues/" -d '{"name":"Atendimento nao pode criar"}')
  check "Support does NOT create work item" "$CREATE" "403"
else
  echo "  ⏭  Support does NOT create work item (no support user in this environment)"
fi

ANON=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H 'Content-Type: application/json' \
  "$API/api/v1/instances/" -d '{"instance_name":"HACK"}')
[ "$ANON" = "401" ] || [ "$ANON" = "403" ] && ok "PATCH /instances/ anonymous blocked ($ANON)" || bad "PATCH /instances/ anonymous ($ANON)"

NOTFOUND=$(curl -s -o /dev/null -w "%{http_code}" -H "$AC" \
  "$API/api/v1/workspaces/quality/projects/$PID/issues/00000000-0000-0000-0000-000000000000/")
check "non-existent record returns 404 (not 500)" "$NOTFOUND" "404"

echo "── 6. Chat / WhatsApp ─────────────────────────────────"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $CHAT/health/)
check "chat-backend no ar" "$HEALTH" "200"
TICKET=$(curl -s -H "$TC" "$CHAT/workspaces/quality/ws-ticket/" | python3 -c "import sys,json;print('ok' if json.load(sys.stdin).get('ticket') else 'erro')" 2>/dev/null)
check "ticket de WebSocket do atendente" "$TICKET" "ok"
CLIENTPAGE=$(curl -s "$CHAT/client?workspace=quality" | grep -c "client.edit")
[ "${CLIENTPAGE:-0}" -ge 1 ] && ok "client widget exposes edit/delete" || bad "client widget lacks edit/delete"

echo "── 7. Auditoria (LGPD) ────────────────────────────────"
# Ver um chamado precisa virar registro de acesso na trilha.
read -r AI AP < <(db "SELECT id, project_id FROM issues WHERE deleted_at IS NULL LIMIT 1;" | tr '|' ' ')
curl -s -o /dev/null -H "$AC" -H "X-Forwarded-For: 203.0.113.99" \
  "$API/api/v1/workspaces/quality/projects/$AP/issues/$AI/"
sleep 2
VIEWS=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/audit-logs/?action=view&entity_id=$AI" \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_count',0))" 2>/dev/null)
[ "${VIEWS:-0}" -gt 0 ] && ok "viewing work item generates audit record" || bad "viewing work item did not generate record"

IP_OK=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/audit-logs/?action=view&entity_id=$AI" \
  | python3 -c "import sys,json;r=json.load(sys.stdin).get('results',[]);print('ok' if r and r[0].get('actor_ip') else 'sem-ip')" 2>/dev/null)
check "trilha registra o IP de origem" "$IP_OK" "ok"

LOGINS=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/audit-logs/?action=login" \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_count',0))" 2>/dev/null)
[ "${LOGINS:-0}" -gt 0 ] && ok "login recorded in audit trail ($LOGINS)" || bad "login not recorded"

NAO_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" -H "$TC" "$API/api/v1/workspaces/quality/audit-logs/")
check "non-admin cannot see others's audit trail" "$NAO_ADMIN" "403"

TITULAR=$(curl -s -o /dev/null -w "%{http_code}" -H "$TC" "$API/api/v1/workspaces/quality/audit-logs/me/")
check "user can query own accesses" "$TITULAR" "200"

CSV=$(curl -s -H "$AC" "$API/api/v1/workspaces/quality/audit-logs/export/" | head -1)
case "$CSV" in *ator_email*) ok "audit trail CSV export" ;; *) bad "audit trail CSV export" ;; esac

echo "── 8. Frontend ────────────────────────────────────────"
WEBCODE=$(curl -s -o /dev/null -w "%{http_code}" $WEB/)
check "web dev server responde" "$WEBCODE" "200"

echo ""
echo "══════════════════════════════════════════════════"
echo "  E2E: $PASS aprovados, $FAIL falhas"
echo "══════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ]
