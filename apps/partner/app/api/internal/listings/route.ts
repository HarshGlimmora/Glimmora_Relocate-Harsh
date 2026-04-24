import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/internal/listings?country=DE&kind=APARTMENT
// Consumer's Marketplace reads this. Only returns ACTIVE listings from APPROVED partners.

const query = z.object({
  country: z.string().length(2).optional(),
  kind: z.string().optional(),
  city: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.INTERNAL_API_KEY || auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = query.safeParse({
    country: url.searchParams.get("country") || undefined,
    kind: url.searchParams.get("kind") || undefined,
    city: url.searchParams.get("city") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      partner: { verificationStatus: "APPROVED" },
      ...(parsed.data.country ? { country: parsed.data.country.toUpperCase() } : {}),
      ...(parsed.data.kind ? { kind: parsed.data.kind.toUpperCase() } : {}),
      ...(parsed.data.city ? { city: { contains: parsed.data.city } } : {}),
    },
    include: {
      partner: {
        select: {
          id: true, name: true, slug: true, category: true, rating: true,
          reviewCount: true, fulfilmentRateBps: true, verificationStatus: true,
        },
      },
    },
    orderBy: [{ partner: { rating: "desc" } }, { publishedAt: "desc" }],
  });

  const payload = listings.map((l) => ({
    id: l.id,
    kind: l.kind,
    title: l.title,
    summary: l.summary,
    city: l.city,
    country: l.country,
    address: l.address,
    priceMin: l.priceMin,
    priceMax: l.priceMax,
    currency: l.currency,
    billingCycle: l.billingCycle,
    photos: JSON.parse(l.photos || "[]"),
    attributes: JSON.parse(l.attributes || "{}"),
    capacityRemaining: l.capacity - l.capacityTaken,
    publishedAt: l.publishedAt?.toISOString() ?? null,
    partner: {
      id: l.partner.id,
      name: l.partner.name,
      slug: l.partner.slug,
      category: l.partner.category,
      rating: l.partner.rating,
      reviewCount: l.partner.reviewCount,
      fulfilmentRate: l.partner.fulfilmentRateBps / 100,
    },
  }));

  return NextResponse.json({ listings: payload });
}
