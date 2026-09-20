import { Router, asyncHandler, validate, z } from "../../src";
import { prisma } from "./db";

export const prismaApiRouter = Router();

const createUserSchema = {
  body: z.object({
    name: z.string().min(2, "Name minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
  }),
};

const createPostSchema = {
  body: z.object({
    title: z.string().min(3, "Title minimal 3 karakter"),
    content: z.string().optional(),
  }),
};

// 1. GET /users - Ambil semua user beserta relasi posts
prismaApiRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { posts: true },
    });
    return res.success(users);
  })
);

// 2. POST /users - Buat user baru (Jika email duplikat, SDK otomatis mengembalikan HTTP 409 Conflict)
prismaApiRouter.post(
  "/users",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.create({
      data: req.body,
    });
    return res.success(user, 201);
  })
);

// 3. GET /users/:id - Ambil user by ID (findUniqueOrThrow otomatis mengembalikan HTTP 404 Not Found jika tidak ada)
prismaApiRouter.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: { posts: true },
    });
    return res.success(user);
  })
);

// 4. POST /users/:id/posts - Tambahkan post ke user
prismaApiRouter.post(
  "/users/:id/posts",
  validate(createPostSchema),
  asyncHandler(async (req, res) => {
    const post = await prisma.post.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        authorId: Number(req.params.id),
      },
    });
    return res.success(post, 201);
  })
);

// 5. DELETE /users/:id - Hapus user (P2025 otomatis jadi HTTP 404 jika user tidak ditemukan)
prismaApiRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    await prisma.user.delete({
      where: { id: Number(req.params.id) },
    });
    return res.success({ message: "User deleted successfully" });
  })
);
