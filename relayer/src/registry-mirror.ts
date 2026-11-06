// Registry mirror: copies 0G InferenceServing Service records (provider -> enclave signer)
// into SignerRegistry on Arc, recording the 0G block they were read at.
//   bun run src/registry-mirror.ts <provider> [<provider> ...]
// With no arguments, mirrors the TeeML provider pickProvider finds for each pipeline model
// (router on mainnet, InferenceServing on testnet; no key needed).

import { zeroHash, type Address } from "viem";
import { addr, publicClient, registryAbi, tx, wallet } from "./arc";
import { PIPELINE_MODELS } from "./judges";
import { getService, pickProvider } from "./zg";

export async function mirrorProvider(provider: Address, log = console.log) {
  const svc = await getService(provider);
  if (svc.verifiability !== "TeeML") throw new Error(`${provider} is ${svc.verifiability}; only TeeML signers are mirrored`);
  const { account, client } = wallet();
  const registry = addr("SIGNER_REGISTRY");
  const already = await publicClient.readContract({ address: registry, abi: registryAbi, functionName: "providerOf", args: [svc.signer] });
  if (already.toLowerCase() === provider.toLowerCase()) {
    log(`  ${svc.model}: signer ${svc.signer} already mirrored`);
    return svc;
  }
  const hash = await client.writeContract({
    address: registry, abi: registryAbi, functionName: "sync",
    args: [provider, svc.signer, svc.model, svc.block, zeroHash], account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  log(`  ${svc.model}: provider ${provider} -> signer ${svc.signer} @0G block ${svc.block}  ${tx(hash)}`);
  return svc;
}

if (import.meta.main) {
  let providers = process.argv.slice(2) as Address[];
  if (providers.length === 0) {
    const found = await Promise.all(PIPELINE_MODELS.map(async (m) => [m, await pickProvider(m)] as const));
    for (const [m, p] of found) console.log(`  ${m} -> ${p}`);
    providers = [...new Set(found.map(([, p]) => p))];
  }
  console.log("mirroring into SignerRegistry", addr("SIGNER_REGISTRY"));
  for (const p of providers) await mirrorProvider(p);
}
