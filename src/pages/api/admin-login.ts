import { getIronSession } from "iron-session";
import type { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions } from "../../../lib/auth";

// Uses iron-session's core getIronSession directly rather than the
// `iron-session/next` wrapper — that subpackage's published types reference
// a source file missing from the npm tarball, which breaks `tsc`/`next build`
// type-checking regardless of this app's own code (this is almost certainly
// why `next.config.ts` previously had `typescript.ignoreBuildErrors: true`).
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const session = await getIronSession(req, res, sessionOptions);
  session.isAdmin = true;
  await session.save();

  return res.status(200).json({ success: true });
}
