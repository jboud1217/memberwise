import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Configure it in your environment variables."
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead — this will throw at build time if key is missing */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});
