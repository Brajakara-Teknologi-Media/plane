import Elysia from "elysia";
import { SignJWT, jwtVerify } from "jose";
import { authPlugin } from "@middleware/auth";
import prisma from "@db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, recordAudit } from "@utils/audit";
import { paginate } from "@utils/pagination";

const JWT_SECRET_BYTES = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "plane-jwt-secret-change-in-production"
);
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

async function signToken(sub: string, email: string): Promise<string> {
  return new SignJWT({ sub, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET_BYTES);
}

function setCookieHeader(token: string): string {
  return `plane_auth=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

function clearCookieHeader(): string {
  return `plane_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function resolveTokenFromRequest(headers: Record<string, string | undefined>): Promise<{ sub: string; email: string } | null> {
  const cookieHeader = headers["cookie"] ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)plane_auth=([^;]+)/);
  const rawToken =
    headers["authorization"]?.replace("Bearer ", "") ??
    (match?.[1] ? decodeURIComponent(match[1]) : null);
  if (!rawToken) return null;
  try {
    const { payload } = await jwtVerify(rawToken, JWT_SECRET_BYTES);
    if (!payload.sub) return null;
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// ── Shared email-check logic ───────────────────────────────────────────────────
async function emailCheck(email: string, set: any) {
  if (!email) {
    set.status = 400;
    return { error_code: 4030, error_message: "EMAIL_REQUIRED" };
  }
  const normalized = String(email).toLowerCase().trim();
  if (!validateEmail(normalized)) {
    set.status = 400;
    return { error_code: 4031, error_message: "INVALID_EMAIL" };
  }

  const instance = await prisma.instance.findFirst();
  if (!instance?.isSetupDone) {
    set.status = 400;
    return { error_code: 4035, error_message: "INSTANCE_NOT_CONFIGURED" };
  }

  // Check if email/password auth is enabled (stored as ENABLE_EMAIL_PASSWORD in configs)
  const saved = (instance.configurations as Record<string, string>) ?? {};
  const emailEnabled = saved["ENABLE_EMAIL_PASSWORD"];
  if (emailEnabled !== undefined && emailEnabled !== "1" && emailEnabled !== "true") {
    set.status = 400;
    return { error_code: 4036, error_message: "EMAIL_PASSWORD_DISABLED" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: normalized } });
  if (existingUser) {
    return { existing: true, status: "CREDENTIAL" };
  }
  return { existing: false, status: "CREDENTIAL" };
}

// The web app signs in/up by submitting a real browser <form> POST (not AJAX),
// so these endpoints must 302-redirect: on success to next_path (the workspace),
// on failure back to the sign-in page with an ?error_code the web understands.
// Error codes mirror packages helpers/authentication.helper.tsx.
const AUTH_ERR = {
  REQUIRED_SIGN_IN: "5070", // REQUIRED_EMAIL_PASSWORD_SIGN_IN
  FAILED_SIGN_IN: "5065", // AUTHENTICATION_FAILED_SIGN_IN
  REQUIRED_SIGN_UP: "5040", // REQUIRED_EMAIL_PASSWORD_SIGN_UP
  USER_ALREADY_EXISTS: "5030", // USER_ALREADY_EXIST
} as const;

// Only allow relative in-app paths to avoid open redirects.
function safeNext(nextPath: any): string {
  const p = typeof nextPath === "string" ? nextPath : "";
  return p.startsWith("/") && !p.startsWith("//") ? p : "/";
}
function authRedirect(set: any, location: string) {
  set.headers["Location"] = location;
  set.status = 302;
  return null;
}

// API clients (mobile) send Accept: application/json; browser form POSTs send text/html.
function wantsJson(headers: Record<string, string | undefined>): boolean {
  return (headers["accept"] ?? "").includes("application/json");
}

function authUserDto(u: any, token: string) {
  return {
    id: u.id,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    display_name: u.displayName,
    avatar_url: u.avatar,
    is_instance_admin: u.isInstanceAdmin,
    is_superuser: u.isSuperuser,
    token,
  };
}


/**
 * Serializes an API token row into the snake_case API contract expected by
 * the frontend (Django-compatible field names).
 */
function apiTokenDto(t: {
  id: string;
  label: string;
  description: string;
  isActive: boolean;
  expiredAt: Date | null;
  lastUsed: Date | null;
  createdAt: Date;
  token?: string;
}) {
  return {
    id: t.id,
    label: t.label,
    description: t.description,
    is_active: t.isActive,
    expired_at: t.expiredAt ? t.expiredAt.toISOString() : null,
    last_used: t.lastUsed ? t.lastUsed.toISOString() : null,
    created_at: t.createdAt.toISOString(),
    ...(t.token !== undefined ? { token: t.token } : {}),
  };
}
/**
 * Records an access attempt in the LGPD audit trail. The trail is per
 * workspace, and at login there is no workspace chosen yet — we use the
 * user's first one (or skip it if they don't belong to any: there is no one
 * to account to yet).
 */
async function auditAuth(
  action: string,
  email: string,
  headers: any,
  user?: { id: string; email: string } | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    const membership = user
      ? await prisma.workspaceMember.findFirst({
          where: { memberId: user.id, isActive: true, deletedAt: null },
          select: { workspaceId: true },
          orderBy: { createdAt: "asc" },
        })
      : null;
    if (!membership) return;
    await recordAudit({
      workspaceId: membership.workspaceId,
      entity: AUDIT_ENTITIES.USER,
      entityId: user?.id ?? email,
      action,
      actor: user ? { id: user.id, email: user.email } : { id: null, email },
      headers,
      metadata,
    });
  } catch (e) {
    console.error("[audit-auth]", e);
  }
}


/** Resolves the user from the session cookie (for logout, which bypasses authPlugin). */
async function userFromCookie(headers: any): Promise<{ id: string; email: string } | null> {
  try {
    const cookie: string = (typeof headers?.get === "function" ? headers.get("cookie") : headers?.cookie) ?? "";
    const match = cookie.match(/(?:^|;\s*)plane_auth=([^;]+)/);
    if (!match?.[1]) return null;
    const { payload } = await jwtVerify(decodeURIComponent(match[1]), JWT_SECRET_BYTES);
    if (!payload.sub) return null;
    return prisma.user.findUnique({ where: { id: String(payload.sub) }, select: { id: true, email: true } });
  } catch {
    return null;
  }
}

// ── Shared sign-in logic ───────────────────────────────────────────────────────
async function signIn(b: any, set: any, json = false, headers?: any) {
  const next = safeNext(b?.next_path);
  const jsonError = (status: number, detail: string) => {
    set.status = status;
    return { detail };
  };
  if (!b?.email || !b?.password) {
    return json
      ? jsonError(400, "Email and password are required.")
      : authRedirect(set, `/?error_code=${AUTH_ERR.REQUIRED_SIGN_IN}`);
  }
  const email = String(b.email).toLowerCase().trim();
  const fail = () =>
    json
      ? jsonError(403, "Invalid email or password.")
      : authRedirect(set, `/?error_code=${AUTH_ERR.FAILED_SIGN_IN}&email=${encodeURIComponent(email)}`);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password || !user.isActive) {
    auditAuth(AUDIT_ACTIONS.LOGIN_FAILED, email, headers, user, { motivo: user ? "inactive or no password" : "nonexistent user" });
    return fail();
  }
  const valid = await Bun.password.verify(b.password, user.password);
  if (!valid) {
    auditAuth(AUDIT_ACTIONS.LOGIN_FAILED, email, headers, user, { motivo: "invalid password" });
    return fail();
  }

  const token = await signToken(user.id, user.email);
  set.headers["Set-Cookie"] = setCookieHeader(token);
  auditAuth(AUDIT_ACTIONS.LOGIN, email, headers, user);
  return json ? authUserDto(user, token) : authRedirect(set, next);
}

// ── Shared sign-up logic ───────────────────────────────────────────────────────
async function signUp(b: any, set: any) {
  const next = safeNext(b?.next_path);
  if (!b?.email || !b?.password) return authRedirect(set, `/?error_code=${AUTH_ERR.REQUIRED_SIGN_UP}`);
  const email = String(b.email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return authRedirect(set, `/?error_code=${AUTH_ERR.USER_ALREADY_EXISTS}&email=${encodeURIComponent(email)}`);

  const hash = await Bun.password.hash(b.password, { algorithm: "bcrypt", cost: 12 });
  const user = await prisma.user.create({
    data: {
      email, password: hash,
      firstName: b.first_name ?? "",
      lastName: b.last_name ?? "",
      displayName: b.display_name ?? email.split("@")[0],
      username: `user_${Date.now()}`,
      isEmailVerified: true,
      language: "pt-BR",
    },
  });
  const token = await signToken(user.id, user.email);
  set.headers["Set-Cookie"] = setCookieHeader(token);
  return authRedirect(set, next);
}

// ── Public auth routes ─────────────────────────────────────────────────────────
export const sessionAuthModule = new Elysia()

  // ── Email check (determines credential vs magic link) ────────────────────────
  .post("/auth/email-check/", async ({ body, set }) => emailCheck((body as any)?.email, set))
  .post("/auth/spaces/email-check/", async ({ body, set }) => emailCheck((body as any)?.email, set))

  // ── Sign-in / sign-up / sign-out ─────────────────────────────────────────────
  .post("/auth/sign-in/", async ({ body, set, headers }) => signIn(body, set, wantsJson(headers), headers))
  .post("/auth/sign-up/", async ({ body, set }) => signUp(body, set))
  // The web app logs out by submitting a browser form to this endpoint, so we
  // must clear the cookie AND redirect (302) to the app root — a 204 would leave
  // the user on a blank page, still "logged in" client-side.
  .post("/auth/sign-out/", async ({ set, headers }) => {
    // Session termination also goes into the audit trail (who signed out, when, from where).
    const user = await userFromCookie(headers);
    if (user) auditAuth(AUDIT_ACTIONS.LOGOUT, user.email, headers, user);
    set.headers["Set-Cookie"] = clearCookieHeader();
    set.headers["Location"] = "/";
    set.status = 302;
    return null;
  })

  // Spaces variants (same logic, different path prefix used by the spaces app)
  .post("/auth/spaces/sign-in/", async ({ body, set, headers }) => signIn(body, set, wantsJson(headers), headers))
  .post("/auth/spaces/sign-up/", async ({ body, set }) => signUp(body, set))
  .post("/auth/spaces/sign-out/", ({ set }) => {
    set.headers["Set-Cookie"] = clearCookieHeader();
    set.headers["Location"] = "/";
    set.status = 302;
    return null;
  })

  // ── CSRF token (not needed for JWT, but the web app refuses to submit the
  // sign-out form when it's empty, so return a non-empty opaque token) ─────────
  .get("/auth/get-csrf-token/", () => ({ csrf_token: crypto.randomUUID().replace(/-/g, "") }))

  // ── Token refresh ────────────────────────────────────────────────────────────
  .post("/auth/token/refresh/", async ({ body, headers, set }) => {
    const b = body as any;
    const cookieHeader = headers["cookie"] ?? "";
    const match = cookieHeader.match(/(?:^|;\s*)plane_auth=([^;]+)/);
    const rawToken = b?.refresh_token ?? (match?.[1] ? decodeURIComponent(match[1]) : null);
    if (!rawToken) { set.status = 401; return { detail: "No token provided." }; }
    try {
      const { payload } = await jwtVerify(rawToken, JWT_SECRET_BYTES);
      if (!payload.sub) { set.status = 401; return { detail: "Invalid token." }; }
      const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
      if (!user?.isActive) { set.status = 401; return { detail: "Inactive username." }; }
      const newToken = await signToken(user.id, user.email);
      set.headers["Set-Cookie"] = setCookieHeader(newToken);
      return { token: newToken, access: newToken };
    } catch {
      set.status = 401;
      return { detail: "Invalid or expired token." };
    }
  })

  // ── Password management ──────────────────────────────────────────────────────
  .post("/auth/forgot-password/", async ({ body, set }) => {
    // SMTP not configured; instruct user to use admin
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured. Contact the administrator." };
  })
  .post("/auth/spaces/forgot-password/", async ({ body, set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured. Contact the administrator." };
  })
  .post("/auth/reset-password/:uidb64/:token/", async ({ params, body, set }) => {
    set.status = 400;
    return { detail: "Email password reset is not available. Contact your administrator." };
  })
  .post("/auth/spaces/reset-password/:uidb64/:token/", async ({ params, body, set }) => {
    set.status = 400;
    return { detail: "Email password reset is not available. Contact your administrator." };
  })
  .post("/auth/set-password/", async ({ body, headers, set }) => {
    const resolved = await resolveTokenFromRequest(headers as any);
    if (!resolved) { set.status = 401; return { detail: "Not authenticated." }; }
    const b = body as any;
    if (!b.password) { set.status = 400; return { detail: "Password is required." }; }
    const hash = await Bun.password.hash(b.password, { algorithm: "bcrypt", cost: 12 });
    await prisma.user.update({
      where: { id: resolved.sub },
      data: { password: hash, isPasswordAutoset: false },
    });
    return { detail: "Password set successfully." };
  })
  .post("/auth/change-password/", async ({ body, headers, set }) => {
    const resolved = await resolveTokenFromRequest(headers as any);
    if (!resolved) { set.status = 401; return { detail: "Not authenticated." }; }
    const b = body as any;
    if (!b.old_password || !b.new_password) {
      set.status = 400;
      return { detail: "old_password and new_password are required." };
    }
    const user = await prisma.user.findUnique({ where: { id: resolved.sub } });
    if (!user?.password) { set.status = 400; return { detail: "No password set. Use set-password." }; }
    const valid = await Bun.password.verify(b.old_password, user.password);
    if (!valid) { set.status = 400; return { detail: "The current password is incorrect." }; }
    const hash = await Bun.password.hash(b.new_password, { algorithm: "bcrypt", cost: 12 });
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    return { detail: "Password changed successfully." };
  })

  // ── Magic link stubs (SMTP required — not configured) ───────────────────────
  .post("/auth/magic-generate/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })
  .post("/auth/magic-sign-in/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })
  .post("/auth/magic-sign-up/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })
  .post("/auth/spaces/magic-generate/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })
  .post("/auth/spaces/magic-sign-in/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })
  .post("/auth/spaces/magic-sign-up/", ({ set }) => {
    set.status = 400;
    return { error_code: 5007, error_message: "SMTP_NOT_CONFIGURED", detail: "Email is not configured." };
  })

  // ── OAuth stubs (not configured) ─────────────────────────────────────────────
  .get("/auth/gitlab/", ({ set }) => { set.status = 400; return { detail: "GitLab OAuth is not configured." }; })
  .get("/auth/gitlab/callback/", ({ set }) => { set.status = 400; return { detail: "GitLab OAuth is not configured." }; })
  .get("/auth/spaces/gitlab/", ({ set }) => { set.status = 400; return { detail: "GitLab OAuth is not configured." }; })
  .get("/auth/spaces/gitlab/callback/", ({ set }) => { set.status = 400; return { detail: "GitLab OAuth is not configured." }; })
  .get("/auth/github/", ({ set }) => { set.status = 400; return { detail: "GitHub OAuth is not configured." }; })
  .get("/auth/github/callback/", ({ set }) => { set.status = 400; return { detail: "GitHub OAuth is not configured." }; })
  .get("/auth/spaces/github/", ({ set }) => { set.status = 400; return { detail: "GitHub OAuth is not configured." }; })
  .get("/auth/spaces/github/callback/", ({ set }) => { set.status = 400; return { detail: "GitHub OAuth is not configured." }; })
  // ── Google OAuth ────────────────────────────────────────────────────────────
  .get("/auth/google/", async ({ query, set, headers }) => {
    const instance = await prisma.instance.findFirst();
    if (!instance?.isSetupDone) {
      set.status = 400;
      return { detail: "Instance not configured." };
    }
    const cfg = (instance.configurations as Record<string, string>) ?? {};
    const clientId = cfg["GOOGLE_CLIENT_ID"];
    const frontendUrl = cfg["PUBLIC_BASE_URL"] || process.env.PUBLIC_BASE_URL || cfg["SPACE_BASE_URL"] || process.env.APP_BASE_URL || "http://localhost:3000";
    const redirectUri = `${frontendUrl}/auth/google/callback/`;
    if (!clientId) {
      set.status = 400;
      return { detail: "Google OAuth not configured." };
    }
    const state = Buffer.from(JSON.stringify({ next_path: query.next_path || "/" })).toString("base64");
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", clientId);
    googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("state", state);
    set.headers["Location"] = googleAuthUrl.toString();
    set.status = 302;
    return null;
  })
  .get("/auth/google/callback/", async ({ query, set, headers }) => {
    const instance = await prisma.instance.findFirst();
    if (!instance) {
      set.status = 400;
      return { detail: "Instance not configured." };
    }
    const cfg = (instance.configurations as Record<string, string>) ?? {};
    const clientId = cfg["GOOGLE_CLIENT_ID"];
    const clientSecret = cfg["GOOGLE_CLIENT_SECRET"];
    const frontendUrl = cfg["PUBLIC_BASE_URL"] || process.env.PUBLIC_BASE_URL || cfg["SPACE_BASE_URL"] || process.env.APP_BASE_URL || "http://localhost:3000";
    const redirectUri = `${frontendUrl}/auth/google/callback/`;
    const code = query.code as string | undefined;
    const state = query.state as string | undefined;
    if (!code || !state) {
      set.status = 400;
      return { detail: "Missing code or state." };
    }
    if (!clientId || !clientSecret) {
      set.status = 400;
      return { detail: "Google OAuth not configured." };
    }
    try {
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code,
        }).toString(),
      });
      if (!tokenResp.ok) throw new Error(`Token exchange failed: ${tokenResp.statusText}`);
      const tokenData: any = await tokenResp.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) throw new Error("No access token received");
      const userResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userResp.ok) throw new Error(`Userinfo fetch failed: ${userResp.statusText}`);
      const userData: any = await userResp.json();
      const email = userData.email?.toLowerCase().trim();
      if (!email) throw new Error("No email in user info");
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const saved = (instance.configurations as Record<string, string>) ?? {};
        const emailEnabled = saved["ENABLE_EMAIL_PASSWORD"];
        const signupEnabled = saved["ENABLE_SIGNUP"];
        if (signupEnabled !== "1" && signupEnabled !== "true") {
          set.status = 403;
          return { detail: "Signup is disabled." };
        }
        user = await prisma.user.create({
          data: {
            email,
            firstName: userData.given_name || "",
            lastName: userData.family_name || "",
            displayName: userData.name || email.split("@")[0],
            avatar: userData.picture || "",
            username: `user_${Date.now()}`,
            isEmailVerified: userData.email_verified || false,
            isActive: true,
            language: "pt-BR",
          },
        });
      }
      const token = await signToken(user.id, user.email);
      set.headers["Set-Cookie"] = setCookieHeader(token);
      auditAuth(AUDIT_ACTIONS.LOGIN, email, headers, user, { provider: "google" });
      let stateData: any = {};
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      } catch { }
      const nextPath = safeNext(stateData.next_path);
      set.headers["Location"] = nextPath;
      set.status = 302;
      return null;
    } catch (error) {
      console.error("[google-oauth]", error);
      set.status = 400;
      return { detail: `OAuth error: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  })
  .get("/auth/spaces/google/", async ({ query, set, headers }) => {
    const instance = await prisma.instance.findFirst();
    if (!instance?.isSetupDone) {
      set.status = 400;
      return { detail: "Instance not configured." };
    }
    const cfg = (instance.configurations as Record<string, string>) ?? {};
    const clientId = cfg["GOOGLE_CLIENT_ID"];
    const frontendUrl = cfg["PUBLIC_BASE_URL"] || process.env.PUBLIC_BASE_URL || cfg["SPACE_BASE_URL"] || process.env.APP_BASE_URL || "http://localhost:3000";
    const redirectUri = `${frontendUrl}/auth/spaces/google/callback/`;
    if (!clientId) {
      set.status = 400;
      return { detail: "Google OAuth not configured." };
    }
    const state = Buffer.from(JSON.stringify({ next_path: query.next_path || "/" })).toString("base64");
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", clientId);
    googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("state", state);
    set.headers["Location"] = googleAuthUrl.toString();
    set.status = 302;
    return null;
  })
  .get("/auth/spaces/google/callback/", async ({ query, set, headers }) => {
    const instance = await prisma.instance.findFirst();
    if (!instance) {
      set.status = 400;
      return { detail: "Instance not configured." };
    }
    const cfg = (instance.configurations as Record<string, string>) ?? {};
    const clientId = cfg["GOOGLE_CLIENT_ID"];
    const clientSecret = cfg["GOOGLE_CLIENT_SECRET"];
    const frontendUrl = cfg["PUBLIC_BASE_URL"] || process.env.PUBLIC_BASE_URL || cfg["SPACE_BASE_URL"] || process.env.APP_BASE_URL || "http://localhost:3000";
    const redirectUri = `${frontendUrl}/auth/spaces/google/callback/`;
    const code = query.code as string | undefined;
    const state = query.state as string | undefined;
    if (!code || !state) {
      set.status = 400;
      return { detail: "Missing code or state." };
    }
    if (!clientId || !clientSecret) {
      set.status = 400;
      return { detail: "Google OAuth not configured." };
    }
    try {
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code,
        }).toString(),
      });
      if (!tokenResp.ok) throw new Error(`Token exchange failed: ${tokenResp.statusText}`);
      const tokenData: any = await tokenResp.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) throw new Error("No access token received");
      const userResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userResp.ok) throw new Error(`Userinfo fetch failed: ${userResp.statusText}`);
      const userData: any = await userResp.json();
      const email = userData.email?.toLowerCase().trim();
      if (!email) throw new Error("No email in user info");
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const saved = (instance.configurations as Record<string, string>) ?? {};
        const signupEnabled = saved["ENABLE_SIGNUP"];
        if (signupEnabled !== "1" && signupEnabled !== "true") {
          set.status = 403;
          return { detail: "Signup is disabled." };
        }
        user = await prisma.user.create({
          data: {
            email,
            firstName: userData.given_name || "",
            lastName: userData.family_name || "",
            displayName: userData.name || email.split("@")[0],
            avatar: userData.picture || "",
            username: `user_${Date.now()}`,
            isEmailVerified: userData.email_verified || false,
            isActive: true,
            language: "pt-BR",
          },
        });
      }
      const token = await signToken(user.id, user.email);
      set.headers["Set-Cookie"] = setCookieHeader(token);
      auditAuth(AUDIT_ACTIONS.LOGIN, email, headers, user, { provider: "google" });
      let stateData: any = {};
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      } catch { }
      const nextPath = safeNext(stateData.next_path);
      set.headers["Location"] = nextPath;
      set.status = 302;
      return null;
    } catch (error) {
      console.error("[google-oauth]", error);
      set.status = 400;
      return { detail: `OAuth error: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  })
  .get("/auth/gitea/", ({ set }) => { set.status = 400; return { detail: "Gitea OAuth is not configured." }; })
  .get("/auth/gitea/callback/", ({ set }) => { set.status = 400; return { detail: "Gitea OAuth is not configured." }; })
  .get("/auth/spaces/gitea/", ({ set }) => { set.status = 400; return { detail: "Gitea OAuth is not configured." }; })
  .get("/auth/spaces/gitea/callback/", ({ set }) => { set.status = 400; return { detail: "Gitea OAuth is not configured." }; })

  // ── Me / session endpoints ────────────────────────────────────────────────────
  .get("/auth/me/", async ({ headers, set }) => {
    const resolved = await resolveTokenFromRequest(headers as any);
    if (!resolved) { set.status = 401; return { detail: "Not authenticated." }; }
    const user = await prisma.user.findUnique({
      where: { id: resolved.sub },
      select: {
        id: true, email: true, firstName: true, lastName: true, displayName: true,
        avatar: true, userTimezone: true, isActive: true, isSuperuser: true,
        isStaff: true, isInstanceAdmin: true, dateJoined: true,
      },
    });
    if (!user) { set.status = 401; return { detail: "Username not found." }; }
    return user;
  })

  .get("/auth/instance/", async ({ headers, set }) => {
    const resolved = await resolveTokenFromRequest(headers as any);
    if (!resolved) { set.status = 401; return { detail: "Not authenticated." }; }
    const user = await prisma.user.findUnique({
      where: { id: resolved.sub },
      select: { id: true, email: true, displayName: true, isInstanceAdmin: true, isSuperuser: true },
    });
    if (!user || (!user.isInstanceAdmin && !user.isSuperuser)) {
      set.status = 403;
      return { detail: "You need to be an instance administrator." };
    }
    return { is_instance_admin: user.isInstanceAdmin, is_superuser: user.isSuperuser, user };
  });

// ── API Token management (requires auth) ─────────────────────────────────────
export const authModule = new Elysia()
  .use(sessionAuthModule)
  .use(authPlugin)

  .get("/users/api-tokens/", async ({ user, query }) => {
    return paginate({
      query: (skip, take) =>
        prisma.apiToken.findMany({
          where: { userId: user.id }, skip, take,
          select: { id: true, label: true, description: true, isActive: true, expiredAt: true, lastUsed: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
      count: () => prisma.apiToken.count({ where: { userId: user.id } }),
      transform: (items) => items.map(apiTokenDto),
      cursor: query.cursor as string | undefined,
    });
  })

  .post("/users/api-tokens/", async ({ body, user, set }) => {
    const b = body as any;
    const token = await prisma.apiToken.create({
      data: {
        userId: user.id,
        label: b.label ?? "API Token",
        description: b.description ?? "",
        expiredAt: b.expired_at ? new Date(b.expired_at) : null,
        token: `plane_${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`,
        isActive: true,
      },
    });
    set.status = 201;
    return apiTokenDto(token);
  })

  .get("/users/api-tokens/:token_id/", async ({ params: { token_id }, user, set }) => {
    const token = await prisma.apiToken.findFirst({ where: { id: token_id, userId: user.id } });
    if (!token) { set.status = 404; return { detail: "Token not found." }; }
    return apiTokenDto(token);
  })

  .patch("/users/api-tokens/:token_id/", async ({ params: { token_id }, body, user, set }) => {
    const token = await prisma.apiToken.findFirst({ where: { id: token_id, userId: user.id } });
    if (!token) { set.status = 404; return { detail: "Token not found." }; }
    const b = body as any;
    const data: any = {};
    if (b.label !== undefined) data.label = b.label;
    if (b.description !== undefined) data.description = b.description;
    if (b.is_active !== undefined) data.isActive = b.is_active;
    if (b.expired_at !== undefined) data.expiredAt = b.expired_at ? new Date(b.expired_at) : null;
    const updated = await prisma.apiToken.update({ where: { id: token_id }, data });
    return apiTokenDto(updated);
  })

  .delete("/users/api-tokens/:token_id/", async ({ params: { token_id }, user, set }) => {
    const token = await prisma.apiToken.findFirst({ where: { id: token_id, userId: user.id } });
    if (!token) { set.status = 404; return { detail: "Token not found." }; }
    await prisma.apiToken.delete({ where: { id: token_id } });
    set.status = 204;
    return null;
  });
