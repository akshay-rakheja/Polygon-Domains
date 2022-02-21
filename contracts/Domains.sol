// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.10;

import {StringUtils} from "./libraries/StringUtils.sol";
import "hardhat/console.sol";

contract Domains {
    //top level domain
    string public tld;

    //mapping from domain name to address
    mapping(string => address) public domains;
    //mapping that stores the record for domain
    mapping(string => string) public records;

    constructor(string memory _tld) payable {
        tld = _tld;
        console.log("%s name service deployed. Congo!", _tld);
    }

    function register(string calldata name) public payable {
        require(domains[name] == address(0));

        uint256 _price = price(name);

        // Check if enough Matic was paid in the transaction
        require(msg.value >= _price, "Not enough Matic paid.");

        domains[name] = msg.sender;
        console.log("%s has registered for a domain", msg.sender);
    }

    function getAddress(string calldata name) public view returns (address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        require(domains[name] == msg.sender);
        records[name] = record;
    }

    function getRecord(string calldata name)
        public
        view
        returns (string memory)
    {
        return records[name];
    }

    function price(string calldata name) public pure returns (uint256) {
        uint256 len_name = StringUtils.strlen(name);
        require(len_name > 0);
        if (len_name == 3) {
            return 10**18;
        } else if (len_name == 4) {
            return 5 * 10**17;
        } else {
            return 2 * 10**17;
        }
    }
}
