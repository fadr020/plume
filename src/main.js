const axios = require("axios");
const { ethers } = require("ethers");
const { createWallet, getAddress } = require('../config/wallet');
const { provider, PRIVATE_KEYS, CONTRACT_ADDRESS } = require("../config/config");
const { log } = require("../utils/logger");
const { CrocEnv } = require("@crocswap-libs/sdk");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
   // Ensure all functions are exported correctly
module.exports = {
     checkIn,
     faucetETH,
     faucetGOON,
     swapTokens,
     executeStake
   };
const stakeABI = [{
  inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
  name: 'stake',
  outputs: [],
  stateMutability: "nonpayable",
  type: "function"
}];

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: '_value', type: "uint256" }
    ],
    name: 'approve',
    outputs: [{ name: "success", type: "bool" }],
    type: "function"
  }
];

async function getAuth(walletAddress, token) {
  const response = await axios.post('https://faucet.plumenetwork.xyz/api/faucet', {
    walletAddress,
    token
  });
  return response.data;
}

async function callCheckInForKey(privateKey) {
  const checkInABI = ["function checkIn() public"];
  const wallet = createWallet(privateKey, provider);
  const contract = new ethers.Contract('0x8Dc5b3f1CcC75604710d9F464e3C5D2dfCAb60d8', checkInABI, wallet);

  try {
    const tx = await contract.checkIn();
    log("INFO", "Transaction sent: " + tx.hash);
    const receipt = await tx.wait();
    log('SUCCESS', "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + receipt.hash);
  } catch (error) {
    log("ERROR", "Error calling checkIn: " + error.message);
  }
}

async function checkIn() {
  while (true) {
    for (const privateKey of PRIVATE_KEYS) {
      await callCheckInForKey(privateKey);
    }
    log("INFO", "Waiting in the next days...\n");
    await delay(86400000);
  }
}

async function claimFaucetETH(privateKey, attempt = 0, maxAttempts = 3) {
  try {
    const walletAddress = getAddress(privateKey, provider);
    log('INFO', "Wallet address: " + walletAddress);

    const getNewSignature = async () => {
      log("INFO", "Requesting tokens from the faucet...");
      return await getAuth(walletAddress, 'ETH');
    };

    let { salt, signature } = await getNewSignature();
    const wallet = createWallet(privateKey, provider);

    const sendTransaction = async () => {
      const data = `0x103fc4520000000000000000000000000000000000000000000000000000000000000060${salt.substring(2)}00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000345544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041${signature.substring(2)}00000000000000000000000000000000000000000000000000000000000000`;
      const tx = await wallet.sendTransaction({ data, to: CONTRACT_ADDRESS, value: 0 });
      await tx.wait();
      log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + tx.hash);
    };

    try {
      await sendTransaction();
    } catch (error) {
      if (error.message.includes("Signature is already used")) {
        log("ERROR", "Signature is already used. Generating a new signature...");
        // Generate a new signature and retry
        if (attempt < maxAttempts) {
          await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          ({ salt, signature } = await getNewSignature());
          await claimFaucetETH(privateKey, attempt + 1, maxAttempts);
        } else {
          log("ERROR", "Maximum attempts reached. Error: " + error.message);
        }
      } else {
        handleError(error, attempt, maxAttempts, () => claimFaucetETH(privateKey, attempt + 1, maxAttempts));
      }
    }
  } catch (error) {
    handleError(error, attempt, maxAttempts, () => claimFaucetETH(privateKey, attempt + 1, maxAttempts));
  }
}
async function faucetETH() {
  while (true) {
    for (const privateKey of PRIVATE_KEYS) {
      await claimFaucetETH(privateKey);
      await delay(600000);
    }
  }
}

async function claimFaucetGOON(privateKey, attempt = 0, maxAttempts = 3) {
  try {
    const walletAddress = getAddress(privateKey, provider);
    log("INFO", "Wallet address: " + walletAddress);

    const getNewSignature = async () => {
      log("INFO", "Requesting tokens from the faucet...");
      return await getAuth(walletAddress, "GOON");
    };

    let { salt, signature } = await getNewSignature();
    const wallet = createWallet(privateKey, provider);

    const sendTransaction = async () => {
      const data = `0x103fc4520000000000000000000000000000000000000000000000000000000000000060${salt.substring(2)}00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000345544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041${signature.substring(2)}00000000000000000000000000000000000000000000000000000000000000`;
      const tx = await wallet.sendTransaction({ data, to: CONTRACT_ADDRESS, value: 0 });
      await tx.wait();
      log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + tx.hash);
    };

    try {
      await sendTransaction();
    } catch (error) {
      if (error.message.includes("Invalid admin signature")) {
        log("ERROR", "Invalid admin signature. Generating a new signature...");
        // Generate a new signature and retry
        if (attempt < maxAttempts) {
          await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          ({ salt, signature } = await getNewSignature());
          await claimFaucetGOON(privateKey, attempt + 1, maxAttempts);
        } else {
          log("ERROR", "Maximum attempts reached. Error: " + error.message);
        }
      } else {
        handleError(error, attempt, maxAttempts, () => claimFaucetGOON(privateKey, attempt + 1, maxAttempts));
      }
    }
  } catch (error) {
    handleError(error, attempt, maxAttempts, () => claimFaucetGOON(privateKey, attempt + 1, maxAttempts));
  }
}
async function faucetGOON() {
  while (true) {
    for (const privateKey of PRIVATE_KEYS) {
      await claimFaucetGOON(privateKey);
      await delay(5000);
    }
    await delay(7200000);
  }
}

async function performSwapForKey(privateKey) {
  try {
    const wallet = createWallet(privateKey, provider);
    const walletAddress = wallet.address;
    log("INFO", "Wallet address: " + walletAddress);

    const crocEnv = new CrocEnv("0x99c0a0f", wallet);
    const swapAmount = (Math.random() * 0.0004 + 0.0001).toFixed(4);
    log("INFO", `Swapping ${swapAmount} GOON for goonUSD`);

    await approveToken("0xba22114ec75f0d55c34a5e5a3cf384484ad9e733", "0x4c722A53Cf9EB5373c655E1dD2dA95AcC10152D1", swapAmount, wallet);
    const tx = await crocEnv.buy('0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3', ethers.parseUnits(swapAmount, 18)).with("0xba22114ec75f0d55c34a5e5a3cf384484ad9e733").swap();
    log('SUCCESS', "Transaction confirmed: https://testnet-explorer.plumenetwork.xyz/tx/" + tx.hash);
  } catch (error) {
    if (error.message.includes("execution reverted: \"TF\"")) {
      log('ERROR', "Insufficient GOON balance for swap.");
    } else {
      log('ERROR', "Transaction error: " + error.message, error);
    }
  }
}

async function swapTokens() {
  while (true) {
    for (const privateKey of PRIVATE_KEYS) {
      await performSwapForKey(privateKey);
      await delay(180000);
    }
  }
}

async function stakeTokens(privateKey) {
  try {
    const wallet = createWallet(privateKey, provider);
    const walletAddress = wallet.address;
    log('INFO', "Wallet address: " + walletAddress);

    const tokenContract = new ethers.Contract("0x5c1409a46cd113b3a667db6df0a8d7be37ed3bb3", ERC20_ABI, wallet);
    const stakeContract = new ethers.Contract("0xA34420e04DE6B34F8680EE87740B379103DC69f6", stakeABI, wallet);
    const stakeAmount = ethers.parseUnits('1', 18);

    const approveTx = await tokenContract.approve("0xA34420e04DE6B34F8680EE87740B379103DC69f6", stakeAmount);
    const approveReceipt = await approveTx.wait();
    if (approveReceipt.status !== 1) {
      log("ERROR", "Approve Failed!");
      return;
    }

    log("INFO", "Staking goonUSD in Nest Staking");
    const stakeTx = await stakeContract.stake(stakeAmount);
    await stakeTx.wait();
    log("SUCCESS", "Transaction successful: https://testnet-explorer.plumenetwork.xyz/tx/" + stakeTx.hash);
  } catch (error) {
    log("ERROR", "Staking error: " + error.message, error);
  }
}

async function executeStake() {
  while (true) {
    for (const privateKey of PRIVATE_KEYS) {
      await stakeTokens(privateKey);
    }
    await delay(86400000);
  }
}

async function main() {
  checkIn();
  faucetETH();
  faucetGOON();
  swapTokens();
  executeStake();
}

// main().catch(error => {
//   log("ERROR", "Main function error: " + error.message, error);
// });

async function approveToken(tokenAddress, spenderAddress, amount, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const tx = await tokenContract.approve(spenderAddress, ethers.parseUnits(amount, 18));
  await tx.wait();
}

function handleError(error, attempt, maxAttempts, retryFunction) {
  if (attempt < maxAttempts) {
    const delayDuration = Math.pow(2, attempt) * 1000;
    log('ERROR', "Attempt " + (attempt + 1) + " failed. Retrying in " + delayDuration / 1000 + " seconds...");
    setTimeout(retryFunction, delayDuration);
  } else {
    log("ERROR", "Maximum attempts reached. Error: " + error.message);
  }
}
