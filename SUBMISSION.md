# ETHGlobal Mumbai submission kit

Paste-ready answers for the form, plus a 3-minute demo script. Every number and link below comes from a live run on Arc testnet.

## Form fields

**Project name:** Verdict

**Short description (≤ 100 chars):**
USDC escrow on Arc that pays out only when signed AI judges agree, checked on-chain byte for byte.

**Description:**
Verdict is a conditional USDC escrow on Arc. A payer locks USDC against a written rubric. The payee commits a hash of their evidence. Two LLMs from different model families judge it independently, a third call checks the rationales against the evidence, and a fourth gives a calibrated confidence. Each model reply is signed over `sha256(request):sha256(response)`. The contract re-hashes the exact bytes, `ecrecover`s every signer against a registry, and checks that the prompt named this escrow's rubric and evidence hashes. It also parses a fixed-width verdict header from the reply. Only then does it release, refund, or escalate. Escalation freezes the funds for a named arbiter, and after the deadline the payer can take them back. Agents can also buy a signed verdict bundle over x402 and pay in Arc USDC (EIP-3009).

The signer is pluggable. The 0G Compute TeeML path (enclave signing keys read from 0G's on-chain `InferenceServing`) is implemented and tested. Tonight's live runs use a self-attested signer over free Groq models, because we could not get the 3+ 0G that 0G Compute requires. The verifier and dApp label those signatures SELF-ATTESTED.

**How it's made:**
- **Contracts:** Foundry, via-IR. `SignerRegistry` maps signer → provider, model, and source block. `VerdictOracle` has no state: SHA-256 ×2, EIP-191, `ecrecover`, request binding, fixed-offset header parse, and the quorum policy (distinct judge models, unanimity, confidence floor, grounding gate). `VerdictEscrow` handles open, evidence, settle, arbitrate, and refund after the deadline. 20 Foundry tests cover tampered bytes, replay across escrows, wrong-escrow headers, revoked signers, and the same model twice.
- **Relayer:** Bun + viem. It keeps the exact request and response bytes and verifies locally before spending gas. It refuses a reply if the first `"VERDICT:` in the raw JSON isn't the reply's own header, because a reasoning field can quote a draft.
- **x402:** Arc USDC supports EIP-3009 with domain `USDC`/`2`, which reproduces the token's `DOMAIN_SEPARATOR`. So the API acts as its own facilitator: it checks the authorization and submits `transferWithAuthorization`.
- **dApp:** zero-build HTML + viem. It opens escrows, commits evidence, offers arbiter and late-refund actions, and verifies any settle tx in the browser.
- **The hack:** the 0G docs describe the signed text wrongly. We read the broker source (`signChatWithKey`) to find what the enclave actually signs.

**Tracks:** Arc — Best Smart Contracts with Advanced Stablecoin Logic. If you also enter 0G, say plainly that the TeeML path is implemented but unfunded.

**Links:**
- Repo: https://github.com/Atharv181/verdict
- Live dApp: https://atharv181.github.io/verdict/web/
- VerdictEscrow: https://explorer.testnet.arc.io/address/0x49bdAB3BAdDdCed369347b89325b7Af058440359 · VerdictOracle `0xdff4D8727642CbED13dC1Df29A1EfE70a59C4cbE` · SignerRegistry `0x0148950580C3F20855b49f199CF254D602E489A6`
- Arc Studio: https://studio.arc.io/app/89b937cc-dbea-475b-9e27-53aa58722c00 (repo cloned into the sandbox; Studio ran `forge build` and `forge test`: 20/20 pass)

**Arc Studio (done):** create the app with a first turn (`arc-studio run --session verdict "..."`), then run `arc-studio clone --session verdict https://github.com/Atharv181/verdict`. A bare `clone` fails with "No session found" until an app exists.

**Team handles:** `<Telegram>` · `<X>`

**AI tools:** Built with Claude Code (Anthropic) as a pair programmer, which is allowed under ETHGlobal rules. All contract logic, live runs and claims were verified on-chain.

## Live evidence (Arc testnet)

| What | Tx |
|---|---|
| YES → released | [0xa5a5d655…](https://explorer.testnet.arc.io/tx/0xa5a5d655ad2ae773496b36e4345b6a30cb6db47275b4095eca132079672d2e7b) |
| NO → refunded | [0xee91df74…](https://explorer.testnet.arc.io/tx/0xee91df74fc4912f8099d244bd588302ac2d6d3c3cbecaae0cf0b3b1b7862ddd6) |
| Prompt injection resisted → refunded | [0xd52c798c…](https://explorer.testnet.arc.io/tx/0xd52c798ca5a32cca0023e0f24921b5302daac4256e7fa81de19580acbc21db7d) |
| ESCALATE → `arbitrate(refund)` | [0x8ac94a4c…](https://explorer.testnet.arc.io/tx/0x8ac94a4cc561a6f27e8e286921817f4327487766b3d67744545cf39d71e01be6) → [0x6fab7ff3…](https://explorer.testnet.arc.io/tx/0x6fab7ff3401afc947ae2eac92275572a70a22fe909d83b0e425ef673833891b2) |
| ESCALATE → `arbitrate(release)` | [0x40140429…](https://explorer.testnet.arc.io/tx/0x40140429284878cdd9624d20e041e12444352f4ede55383d2610732b12bc55aa) → [0x97df7903…](https://explorer.testnet.arc.io/tx/0x97df7903ddd599df9755c8ad21184ad8fc90612b1dc5221496b269e4f4e6324a) |
| x402: 0.05 USDC paid per verdict | [0xf20ef6d7…](https://explorer.testnet.arc.io/tx/0xf20ef6d76e6dc6e4eb282b8639bd82fcbba42d3dc235265497720f2a52f710c8) |
| **Kept Escalated for the demo** | escrow `0x4dcc122f71a0d31788aabb0315f602c6d4f0b91abf4781ee8c78ab42128070a5`, settle [0x5cc63a29…](https://explorer.testnet.arc.io/tx/0x5cc63a2945b8d55573104b2cfe1122759751e4fc5bba26afd197f448530bffec) |

## Demo video script (about 3 minutes)

Before recording, import the `ARC_PRIVATE_KEY` wallet (`0x8937…8Fc1`) into your browser wallet. It is the payer and the arbiter of the demo escrow. Add Arc testnet: chain 5042002, RPC `https://rpc.testnet.arc.io`. Bun reads `.env` only from the current folder and the file lives in the repo root, so start **every** terminal with:

```bash
cd verdict && set -a && source .env && set +a && cd relayer
```

1. **The problem (0:00–0:20).** "AI oracles ask you to trust a relayer or wait days for a dispute window. Verdict's contract checks the signatures over the exact model bytes itself."
2. **Settle one escrow live (0:20–1:20).** In a terminal (set up as above): `bun run src/e2e.ts pass`. Narrate as it runs:
   - it opens a 1 USDC escrow
   - it commits the evidence hash
   - two model families say Y
   - grounding says Y
   - calibration gives 0.9+
   - `oracle.resolve -> YES`, the escrow settles, and the payee's USDC goes up

   Open the settle link it prints.
3. **Anyone can verify (1:20–1:50).** On the live dApp, paste that settle tx into **Verify**. The page re-hashes every attestation and shows the recovered signers. Point out the "SELF-ATTESTED" label: it is honest about tonight's signer.
4. **Escalation and the arbiter (1:50–2:30).** In the dApp, **Load** escrow `0x4dcc…70a5`. The state is *Escalated*: both judges answered U, because the rubric hinges on a private call that text evidence can't show. Connect the arbiter wallet and click **Arbiter: release to payee** (or refund). Show the state flip to Resolved.
5. **Agents pay per verdict (2:30–2:50).** Run `bun run src/api.ts` in one terminal and `bun run src/pay.ts` in another (both set up as above). Show the 402 quote, the signed EIP-3009 authorization, the 200 response, and exactly 0.05 USDC leaving the buyer.
6. **Arc Studio (≈10 s).** Open https://studio.arc.io/app/89b937cc-dbea-475b-9e27-53aa58722c00. Show the cloned `verdict/` workspace and Studio's 20/20 `forge test` run.
7. **Close (2:50–3:00).** "The signer is pluggable. The 0G TeeML enclave path is built and tested; with 0G tokens it is a `.env` change."

Note for the recording: the Groq free tier allows about 1000 output tokens per minute for qwen, and the relayer waits out 429s, so step 2 can pause for 10–40 s. Run it once before recording so the video can be trimmed.

## Known limits (say these if asked)

- **Trusted signer:** live runs are signed by the relayer. That proves the escrow logic, not provenance. With 0G funds, enclave keys sign instead, and the contracts stay the same.
- **Stuck test escrows:** four escrows from failed runs are still Open, each holding 1 testnet USDC. The contract only allows `refundAfterDeadline`, about 7 days after opening.
- **The "ambiguous" attempt:** evidence of "92 on desktop, 84 on mobile", against a rubric that names neither, was meant to escalate. All models said Y, so it released. That is a defensible reading, so we replaced the case rather than tune it until it escalated.
