import type { IronSessionOptions } from "iron-session";
import { unsealData } from "iron-session";
import { cookies } from "next/headers";

declare module "iron-session" {
  interface IronSessionData {
    isAdmin?: boolean;
  }
}

export const sessionOptions: IronSessionOptions = {
  cookieName: "ncv-admin-session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

/**
 * Read-only admin check for App Router route handlers, which don't have the
 * req/res pair `getIronSession` needs. Reads + unseals the same cookie
 * `withIronSessionApiRoute` (pages/api routes) writes, without needing to
 * save/mutate a session here.
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(sessionOptions.cookieName)?.value;
  if (!sealed) return false;

  try {
    const session = await unsealData<{ isAdmin?: boolean }>(sealed, {
      password: sessionOptions.password,
    });
    return session.isAdmin === true;
  } catch {
    return false;
  }
}
