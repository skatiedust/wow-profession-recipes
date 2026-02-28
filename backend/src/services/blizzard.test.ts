import {
  exchangeCodeForToken,
  fetchUserInfo,
  fetchWowCharacters,
  fetchGuildCharacters,
  revokeToken,
} from "./blizzard";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BNET_CLIENT_ID = "test-client-id";
  process.env.BNET_CLIENT_SECRET = "test-client-secret";
});

describe("exchangeCodeForToken", () => {
  it("exchanges an authorization code for a token", async () => {
    const tokenPayload = {
      access_token: "abc123",
      token_type: "bearer",
      expires_in: 86400,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tokenPayload),
    });

    const result = await exchangeCodeForToken("auth-code", "https://example.com/callback");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth.battle.net/token",
      expect.objectContaining({ method: "POST" })
    );
    const body = mockFetch.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("redirect_uri")).toBe("https://example.com/callback");
    expect(result).toEqual(tokenPayload);
  });

  it("sends Basic auth with base64-encoded credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "t", token_type: "bearer", expires_in: 1 }),
    });

    await exchangeCodeForToken("code", "https://example.com/cb");

    const headers = mockFetch.mock.calls[0][1].headers;
    const expected = Buffer.from("test-client-id:test-client-secret").toString("base64");
    expect(headers.Authorization).toBe(`Basic ${expected}`);
  });

  it("throws when the token endpoint returns an error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("invalid_grant"),
    });

    await expect(
      exchangeCodeForToken("bad-code", "https://example.com/cb")
    ).rejects.toThrow("Token exchange failed (400): invalid_grant");
  });
});

describe("fetchUserInfo", () => {
  it("returns user info from the access token", async () => {
    const userPayload = { sub: "12345", battletag: "Player#1234" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(userPayload),
    });

    const result = await fetchUserInfo("abc123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth.battle.net/userinfo",
      expect.objectContaining({
        headers: { Authorization: "Bearer abc123" },
      })
    );
    expect(result).toEqual(userPayload);
  });

  it("throws when the userinfo endpoint returns an error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(fetchUserInfo("expired-token")).rejects.toThrow(
      "Userinfo fetch failed (401)"
    );
  });
});

describe("fetchWowCharacters", () => {
  it("returns characters from multiple wow accounts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          wow_accounts: [
            {
              characters: [
                {
                  name: "Arthas",
                  realm: { slug: "mograine", name: "Mograine" },
                },
              ],
            },
            {
              characters: [
                {
                  name: "Jaina",
                  realm: { slug: "whitemane", name: "Whitemane" },
                },
              ],
            },
          ],
        }),
    });

    const result = await fetchWowCharacters("token");

    expect(result).toEqual([
      {
        name: "Arthas",
        realm: "Mograine",
        realmSlug: "mograine",
      },
      {
        name: "Jaina",
        realm: "Whitemane",
        realmSlug: "whitemane",
      },
    ]);
  });

  it("returns empty array when the API returns an error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const result = await fetchWowCharacters("bad-token");
    expect(result).toEqual([]);
  });

  it("returns empty array when wow_accounts is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await fetchWowCharacters("token");
    expect(result).toEqual([]);
  });

  it("skips accounts with no characters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          wow_accounts: [
            { characters: undefined },
            {
              characters: [
                { name: "Thrall", realm: { slug: "faerlina", name: "Faerlina" } },
              ],
            },
          ],
        }),
    });

    const result = await fetchWowCharacters("token");
    expect(result).toEqual([
      { name: "Thrall", realm: "Faerlina", realmSlug: "faerlina" },
    ]);
  });
});

describe("fetchGuildCharacters", () => {
  it("filters by guild roster membership", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          wow_accounts: [
            {
              characters: [
                {
                  name: "Avarrai",
                  realm: { slug: "dreamscythe", name: "Dreamscythe" },
                },
                {
                  name: "Alt",
                  realm: { slug: "dreamscythe", name: "Dreamscythe" },
                },
              ],
            },
          ],
        }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          members: [
            {
              character: {
                name: "Avarrai",
                realm: { name: "Dreamscythe" },
              },
            },
          ],
        }),
    });

    const result = await fetchGuildCharacters("token", "Red Sun");
    expect(result).toEqual([{ name: "Avarrai", realm: "Dreamscythe" }]);
  });

  it("returns empty when roster lookup fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          wow_accounts: [
            {
              characters: [
                {
                  name: "Avarrai",
                  realm: { slug: "dreamscythe", name: "Dreamscythe" },
                },
                {
                  name: "Alt",
                  realm: { slug: "dreamscythe", name: "Dreamscythe" },
                },
              ],
            },
          ],
        }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await fetchGuildCharacters("token", "Red Sun");
    expect(result).toEqual([]);
  });
});

describe("revokeToken", () => {
  it("sends a POST to the revoke endpoint with the token", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await revokeToken("tok_to_revoke");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth.battle.net/revoke",
      expect.objectContaining({ method: "POST" })
    );
    const body = mockFetch.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("token")).toBe("tok_to_revoke");
  });

  it("sends Basic auth with base64-encoded client credentials", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await revokeToken("tok");

    const headers = mockFetch.mock.calls[0][1].headers;
    const expected = Buffer.from("test-client-id:test-client-secret").toString("base64");
    expect(headers.Authorization).toBe(`Basic ${expected}`);
  });

  it("throws when the revoke endpoint returns an error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("invalid_token"),
    });

    await expect(revokeToken("bad-tok")).rejects.toThrow(
      "Token revocation failed (400): invalid_token"
    );
  });
});
