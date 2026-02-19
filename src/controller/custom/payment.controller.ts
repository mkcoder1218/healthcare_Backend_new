import { Request, Response } from "express";
import { AddisPayService } from "../../service/custom/addisPay.service";
import { asyncHandler } from "../../utils/asyncHandler";

export const PaymentController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const orderResponse = await AddisPayService.createOrder(req.body);
    return res.status(200).json(orderResponse);
  }),

  checkStatus: asyncHandler(async (req: Request, res: Response) => {
    const { uuid } = req.query;
    if (!uuid || typeof uuid !== "string") {
      return res.status(400).json({ message: "UUID is required" });
    }
    const statusResponse = await AddisPayService.checkStatus(uuid);
    return res.status(200).json(statusResponse);
  }),

  getReceipt: asyncHandler(async (req: Request, res: Response) => {
    const { uuid } = req.query;
    if (!uuid || typeof uuid !== "string") {
      return res.status(400).json({ message: "UUID is required" });
    }
    const receiptResponse = await AddisPayService.getReceipt(uuid);
    return res.status(200).json(receiptResponse);
  }),

  payout: asyncHandler(async (req: Request, res: Response) => {
    const payoutResponse = await AddisPayService.payout(req.body);
    return res.status(200).json(payoutResponse);
  }),
};
