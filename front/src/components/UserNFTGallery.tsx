"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { MagicCard__factory } from "@/typechain";
import NFTCard from "./NFTCard";
import { MAGIC_CARD_ADDRESS } from "@/config";

const IMAGE_PATH = "/images/";

type NFTData = {
  id: number;
  name: string;
  reputation: number;
  price: string;
  image: string;
};

type UserNFTGalleryProps = {
  provider: ethers.AbstractProvider | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  onUpdateNFTs: () => void;
  refreshNFTs: boolean; 
  updateBalance: () => void;
  setStatusMessage: (message: string | null) => void; // Новый пропс 

};

function UserNFTGallery({ provider, signer, onUpdateNFTs, refreshNFTs, updateBalance, setStatusMessage }: UserNFTGalleryProps) {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!signer) {
        setNfts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, signer);
        const userAddress = await signer.getAddress();        
        const nftIds = await magic.userNFTs(userAddress);      
        

        const nftData = await Promise.all(
          nftIds
            .map((id: any) => (typeof id === "bigint" ? Number(id) : parseInt(id, 10)))
            .map(async (id: number) => {
              const [name, reputation] = await magic.getDescription(id);
              const priceWei = await magic.getSellPrice(id);
              return {
                id,
                name,
                reputation: Number(reputation),
                price: ethers.formatEther(priceWei),
                image: `${IMAGE_PATH}${name}.png`,
              };
            })
        );
        

        setNfts(nftData);
      } catch (error) {
        console.error("Ошибка при загрузке NFT пользователя:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs(); // Вызываем при загрузке и изменении refreshNFTs
  }, [signer, refreshNFTs]);

    const sellNFT = async (id: number) => {
      if (!signer) return setStatusMessage("Кошелек не подключен ❌");
      try {
        const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, signer);
        const tx = await magic.sellNFT(id);
        
        console.log(`Транзакция покупки отправлена: ${tx.hash}`);
        setStatusMessage(`Покупка NFT... TX: ${tx.hash}`);
        
        await tx.wait();
    
        setNfts((prevNfts) => prevNfts.filter((nft) => nft.id !== id));
        onUpdateNFTs(); // Обновляем ленту контракта после продажи        
        await updateBalance(); // Обновляем баланс

        setStatusMessage(`NFT #${id} успешно продан! ✅`);    
        
      } catch (error) {
        console.error("Ошибка при продаже:", error);
        setStatusMessage("Ошибка при продаже ❌");
      }
    };
  

  return (
    <div>
    {loading ? (
      <p>Загрузка...</p>
    ) : !signer ? (
      <p>Кошелек не подключен</p>
    ) : nfts.length === 0 ? (
      <p>У вас пока нет NFT</p>
    ) : (
      <div className="nft-container">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} {...nft} onSell={sellNFT} isSellable={!!signer} />
        ))}
      </div>
    )}
  </div>
  
    
  );
}

export default UserNFTGallery;
