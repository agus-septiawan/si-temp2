import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBooking } from "../../hooks/useBooking";

describe("useBooking", () => {
  const testBooking = {
    serviceId: "test-service-id",
    startDate: new Date(),
    quantity: 2,
    specialRequests: "Test request",
  };

  it("should create a new booking", async () => {
    const { result } = renderHook(() => useBooking());

    await act(async () => {
      const response = await result.current.createBooking(
        "test-user-id",
        testBooking,
      );
      expect(response.success).toBe(true);
      expect(response.booking).toBeDefined();
      expect(response.booking.booking_number).toBe("TEST-123");
    });
  });

  it("should get user bookings", async () => {
    const { result } = renderHook(() => useBooking());

    await act(async () => {
      const response = await result.current.getUserBookings("test-user-id");
      expect(response.success).toBe(true);
      expect(Array.isArray(response.bookings)).toBe(true);
      expect(response.bookings.length).toBeGreaterThan(0);
    });
  });

  it("should get booking by id", async () => {
    const { result } = renderHook(() => useBooking());

    await act(async () => {
      const response = await result.current.getBookingById("test-booking-id");
      expect(response.success).toBe(true);
      expect(response.booking).toBeDefined();
      expect(response.booking.id).toBe("test-id");
    });
  });
});
