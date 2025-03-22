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
import MintButton from "@/components/MintButton"; // Импортируем компонент MintButton

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
    const [txBeingSent, setTxBeingSent] = useState<string>();
    const [transactionError, setTransactionError] = useState<any>();
    const [currentBalance, setCurrentBalance] = useState<string>();
    const [mintPrice, setMintPrice] = useState<string | null>(null);
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
          await _initialize(ethers.getAddress(newAccount));
        }        
      );
  
      window.ethereum.on("chainChanged", 
        async ([_networkId] : any) => {
          _resetState();      
        }
      );
    };

    useEffect(() => {
        (async () => {
          if (currentConnection?.provider) {
            // Получаем цену для минта из контракта, не используя signer
            const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, currentConnection.provider);
            const priceInWei = await magic.getMintPrice(); // Получаем цену в wei
            setMintPrice(priceInWei.toString()); // Сохраняем цену
          }
    
          if (currentConnection?.provider && currentConnection.signer) {
            setCurrentBalance(
              (await currentConnection.provider.getBalance(currentConnection.signer.address)).toString()
            );
          }
        })();
      }, [currentConnection, txBeingSent]);

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
            setTransactionError(undefined);
            setTxBeingSent(undefined);
            setCurrentBalance(undefined);
            setCurrentConnection({
            provider: undefined,
            signer: undefined,
            magic: undefined,
      });
    };
    
    const _dismissNetworkError = () => {
      setNetworkError(undefined);
    };

    const _dismissTransactionError = () => {
      setTransactionError(undefined);
    };

    const _getRpcErrorMessage = (error: any):string => {
      console.log(error);
      if(error.data) {
        return error.data.message;

      }
      return error.message;
    }

    const handleTransactionSent = (txHash: string) => {
      setTxBeingSent(txHash); // Устанавливаем хэш транзакции
    };
  
    const handleTransactionError = (error: any) => {
      setTransactionError(error); // Устанавливаем ошибку транзакции
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
        
        {txBeingSent && <WaitinForTransactionMessage txHash={txBeingSent}/>}

        {transactionError && (
          <TransactionErrorMessage message = {_getRpcErrorMessage(transactionError)}
          dismiss={_dismissTransactionError}
          />
        )}

        {currentBalance && (
          <p>Your balace: {ethers.formatEther(currentBalance)} ETH</p>
        )}        
        
        {/* Если mintPrice доступна, показываем цену */}
        {mintPrice && (
        <p>Mint price: {ethers.formatEther(mintPrice)} ETH</p>
      )}
        
       {/* Кнопка Минт всегда доступна, независимо от состояния кошелька */}
       <MintButton
        magic={currentConnection?.magic}
        onTransactionSent={handleTransactionSent}
        onTransactionError={handleTransactionError}
      />

      </main>   
    );
}
