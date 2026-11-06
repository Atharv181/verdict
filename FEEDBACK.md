# Developer feedback: 0G and Arc

## 0G Compute

- **The testnet faucet cannot fund a Compute ledger.** The faucet gives 0.1 0G per day, but `depositFund` needs at least 3 0G to create a ledger. So a team that starts a hackathon with no 0G cannot run a single TeeML inference on Galileo before the deadline. That is why our live run used a self-attested signer instead of an enclave. A hackathon faucet tier, or a lower testnet ledger minimum, would fix it.
- **`GET /v1/providers?model=` mixes in providers that have no on-chain record.** It is the fastest way to find TeeML providers, but the standard-tier entries (`baidu`, `tencent`) share one address, `0x000000003f486c7198d6203568a98d02b91f8044`, that is not in `InferenceServing`; `getService` reverts with selector `0x098eda7e`. The reference should say which providers have on-chain records and name the custom error.
- **Model id casing differs** between the router (`0gm-1.0-35b-a3b`) and the Service record (`0GM-1.0-35B-A3B`). The signature endpoint takes `?model=`; it should accept either, or the docs should say to use `Service.model`.
- **The docs describe the signed payload wrongly.** The verifiable-execution page says to "confirm the signed text matches the response content". The broker actually signs `hex(sha256(requestBody)) ":" hex(sha256(responseBody))` (`signing.go`, `signChatWithKey`), so the text returned by `/v1/proxy/signature` never equals the content. A page titled "What exactly is signed", with the byte layout and the fact that only a direct caller holds the hashed bytes, would save every integrator a day. We lost half of ours to this.
- **Router and private mode break independent verification.** The router rewrites the request, and in private mode the gateway seals it, so an API-key client cannot reproduce the bytes the enclave hashed. `tee_verified` is also never set on private requests (0g-doc PR #422, unmerged). Either return the hashed request bytes (or their hash preimage) in `x_0g_trace`, or document that on-chain binding needs Direct mode.
- **`ZG-Res-Key` outlives failures** on the chat and image handlers (issue #735, open), so a client can hold a chat id that will never have a signature. We treat a 404 from the signature endpoint as a hard failure and retry the inference.
- **`/v1/decisions` responses cannot carry an application header**, so decision models (`vela-2.0-9b`, `laya`) cannot produce text a contract can bind to an escrow. A `signed_text` option, or signing the full JSON response, would make them usable on-chain.
- **No cross-chain proof of a Service record.** A contract on another chain cannot read `teeSignerAddress`. A signed snapshot (or a CCIP/light-client path) would remove the one trusted step in our design.
- **Inconsistent naming.** `ZG-Res-Key` is the chat id for the signature endpoint, but the docs call it `chatID`, `chat_id` and `id` in different places.
- **Galileo testnet has almost no live TeeML chat capacity.** On Nov 7, 2026, of 8 services on `InferenceServing` `0xa79F…F91E` and 11 on `0x41bD…85c5`, one signature endpoint answered (`qwen/qwen3.8-omni-flash`, a centralized `aliyun` provider). The acknowledged `glm-5.3` provider's dstack gateway returned 502; others pointed at hostnames that no longer resolve. Registry entries for dead providers should expire, and a status page would save builders an hour of probing.
- **The router has no testnet.** `router-api.0g.ai` ignores `?network=testnet` and returns mainnet, and there is no `router-api-testnet` host. Testnet tooling has to fall back to `getAllServices`, which reverts on `limit > 50` with an undecoded custom error.

## Arc / Arc Studio

- **Gas is native USDC with 18 decimals, while ERC-20 USDC at `0x3600…` has 6.** The connect-to-arc page states this; the contract-addresses page should repeat it next to the USDC row.
- **The mempool silently drops transactions with `maxFeePerGas` below 20 gwei.** A rejection error, or a line in the docs, would save a stuck deploy.
- **The faucet is browser-only with reCAPTCHA**; a rate-limited API for CI would help.
- **Arc Studio is sandboxed and does not edit a local repo**; a "pull from GitHub" import would let teams keep Foundry tests and Studio in sync.
