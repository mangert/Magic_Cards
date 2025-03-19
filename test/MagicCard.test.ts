import { loadFixture, ethers, expect } from "./setup";

describe("MagicCard", function() {
    async function deploy() {        
        const [user1, user2] = await ethers.getSigners();
        
        const Factory = await ethers.getContractFactory("MagicCard");
        const magicCard = await Factory.deploy();
        await magicCard.waitForDeployment();        

        return { user1, user2, magicCard }
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
        const { user1, user2, magicCard } = await loadFixture(deploy);       
        
        const sum = 1000000;
        const tx = await  magicCard.mint({value: sum});
        await tx.wait(1);

        
        await expect(tx).to.changeEtherBalance(user1, -sum);        
        await expect(tx).to.changeEtherBalance(magicCard, sum);    
        
    });    
});