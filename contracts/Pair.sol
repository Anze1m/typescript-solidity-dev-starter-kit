// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

contract Pair {
    using SafeMath for uint256;

    IERC20 public xToken;
    IERC20 public yToken;

    event Fuel(uint256 xInput, uint256 yInput);
    event Swap(address trader, uint256 xInput, uint256 yOutput);

    constructor(IERC20 _xToken, IERC20 _yToken) public {
        xToken = _xToken;
        yToken = _yToken;
    }

    function fuel(uint256 xInput, uint256 yInput) public {
        xToken.transferFrom(msg.sender, address(this), xInput);
        yToken.transferFrom(msg.sender, address(this), yInput);
        emit Fuel(xInput, yInput);
    }

    // X * Y = k
    // (X + Δx) * (Y - Δy) = k
    // X * Y = (X + Δx) * (Y - Δy)
    // Δy = Y - (X*Y / (X + Δx))
    function swap(uint256 xInput) public {
        uint256 xReserve = xToken.balanceOf(address(this));
        uint256 yReserve = yToken.balanceOf(address(this));
        uint256 yOutput = yReserve.sub(
            xReserve.mul(yReserve).div(xReserve.add(xInput))
        );
        xToken.transferFrom(msg.sender, address(this), xInput);
        yToken.transfer(msg.sender, yOutput);
        emit Swap(msg.sender, xInput, yOutput);
    }
}
