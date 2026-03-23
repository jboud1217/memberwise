"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId) };
}

export interface SmartAlert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  title: string;
  message: string;
  href: string;
  actionLabel: string;
  count?: number;
}

export async function getSmartAlerts(): Promise<SmartAlert[]> {
  const { db } = await getTenantPrisma();
  const now = new Date();
  const alerts: SmartAlert[] = [];

  const [
    renewalsDue,
    expiredActive,
    lapsedRecent,
    draftCampaigns,
    pendingVolunteerHours,
    upcomingEvents,
    overdueInvoices,
  ] = await Promise.all([
    // Renewals due in next 30 days
    db.member.count({
      where: {
        renewalDate: {
          gte: now,
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: "ACTIVE",
      },
    }),
    // Active members with expired dates
    db.member.count({
      where: {
        expirationDate: { lte: now },
        status: "ACTIVE",
      },
    }),
    // Recently lapsed (last 7 days)
    db.member.count({
      where: {
        status: "LAPSED",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Draft campaigns that haven't been sent
    db.emailCampaign.count({
      where: { status: "DRAFT" },
    }),
    // Volunteer hours pending approval
    db.volunteerLog.count({
      where: { approved: false },
    }).catch(() => 0),
    // Events happening in next 7 days
    db.event.count({
      where: {
        startDate: {
          gte: now,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: "PUBLISHED",
      },
    }),
    // Overdue invoices
    db.invoice.count({
      where: { status: "OVERDUE" },
    }),
  ]);

  if (expiredActive > 0) {
    alerts.push({
      id: "expired-active",
      type: "danger",
      title: `${expiredActive} expired member${expiredActive > 1 ? "s" : ""} still active`,
      message: "These members have passed their expiration date but are still marked as active.",
      href: "/members?status=ACTIVE",
      actionLabel: "Review Members",
      count: expiredActive,
    });
  }

  if (renewalsDue > 0) {
    alerts.push({
      id: "renewals-due",
      type: "warning",
      title: `${renewalsDue} renewal${renewalsDue > 1 ? "s" : ""} due in 30 days`,
      message: "Send renewal reminders to keep your members engaged.",
      href: "/members?status=ACTIVE",
      actionLabel: "View Renewals",
      count: renewalsDue,
    });
  }

  if (overdueInvoices > 0) {
    alerts.push({
      id: "overdue-invoices",
      type: "danger",
      title: `${overdueInvoices} overdue invoice${overdueInvoices > 1 ? "s" : ""}`,
      message: "Follow up on unpaid invoices to maintain cash flow.",
      href: "/billing/invoices",
      actionLabel: "View Invoices",
      count: overdueInvoices,
    });
  }

  if (lapsedRecent > 0) {
    alerts.push({
      id: "lapsed-recent",
      type: "warning",
      title: `${lapsedRecent} member${lapsedRecent > 1 ? "s" : ""} lapsed this week`,
      message: "Consider a re-engagement campaign to win them back.",
      href: "/members?status=LAPSED",
      actionLabel: "View Lapsed",
      count: lapsedRecent,
    });
  }

  if (upcomingEvents > 0) {
    alerts.push({
      id: "upcoming-events",
      type: "info",
      title: `${upcomingEvents} event${upcomingEvents > 1 ? "s" : ""} this week`,
      message: "Make sure registrations are confirmed and logistics are ready.",
      href: "/events",
      actionLabel: "View Events",
      count: upcomingEvents,
    });
  }

  if (pendingVolunteerHours > 0) {
    alerts.push({
      id: "pending-volunteer",
      type: "info",
      title: `${pendingVolunteerHours} volunteer hour${pendingVolunteerHours > 1 ? "s" : ""} pending approval`,
      message: "Approve volunteer hours to keep your volunteers recognized.",
      href: "/volunteers",
      actionLabel: "Review Hours",
      count: pendingVolunteerHours,
    });
  }

  if (draftCampaigns > 2) {
    alerts.push({
      id: "draft-campaigns",
      type: "info",
      title: `${draftCampaigns} draft campaigns`,
      message: "You have unsent email campaigns. Review and send them to engage your members.",
      href: "/email",
      actionLabel: "View Drafts",
      count: draftCampaigns,
    });
  }

  return alerts;
}
