import { Router } from "express";
import { db, smackboardTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { PostSmackMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/smackboard", async (_req, res) => {
  const messages = await db.select().from(smackboardTable).orderBy(desc(smackboardTable.timestamp)).limit(50);
  res.json(messages.map((m) => ({
    id: m.id,
    name: m.name,
    message: m.message,
    timestamp: m.timestamp.toISOString(),
  })));
});

router.post("/smackboard", async (req, res) => {
  const parsed = PostSmackMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const [msg] = await db.insert(smackboardTable).values(parsed.data).returning();
  res.status(201).json({
    id: msg.id,
    name: msg.name,
    message: msg.message,
    timestamp: msg.timestamp.toISOString(),
  });
});

export default router;
