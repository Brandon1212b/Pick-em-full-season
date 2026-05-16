import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginUserBody } from "@workspace/api-zod";

const router = Router();

router.post("/users/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.name, name)).limit(1);
  if (existing.length > 0) {
    res.status(200).json({
      id: existing[0].id,
      name: existing[0].name,
      createdAt: existing[0].createdAt.toISOString(),
    });
    return;
  }
  const [created] = await db.insert(usersTable).values({ name }).returning();
  res.status(201).json({
    id: created.id,
    name: created.name,
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/users", async (_req, res) => {
  const users = await db.select().from(usersTable);
  res.json(users.map((u) => ({ id: u.id, name: u.name, createdAt: u.createdAt.toISOString() })));
});

router.get("/users/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, name: user.name, createdAt: user.createdAt.toISOString() });
});

export default router;
