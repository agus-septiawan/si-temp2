import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePayment } from "../../hooks/usePayment";

describe("usePayment", () => {
  it("should create a payment", async () => {
    const { result } = renderHook(() => usePayment());

    await act(async () => {
      const response = await result.current.createPayment("test-booking-id");
      expect(response.success).toBe(true);
      expect(response.payment_link).toBe("https://test-payment-link.com");
    });
  });

  it("should check payment status", async () => {
    const { result } = renderHook(() => usePayment());

    await act(async () => {
      const response =
        await result.current.checkPaymentStatus("test-payment-id");
      expect(response.success).toBe(true);
      expect(response.payment.status).toBe("pending");
    });
  });
});
