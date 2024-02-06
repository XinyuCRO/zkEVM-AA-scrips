import fs from 'fs'
import os from 'os'
import path from 'path'

export const ETH_ADDRESS = "0x000000000000000000000000000000000000800A";


export function getDeployerPK(): string {
    const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
    if (WALLET_PRIVATE_KEY.length < 1) {
        throw new Error("WALLET_PRIVATE_KEY is not set in .env");
    }

    return WALLET_PRIVATE_KEY;
}

interface SmartAccountEnv {
    SMART_ACCOUNT_ADDRESS: string;
    SMART_ACCOUNT_OWNER_PK: string;
    RECEIVER_ADDRESS: string;
}

export function getSmartAccountEnv(): SmartAccountEnv {
    const SMART_ACCOUNT_ADDRESS = process.env.SMART_ACCOUNT_ADDRESS || "";
    const SMART_ACCOUNT_OWNER_PK = process.env.SMART_ACCOUNT_OWNER_PK || "";
    const RECEIVER_ADDRESS = SMART_ACCOUNT_ADDRESS;


    if (SMART_ACCOUNT_OWNER_PK.length < 1) {
        throw new Error("SMART_ACCOUNT_OWNER_PK is not set in .env, run deploy:aa-factory to deploy smart account first.");
    }

    if (SMART_ACCOUNT_ADDRESS.length < 1) {
        throw new Error("SMART_ACCOUNT_ADDRESS is not set in .env, run deploy:aa-factory to deploy smart account first.");
    }

    return {
        SMART_ACCOUNT_ADDRESS,
        SMART_ACCOUNT_OWNER_PK,
        RECEIVER_ADDRESS
    }
}

interface PaymasterEnv {
    PAYMASTER_ADDRESS: string;
    PAYMASTER_ERC20_TOKEN_ADDRESS: string
    PAYMASTER_EMPTY_WALLET_PRIVATE_KEY: string
}

export function getPaymasterEnv(): PaymasterEnv {
    const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS || "";
    const PAYMASTER_ERC20_TOKEN_ADDRESS = process.env.PAYMASTER_ERC20_TOKEN_ADDRESS || "";
    const PAYMASTER_EMPTY_WALLET_PRIVATE_KEY = process.env.PAYMASTER_EMPTY_WALLET_PRIVATE_KEY || "";

    if (PAYMASTER_ADDRESS.length < 1) {
        throw new Error("PAYMASTER_ADDRESS is not set in .env, run yarn deploy:paymaster to deploy paymaster contract first.");
    }

    if (PAYMASTER_ERC20_TOKEN_ADDRESS.length < 1) {
        throw new Error("PAYMASTER_ERC20_TOKEN_ADDRESS is not set in .env, run yarn deploy:paymaster to deploy paymaster contract first.");
    }

    if (PAYMASTER_EMPTY_WALLET_PRIVATE_KEY.length < 1) {
        throw new Error("PAYMASTER_EMPTY_WALLET_PRIVATE_KEY is not set in .env, run yarn deploy:paymaster to deploy paymaster contract first.");
    }

    return {
        PAYMASTER_ADDRESS,
        PAYMASTER_ERC20_TOKEN_ADDRESS,
        PAYMASTER_EMPTY_WALLET_PRIVATE_KEY
    }
}


export function setEnvValue(key: string, value: string): void {
    const environment_path = path.resolve(__dirname, '../.env')

    const ENV_VARS = fs.readFileSync(environment_path, 'utf8').split(os.EOL)

    const line = ENV_VARS.find((line: string) => {
        return line.match(`(?<!#\\s*)${key}(?==)`)
    })

    if (line) {
        const target = ENV_VARS.indexOf(line as string)
        if (target !== -1) {
            ENV_VARS.splice(target, 1, `${key}=${value}`)
        } else {
            ENV_VARS.push(`${key}=${value}`)
        }
    } else {
        ENV_VARS.push(`${key}=${value}`)
    }

    fs.writeFileSync(environment_path, ENV_VARS.join(os.EOL))
    console.log(`Wrote ${key}=${value} to .env file`)
}