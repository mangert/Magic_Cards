import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/typechain";
import { ethers } from 'ethers';

interface MintButtonProps {
  magic: MagicCard | undefined;
  onTransactionSent: (txHash: string) => void;
  onTransactionError: (error: any) => void;
  onUpdateNFTs: () => void; 
  updateBalance: () => void; 
}

const MintButton: React.FC<MintButtonProps> = ({ magic, onTransactionSent, onTransactionError, onUpdateNFTs, updateBalance }) => {
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
        const tx = await magic.mint({ value: priceInWei, gasLimit: 1000000 });
    
        onTransactionSent(tx.hash);
        await tx.wait();
    
        onUpdateNFTs(); // Обновляем ленту пользователя
        await updateBalance(); // Обновляем баланс
    
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error('Transaction error:', error);
        onTransactionError(error);
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
