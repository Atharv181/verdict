// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SignerRegistry} from "../src/SignerRegistry.sol";
import {VerdictOracle} from "../src/VerdictOracle.sol";
import {VerdictEscrow} from "../src/VerdictEscrow.sol";

/// Usage (Arc testnet, USDC = 0x3600000000000000000000000000000000000000):
///   USDC=0x3600000000000000000000000000000000000000 forge script script/Deploy.s.sol \
///     --rpc-url https://rpc.testnet.arc.io --private-key $ARC_PRIVATE_KEY --broadcast
contract Deploy is Script {
    function run() external {
        address usdc = vm.envAddress("USDC");
        uint256 pk = vm.envUint("ARC_PRIVATE_KEY");
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);
        SignerRegistry registry = new SignerRegistry(owner);
        VerdictOracle oracle = new VerdictOracle(registry);
        VerdictEscrow escrow = new VerdictEscrow(IERC20(usdc), oracle);
        vm.stopBroadcast();

        console.log("SignerRegistry", address(registry));
        console.log("VerdictOracle ", address(oracle));
        console.log("VerdictEscrow ", address(escrow));
        console.log("USDC          ", usdc);
    }
}
