"use client";

import React, {
  useState,
  useEffect, 
}  from "react";
import { ethers } from "ethers";

import { MagicCard__factory } from "@/typechain";
import type { MagicCard } from "@/typechain";
import type { BrowserProvider } from "ethers";

import ConnectWallet from "@/components/ConnectWallet";
import WaitinForTransactionMessage from "@/components/WaitingForTransactionMessage";
import TransactionErrorMessage from "@/components/TransactionErrorMessage";

const HARDHAT_NETWORK_ID = "0x539";
const MAGIC_CARD_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

declare let window: any;

type CurrentConnectionProps = {
  provider: BrowserProvider | undefined;
  magic: MagicCard | undefined;
  signer: ethers.JsonRpcSigner | undefined;
};

export default function Home() {
    const [networkError, setNetworkError] = useState<string>();
    const [currentConnection, setCurrentConnection] = useState<CurrentConnectionProps>();
  
    const _connectWallet = async() => {
        if(window.ethereum === undefined){
          setNetworkError ("Please install Metamask");
          return;
        }
        if (!(await _checkNetwork())) {
          return; 
      }
  
      const [selectedAccount] = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
  
      await _initialize(ethers.getAddress(selectedAccount));
  
      window.ethereum.on("accountsChanged", 
        async ([newAccount] : [newAccount: string]) => {
          if(newAccount === undefined){
            return _resetState();
          }
          await _initialize(ethers.getAddress(selectedAccount));
        }
      );
  
      window.ethereum.on("chainChanged", 
        async ([_networkId] : any) => {
          _resetState;      
        }
      );
    };

    const _initialize = async(selectedAccount: string) => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(selectedAccount);

      setCurrentConnection({
        ...currentConnection,
        provider,
        signer,
        magic: MagicCard__factory.connect(MAGIC_CARD_ADDRESS, signer),
      });
    };
    
    const _checkNetwork = async (): Promise<boolean> => {
      const chosenChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (chosenChainId === HARDHAT_NETWORK_ID) {
        return true;
      }
      setNetworkError("Please connect to HardHat network (localhost:8545)");
      return false;
    };

    const _resetState = () => {
      setNetworkError(undefined);
      setCurrentConnection({
        provider: undefined,
        signer: undefined,
        magic: undefined,
      });
    };
    
    const _dismissNetworkError = () => {
      setNetworkError(undefined);
    };


    return (
      <main>         
        { !currentConnection?.signer && (
          <ConnectWallet
            connectWallet = {_connectWallet}
            networkError = {networkError}
            dismiss = {_dismissNetworkError}
          />    
        )}
        {currentConnection?.signer && (
          <p>Your address: {currentConnection.signer.address}</p>
        )}     
        
      </main>   
    );
}
