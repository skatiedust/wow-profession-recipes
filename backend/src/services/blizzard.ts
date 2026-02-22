const BNET_TOKEN_URL = "https://oauth.battle.net/token";
const BNET_REVOKE_URL = "https://oauth.battle.net/revoke";
const BNET_USERINFO_URL = "https://oauth.battle.net/userinfo";
const BNET_API_BASE = "https://us.api.blizzard.com";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  sub: string;
  battletag: string;
}

export interface WowCharacter {
  name: string;
  realm: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env.BNET_CLIENT_ID!;
  const clientSecret = process.env.BNET_CLIENT_SECRET!;

  const res = await fetch(BNET_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${body}`);
  }

  return (await res.json()) as TokenResponse;
}

export async function fetchUserInfo(accessToken: string): Promise<UserInfo> {
  const res = await fetch(BNET_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Userinfo fetch failed (${res.status})`);
  }

  return (await res.json()) as UserInfo;
}

export async function fetchWowCharacters(
  accessToken: string
): Promise<WowCharacter[]> {
  const res = await fetch(
    `${BNET_API_BASE}/profile/user/wow?namespace=profile-classic1x-us&locale=en_US`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as {
    wow_accounts?: Array<{
      characters?: Array<{
        name: string;
        realm: { slug: string; name: string };
      }>;
    }>;
  };

  if (!data.wow_accounts) {
    return [];
  }

  const characters: WowCharacter[] = [];
  for (const account of data.wow_accounts) {
    if (!account.characters) continue;
    for (const char of account.characters) {
      characters.push({
        name: char.name,
        realm: char.realm.name,
      });
    }
  }

  return characters;
}

export async function revokeToken(token: string): Promise<void> {
  const clientId = process.env.BNET_CLIENT_ID!;
  const clientSecret = process.env.BNET_CLIENT_SECRET!;

  const res = await fetch(BNET_REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ token }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token revocation failed (${res.status}): ${body}`);
  }
}
