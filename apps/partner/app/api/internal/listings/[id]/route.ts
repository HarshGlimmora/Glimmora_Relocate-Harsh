import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/internal/listings/[id] — full detail for Consumer Marketplace

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get("authorization");
  if (!process.env.INTERNAL_API_KEY || auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const l = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      partner: {
        select: {
          id: true, name: true, slug: true, category: true, about: true, website: true,
          rating: true, reviewCount: true, fulfilmentRateBps: true, verificationStatus: true,
          hqCity: true, hqCountry: true,
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!l || l.status !== "ACTIVE" || l.partner.verificationStatus !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
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
      about: l.partner.about,
      website: l.partner.website,
      rating: l.partner.rating,
      reviewCount: l.partner.reviewCount,
      fulfilmentRate: l.partner.fulfilmentRateBps / 100,
      hqCity: l.partner.hqCity,
      hqCountry: l.partner.hqCountry,
    },
    totalBookings: l._count.bookings,
  });
}
