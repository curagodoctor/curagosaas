import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import { getDoctorAiUsage } from '@/lib/practice-os/aiUsage';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';

export const runtime = 'nodejs';

// Per-doctor AI usage for the admin doctor page: requests, tokens, images and
// estimated cost, broken down by model.
export async function GET(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const usage = await getDoctorAiUsage(id);
  // Lifetime token totals recorded before per-model tracking existed (historical
  // context), plus the current credit balance.
  const ledger = await AiCreditLedger.findOne({ doctorId: id })
    .select('lifetimeTokens lifetimePromptTokens lifetimeCompletionTokens dailyBalance dailyLimit unlimited').lean();
  return NextResponse.json({ success: true, usage, ledger: ledger || null });
}
