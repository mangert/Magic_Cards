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
    <div className="w-64 p-4 border rounded-lg shadow-lg bg-white flex-shrink-0">
      <img src={image} alt={name} className="w-full h-40 object-cover rounded-md" />
      <p className="mt-2 text-lg font-bold">{name} (ID: {id})</p>
      <p className="text-sm text-gray-600">Reputation: {reputation}</p>
      <p className="text-sm font-semibold">Price: {price} ETH</p>

      {onBuy && (
        <button
          className={`mt-2 w-full py-2 rounded-lg ${
            isBuyable ? "bg-blue-500 text-white hover:bg-blue-700" : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
          onClick={() => isBuyable && onBuy(id, price)}
          disabled={!isBuyable}
        >
          Buy
        </button>
      )}

      {onSell && (
        <button
          className={`mt-2 w-full py-2 rounded-lg ${
            isSellable ? "bg-red-500 text-white hover:bg-red-700" : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
          onClick={() => isSellable && onSell(id)}
          disabled={!isSellable}
        >
          Sell
        </button>
      )}
    </div>
  );
}
