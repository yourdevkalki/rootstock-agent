// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract DummyTarget {
    event Poked(address indexed caller, uint256 at);

    uint256 public pokeCount;

    function poke() external {
        pokeCount += 1;
        emit Poked(msg.sender, block.timestamp);
    }
}


