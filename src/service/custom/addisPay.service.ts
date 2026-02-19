const apiKey =
  process.env.ADDISPAY_API_KEY || "**********************************";
const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.addispay.et/checkout-api/v1"
    : "https://uat.api.addispay.et/checkout-api/v1";

// For environments where fetch is not global (older Node.js)
// Note: In Node 18+ fetch is global.

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

export class AddisPayService {
  /**
   * Create an order to AddisPay server
   */
  static async createOrder(paymentData: PaymentData) {
    const url = `${baseUrl}/create-order`;
    const payload = {
      data: paymentData,
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
