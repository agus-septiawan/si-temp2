import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";

describe("useAuth", () => {
  const testUser = {
    email: "test@example.com",
    password: "Test123!",
    firstName: "Test",
    lastName: "User",
  };

  it("should sign up a new user", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signUp(
        testUser.email,
        testUser.password,
        {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        },
      );
      expect(response.success).toBe(true);
      expect(response.data?.user).toBeDefined();
    });
  });

  it("should sign in an existing user", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signIn(
        testUser.email,
        testUser.password,
      );
      expect(response.success).toBe(true);
      expect(response.data?.user).toBeDefined();
    });
  });

  it("should sign out the user", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signOut();
      expect(response.success).toBe(true);
    });
  });
});
