require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenContract = new ethers.Contract(
  process.env.TOKEN_CONTRACT,
  [
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)"
  ],
  wallet
);

app.post("/reward", async (req, res) => {
  try {
    const { wallet: user, amount } = req.body;
    const decimals = await tokenContract.decimals();
    const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
    const tx = await tokenContract.transfer(user, parsedAmount);
    await tx.wait();
    res.send("Prize sent!");
  } catch (e) {
    console.error("Transfer error:", e);
    res.status(500).send("Transfer failed.");
  }
});

app.listen(3000, () => console.log("Backend listening on port 3000"));
