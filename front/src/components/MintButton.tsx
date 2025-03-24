import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/typechain";
import { ethers } from 'ethers';

interface MintButtonProps {
  magic: MagicCard | undefined;
  onTransactionSent: (txHash: string) => void;
  onTransactionError: (error: any) => void;
  onUpdateNFTs: () => void; 
  updateBalance: () => void;
  setStatusMessage: (message: string | null) => void; 
}

const MintButton: React.FC<MintButtonProps> = ({ magic, onTransactionSent, onTransactionError, onUpdateNFTs, updateBalance, setStatusMessage }) => {
  const [loading, setLoading] = useState(false);
  const [mintPrice, setMintPrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchMintPrice = async () => {
      if (magic) {
        try {
          const priceInWei = await magic.getMintPrice();
          setMintPrice(priceInWei.toString());
        } catch (error) {
          console.error('Error fetching mint price', error);
        }
      }
    };
    fetchMintPrice();
  }, [magic]);

    const handleMint = async () => {
      if (!magic || !mintPrice) return;
    
      setLoading(true);
      try {
        const priceInWei = await magic.mintPrice();
        const tx = await magic.mint({ value: priceInWei, gasLimit: 10000000 });
    
        onTransactionSent(tx.hash);
        console.log(`Транзакция отправлена: ${tx.hash}`);

        setStatusMessage(`Mint in progress... TX: ${tx.hash}`);
        await tx.wait();
    
        onUpdateNFTs(); // Обновляем ленту пользователя
        await updateBalance(); // Обновляем баланс
        setStatusMessage("Mint successful! 🎉");
    
        setLoading(false);
      } catch (error) {
        console.error("Ошибка при минте:", error);
        setStatusMessage("Mint failed ❌");
        setLoading(false);        
        onTransactionError(error);
      }
    };
  
  return (
    <div>
      <button className="btn-primary" onClick={handleMint} disabled={loading || !mintPrice}>
        {loading ? 'Minting...' : 'Mint Card'}
      </button>
    </div>
  );
};

export default MintButton;
