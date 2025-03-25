"use client";

import React from "react";

type NFTCardProps = {
  id: number;
  name: string;
  reputation: number;
  price: string;
  image: string;
  onBuy?: (id: number, priceInWei: string) => void;
  onSell?: (id: number) => void;
  isBuyable?: boolean;
  isSellable?: boolean;
};

export default function NFTCard({ id, name, reputation, price, image, onBuy, onSell, isBuyable, isSellable }: NFTCardProps) {
  return (
    <div className ="nft-card">
      <img src={image} alt={name} />
      <p>{name} ID: {id}</p>
      <p>Rep: {reputation}</p>
      <p>Price: {price} ETH</p>      

      {onBuy && (
        <button         
          onClick={() => isBuyable && onBuy(id, price)}
          disabled={!isBuyable}
        >
          Buy
        </button>
      )}

      {onSell && (
        <button        
          onClick={() => isSellable && onSell(id)}
          disabled={!isSellable}
        >
          Sell
        </button>
      )}
    </div>
  );
}
