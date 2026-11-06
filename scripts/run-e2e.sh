#!/usr/bin/env bash
# Full real run: deploy (if needed) -> mirror signers -> e2e pass / fail / injected
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

: "${ZG_PRIVATE_KEY:?ZG_PRIVATE_KEY is empty: put a funded 0G wallet key (Galileo testnet by default) in .env (see README)}"
if [ -z "${VERDICT_ESCROW:-}" ]; then ./scripts/deploy.sh; set -a; source .env; set +a; fi

cd relayer
echo "== fund 0G ledger + provider sub-accounts (no-op if already funded)"; bun run src/fund.ts
echo "== spike: one attested call end to end"; bun run src/spike.ts "${JUDGE_A:-glm-5.3}"
echo "== mirror signers into SignerRegistry"; bun run src/registry-mirror.ts
cases=("$@"); [ ${#cases[@]} -eq 0 ] && cases=(pass fail injected)
for c in "${cases[@]}"; do
  echo "== e2e case: $c"; bun run src/e2e.ts "$c"
done
