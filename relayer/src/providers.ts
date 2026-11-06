// Lists the router's providers for a model, reads each one's Service record from 0G chain,
// and probes the provider's signature endpoint. No API key needed.
//   bun run src/providers.ts [model]

import type { Address } from "viem";
import { ROUTER, getService, INFERENCE_SERVING, ZG_RPC } from "./zg";

const model = process.argv[2] ?? "glm-5.3";
const res = await fetch(`${ROUTER}/providers?model=${encodeURIComponent(model)}`);
const j: any = await res.json();
const list: any[] = j.data ?? j.providers ?? j;
console.log(`router providers for ${model}: ${Array.isArray(list) ? list.length : JSON.stringify(j).slice(0, 300)}`);
console.log(`InferenceServing ${INFERENCE_SERVING} via ${ZG_RPC}\n`);

for (const p of Array.isArray(list) ? list : []) {
  const address: Address | undefined = p.address ?? p.provider ?? p.provider_address ?? p.onchain_address;
  console.log(JSON.stringify(p).slice(0, 400));
  if (!address) continue;
  try {
    const s = await getService(address);
    console.log(`  Service @block ${s.block}: model=${s.model} verifiability=${s.verifiability}`);
    console.log(`  url=${s.url}`);
    console.log(`  teeSignerAddress=${s.teeSignerAddress} acknowledged=${s.teeSignerAcknowledged} effective=${s.signer}`);
    console.log(`  additionalInfo=${s.additionalInfo.slice(0, 160)}`);
    const probe = `${s.url.replace(/\/+$/, "")}/v1/proxy/signature/verdict-probe?model=${encodeURIComponent(s.model)}`;
    try {
      const r = await fetch(probe, { signal: AbortSignal.timeout(8000) });
      console.log(`  signature endpoint reachable: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
    } catch (e) {
      console.log(`  signature endpoint NOT reachable: ${(e as Error).message}`);
    }
  } catch (e) {
    console.log(`  getService failed: ${(e as Error).message.slice(0, 200)}`);
  }
  console.log();
}
