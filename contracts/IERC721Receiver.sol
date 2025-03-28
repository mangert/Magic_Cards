// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address to,
        uint tokenId,
        bytes calldata data
    ) external returns (bytes4);
}