import {
  utils,
  Wallet,
  Provider,
  Contract,
  EIP712Signer,
  types,
} from "zksync-ethers";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ETH_ADDRESS, getSmartAccountEnv } from "./utils";

export default async function (hre: HardhatRuntimeEnvironment) {

  const {SMART_ACCOUNT_ADDRESS, SMART_ACCOUNT_OWNER_PK, RECEIVER_ADDRESS } = getSmartAccountEnv();


  // @ts-ignore target zkSyncTestnet in config file which can be testnet or local
  const provider = new Provider(hre.network.config.url);

  const owner = new Wallet(SMART_ACCOUNT_OWNER_PK, provider);

  // account that will receive the baseToken transfer
  const receiver = RECEIVER_ADDRESS;
  // ⚠️ update this amount to test if the limit works; 0.00051 fails but 0.0049 succeeds
  const transferAmount = "0.000001";

  let ethTransferTx = {
    from: SMART_ACCOUNT_ADDRESS,
    to: receiver,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(SMART_ACCOUNT_ADDRESS),
    type: 113,
    customData: {
      ergsPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,

    value: ethers.utils.parseEther(transferAmount),
    gasPrice: await provider.getGasPrice(),
    gasLimit: ethers.BigNumber.from(20000000), // constant 20M since estimateGas() causes an error and this tx consumes more than 15M at most
    data: "0x",
  };
  const signedTxHash = EIP712Signer.getSignedDigest(ethTransferTx);
  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)),
  );

  ethTransferTx.customData = {
    ...ethTransferTx.customData,
    customSignature: signature,
  };

  const accountArtifact = await hre.artifacts.readArtifact("Account");

  // read account limits
  const account = new Contract(SMART_ACCOUNT_ADDRESS, accountArtifact.abi, owner);
  const limitData = await account.limits(ETH_ADDRESS);

  console.log("Account baseToken limit is: ", limitData.limit.toString());
  console.log("Available today: ", limitData.available.toString());

  // L1 timestamp tends to be undefined in latest blocks. So it should find the latest L1 Batch first.
  let l1BatchRange = await provider.getL1BatchBlockRange(
    await provider.getL1BatchNumber(),
  );
  let l1TimeStamp = (await provider.getBlock(l1BatchRange[1])).l1BatchTimestamp;

  console.log("L1 timestamp: ", l1TimeStamp);
  console.log(
    "Limit will reset on timestamp: ",
    limitData.resetTime.toString(),
  );

  // actually do the baseToken transfer
  console.log("Sending baseToken transfer from smart contract account");
  const sentTx = await provider.sendTransaction(utils.serialize(ethTransferTx));
  await sentTx.wait();
  console.log(`baseToken transfer tx hash is ${sentTx.hash}`);

  console.log("Transfer completed and limits updated!");

  const newLimitData = await account.limits(ETH_ADDRESS);
  console.log("Account limit: ", newLimitData.limit.toString());
  console.log("Available today: ", newLimitData.available.toString());
  console.log(
    "Limit will reset on timestamp:",
    newLimitData.resetTime.toString(),
  );

  if (newLimitData.resetTime.toString() == limitData.resetTime.toString()) {
    console.log("Reset time was not updated as not enough time has passed");
  } else {
    console.log("Limit timestamp was reset");
  }
  return;
}
