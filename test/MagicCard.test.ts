import { loadFixture, ethers, expect } from "./setup";

describe("MagicCard", function() {
    async function deploy() {        
        const [user0, user1, user2] = await ethers.getSigners();
        
        const Factory = await ethers.getContractFactory("MagicCard");
        const magicCard = await Factory.deploy();
        await magicCard.waitForDeployment();        

        return { user0, user1, user2, magicCard }
    }

    it("should be deployed", async function() {
        const { magicCard } = await loadFixture(deploy);        
        
        expect(magicCard.target).to.be.properAddress;        
    });

    it("should have 0 eth by default", async function() {
        const { magicCard } = await loadFixture(deploy);

        const balance = await magicCard.getBalance();
        expect(balance).eq(0);
        
    }); 
    
    it("should possible mint NFT", async function() {
        const { user1, magicCard } = await loadFixture(deploy);       
        
        const sum = await magicCard.mintPrice();
        const tx = await magicCard.connect(user1).mint({value: sum});
        await tx.wait(1); 
        const userBalance = await(magicCard.getUserBalance(user1.address));
        const countNFT = await(magicCard.getCountNFT());
        
        await expect(tx).to.changeEtherBalance(user1, -sum);        
        await expect(tx).to.changeEtherBalance(magicCard, sum);
        await expect(userBalance).eq(1);
        await expect(countNFT).eq(1);
    });    

    it("should possible premint NFT", async function() {
        const { user0, magicCard } = await loadFixture(deploy);               
        
        const tx = await magicCard.preMint();
        await tx.wait(1);         
        const countNFT = await(magicCard.getCountNFT());                
        expect(countNFT).eq(1+11+22+33+44);        
    });

    it("should possible buy NFT and send drop", async function() {
        const { user0, user1, user2, magicCard } = await loadFixture(deploy);               
        
        //сначала делаем преминт, чтобы получить nft для продажи
        const tx_premint = await magicCard.preMint();
        await tx_premint.wait(1);
        
        //минтим еще одну на нового юзера - получателя дропа     
        
        const sum = await magicCard.mintPrice();
        const tx_mint = await magicCard.connect(user2).mint({value: sum});
        tx_mint.wait(1);
        const nfts: bigint[] = await magicCard.userNFTs(user2);
        const [nft, user2Rep] = await magicCard.getDescription(nfts[0]);       
        
        //считаем суммарную репу
        const totalRep = user2Rep + 1000n + 100n * 11n + 75n * 22n + 50n * 33n + 25n * 44n;        

        //user 1 покупает NFT #15
        const tokenId = 15;
        const price = await magicCard.getBuyPrice(tokenId);
        let [typeNFT, rep] = await magicCard.getDescription(tokenId);
        const tx_buy = await magicCard.connect(user1).buyNFT(tokenId, {value: price});
        await tx_buy.wait(1);       

        //считаем дроп 
        const drop = ((price / 3n) / totalRep) * user2Rep;

        await expect(tx_buy).to.changeEtherBalance(user1, -price);        
        await expect(tx_buy).to.changeEtherBalance(magicCard, (price - drop));
        await expect(tx_buy).to.changeEtherBalance(user2, drop);
    
    });   
    
    it("should possible sell NFT", async function() {
        const { user0, user1, magicCard } = await loadFixture(deploy);       
        
        const tx_premint = await magicCard.preMint();
        await tx_premint.wait(1);
        
        //сначала делаем минт, чтобы было, что продавать
        const sum = await magicCard.mintPrice();
        const tx_mint = await magicCard.connect(user1).mint({value: sum});
        tx_mint.wait(1);
        const nfts: bigint[] = await magicCard.userNFTs(user1);
        const [nft, user1Rep] = await magicCard.getDescription(nfts[0]);
        
        //считаем цену и покупаем на контракт (юзер продает)
        const price = await magicCard.getSellPrice(nfts[0]);        
        const tx_sell = await magicCard.connect(user1).sellNFT(nfts[0]);
        tx_sell.wait(1);

        const owner = await magicCard.ownerOf(nfts[0]);       

        await expect(tx_sell).to.changeEtherBalance(user1, price);        
        await expect(tx_sell).to.changeEtherBalance(magicCard, -price);
        expect(owner).eq(magicCard.target);

    });

    it("should withdrawAll", async function() {
        const { user0, user1, user2, magicCard } = await loadFixture(deploy);       
        
        const tx_premint = await magicCard.preMint();
        await tx_premint.wait(1);

        //user 1 покупает 10 NFT
        for (let tokenId = 11; tokenId != 21; ++tokenId) {
            let price = await magicCard.getBuyPrice(tokenId);
            let [typeNFT, rep] = await magicCard.getDescription(tokenId);
            let tx_buy = await magicCard.connect(user1).buyNFT(tokenId, {value: price});
            await tx_buy.wait(1);            
        }
        
        const balance =await magicCard.getBalance();        
        const minBalance = await magicCard._calcMinimumBalance();
        const withdrawLimit = balance - minBalance;

        const tx_wdAll = await magicCard.withdrawAll(user2);
        tx_wdAll.wait(1);

        expect(tx_wdAll).to.changeEtherBalance(user2, withdrawLimit);
        expect(tx_wdAll).to.changeEtherBalance(magicCard.target, -withdrawLimit);
    });

    it("should withdraw custom amount", async function() {
        const { user0, user1, user2, magicCard } = await loadFixture(deploy);       
        
        const tx_premint = await magicCard.preMint();
        await tx_premint.wait(1);

        //user 1 покупает 10 NFT
        for (let tokenId = 11; tokenId != 21; ++tokenId) {
            let price = await magicCard.getBuyPrice(tokenId);
            let [typeNFT, rep] = await magicCard.getDescription(tokenId);
            let tx_buy = await magicCard.connect(user1).buyNFT(tokenId, {value: price});
            await tx_buy.wait(1);            
        }
        
        const balance =await magicCard.getBalance();        
        const minBalance = await magicCard._calcMinimumBalance();
        const withdrawAmont = (balance - minBalance) / 2n ;

        const tx_wdAll = await magicCard.withdraw(withdrawAmont, user2);
        tx_wdAll.wait(1);

        expect(tx_wdAll).to.changeEtherBalance(user2, withdrawAmont);
        expect(tx_wdAll).to.changeEtherBalance(magicCard.target, -withdrawAmont);
    });
    
});