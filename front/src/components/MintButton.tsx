import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/typechain"; // Импортируем тип для смарт-контракта
import { ethers } from 'ethers';

interface MintButtonProps {
  magic: MagicCard | undefined;
  onTransactionSent: (txHash: string) => void;
  onTransactionError: (error: any) => void;
}

const MintButton: React.FC<MintButtonProps> = ({ magic, onTransactionSent, onTransactionError }) => {
  const [loading, setLoading] = useState(false);
  const [mintPrice, setMintPrice] = useState<string | null>(null); // Храним цену минта в wei

  // Получаем цену минта
  useEffect(() => {
    const fetchMintPrice = async () => {
      if (magic) {
        try {
          const priceInWei = await magic.getMintPrice();
          setMintPrice(priceInWei.toString()); // Преобразуем в строку для хранения в стейте
        } catch (error) {
          console.error('Error fetching mint price', error);
        }
      }
    };
    fetchMintPrice();
  }, [magic]);

  const handleMint = async () => {
    if (!magic || !mintPrice) return; // Если magic не определен или mintPrice не загружена, ничего не делаем

    setLoading(true);
    try {
      
      const priceInWei = await magic.mintPrice(); 

      // Печатаем данные, чтобы убедиться, что они верны
      console.log("Minting with value:", priceInWei.toString());

      // Передаем цену в Wei в поле value
      const tx = await magic.mint({ 
                    value: priceInWei,
                    gasLimit: 1000000,
                   }); 

      onTransactionSent(tx.hash); // Отправляем хэш транзакции на родительский компонент
      await tx.wait(); // Ожидаем подтверждения транзакции
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Transaction error:', error);  // Печатаем полную ошибку для диагностики
      onTransactionError(error); // Отправляем ошибку на родительский компонент
    }
  };

  return (
    <div>
      <button onClick={handleMint} disabled={loading || !mintPrice}>
        {loading ? 'Minting...' : 'Mint Card'}
      </button>
    </div>
  );
};

export default MintButton;
