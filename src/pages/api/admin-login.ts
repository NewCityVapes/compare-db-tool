import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions } from "../../../lib/auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  // ✅ Debug logs
  console.log("⛳️ Password received:", password);
  console.log("🔐 ENV password:", process.env.ADMIN_PASSWORD);

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  req.session.isAdmin = true;
  await req.session.save();

  return res.status(200).json({ success: true });
}

export default withIronSessionApiRoute(handler, sessionOptions);
