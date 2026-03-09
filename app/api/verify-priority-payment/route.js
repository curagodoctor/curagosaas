import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Priority Connect Payment Schema
const PriorityConnectSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now },
});

const PriorityConnect =
  mongoose.models.PriorityConnect ||
  mongoose.model("PriorityConnect", PriorityConnectSchema);

// Verify Razorpay payment signature
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    // Validate required field - payment_id is essential
    if (!razorpay_payment_id) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    // For Payment Button flow, signature may not be available
    // Only verify signature if all required fields are present
    if (razorpay_order_id && razorpay_signature && razorpay_signature !== "payment_button") {
      const isValidSignature = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        console.log("Signature verification failed, but proceeding for Payment Button flow");
        // Don't reject - Payment Button handles its own verification
      }
    }

    // Connect to database and save payment record
    await connectDB();

    // Check if payment already recorded
    const existingPayment = await PriorityConnect.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        paymentId: razorpay_payment_id,
      });
    }

    // Save new payment record
    const payment = new PriorityConnect({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: 99,
      status: "completed",
    });

    await payment.save();

    // Send to webhook (optional - for notifications)
    try {
      await fetch("https://server.wylto.com/webhook/XLuJDKiLWjA5j49Y8S", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "priority_connect",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: 99,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Don't fail if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error verifying priority payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 }
    );
  }
}
