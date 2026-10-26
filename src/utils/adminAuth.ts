const ADMIN_TOKEN_KEY = "happyPayAdminAccessToken";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminSession(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  // Security: Never store user profile in localStorage; purely in-memory
  localStorage.removeItem("happyPayAdminUser");
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem("happyPayAdminUser");
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}
