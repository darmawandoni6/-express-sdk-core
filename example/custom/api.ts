import { Router, asyncHandler, createHttpError, validate, z } from "../../src";

export const customProductRouter = Router();

const querySchema = {
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
  }),
};

// GET /api/v1/products (Query validation + success response)
customProductRouter.get(
  "/products",
  validate(querySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;

    const dummyProducts = [
      { id: 1, name: "MacBook Pro M3", price: 1999 },
      { id: 2, name: "Dell XPS 15", price: 1799 },
    ];

    return res.success({
      meta: { page, limit, search: search ?? null },
      items: dummyProducts,
    });
  })
);

// GET /api/v1/products/:id (Error handling HttpError demo)
customProductRouter.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (id !== 1 && id !== 2) {
      throw createHttpError.NotFound(`Product with ID ${id} not found`);
    }

    return res.success({ id, name: "MacBook Pro M3", price: 1999 });
  })
);

// POST /api/v1/products (Menerima custom payload besar hingga 10MB)
customProductRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    return res.success({ message: "Product created", data: req.body }, 201);
  })
);
