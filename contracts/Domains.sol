// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.10;

import "hardhat/console.sol";

contract Domains {
    //mapping from domain name to address
    mapping(string => address) public domains;

    constructor() {
        console.log("THIS IS MY DOMAINS CONTRACT. NICE.");
    }

    function register(string calldata name) public {
        domains[name] = msg.sender;
        console.log("%s has registered for %s domain", msg.sender);
    }

    function getAddress(string calldata name) public view returns (address) {
        return domains[name];
    }
}
