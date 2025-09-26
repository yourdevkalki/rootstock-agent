import { ethers } from "ethers";
import { isMock } from "../py.config.mjs";

const RPC_URL = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(RPC_URL);

const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

export async function getAllowance(token, owner, spender) {
  if (isMock()) {
    return { allowance: "1000000000000000000", decimals: 18, symbol: "MOCK" };
  }
  
  const c = new ethers.Contract(token, ERC20_ABI, provider);
  const [allowance, decimals, symbol] = await Promise.all([
    c.allowance(owner, spender),
    c.decimals().catch(() => 18),
    c.symbol().catch(() => "TOKEN"),
  ]);
  return { allowance: allowance.toString(), decimals: Number(decimals), symbol };
}


