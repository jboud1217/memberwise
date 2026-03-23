import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }
      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Checkout completed (membership renewal / one-time payment) ─────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { memberId, tierId, orgId, type } = (session.metadata || {}) as Record<string, string>;

  if (type !== "membership_renewal" || !memberId || !orgId) return;

  // Record the payment
  await prisma.payment.create({
    data: {
      organizationId: orgId,
      memberId,
      amount: session.amount_total || 0,
      status: "COMPLETED",
      method: "STRIPE",
      stripePaymentId: session.payment_intent as string || session.id,
      description: `Online payment — ${session.line_items ? "membership" : "membership renewal"}`,
      paidAt: new Date(),
    },
  });

  // Update member status and renewal dates
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const updateData: Record<string, unknown> = {
    status: "ACTIVE",
    renewalDate: nextYear,
    expirationDate: nextYear,
  };

  if (tierId) {
    updateData.tierId = tierId;
  }

  await prisma.member.update({
    where: { id: memberId },
    data: updateData,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId: orgId,
      type: "payment_recorded",
      description: `Online payment of $${((session.amount_total || 0) / 100).toFixed(2)} received via Stripe`,
      memberId,
      metadata: {
        stripeSessionId: session.id,
        amount: session.amount_total,
      },
    },
  });
}

// ─── Recurring invoice paid ──────────────────────────────────────────

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  // Find the member by Stripe customer ID
  const member = await prisma.member.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!member) return;

  await prisma.payment.create({
    data: {
      organizationId: member.organizationId,
      memberId: member.id,
      amount: invoice.amount_paid,
      status: "COMPLETED",
      method: "STRIPE",
      stripePaymentId: (invoice as unknown as { payment_intent?: string }).payment_intent || invoice.id,
      description: `Recurring payment — invoice ${invoice.number || invoice.id}`,
      paidAt: new Date(),
    },
  });

  // Extend renewal
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  await prisma.member.update({
    where: { id: member.id },
    data: {
      status: "ACTIVE",
      renewalDate: nextYear,
      expirationDate: nextYear,
    },
  });
}

// ─── Subscription cancelled ─────────────────────────────────────────

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  if (!customerId) return;

  const member = await prisma.member.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!member) return;

  await prisma.member.update({
    where: { id: member.id },
    data: { status: "LAPSED" },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: member.organizationId,
      type: "member_updated",
      description: `${member.displayName} subscription cancelled — status changed to LAPSED`,
      memberId: member.id,
    },
  });
}
