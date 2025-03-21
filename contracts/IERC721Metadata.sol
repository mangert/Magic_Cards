// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./IERC721.sol";

interface IERC721Metadata {
    function name() external view returns(string memory);

    function symbol() external view returns(string memory);

    function tokenURI(uint tokenId) external view returns(string memory);

}