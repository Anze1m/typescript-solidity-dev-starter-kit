// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

contract Market {
    using SafeMath for uint256;

    IERC20 public xToken;
    IERC20 public yToken;

    event Supply(uint256 xInput, uint256 yInput);
    event Trade(address trader, uint256 xInput, uint256 yOutput);

    constructor(IERC20 _xToken, IERC20 _yToken) public {
        xToken = _xToken;
        yToken = _yToken;
    }

    // X / Y = (X + Δx) / (Y + Δy)
    // X * (Y + Δy) = (X + Δx) * Y
    function supply(uint256 xInput, uint256 yInput) public {
        require(xInput > 0, "input = 0");
        require(yInput > 0, "input = 0");

        uint256 xReserve = xToken.balanceOf(address(this));
        uint256 yReserve = yToken.balanceOf(address(this));
        require(
            xReserve.mul(yReserve.add(yInput)) ==
                yReserve.mul(xReserve.add(xInput)),
            "price changed"
        );

        xToken.transferFrom(msg.sender, address(this), xInput);
        yToken.transferFrom(msg.sender, address(this), yInput);
        emit Supply(xInput, yInput);
    }

    // X * Y = k
    // (X + Δx) * (Y - Δy) = k
    // X * Y = (X + Δx) * (Y - Δy)
    // Δy = Y - (X * Y / (X + Δx))
    function trade(uint256 xInput) public {
        require(xInput > 0, "input = 0");

        uint256 xReserve = xToken.balanceOf(address(this));
        uint256 yReserve = yToken.balanceOf(address(this));
        uint256 yOutput = yReserve.sub(
            xReserve.mul(yReserve).div(xReserve.add(xInput))
        );

        xToken.transferFrom(msg.sender, address(this), xInput);
        yToken.transfer(msg.sender, yOutput);
        emit Trade(msg.sender, xInput, yOutput);
    }
}
