// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor() public ERC20("Token", "TKN") {
        _mint(msg.sender, 1e6);
    }
}
