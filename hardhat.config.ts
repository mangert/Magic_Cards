import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks : {
    hardhat : {
      chainId : 1337,
      initialBaseFeePerGas : 0,
    },   
  },
};

export default config;
