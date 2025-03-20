import hre, { ethers } from "hardhat";

async function main() {
    console.log("DEPLOYING...");
    const [deployer, owner] = await ethers.getSigners();

    const MagicCard = await ethers.getContractFactory("MagicCard");
    const magic = await MagicCard.deploy();
    await magic.waitForDeployment();    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error); 
        process.exit(1);
    });

