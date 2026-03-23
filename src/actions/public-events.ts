"use server";

import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { headers } from "next/headers";

async function getOrgIdFromHost(): Promise<string | null> {
  const headersList = await headers();
  const slugHeader = headersList.get("x-org-slug");
  const host = headersList.get("host") || "";
  const slug = slugHeader || host.split(".")[0];

  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { customDomain: host }] },
    select: { id: true },
  });
  return org?.id || null;
}

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  body: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  format: string;
  status: string;
  venueName: string | null;
  address1: string | null;
  city: string | null;
  state: string | null;
  virtualUrl: string | null;
  coverImage: string | null;
  tags: string[];
  capacity: number | null;
  registrationCount: number;
  isFree: boolean;
  memberPrice: number | null;
  nonMemberPrice: number | null;
  contactName: string | null;
  contactEmail: string | null;
}

/** Fetch published events for the public site — no auth required */
export async function getPublicEvents({
  year,
  month,
}: {
  year: number;
  month: number; // 0-indexed (JS Date convention)
}): Promise<PublicEvent[]> {
  const orgId = await getOrgIdFromHost();
  if (!orgId) return [];

  const db = tenantPrisma(prisma, orgId);

  // Fetch events that overlap with the given month window
  // Expand range by 7 days on each side to catch multi-day events
  const start = new Date(year, month, 1);
  start.setDate(start.getDate() - 7);
  const end = new Date(year, month + 1, 0);
  end.setDate(end.getDate() + 7);

  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { lte: end },
      endDate: { gte: start },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      body: true,
      startDate: true,
      endDate: true,
      allDay: true,
      format: true,
      status: true,
      venueName: true,
      address1: true,
      city: true,
      state: true,
      virtualUrl: true,
      coverImage: true,
      tags: true,
      capacity: true,
      registrationCount: true,
      isFree: true,
      memberPrice: true,
      nonMemberPrice: true,
      contactName: true,
      contactEmail: true,
    },
    take: 200,
  });

  return events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    memberPrice: e.memberPrice ? Number(e.memberPrice) : null,
    nonMemberPrice: e.nonMemberPrice ? Number(e.nonMemberPrice) : null,
  }));
}
