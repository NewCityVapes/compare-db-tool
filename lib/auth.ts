import type { IronSessionOptions } from "iron-session";

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
