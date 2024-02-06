import * as ethers from "ethers";

import { Provider, Wallet, utils } from "zksync-ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getPaymasterEnv } from "./utils";

function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet, address: string) {
    const artifact = hre.artifacts.readArtifactSync("MyERC20");
    return new ethers.Contract(address, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {

    const { PAYMASTER_ADDRESS, PAYMASTER_EMPTY_WALLET_PRIVATE_KEY, PAYMASTER_ERC20_TOKEN_ADDRESS } = getPaymasterEnv()

    // @ts-ignore
    const provider = new Provider(hre.network.config.url);

    const emptyWallet = new Wallet(PAYMASTER_EMPTY_WALLET_PRIVATE_KEY, provider);

    // const paymasterWallet = new Wallet(PAYMASTER_ADDRESS, provider);
    // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
    const ethBalance = await emptyWallet.getBalance();
    if (!ethBalance.eq(0)) {
        throw new Error("The wallet is not empty!");
    }

    console.log(
        `ERC20 token balance of the empty wallet before mint: ${await emptyWallet.getBalance(
            PAYMASTER_ERC20_TOKEN_ADDRESS,
        )}`,
    );

    let paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
    console.log(`Paymaster baseToken balance is ${paymasterBalance.toString()}`);

    const erc20 = getToken(hre, emptyWallet, PAYMASTER_ERC20_TOKEN_ADDRESS);

    const gasPrice = await provider.getGasPrice();

    // Encoding the "ApprovalBased" paymaster flow's input
    const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
        type: "ApprovalBased",
        token: PAYMASTER_ERC20_TOKEN_ADDRESS,
        // set minimalAllowance as we defined in the paymaster contract
        minimalAllowance: ethers.BigNumber.from(1),
        // empty bytes as testnet paymaster does not use innerInput
        innerInput: new Uint8Array(),
    });

    // Estimate gas fee for mint transaction
    const gasLimit = await erc20.estimateGas.mint(emptyWallet.address, 5, {
        customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            paymasterParams: paymasterParams,
        },
    });

    const fee = gasPrice.mul(gasLimit.toString());
    console.log("Transaction fee estimation is :>> ", fee.toString());

    console.log(`Minting 5 tokens for empty wallet via paymaster...`);
    await (
        await erc20.mint(emptyWallet.address, 5, {
            // paymaster info
            customData: {
                paymasterParams: paymasterParams,
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            },
        })
    ).wait();

    console.log(
        `Paymaster ERC20 token balance is now ${await erc20.balanceOf(
            PAYMASTER_ADDRESS,
        )}`,
    );

    paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
    console.log(`Paymaster baseToken balance is now ${paymasterBalance.toString()}`);

    console.log(
        `ERC20 token balance of the empty wallet after mint: ${await emptyWallet.getBalance(
            PAYMASTER_ERC20_TOKEN_ADDRESS,
        )}`,
    );
}
