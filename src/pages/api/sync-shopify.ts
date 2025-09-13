import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions } from "../../../lib/auth";
import { syncShopifyProducts } from "../../../lib/syncShopify";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = req.session;

  if (!session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await syncShopifyProducts();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Sync failed" });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
