// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A simple mock ERC20 for testing purposes
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock PYUSD", "mPYUSD") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}