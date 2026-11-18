const WALLET_BALANCE_KEY = "happyPayRetailerWalletBalance";
const WALLET_LOCK_KEY = "happyPayRetailerWalletLock";
const DEFAULT_WALLET_BALANCE = 0;

export interface WalletLockState {
  isWalletLocked: boolean;
  reason: string | null;
  lockedAt: string | null;
}

const DEFAULT_WALLET_LOCK_STATE: WalletLockState = {
  isWalletLocked: false,
  reason: null,
  lockedAt: null,
};

export function getWalletBalance(): number {
  const stored = Number(localStorage.getItem(WALLET_BALANCE_KEY));
  return Number.isFinite(stored) && stored >= 0 ? stored : DEFAULT_WALLET_BALANCE;
}

export function setWalletBalance(balance: number): void {
  localStorage.setItem(WALLET_BALANCE_KEY, balance.toFixed(2));
}

export function getWalletLockState(): WalletLockState {
  try {
    const stored = localStorage.getItem(WALLET_LOCK_KEY);
    if (!stored) return { ...DEFAULT_WALLET_LOCK_STATE };
    const parsed = JSON.parse(stored) as Partial<WalletLockState>;
    return {
      isWalletLocked: Boolean(parsed.isWalletLocked),
      reason: parsed.reason ?? null,
      lockedAt: parsed.lockedAt ?? null,
    };
  } catch {
    return { ...DEFAULT_WALLET_LOCK_STATE };
  }
}

export function setWalletLockState(state: WalletLockState): void {
  localStorage.setItem(WALLET_LOCK_KEY, JSON.stringify(state));
}

export function clearWalletLockState(): void {
  localStorage.removeItem(WALLET_LOCK_KEY);
}

// In-memory mirror so non-React consumers can read synchronously
let inMemoryWalletLockState: WalletLockState = getWalletLockState();

// eslint-disable-next-line react-refresh/only-export-components
export const getInMemoryWalletLockState = (): WalletLockState => inMemoryWalletLockState;

export function updateWalletLockState(state: WalletLockState): void {
  inMemoryWalletLockState = state;
  setWalletLockState(state);
}

export function resetWalletLockState(): void {
  inMemoryWalletLockState = { ...DEFAULT_WALLET_LOCK_STATE };
  clearWalletLockState();
}
