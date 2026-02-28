const BNET_TOKEN_URL = "https://oauth.battle.net/token";
const BNET_REVOKE_URL = "https://oauth.battle.net/revoke";
const BNET_USERINFO_URL = "https://oauth.battle.net/userinfo";
const BNET_API_BASE = "https://us.api.blizzard.com";
const BNET_PROFILE_NAMESPACE = "profile-classicann-us";

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
  realmSlug: string;
}

function slugifyName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
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
    `${BNET_API_BASE}/profile/user/wow?namespace=${BNET_PROFILE_NAMESPACE}&locale=en_US`,
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
        guild?: { name: string };
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
        realmSlug: char.realm.slug,
      });
    }
  }

  return characters;
}

async function fetchGuildRosterKeys(
  accessToken: string,
  realmSlug: string,
  guildName: string
): Promise<Set<string>> {
  const guildSlug = slugifyName(guildName);
  if (!realmSlug || !guildSlug) return new Set();

  const rosterUrl = `${BNET_API_BASE}/data/wow/guild/${realmSlug}/${guildSlug}/roster?namespace=${BNET_PROFILE_NAMESPACE}&locale=en_US`;
  const res = await fetch(
    rosterUrl,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    return new Set();
  }

  const data = (await res.json()) as {
    members?: Array<{
      character?: {
        name?: string;
        realm?: {
          name?: string | { [locale: string]: string };
          slug?: string;
        };
      };
    }>;
  };
  const keys = new Set<string>();
  for (const member of data.members ?? []) {
    const nameRaw = member.character?.name;
    const realmNameRaw = member.character?.realm?.name;
    const realmSlugRaw = member.character?.realm?.slug;
    const name =
      typeof nameRaw === "string"
        ? nameRaw.trim()
        : "";
    const realm =
      typeof realmNameRaw === "string"
        ? realmNameRaw.trim()
        : typeof realmNameRaw === "object" && realmNameRaw !== null
          ? String((realmNameRaw as Record<string, string>).en_US ?? "").trim()
          : typeof realmSlugRaw === "string"
            ? realmSlugRaw.trim()
            : "";
    if (!name || !realm) continue;
    keys.add(`${name.toLowerCase()}|${realm.toLowerCase()}`);
  }
  return keys;
}

export async function fetchGuildCharacters(
  accessToken: string,
  guildNameRaw: string
): Promise<Array<{ name: string; realm: string }>> {
  const guildName = guildNameRaw.trim().toLowerCase();
  if (!guildName) return [];

  const userCharacters = await fetchWowCharacters(accessToken);
  if (userCharacters.length === 0) return [];

  const realmSlugs = [...new Set(userCharacters.map((c) => c.realmSlug))];
  const rosterSets = await Promise.all(
    realmSlugs.map((realmSlug) => fetchGuildRosterKeys(accessToken, realmSlug, guildName))
  );
  const guildKeys = new Set<string>();
  for (const set of rosterSets) {
    for (const key of set) guildKeys.add(key);
  }

  return userCharacters
    .filter((char) => guildKeys.has(`${char.name.toLowerCase()}|${char.realm.toLowerCase()}`))
    .map((char) => ({ name: char.name, realm: char.realm }));
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
