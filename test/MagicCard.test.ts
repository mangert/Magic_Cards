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
        
        const sum = 1000000;
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

    it("should possible buy NFT", async function() {
        const { user0, user1, magicCard } = await loadFixture(deploy);               
        
        const tx_premint = await magicCard.preMint();
        await tx_premint.wait(1);         

        const price = await magicCard.getBuyPrice(15);
        const [typeNFT, rep] = await magicCard.getDescription(15);
        console.log(price, " ", typeNFT, " ", rep);
        const magicBalance = await magicCard.getBalance();
        console.log(magicBalance);
        const tokenId = 15;
        const tx_buy = await magicCard.buyNFT(tokenId, {value: price});
        await tx_buy.wait(1);       
    
    });   
    
});