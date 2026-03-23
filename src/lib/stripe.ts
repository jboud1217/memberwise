import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn(
    "STRIPE_SECRET_KEY is not set. Stripe features will not work until configured."
  );
}

export const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2025-04-30.basil",
});
