# AA Testscripts for Cronos zkEVM Sepolia Testnet

Some basic scripts for testing smart account and paymaster on Cronos zkEVM Sepolia Testnet, based on [matter-labs/tutorials](https://github.com/matter-labs/tutorials/), added some additional configurations and updated some scripts to make it easier to use.

## Pre-requisites

```
yarn install

yarn compile
```

Create `.env` file in the project root, fill `WALLET_PRIVATE_KEY` in `.env` file, this will be used to deploy the smart contract, and make sure there are enough funds in the wallet(several baseToken).

## Smart Account Deployment & Transfer Test

### 1. Deploy Smart Account Factory & Create a Smart Account

```
yarn deploy:aa-factory
```

- This script will, 
- Deploy the smart account factory contract
- Generate a radnom key as the owner key of the smart account, this key will be used to sign transactions for the smart account
- Use the factory contract to deploy a smart account, set the smart account's owner to the generated key's address
- Transfer some tokens to the smart account


### 2. Transfer Tokens using Smart Account

Use the random generated key on the last step to sign a transaciton for smart account to transfer tokens to it self

```
yarn use:aa
```


## Fiat Paymaster 

### 1. Deploy a Fiat Paymaster

```
yarn deploy:paymaster
```

- Deploy the ERC20 token contract
- Deploy an `approvalBased` flow  paymaster contract
- Fund the paymaster contract with some baseTokens

### 2. Use Paymaster to help Account trnasact with ERC20 token as gas

```
yarn use:paymaster
```

- Account make a transaction with `paymasterParams` set
- Paymaster will help the account to pay the gas fee with the equal amount of ERC20 token
