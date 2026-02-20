const apiKey =
  process.env.ADDISPAY_API_KEY || "**********************************";

// UAT key → always use UAT base URL until you switch to a live key
const baseUrl = "https://uat.api.addispay.et/checkout-api/v1";

// Debug log — confirms what key + URL is being used (check your Render logs)
console.log("[AddisPay] Base URL:", baseUrl);
console.log(
  "[AddisPay] API Key status:",
  apiKey !== "**********************************"
    ? "✅ Real key loaded"
    : "❌ Placeholder key — set ADDISPAY_API_KEY in Render Environment",
);

export interface PaymentData {
  redirect_url?: string;
  cancel_url?: string;
  success_url?: string;
  error_url?: string;
  order_reason: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  nonce: string;
  order_detail: {
    amount: number;
    description: string;
  };
  phone_number: string;
  session_expired: string;
  total_amount: string | number;
  tx_ref: string;
}

export interface PayoutPaymentData {
  cancel_url: string;
  success_url: string;
  error_url: string;
  order_reason: string;
  currency: string;
  customer_name: string;
  phone_number: string;
  nonce: string;
  payment_method: string;
  total_amount: string | number;
  tx_ref: string;
}

/**
 * Normalizes phone numbers to '09...' format for AddisPay
 */
const normalizePhoneForAddisPay = (phone: string): string => {
  if (!phone) return phone;
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("251")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return "0" + cleaned; // AddisPay usually expects 09...
};

export class AddisPayService {
  /**
   * Create an order to AddisPay server
   */
  static async createOrder(paymentData: PaymentData) {
    const url = `${baseUrl}/create-order`;

    // AddisPay requires total_amount and amount as a string with 2 decimals e.g. "100.00"
    const normalizedData = {
      ...paymentData,
      phone_number: normalizePhoneForAddisPay(paymentData.phone_number),
      total_amount: parseFloat(String(paymentData.total_amount)).toFixed(2),
      order_detail: {
        ...paymentData.order_detail,
        amount: parseFloat(String(paymentData.order_detail.amount)).toFixed(2),
      },
    };

    const payload = {
      data: normalizedData,
      message: "all in all good experience",
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Auth: apiKey,
      },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Order creation failed: " + errorText);
      }
      const data = await response.json();
      // Combine checkout_url with uuid as per documentation
      if (data && data.checkout_url && data.uuid) {
        data.full_checkout_url = `${data.checkout_url}/${data.uuid}`;
      }
      return data;
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      throw error;
    }
  }

  /**
   * Check order status using UUID
   */
  static async checkStatus(uuid: string) {
    const url = `${baseUrl}/get-status?uuid=${uuid}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          "Failed to fetch order for uuid: " + uuid + " " + errorText,
        );
      }
      const data = await response.json();
      return { data, uuid };
    } catch (error: any) {
      console.error("Error checking order status:", error.message);
      throw error;
    }
  }

  /**
   * Get receipt for a successful order using UUID
   */
  static async getReceipt(uuid: string) {
    const url = `${baseUrl}/get-recipt?uuid=${uuid}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          "Failed to fetch receipt for uuid: " + uuid + " " + errorText,
        );
      }
      return await response.json();
    } catch (error: any) {
      console.error("Error getting receipt:", error.message);
      throw error;
    }
  }

  /**
   * Business to Customer (B2C) payment for refunds and rewards
   */
  static async payout(payoutData: PayoutPaymentData) {
    const url = `${baseUrl}/payment/direct-b2c`;
    const payload = {
      data: payoutData,
      message: "this a test direct payout",
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Auth: apiKey,
      },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Payout failed: " + errorText);
      }
      return await response.json();
    } catch (error: any) {
      console.error("Error during payout:", error.message);
      throw error;
    }
  }
}
