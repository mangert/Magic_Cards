import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import { MagicCard } from './typechain-types/contracts/MagicCard.ts';

export { loadFixture, ethers, expect };