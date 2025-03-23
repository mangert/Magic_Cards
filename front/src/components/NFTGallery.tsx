"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { MagicCard__factory } from "@/typechain";
import NFTCard from "./NFTCard";

const MAGIC_CARD_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
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
  };

function NFTGallery({ provider, signer }: NFTGalleryProps) {
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

    fetchNFTs();
  }, [provider]);

  const buyNFT = async (id: number, priceInWei: string) => {
    if (!signer) return alert("Подключите кошелек!");
    try {
      const magic = MagicCard__factory.connect(MAGIC_CARD_ADDRESS, signer);
      const tx = await magic.buyNFT(id, { value: ethers.parseEther(priceInWei) });
      await tx.wait();
      
      // Удаляем купленный NFT из списка
      setNfts((prevNfts) => prevNfts.filter((nft) => nft.id !== id));

      alert(`NFT #${id} успешно куплен!`);
    } catch (error) {
      console.error("Ошибка при покупке:", error);
    }
  };

  return (
    <div className="mt-8 overflow-x-auto">
      <div className="flex gap-4">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} {...nft} onBuy={buyNFT} isBuyable={!!signer} />
        ))}
      </div>
    </div>
  );
}

export default NFTGallery;
