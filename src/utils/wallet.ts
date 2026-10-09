const WALLET_BALANCE_KEY = "happyPayRetailerWalletBalance";
const DEFAULT_WALLET_BALANCE = 0;

export function getWalletBalance(): number {
  const stored = Number(localStorage.getItem(WALLET_BALANCE_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : DEFAULT_WALLET_BALANCE;
}

export function setWalletBalance(balance: number): void {
  localStorage.setItem(WALLET_BALANCE_KEY, balance.toFixed(2));
}
