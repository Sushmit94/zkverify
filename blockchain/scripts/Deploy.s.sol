// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EscrowMarketplace} from "../contracts/EscrowMarketplace.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        EscrowMarketplace marketplace = new EscrowMarketplace(deployer);
        
        console.log("EscrowMarketplace deployed at:", address(marketplace));
        
        vm.stopBroadcast();
    }
}

