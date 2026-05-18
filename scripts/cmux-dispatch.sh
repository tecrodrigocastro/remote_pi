#!/usr/bin/env bash
set -euo pipefail

# Despacha uma tarefa orquestrada pra um dos panes de agente do workspace
# cmux atual. Sempre prefixa o prompt com [ORCH:<task-id>] — esse é o gatilho
# que faz os 4 CLAUDE.md de subprojeto lerem .orchestration/INSTRUCTIONS.md
# e aplicarem as regras de modo orquestrado (cwd-only, sem commit, etc).
#
# Uso:
#   scripts/cmux-dispatch.sh <Pane> <task-id> <prompt>
#
# Exemplo:
#   scripts/cmux-dispatch.sh Extension 03-ts-codec "Implemente passo 3 do plan/03-protocol.md"
#
# Argumentos:
#   <Pane>    : App | Relay | Extension | Site
#   <task-id> : ID curto (kebab/snake: a-z 0-9 . _ -)
#   <prompt>  : texto do prompt (use aspas se tem espaços)
#
# Pra conversa fora do protocolo orquestrado (perguntas exploratórias,
# debug, retomar claude), use `cmux send` direto. Esse script é
# exclusivamente pro modo orquestrado — ele EXISTE pra não esquecer o
# marker.

usage() {
  awk '
    /^# Despacha/ { on = 1 }
    on {
      if (!/^#/) exit
      sub(/^# /, "")
      sub(/^#$/, "")
      print
    }
  ' "$0"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ $# -lt 3 ]; then
  usage >&2
  echo >&2
  echo "erro: argumentos insuficientes (esperado 3, recebido $#)" >&2
  exit 2
fi

pane="$1"
task_id="$2"
shift 2
prompt="$*"

valid_panes=(App Relay Extension Site)
case " ${valid_panes[*]} " in
  *" $pane "*) ;;
  *)
    echo "erro: pane '$pane' inválido. Use: ${valid_panes[*]}" >&2
    exit 2
    ;;
esac

if [[ ! "$task_id" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "erro: task-id '$task_id' inválido (use a-z A-Z 0-9 . _ -)" >&2
  exit 2
fi

if [ -z "$prompt" ]; then
  echo "erro: prompt vazio" >&2
  exit 2
fi

command -v cmux >/dev/null || { echo "erro: cmux não encontrado no PATH" >&2; exit 1; }

WS_REF=$(cmux identify 2>/dev/null \
  | awk -F'"' '/"workspace_ref"/ {print $4; exit}')
[ -n "$WS_REF" ] || { echo "erro: workspace cmux não identificado" >&2; exit 1; }

# resolve surface ID pelo título do pane no workspace alvo
sid=$(cmux tree 2>/dev/null | awk -v target="$WS_REF" -v name="$pane" '
  /workspace workspace:/ {
    in_ws = 0
    for (i = 1; i <= NF; i++) if ($i == target) in_ws = 1
    next
  }
  in_ws && /surface surface:/ && index($0, "\"" name "\"") {
    for (i = 1; i <= NF; i++) if ($i ~ /^surface:/) { print $i; exit }
  }
')

if [ -z "$sid" ]; then
  echo "erro: pane '$pane' não encontrado no workspace $WS_REF" >&2
  echo "rode scripts/cmux-bootstrap-agents.sh pra criar os 4 panes" >&2
  exit 3
fi

full_prompt="[ORCH:${task_id}] ${prompt}"

cmux send     --surface "$sid" -- "$full_prompt" >/dev/null
cmux send-key --surface "$sid" enter >/dev/null

printf "ok  %-10s %s\n     [ORCH:%s] %s\n" "$pane" "$sid" "$task_id" "$prompt"
