import { utils, Wallet, Provider } from "zksync-ethers";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";
import { getDeployerPK, setEnvValue } from "./utils";

dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {

  const WALLET_PRIVATE_KEY = getDeployerPK();

  // @ts-ignore 
  const provider = new Provider(hre.network.config.url);
  const wallet = new Wallet(WALLET_PRIVATE_KEY, provider);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const aaArtifact = await deployer.loadArtifact("Account");

  // Bridge funds if the wallet on zkSync doesn't have enough funds.
  // const depositAmount = ethers.utils.parseEther('0.1');
  // const depositHandle = await deployer.zkWallet.deposit({
  //   to: deployer.zkWallet.address,
  //   token: utils.ETH_ADDRESS,
  //   amount: depositAmount,
  // });
  // await depositHandle.wait();

  const factory = await deployer.deploy(
    factoryArtifact,
    [utils.hashBytecode(aaArtifact.bytecode)],
    undefined,
    [aaArtifact.bytecode],
  );

  console.log(`AA factory address: ${factory.address}`);

  const aaFactory = new ethers.Contract(
    factory.address,
    factoryArtifact.abi,
    wallet,
  );

  const owner = Wallet.createRandom();
  console.log("SC Account owner pk: ", owner.privateKey);

  const salt = ethers.constants.HashZero;
  const tx = await aaFactory.deployAccount(salt, owner.address);
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();
  const accountAddress = utils.create2Address(
    factory.address,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [owner.address]),
  );

  console.log(`SC Account deployed on address ${accountAddress}`);

  console.log("Funding smart contract account with some ETH");
  await (
    await wallet.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther("0.02"),
    })
  ).wait();


  setEnvValue("SMART_ACCOUNT_FACTORY_ADDRESS", factory.address);
  setEnvValue("SMART_ACCOUNT_OWNER_PK", owner.privateKey);
  setEnvValue("SMART_ACCOUNT_ADDRESS", accountAddress);

  console.log(`Done!`);
}
