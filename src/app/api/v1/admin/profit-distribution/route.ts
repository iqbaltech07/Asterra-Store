import { NextRequest, NextResponse } from 'next/server';
import { ProfitLedgerService } from '@/lib/services/profit-ledger.service';

/**
 * Superadmin endpoint for Asterra Store Profit Distribution & Audit Ledger.
 * Returns financial summary and full Section 8 audit ledger entries.
 * Strictly adheres to SSOT: asterra-referral-profit-model.md
 */
export async function GET(req: NextRequest) {
  try {
    // Process any matured holding orders (3 days) automatically
    ProfitLedgerService.processMaturedHoldings();

    const summary = ProfitLedgerService.getFinancialSummary();
    const entries = ProfitLedgerService.getAllEntries();

    return NextResponse.json({
      success: true,
      data: {
        summary,
        entries,
      },
    });
  } catch (error) {
    console.error('Error fetching profit distribution ledger:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat buku besar distribusi laba.' },
      { status: 500 }
    );
  }
}
