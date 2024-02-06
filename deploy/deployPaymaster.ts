import * as ethers from "ethers";

import { Provider, Wallet, utils } from "zksync-ethers";

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDeployerPK, setEnvValue } from "./utils";

export default async function (hre: HardhatRuntimeEnvironment) {

    const WALLET_PRIVATE_KEY = getDeployerPK();

    // @ts-ignore 
    const provider = new Provider(hre.network.config.url);
    const wallet = new Wallet(WALLET_PRIVATE_KEY, provider);


    // The wallet that will receive ERC20 tokens
    const emptyWallet = Wallet.createRandom();
    console.log(`Empty wallet's address: ${emptyWallet.address}`);
    console.log(`Empty wallet's private key: ${emptyWallet.privateKey}`);

    const deployer = new Deployer(hre, wallet);

    // Deploying the ERC20 token
    const erc20Artifact = await deployer.loadArtifact("MyERC20");
    const erc20 = await deployer.deploy(erc20Artifact, [
        "MyToken",
        "MyToken",
        18,
    ]);
    console.log(`ERC20 address: ${erc20.address}`);

    // Deploying the paymaster
    const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
    const paymaster = await deployer.deploy(paymasterArtifact, [erc20.address]);
    console.log(`Paymaster address: ${paymaster.address}`);

    console.log("Funding paymaster with ETH");
    // Supplying paymaster with ETH
    await (
        await deployer.zkWallet.sendTransaction({
            to: paymaster.address,
            value: ethers.utils.parseEther("0.06"),
        })
    ).wait();

    let paymasterBalance = await provider.getBalance(paymaster.address);

    console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);

    // Supplying the ERC20 tokens to the empty wallet:
    await // We will give the empty wallet 3 units of the token:
        (await erc20.mint(emptyWallet.address, 3)).wait();

    console.log("Minted 3 tokens for the empty wallet");

    setEnvValue("PAYMASTER_ADDRESS", paymaster.address);
    setEnvValue("PAYMASTER_ERC20_TOKEN_ADDRESS", erc20.address);
    setEnvValue("PAYMASTER_EMPTY_WALLET_PRIVATE_KEY", emptyWallet.privateKey);

    console.log(`Done!`);
}
