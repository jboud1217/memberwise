"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId, session };
}

// ─── List Events ──────────────────────────────────────

export async function getEvents({
  search,
  status,
  upcoming,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  upcoming?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { venueName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (upcoming) where.startDate = { gte: new Date() };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: upcoming ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        ticketTypes: true,
        _count: { select: { registrations: true } },
      },
    }),
    db.event.count({ where }),
  ]);

  return { events, total, pages: Math.ceil(total / pageSize) };
}

// ─── Get Single Event ─────────────────────────────────

export async function getEvent(id: string) {
  const { db } = await getTenantPrisma();

  return db.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      registrations: {
        include: {
          member: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          ticketType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { registrations: true } },
    },
  });
}

// ─── Create Event ─────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description?: string;
  body?: string;
  format: "IN_PERSON" | "VIRTUAL" | "HYBRID";
  startDate: string; // ISO
  endDate: string;
  timezone?: string;
  allDay?: boolean;
  venueName?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  virtualUrl?: string;
  capacity?: number;
  waitlistEnabled?: boolean;
  isFree?: boolean;
  memberPrice?: number;
  nonMemberPrice?: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  registrationOpens?: string;
  registrationCloses?: string;
  allowGuests?: boolean;
  maxGuestsPerRegistration?: number;
  requireApproval?: boolean;
  coverImage?: string;
  tags?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  allowedTierIds?: string[];
  ticketTypes?: {
    name: string;
    description?: string;
    price: number;
    memberPrice?: number;
    capacity?: number;
  }[];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createEvent(input: CreateEventInput) {
  const { db, orgId } = await getTenantPrisma();

  // Ensure unique slug
  let slug = generateSlug(input.title);
  const existing = await db.event.findUnique({
    where: { organizationId_slug: { organizationId: orgId, slug } },
  });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = await db.event.create({
    data: {
      title: input.title,
      slug,
      description: input.description || null,
      body: input.body || null,
      format: input.format,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      timezone: input.timezone || "America/New_York",
      allDay: input.allDay || false,
      venueName: input.venueName || null,
      address1: input.address1 || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      virtualUrl: input.virtualUrl || null,
      capacity: input.capacity || null,
      waitlistEnabled: input.waitlistEnabled || false,
      isFree: input.isFree ?? true,
      memberPrice: input.memberPrice || null,
      nonMemberPrice: input.nonMemberPrice || null,
      earlyBirdPrice: input.earlyBirdPrice || null,
      earlyBirdDeadline: input.earlyBirdDeadline ? new Date(input.earlyBirdDeadline) : null,
      registrationOpens: input.registrationOpens ? new Date(input.registrationOpens) : null,
      registrationCloses: input.registrationCloses ? new Date(input.registrationCloses) : null,
      allowGuests: input.allowGuests || false,
      maxGuestsPerRegistration: input.maxGuestsPerRegistration || 0,
      requireApproval: input.requireApproval || false,
      coverImage: input.coverImage || null,
      tags: input.tags || [],
      contactName: input.contactName || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      allowedTierIds: input.allowedTierIds || [],
      ticketTypes: input.ticketTypes
        ? {
            create: input.ticketTypes.map((tt, i) => ({
              name: tt.name,
              description: tt.description || null,
              price: tt.price,
              memberPrice: tt.memberPrice || null,
              capacity: tt.capacity || null,
              sortOrder: i,
            })),
          }
        : undefined,
    } as any,
    include: { ticketTypes: true },
  });

  await logActivity({
    type: "event_created",
    description: `Created event "${event.title}"`,
    metadata: { eventId: event.id, format: event.format },
  });

  revalidatePath("/events");
  return event;
}

// ─── Update Event ─────────────────────────────────────

export async function updateEvent(id: string, input: Partial<CreateEventInput> & { status?: string }) {
  const { db } = await getTenantPrisma();

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.body !== undefined) data.body = input.body || null;
  if (input.format !== undefined) data.format = input.format;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.allDay !== undefined) data.allDay = input.allDay;
  if (input.venueName !== undefined) data.venueName = input.venueName || null;
  if (input.address1 !== undefined) data.address1 = input.address1 || null;
  if (input.city !== undefined) data.city = input.city || null;
  if (input.state !== undefined) data.state = input.state || null;
  if (input.zip !== undefined) data.zip = input.zip || null;
  if (input.virtualUrl !== undefined) data.virtualUrl = input.virtualUrl || null;
  if (input.capacity !== undefined) data.capacity = input.capacity || null;
  if (input.waitlistEnabled !== undefined) data.waitlistEnabled = input.waitlistEnabled;
  if (input.isFree !== undefined) data.isFree = input.isFree;
  if (input.memberPrice !== undefined) data.memberPrice = input.memberPrice || null;
  if (input.nonMemberPrice !== undefined) data.nonMemberPrice = input.nonMemberPrice || null;
  if (input.earlyBirdPrice !== undefined) data.earlyBirdPrice = input.earlyBirdPrice || null;
  if (input.earlyBirdDeadline !== undefined) data.earlyBirdDeadline = input.earlyBirdDeadline ? new Date(input.earlyBirdDeadline) : null;
  if (input.registrationOpens !== undefined) data.registrationOpens = input.registrationOpens ? new Date(input.registrationOpens) : null;
  if (input.registrationCloses !== undefined) data.registrationCloses = input.registrationCloses ? new Date(input.registrationCloses) : null;
  if (input.allowGuests !== undefined) data.allowGuests = input.allowGuests;
  if (input.maxGuestsPerRegistration !== undefined) data.maxGuestsPerRegistration = input.maxGuestsPerRegistration;
  if (input.requireApproval !== undefined) data.requireApproval = input.requireApproval;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.contactName !== undefined) data.contactName = input.contactName || null;
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail || null;
  if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone || null;
  if (input.allowedTierIds !== undefined) data.allowedTierIds = input.allowedTierIds;
  if (input.status) data.status = input.status;

  const event = await db.event.update({ where: { id }, data });

  await logActivity({
    type: "event_updated",
    description: `Updated event "${event.title}"`,
    metadata: { eventId: event.id },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return event;
}

// ─── Publish / Cancel ─────────────────────────────────

export async function publishEvent(id: string) {
  return updateEventStatus(id, "PUBLISHED");
}

export async function cancelEvent(id: string) {
  return updateEventStatus(id, "CANCELLED");
}

export async function completeEvent(id: string) {
  return updateEventStatus(id, "COMPLETED");
}

async function updateEventStatus(id: string, status: "PUBLISHED" | "CANCELLED" | "COMPLETED") {
  const { db } = await getTenantPrisma();
  const event = await db.event.update({ where: { id }, data: { status } });

  await logActivity({
    type: `event_${status.toLowerCase()}`,
    description: `Event "${event.title}" ${status.toLowerCase()}`,
    metadata: { eventId: event.id },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  return event;
}

// ─── Delete Event ─────────────────────────────────────

export async function deleteEvent(id: string) {
  const { db } = await getTenantPrisma();
  const event = await db.event.delete({ where: { id } });

  await logActivity({
    type: "event_deleted",
    description: `Deleted event "${event.title}"`,
  });

  revalidatePath("/events");
  return { success: true };
}

// ─── Registration ─────────────────────────────────────

export async function registerForEvent({
  eventId,
  memberId,
  contactId,
  ticketTypeId,
  guestName,
  guestEmail,
  guestPhone,
  guestCount,
  customResponses,
  notes,
}: {
  eventId: string;
  memberId?: string;
  contactId?: string;
  ticketTypeId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  customResponses?: Record<string, string>;
  notes?: string;
}) {
  const { db, orgId } = await getTenantPrisma();

  // Use a transaction to prevent race conditions on capacity check + registration
  const registration = await prisma.$transaction(async (tx) => {
    // Lock the event row with a raw query to prevent concurrent over-registration
    const events = await tx.$queryRaw<{ capacity: number | null; registrationCount: number; waitlistEnabled: boolean; waitlistCount: number; title: string }[]>`
      SELECT capacity, "registrationCount", "waitlistEnabled", "waitlistCount", title
      FROM "Event"
      WHERE id = ${eventId} AND "organizationId" = ${orgId}
      FOR UPDATE
    `;
    const event = events[0];
    if (!event) throw new Error("Event not found");

    let status: "REGISTERED" | "WAITLISTED" = "REGISTERED";
    if (event.capacity && event.registrationCount >= event.capacity) {
      if (event.waitlistEnabled) {
        status = "WAITLISTED";
      } else {
        throw new Error("Event is at capacity");
      }
    }

    // Calculate amount
    let amountPaid = 0;
    if (ticketTypeId) {
      const ticket = await tx.eventTicketType.findUnique({ where: { id: ticketTypeId } });
      if (ticket) {
        amountPaid = memberId && ticket.memberPrice != null ? ticket.memberPrice : ticket.price;
      }
    }

    const reg = await tx.eventRegistration.create({
      data: {
        eventId,
        organizationId: orgId,
        memberId: memberId || null,
        contactId: contactId || null,
        ticketTypeId: ticketTypeId || null,
        status,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        guestCount: guestCount || 0,
        amountPaid,
        customResponses: customResponses || undefined,
        notes: notes || null,
      },
    });

    // Update counts atomically within the same transaction
    if (status === "REGISTERED") {
      await tx.event.update({
        where: { id: eventId },
        data: { registrationCount: { increment: 1 } },
      });
      if (ticketTypeId) {
        await tx.eventTicketType.update({
          where: { id: ticketTypeId },
          data: { soldCount: { increment: 1 } },
        });
      }
    } else {
      await tx.event.update({
        where: { id: eventId },
        data: { waitlistCount: { increment: 1 } },
      });
    }

    return { reg, eventTitle: event.title, status };
  });

  const registrantName = guestName || memberId || "Someone";
  await logActivity({
    type: "event_registration",
    description: `${registrantName} ${registration.status === "WAITLISTED" ? "waitlisted for" : "registered for"} "${registration.eventTitle}"`,
    memberId: memberId || undefined,
    metadata: { eventId, registrationId: registration.reg.id },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return registration.reg;
}

// ─── Check In ─────────────────────────────────────────

export async function checkInRegistration(registrationId: string) {
  const { db } = await getTenantPrisma();

  const reg = await db.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "CHECKED_IN", checkedInAt: new Date() },
    include: { event: { select: { id: true, title: true } } },
  });

  await db.event.update({
    where: { id: reg.eventId },
    data: { checkedInCount: { increment: 1 } },
  });

  revalidatePath(`/events/${reg.eventId}`);
  return reg;
}

// ─── Cancel Registration ──────────────────────────────

export async function cancelRegistration(registrationId: string, reason?: string) {
  const { db } = await getTenantPrisma();

  const reg = await db.eventRegistration.update({
    where: { id: registrationId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason || null,
    },
    include: { event: { select: { id: true, title: true, waitlistEnabled: true } } },
  });

  // Decrement count
  await db.event.update({
    where: { id: reg.eventId },
    data: { registrationCount: { decrement: 1 } },
  });

  // Promote from waitlist if available
  if (reg.event.waitlistEnabled) {
    const nextWaitlisted = await db.eventRegistration.findFirst({
      where: { eventId: reg.eventId, status: "WAITLISTED" },
      orderBy: { createdAt: "asc" },
    });
    if (nextWaitlisted) {
      await db.eventRegistration.update({
        where: { id: nextWaitlisted.id },
        data: { status: "REGISTERED" },
      });
      await db.event.update({
        where: { id: reg.eventId },
        data: {
          registrationCount: { increment: 1 },
          waitlistCount: { decrement: 1 },
        },
      });
    }
  }

  revalidatePath(`/events/${reg.eventId}`);
  return reg;
}

// ─── Event Stats ──────────────────────────────────────

export async function getEventStats() {
  const { db } = await getTenantPrisma();
  const now = new Date();

  const [total, upcoming, totalRegistrations, thisMonth] = await Promise.all([
    db.event.count(),
    db.event.count({ where: { startDate: { gte: now }, status: "PUBLISHED" } }),
    db.eventRegistration.count({ where: { status: { in: ["REGISTERED", "CHECKED_IN"] } } }),
    db.event.count({
      where: {
        startDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        status: { in: ["PUBLISHED", "COMPLETED"] },
      },
    }),
  ]);

  return { total, upcoming, totalRegistrations, thisMonth };
}
