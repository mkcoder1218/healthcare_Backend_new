import { Request, Response } from "express";
import { AddisPayService } from "../../service/custom/addisPay.service";
import { asyncHandler } from "../../utils/asyncHandler";
import sequelize from "../../model/db";

export const PaymentController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const orderResponse = await AddisPayService.createOrder(req.body);
    return res.status(200).json(orderResponse);
  }),

  /**
   * Called by the frontend after a user returns from AddisPay.
   * Verifies the payment and updates the booking in the DB.
   */
  confirmBookingPayment: asyncHandler(async (req: Request, res: Response) => {
    const { uuid, booking_id } = req.body;

    if (!uuid || !booking_id) {
      return res
        .status(400)
        .json({ message: "UUID and booking_id are required" });
    }

    // 1. Verify status with AddisPay
    const statusResponse = await AddisPayService.checkStatus(uuid);
    const apiData = statusResponse.data;

    // 2. If successful, update the booking record
    if (apiData.data && apiData.data.payment_status === "success") {
      const Booking = sequelize.models.Booking;
      const booking = await Booking.findByPk(booking_id);

      if (!booking) {
        return res.status(404).json({ message: "Booking record not found" });
      }

      await booking.update({
        payment_status: "Paid",
        status: "Confirmed",
      });

      return res.status(200).json({
        message: "Payment confirmed and booking updated",
        booking,
      });
    }

    return res.status(400).json({
      message: "Payment verification failed or status is not success",
      details: apiData,
    });
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
