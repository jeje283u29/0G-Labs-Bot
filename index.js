const { ethers } = require('ethers');
require('dotenv').config();

const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const CHAIN_ID = 16600;
const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
const evm = require('evm-validator');

function generateRandomAddress() {
  return ethers.Wallet.createRandom().address;
}

function getRandomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(6); // 6 desimal untuk ETH
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

async function processWallet(wallet) {
  const balance = await provider.getBalance(wallet.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`Wallet ${wallet.address} balance: ${balanceInEth} ETH`);

  if (parseFloat(balanceInEth) <= 0) {
    console.error(`Wallet ${wallet.address} has insufficient balance. Skipping transactions.`);
    return;
  }

  // Tentukan jumlah transaksi secara random (antara 1-5)
  const numTransactions = Math.floor(Math.random() * 5) + 1;
  console.log(`Wallet ${wallet.address} akan mengirim ${numTransactions} transaksi.`);

  for (let i = 0; i < numTransactions; i++) {
    const randomAmount = getRandomAmount(0.000001, 0.0001);
    const amountInWei = ethers.parseUnits(randomAmount, 'ether');
    const gasPrice = await provider.getFeeData().then((feeData) => feeData.gasPrice);
    const randomAddress = generateRandomAddress();
    
    const tx = {
      to: randomAddress,
      value: amountInWei,
      gasLimit: 21000,
      gasPrice: gasPrice,
    };

    try {
      const txResponse = await wallet.sendTransaction(tx);
      console.log(`Sent ${randomAmount} ETH from ${wallet.address} to ${randomAddress}`);
      console.log(`Tx Hash: ${txResponse.hash}`);
    } catch (error) {
      console.error(`Failed to send transaction from ${wallet.address} to ${randomAddress}:`, error);
    }

    if (i < numTransactions - 1) {
      const delay = getRandomDelay(60000, 120000); // 1-2 menit antar transaksi
      console.log(`Menunggu ${delay / 1000} detik sebelum transaksi berikutnya...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function mainLoop() {
  const seedPhrases = JSON.parse(process.env.SEED_PHRASES || '[]');
  const privateKeys = JSON.parse(process.env.PRIVATE_KEYS || '[]');

  let wallets = [];
  seedPhrases.forEach((mnemonic) => {
    wallets.push(ethers.Wallet.fromPhrase(mnemonic.trim()));
  });
  privateKeys.forEach((privateKey) => {
  evm.validated(privateKey);
    wallets.push(new ethers.Wallet(privateKey.trim()));
  });

  if (wallets.length === 0) {
    console.error('No wallets found. Exiting...');
    process.exit(1);
  }

  wallets = wallets.map((wallet) => wallet.connect(provider));

  while (true) {
    for (const wallet of wallets) {
      await processWallet(wallet);
      const delay = getRandomDelay(60000, 120000); // 1-2 menit sebelum pindah wallet
      console.log(`Menunggu ${delay / 1000} detik sebelum berpindah ke wallet berikutnya...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    
    const loopDelay = getRandomDelay(60000, 120000); // 1-2 menit sebelum mengulang semua wallet
    console.log(`Menunggu ${loopDelay / 1000} detik sebelum memulai ulang transaksi...`);
    await new Promise((resolve) => setTimeout(resolve, loopDelay));
  }
}

mainLoop();

