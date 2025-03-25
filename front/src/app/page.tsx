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
import TransactionErrorMessage from "@/components/TransactionErrorMessage";
import MintButton from "@/components/MintButton"; 
import NFTGallery from "@/components/NFTGallery";
import UserNFTGallery from "@/components/UserNFTGallery";
import { MAGIC_CARD_ADDRESS, NETWORK_ID, PROVIDER } from "@/config";

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
    const [publicProvider, setPublicProvider] = useState<ethers.AbstractProvider | null>(null);
    const [refreshNFTs, setRefreshNFTs] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const updateNFTs = () => {
      setRefreshNFTs((prev) => !prev); // Переключаем флаг для триггера обновления
    };


    useEffect(() => {
      const provider = new ethers.JsonRpcProvider(PROVIDER);
      setPublicProvider(provider);
    }, []);
  
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
      const scrollWrappers = document.querySelectorAll(".nft-scroll-wrapper");
          scrollWrappers.forEach(wrapper => {
          wrapper.scrollLeft = 0;
      });
      
      const fetchMintPrice = async () => {
          try {
              const provider = new ethers.JsonRpcProvider(PROVIDER); // Подключаем провайдер напрямую
              const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, provider);
              const priceInWei = await magic.getMintPrice();
              setMintPrice(priceInWei.toString());
          } catch (error) {
              console.error("Ошибка при получении mintPrice:", error);
          }
      };

      fetchMintPrice(); // Вызываем функцию загрузки цены при монтировании компонента
      
    }, []);

    // Функция для обновления баланса
    const updateBalance = async () => {
        if (currentConnection?.provider && currentConnection.signer) {
          try {
              const balance = await currentConnection.provider.getBalance(currentConnection.signer.address);
              setCurrentBalance(balance.toString());
          } catch (error) {
              console.error("Ошибка при обновлении баланса:", error);
          }
        }   
    };

// Обновляем баланс при подключении или смене кошелька
    useEffect(() => {
      updateBalance();
    }, [currentConnection]);


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
      if (chosenChainId === NETWORK_ID) {
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
    const handleTransactionSent = async (txHash: string) => {
      setTxBeingSent(txHash); // Устанавливаем хеш транзакции
    
      // Ждем подтверждения транзакции и обновляем баланс
      try {
          const receipt = await currentConnection?.provider?.waitForTransaction(txHash);
          if (receipt?.status === 1) {
              updateBalance();
          }
      } catch (error) {
          console.error("Ошибка при ожидании транзакции:", error);
      }
    };    
  
    const handleTransactionError = (error: any) => {
      setTransactionError(error); // Устанавливаем ошибку транзакции
    };    
    
    return (                
      <main>
        {/* Заголовок страницы */}
        <header className="header-container">
          <h1 className="site-title">Волшебные карты Элементалей</h1>
        </header>
{/* Фиксированный контейнер под заголовком */}
<div className="top-container">

  {/* Блок 1: Кошелек */}
  <div className="wallet-container">
    {!currentConnection?.signer ? (
      <ConnectWallet
        connectWallet={_connectWallet} 
        networkError={networkError} 
        dismiss={() => setNetworkError(undefined)} 
      />
    ) : (
      <div className="wallet-info">
        <p>address: {currentConnection.signer.address.slice(0, 8)}......{currentConnection.signer.address.slice(-7)}</p>
        <p>Баланс: {parseFloat(ethers.formatEther(currentBalance || "0")).toFixed(2)} ETH</p>
      </div>
    )}
  </div>

  {/* Блок 2: Изображения */}
  <div className="images-container">
    <img src="/images/Fire.png" alt="Fire" />
    <img src="/images/Air.png" alt="Air" />
    <img src="/images/Jocker.png" alt="Jocker" />
    <img src="/images/Aqua.png" alt="Aqua" />
    <img src="/images/Earth.png" alt="Earth" />
  </div>

  {/* Блок 3: Минт */}
  <div className="mint-container">
    <MintButton 
              magic={currentConnection?.magic}
              onUpdateNFTs={updateNFTs}
              updateBalance={updateBalance}
              setStatusMessage={setStatusMessage}
              onTransactionSent={(txHash) => setStatusMessage(`Транзакция отправлена: ${txHash}`)}
              onTransactionError={(error) => setStatusMessage(`Ошибка: ${error.message}`)}
    />
    {mintPrice && <p>Цена: {parseFloat(ethers.formatEther(mintPrice)).toFixed(2)} ETH</p>}
  </div>

</div>      
        {/* Заголовок перед лентой пользователя */}
        <h2 className="section-title">Твои NFT</h2>
        <div className="nft-scroll-wrapper">
          <UserNFTGallery 
            provider={publicProvider || currentConnection?.provider} 
            signer={currentConnection?.signer} 
            onUpdateNFTs={updateNFTs} 
            refreshNFTs={refreshNFTs} 
            updateBalance={updateBalance} 
            setStatusMessage={setStatusMessage} 
          />
        </div>
        

        {/* Заголовок перед лентой контракта */}
        <h2 className="section-title">Купи NFT</h2>
        <div className="nft-scroll-wrapper">
          <NFTGallery provider={publicProvider || currentConnection?.provider} signer={currentConnection?.signer} onUpdateNFTs={updateNFTs} refreshNFTs={refreshNFTs} updateBalance={updateBalance} setStatusMessage={setStatusMessage} />
        </div>
        

        {/* Статусная строка */}
        {statusMessage && <div className="status-message">{statusMessage}</div>}

          
  </main>

    );
}
