import express, { RequestHandler } from "express";
import { model } from "../model/model";
import { generateController } from "../controller";
import { validationSchemas, validationUpdateSchemas } from "../validation";
import { authController } from "../controller/auth";
import { checkAccess, authenticateToken } from "../middleware/auth";
import { validate, validateUpdate } from "../middleware";
import { uniqueCheck } from "../middleware/uniqueCheck";
import { asyncHandler } from "../utils/asyncHandler";
import { userPointController } from "../controller/custom/userpoint";
import { BookingController } from "../controller/custom/booking";
import { PaymentController } from "../controller/custom/payment.controller";
const router = express.Router();

/** Payment routes */
router.post(
  "/payment/create-order",
  asyncHandler(PaymentController.createOrder),
);
router.get("/payment/status", asyncHandler(PaymentController.checkStatus));
router.get("/payment/receipt", asyncHandler(PaymentController.getReceipt));
router.post("/payment/payout", asyncHandler(PaymentController.payout));

/** Auth routes (public) */
router.post("/auth/register", asyncHandler(authController.register));
router.post("/auth/login", asyncHandler(authController.login));

/** Protected profile route */
router.get(
  "/auth/profile",
  authenticateToken(process.env.JWT_SECRET!),
  // checkAccess("User", "read"),
  asyncHandler(authController.getProfile),
);

/** Dynamic CRUD routes */
for (const modelName in model) {
  const def = model[modelName];
  const controller = generateController(modelName);
  const basePath = `/${modelName.toLowerCase()}`;
  const schema = validationSchemas[modelName];
  const schemaupdate = validationUpdateSchemas[modelName];

  const uniqueFields = Object.entries(def.fields)
    .filter(([_, f]) => f.unique)
    .map(([field]) => field);

  /** CREATE */
  if (def.routes?.includes("create")) {
    const middlewares: RequestHandler[] = [
      ...(def.auth?.create
        ? [
            //authenticateToken(process.env.JWT_SECRET!),// checkAccess(modelName, "create")
          ]
        : []),
      validate(schema),
      ...uniqueFields.map((f) => uniqueCheck(modelName, f)),
    ];
    router.post(basePath, ...middlewares, controller.create);
  }

  /** READ */
  if (def.routes?.includes("read")) {
    const readMw: RequestHandler[] = [
      ...(def.auth?.read
        ? [
            // authenticateToken(process.env.JWT_SECRET!), checkAccess(modelName, "read")
          ]
        : []),
    ];
    router.get(basePath, ...readMw, controller.getAll);
    router.get(`${basePath}/:id`, ...readMw, controller.getOne);
  }

  /** UPDATE */
  if (def.routes?.includes("update")) {
    const middlewares: RequestHandler[] = [
      ...(def.auth?.update
        ? [
            // authenticateToken(process.env.JWT_SECRET!), checkAccess(modelName, "update")
          ]
        : []),
      validateUpdate(schemaupdate),
      ...uniqueFields.map((f) => uniqueCheck(modelName, f, "id")),
    ];
    router.put(`${basePath}/:id`, ...middlewares, controller.update);
  }

  /** DELETE */
  if (def.routes?.includes("delete")) {
    const deleteMw: RequestHandler[] = [
      ...(def.auth?.delete
        ? [
            //authenticateToken(process.env.JWT_SECRET!), //checkAccess(modelName, "delete")
          ]
        : []),
    ];
    router.delete(`${basePath}/:id`, ...deleteMw, controller.delete);
  }
}

export default router;
