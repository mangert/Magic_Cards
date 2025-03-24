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

type NFTGalleryProps = {
  provider: ethers.AbstractProvider | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  onUpdateNFTs: () => void;
  refreshNFTs: boolean; 
  updateBalance: () => void; 
  setStatusMessage: (message: string | null) => void; // Новый пропс
};

function NFTGallery({ provider, signer, onUpdateNFTs, refreshNFTs, updateBalance, setStatusMessage }: NFTGalleryProps) {
  const [nfts, setNfts] = useState<NFTData[]>([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        if (!provider) return;
        const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, provider);
        const userAddress = MAGIC_CARD_ADDRESS;
        const nftIds = await magic.userNFTs(userAddress);
        

        const nftData = await Promise.all(
            
            nftIds
            .map((id: any) => {
              if (typeof id === "bigint") return Number(id); // BigInt → number
              if (typeof id === "string") return parseInt(id, 10); // Hex или string → number
              return id;
            })
            .filter((id: number) => id !== 0) // Фильтруем ID=0
            .filter((id: number) => id !== 0) // Фильтруем NFT с id === 0
            .map(async (id: number) => {
              const [name, reputation] = await magic.getDescription(id);
              const priceWei = await magic.getBuyPrice(id);

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
        console.error("Ошибка при загрузке NFT:", error);
      }
    };

    fetchNFTs(); // Вызываем при загрузке и обновлении
  }, [provider, refreshNFTs]); // Следим за refreshNFTs

    const buyNFT = async (id: number, priceInWei: string) => {
        if (!signer) return setStatusMessage("Кошелек не подключен ❌");
        try {
        const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, signer);
        const tx = await magic.buyNFT(id, { value: ethers.parseEther(priceInWei) });

        console.log(`Транзакция покупки отправлена: ${tx.hash}`);
        setStatusMessage(`Покупка NFT... TX: ${tx.hash}`);

        await tx.wait();
    
        setNfts((prevNfts) => prevNfts.filter((nft) => nft.id !== id));
        onUpdateNFTs(); // Обновляем ленту пользователя после покупки
        await updateBalance(); // Обновляем баланс

        setStatusMessage(`NFT #${id} успешно куплен! ✅`);    
        
        } catch (error) {
            console.error("Ошибка при покупке:", error);
            setStatusMessage("Ошибка при покупке ❌");
        }
    };
    

  return (
    <div className="nft-container">
      
        {nfts.map((nft) => (
          <NFTCard key={nft.id} {...nft} onBuy={buyNFT} isBuyable={!!signer} />
        ))}
      
    </div>
  );
}

export default NFTGallery;
