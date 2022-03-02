// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

// We first import some OpenZeppelin Contracts.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Base64} from "./libraries/Base64.sol";
import {StringUtils} from "./libraries/StringUtils.sol";
import "hardhat/console.sol";

contract Domains is ERC721URIStorage {
    address payable public owner;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenid;

    error Unauthorized();
    error AlreadyRegistered();
    error InvalidName(string name);

    //top level domain
    string public tld;

    // We'll be storing our NFT images on chain as SVGs: two parts to it and we'l be adding our domain data in between the two parts
    string svgPartOne =
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#a)" d="M0 0h270v270H0z"/><defs><filter id="b" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949a4.382 4.382 0 0 0-4.394 0l-10.081 6.032-6.85 3.934-10.081 6.032a4.382 4.382 0 0 1-4.394 0l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616 4.54 4.54 0 0 1-.608-2.187v-9.31a4.27 4.27 0 0 1 .572-2.208 4.25 4.25 0 0 1 1.625-1.595l7.884-4.59a4.382 4.382 0 0 1 3.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v6.032l6.85-4.065v-6.032a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595L41.456 24.59a4.382 4.382 0 0 0-4.394 0l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595 4.273 4.273 0 0 0-.572 2.208v17.441a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l10.081-5.901 6.85-4.065 10.081-5.901a4.382 4.382 0 0 1 4.394 0l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616 4.54 4.54 0 0 1 .608 2.187v9.311a4.27 4.27 0 0 1-.572 2.208 4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721a4.382 4.382 0 0 1-4.394 0l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616 4.53 4.53 0 0 1-.608-2.187v-6.032l-6.85 4.065v6.032a4.27 4.27 0 0 0 .572 2.208 4.25 4.25 0 0 0 1.625 1.595l14.864 8.655a4.382 4.382 0 0 0 4.394 0l14.864-8.655a4.545 4.545 0 0 0 2.198-3.803V55.538a4.27 4.27 0 0 0-.572-2.208 4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="a" x1="90" y1="1" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="#4c4bea"/><stop offset="1" stop-color="#1ad3e1" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#b)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgPartTwo = "</text></svg>";

    //mapping from domain name to address
    mapping(string => address) public domains;
    //mapping that stores the record for domain
    mapping(string => string) public records;
    // mapping tokenID to domain -> used to retrieve all names registered.
    mapping(uint256 => string) public names;

    constructor(string memory _tld)
        payable
        ERC721("United Name Service", "UNS")
    {
        owner = payable(msg.sender);
        tld = _tld;
        console.log("%s name service deployed. Congo!", _tld);
    }

    //gets all names registered using names mapping
    function getAllNames() public view returns (string[] memory) {
        console.log("Getting all names from contract");
        string[] memory allNames = new string[](_tokenid.current());
        for (uint256 i = 0; i < _tokenid.current(); i++) {
            allNames[i] = names[i];
            console.log("Name for token %d is %s", i, allNames[i]);
        }

        return allNames;
    }

    function register(string calldata name) public payable {
        if (domains[name] != address(0)) revert AlreadyRegistered();
        //if (!valid(name)) revert InvalidName(name);

        uint256 _price = price(name);

        // Check if enough Matic was paid in the transaction
        require(msg.value >= _price, "Not enough Matic paid.");

        //combining name with the top level domain
        string memory _name = string(abi.encodePacked(name, ".", tld));
        //combining our final name with the svg to make an image
        string memory finalSVG = string(
            abi.encodePacked(svgPartOne, _name, svgPartTwo)
        );
        uint256 newRecordID = _tokenid.current();
        uint256 length = StringUtils.strlen(name);
        string memory strLen = Strings.toString(length);

        console.log(
            "Registering %s.%s with tokenId %d",
            name,
            tld,
            newRecordID
        );
        // Create the JSON metadata of our NFT. We do this by combining strings and encoding as base64
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        _name,
                        '", "description": "A domain on the United Name Service", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSVG)),
                        '","length":"',
                        strLen,
                        '"}'
                    )
                )
            )
        );
        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        console.log(
            "\n--------------------------------------------------------"
        );
        console.log("Final tokenURI", finalTokenUri);
        console.log(
            "--------------------------------------------------------\n"
        );

        //Minting and setting tokenURI
        _safeMint(msg.sender, newRecordID);
        _setTokenURI(newRecordID, finalTokenUri);

        //assigning domain to the message sender
        domains[name] = msg.sender;
        names[newRecordID] = name;
        //incrementing tokenid for next token
        _tokenid.increment();
        console.log(
            "%s has registered for a domain %s.%s",
            msg.sender,
            name,
            tld
        );
    }

    function getAddress(string calldata name) public view returns (address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        if (msg.sender != domains[name]) revert Unauthorized();
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

    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw Matic");
    }
}
