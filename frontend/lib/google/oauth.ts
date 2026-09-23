import type { Account } from "next-auth";
import { HttpError } from "@/lib/http-error";
import { IUserInstance } from "@/lib/sequelize/models/user";

import { SHEETS_SCOPE } from "./scopes";

export { SHEETS_SCOPE };

const notConnected = () =>
  new HttpError(428, "Connect Google Sheets first", "sheets_not_connected");

// Returns a valid Google access token with the Sheets scope, refreshing it
// when it expires within 60 seconds.
export async function getAccessTokenForUser(user: IUserInstance): Promise<string> {
  if (!user.hasSheetsScope()) throw notConnected();

  const expiresAt = user.providerAccessTokenExpiredAt
    ? new Date(user.providerAccessTokenExpiredAt).getTime()
    : 0;
  if (user.providerAccessToken && expiresAt - Date.now() > 60_000) {
    return user.providerAccessToken;
  }

  const refreshed = await user.refreshAccessToken();
  if (!refreshed) throw notConnected();
  return refreshed.providerAccessToken;
}

// Stores the tokens from a Google sign-in on an existing user. A plain sign-in
// (no refresh token) never removes the refresh token or narrows the scopes.
export async function updateGoogleTokens(user: IUserInstance, account: Account) {
  const oldScopes = (user.providerAccessTokenPermissions ?? "").split(" ").filter(Boolean);
  const newScopes = (account.scope ?? "").split(" ").filter(Boolean);
  const scopes = Array.from(new Set([...oldScopes, ...newScopes])).join(" ");

  const losesSheets =
    oldScopes.includes(SHEETS_SCOPE) && !newScopes.includes(SHEETS_SCOPE) && !!user.providerRefreshToken;

  await user.update({
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    ...(losesSheets
      ? {}
      : {
          providerAccessToken: account.access_token,
          providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
        }),
    ...(account.refresh_token
      ? { providerRefreshToken: account.refresh_token, providerAccessTokenPermissions: scopes }
      : { providerAccessTokenPermissions: user.providerRefreshToken ? scopes : account.scope }),
  });
}
