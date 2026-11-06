// Funds the 0G ledger and provider sub-accounts for Direct mode.
//   bun run src/fund.ts            (ledger: 3 0G minimum; 1 0G per pipeline provider)
// transferFund also acknowledges the provider's TEE signer on-chain for this account.

import { ethers } from "ethers";
import { MODELS } from "./judges";
import { broker, pickProvider, zgWallet } from "./zg";

const w = zgWallet();
const bal = await w.provider!.getBalance(w.address);
console.log(`0G wallet ${w.address}  balance ${ethers.formatEther(bal)} 0G`);

const b = await broker();
let ledgerOk = true;
try { await b.ledger.getLedger(); } catch { ledgerOk = false; }
if (!ledgerOk) {
  console.log("creating ledger with 3 0G ...");
  await b.ledger.depositFund(3);
}
const models = [...new Set(Object.values(MODELS))];
for (const m of models) {
  const p = await pickProvider(m);
  console.log(`transfer 1 0G to sub-account for ${m} (${p}) ...`);
  await b.ledger.transferFund(p, "inference", BigInt(1) * BigInt(10 ** 18));
}
console.log("done");
