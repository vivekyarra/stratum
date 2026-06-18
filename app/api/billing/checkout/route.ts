import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_REALTOR_PRICE_ID) {
    return NextResponse.redirect(`${origin}/dashboard?checkout=demo`, { status: 303 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20"
  });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_REALTOR_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`
  });

  return NextResponse.redirect(session.url ?? `${origin}/dashboard`, { status: 303 });
}
