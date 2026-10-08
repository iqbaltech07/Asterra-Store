import { NextRequest, NextResponse } from 'next/server';
import { SalesDbService } from '@/lib/services/sales-db.service';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await SalesDbService.processMaturedCommissions();

    const summary = await SalesDbService.getFinancialSummary();
    const entries = await prisma.profitLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

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
