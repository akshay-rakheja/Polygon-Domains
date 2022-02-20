const main = async () => {

  const [owner, randomGuy] = await hre.ethers.getSigners(); 
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy();
  await domainContract.deployed();
  console.log("Contract deployed by: ", owner.address);
  console.log("Contract deployed to: ", domainContract.address);

  const txn = await domainContract.register("doom");
	await txn.wait();

  const getowner = await domainContract.getAddress("doom");
  console.log("Owner of domain:", getowner);

  const txn2 = await domainContract.connect(randomGuy).setRecord("doom", "got this domain!");
  await txn2.wait();

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
