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

    // Basic validation
    if (!user || !ethers.isAddress(user)) {
      return res.status(400).json({ success: false, message: "Invalid wallet address." });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }

    // Get decimals, parse amount to correct units
    const decimals = await tokenContract.decimals();
    const parsedAmount = ethers.parseUnits(amount.toString(), decimals);

    // Transfer tokens
    const tx = await tokenContract.transfer(user, parsedAmount);
    await tx.wait();

    return res.json({ success: true, message: "Prize sent!" });
  } catch (e) {
    console.error("Transfer error:", e);

    // Send user-friendly message, optionally detect common errors
    let message = "Transfer failed.";

    if (e.code === 'INSUFFICIENT_FUNDS') {
      message = "Insufficient funds to pay gas fees.";
    } else if (e.code === 'UNPREDICTABLE_GAS_LIMIT') {
      message = "Transaction failed: Gas estimation error.";
    } else if (e.reason) {
      message = e.reason;
    }

    return res.status(500).json({ success: false, message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
