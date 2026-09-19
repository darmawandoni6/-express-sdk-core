import { Router, asyncHandler, validate, z } from "../../src";

export const defaultApiRouter = Router();

const createUserSchema = {
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
  }),
};

// GET /v1/ping
defaultApiRouter.get(
  "/ping",
  asyncHandler(async (_req, res) => {
    return res.success({ message: "pong" });
  })
);

// POST /v1/users (memanfaatkan default express.json() body parser)
defaultApiRouter.post(
  "/users",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    return res.success(
      {
        message: "User created successfully",
        user: req.body,
      },
      201
    );
  })
);
