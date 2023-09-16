// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MyToken is ERC20 {

    constructor(uint8 initialSupply) ERC20("Candidate 1", "CAN1") {

        _mint(msg.sender, initialSupply);
    }
    function mintAndSend(address[] memory recipients, uint8[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            approve(recipients[i], amounts[i]);

        }
    }
    function transferTokens(address owner, address recipient, uint256 amount) external {
    require(msg.sender != address(0), "Invalid sender address");
    require(recipient != address(0), "Invalid recipient address");
    require(amount > 0, "Amount must be greater than 0");
   
    _approve(msg.sender , owner, amount);

    _transfer(owner,recipient, amount);

}
}