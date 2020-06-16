# moneystream-wallet
A wallet for streaming bitcoin

## Install
`git clone https://github.com/moneystreamdev/moneystream-wallet`
`cd moneystream-wallet`
`yarn install`

## Run tests
`yarn test`

## To use from a different project
Create your project then add a reference to this wallet. You can add references to projects that are not in npm yet.  
`npm install --save moneystreamdev/moneystream-wallet`

## Notes
Code is not clean. There are many TODO

## Using the wallet
See the tests for examples

## Funding your wallet
1. make a new wallet `const w = new Wallet()`
2. view the address in wallet.json file
3. send bitcoin to the wallet address to fund
