// Typed HTTP client for the Partner portal's internal APIs.
// Backend team replaces base URL + auth — request/response contracts stay stable.

import { z } from "zod";

const base = process.env.PARTNER_API_URL ?? "http://localhost:3004";
const apiKey = process.env.INTERNAL_API_KEY;

const partnerRef = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  fulfilmentRate: z.number(),
});

const listing = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  address: z.string().nullable(),
  priceMin: z.number().int().nullable(),
  priceMax: z.number().int().nullable(),
  currency: z.string(),
  billingCycle: z.string(),
  photos: z.array(z.string()),
  attributes: z.record(z.unknown()),
  capacityRemaining: z.number().int(),
  publishedAt: z.string().nullable(),
  partner: partnerRef,
});

const booking = z.object({
  id: z.string(),
  status: z.string(),
  escrowState: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  confirmedAt: z.string().nullable(),
  fulfilledAt: z.string().nullable(),
  listing: z.object({ id: z.string(), title: z.string(), kind: z.string(), city: z.string(), country: z.string() }),
  partner: z.object({ id: z.string(), name: z.string(), slug: z.string(), category: z.string() }),
  messages: z.array(z.object({
    id: z.string(), sender: z.string(), author: z.string(), body: z.string(), createdAt: z.string(),
  })),
});

const listingDetail = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  address: z.string().nullable(),
  priceMin: z.number().int().nullable(),
  priceMax: z.number().int().nullable(),
  currency: z.string(),
  billingCycle: z.string(),
  photos: z.array(z.string()),
  attributes: z.record(z.unknown()),
  capacityRemaining: z.number().int(),
  publishedAt: z.string().nullable(),
  partner: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    about: z.string().nullable(),
    website: z.string().nullable(),
    rating: z.number(),
    reviewCount: z.number(),
    fulfilmentRate: z.number(),
    hqCity: z.string().nullable(),
    hqCountry: z.string().nullable(),
  }),
  totalBookings: z.number().int().nonnegative(),
});

export type PartnerListing = z.infer<typeof listing>;
export type PartnerListingDetail = z.infer<typeof listingDetail>;
export type PartnerBooking = z.infer<typeof booking>;

async function request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  if (!apiKey) throw new Error("INTERNAL_API_KEY is not set in the Consumer app env.");
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Partner API ${res.status} at ${path}: ${body.slice(0, 200)}`);
  }
  const json = await res.json().catch(() => null);
  return schema.parse(json);
}

export async function getPartnerListing(id: string): Promise<PartnerListingDetail | null> {
  try {
    return await request(`/api/internal/listings/${encodeURIComponent(id)}`, { method: "GET" }, listingDetail);
  } catch (e) {
    if (e instanceof Error && e.message.includes(" 404 ")) return null;
    throw e;
  }
}

export async function listPartnerListings(opts?: { country?: string; kind?: string; city?: string }): Promise<PartnerListing[]> {
  const params = new URLSearchParams();
  if (opts?.country) params.set("country", opts.country);
  if (opts?.kind) params.set("kind", opts.kind);
  if (opts?.city) params.set("city", opts.city);
  const qs = params.toString() ? `?${params}` : "";
  const data = await request(`/api/internal/listings${qs}`, { method: "GET" }, z.object({ listings: z.array(listing) }));
  return data.listings;
}

export async function listCustomerBookings(email: string): Promise<PartnerBooking[]> {
  const data = await request(
    `/api/internal/bookings?email=${encodeURIComponent(email)}`,
    { method: "GET" },
    z.object({ bookings: z.array(booking) }),
  );
  return data.bookings;
}

export async function submitPartnerBooking(input: {
  listingId: string;
  customerEmail: string;
  customerName: string;
  customerCountry?: string | null;
  customerPassport?: string | null;
  note?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  amount: number;
  currency: string;
}): Promise<{ ok: true; bookingId: string; status: string; alreadyBooked: boolean }> {
  return request(
    "/api/internal/bookings",
    { method: "POST", body: JSON.stringify(input) },
    z.object({
      ok: z.literal(true),
      bookingId: z.string(),
      status: z.string(),
      alreadyBooked: z.boolean(),
    }),
  );
}
