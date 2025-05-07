import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createClient } from "@supabase/supabase-js";

// Mock environment variables
process.env.VITE_SUPABASE_URL = "http://localhost:54321";
process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";

// Create mock Supabase client
const mockSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

// Mock Supabase methods
vi.mock("../lib/supabase", () => ({
  default: {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: { id: "test-user-id", email: "test@example.com" },
              access_token: "test-token",
            },
          },
          error: null,
        }),
      signUp: () =>
        Promise.resolve({
          data: {
            user: { id: "test-user-id", email: "test@example.com" },
            session: { access_token: "test-token" },
          },
          error: null,
        }),
      signInWithPassword: () =>
        Promise.resolve({
          data: {
            user: { id: "test-user-id", email: "test@example.com" },
            session: { access_token: "test-token" },
          },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback) => {
        callback("SIGNED_IN", {
          user: { id: "test-user-id", email: "test@example.com" },
          access_token: "test-token",
        });
        return {
          subscription: {
            unsubscribe: () => {},
          },
          data: { subscription: { unsubscribe: () => {} } },
        };
      },
    },
    from: (table: string) => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                id: "test-id",
                booking_number: "TEST-123",
                status: "pending",
              },
              error: null,
            }),
        }),
      }),
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "test-id", status: "pending" },
              error: null,
            }),
          maybeSingle: () =>
            Promise.resolve({
              data: { id: "test-id", status: "pending" },
              error: null,
            }),
          order: () =>
            Promise.resolve({
              data: [
                {
                  id: "test-id",
                  booking_number: "TEST-123",
                  status: "pending",
                  services: {
                    name: "Test Service",
                    service_providers: {
                      company_name: "Test Provider",
                    },
                  },
                },
              ],
              error: null,
            }),
        }),
        order: () =>
          Promise.resolve({
            data: [
              {
                id: "test-id",
                booking_number: "TEST-123",
                status: "pending",
                services: {
                  name: "Test Service",
                  service_providers: {
                    company_name: "Test Provider",
                  },
                },
              },
            ],
            error: null,
          }),
      }),
    }),
  },
}));

// MSW handlers for external API calls
const handlers = [
  http.post("*/functions/v1/create-payment", () => {
    return HttpResponse.json({
      success: true,
      payment_id: "test-payment-id",
      payment_link: "https://test-payment-link.com",
    });
  }),

  http.get("*/functions/v1/check-payment-status", () => {
    return HttpResponse.json({
      success: true,
      payment: {
        id: "test-payment-id",
        status: "pending",
      },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
