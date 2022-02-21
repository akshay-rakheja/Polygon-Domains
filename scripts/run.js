const main = async () => {

  const [owner, randomGuy] = await hre.ethers.getSigners(); 
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy("polygon"); //tld we want is passed as a parameter while deploying
  await domainContract.deployed();
  console.log("Contract deployed by: ", owner.address);
  console.log("Contract deployed to: ", domainContract.address);

  const txn = await domainContract.register("akshay", {value: hre.ethers.utils.parseEther('0.2')});
	await txn.wait();

  const getowner = await domainContract.getAddress("akshay");
  console.log("Owner of domain:", getowner);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(balance));

};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
