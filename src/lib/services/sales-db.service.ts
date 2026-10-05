import { prisma } from '@/lib/prisma';
import { ProfitBreakdown } from './referral-profit.service';

export class SalesDbService {
  public static async findOrCreatePartner(params: {
    code: string;
    name?: string;
    email?: string;
    whatsapp?: string;
  }) {
    const normalized = params.code.trim().toUpperCase();

    let partner = await prisma.salesPartner.findUnique({
      where: { code: normalized },
    });

    if (!partner && params.email) {
      partner = await prisma.salesPartner.upsert({
        where: { email: params.email.trim().toLowerCase() },
        update: { code: normalized },
        create: {
          code: normalized,
          name: params.name || 'Sales Partner',
          email: params.email.trim().toLowerCase(),
          whatsapp: params.whatsapp || '-',
          tier: 'Standard (10%)',
          rate: 10,
          status: 'active',
        },
      });
    }

    return partner;
  }

  public static async findByCode(code: string) {
    if (!code) return null;
    const normalized = code.trim().toUpperCase();
    return prisma.salesPartner.findUnique({
      where: { code: normalized },
    });
  }

  public static async findByEmail(email: string) {
    if (!email) return null;
    return prisma.salesPartner.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  public static async findById(id: string) {
    if (!id) return null;
    return prisma.salesPartner.findUnique({
      where: { id },
    });
  }

  public static async registerSalesPartner(input: {
    name: string;
    email: string;
    whatsapp: string;
    referredByCode?: string;
    customCode?: string;
  }) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const whatsapp = input.whatsapp.trim();

    if (!name || name.length < 3) {
      return { success: false, message: 'Nama lengkap wajib diisi minimal 3 karakter.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Alamat email aktif tidak valid.' };
    }
    if (!whatsapp || whatsapp.length < 9) {
      return { success: false, message: 'Nomor WhatsApp wajib diisi minimal 9 digit.' };
    }

    const existing = await prisma.salesPartner.findFirst({
      where: {
        OR: [{ email }, { whatsapp }],
      },
    });

    if (existing) {
      return {
        success: false,
        message: `Akun sales dengan email atau WhatsApp tersebut sudah terdaftar (Kode: ${existing.code}).`,
      };
    }

    let referredById: string | undefined = undefined;
    if (input.referredByCode && input.referredByCode.trim()) {
      const sponsor = await this.findByCode(input.referredByCode.trim().toUpperCase());
      if (!sponsor) {
        return {
          success: false,
          message: 'Kode referral pengajak tidak valid atau tidak terdaftar di sistem Asterra Store.',
        };
      }

      if (sponsor.email === email) {
        return {
          success: false,
          message: 'Pelanggaran keamanan: Anda tidak dapat menggunakan kode referral Anda sendiri (Self-referral dilarang).',
        };
      }

      const cleanPhone = (whatsapp || '').replace(/\D/g, '');
      const sponsorPhone = (sponsor.whatsapp || '').replace(/\D/g, '');
      if (cleanPhone.length >= 8 && sponsorPhone.length >= 8 && cleanPhone === sponsorPhone) {
        return {
          success: false,
          message: 'Pelanggaran keamanan: Nomor WhatsApp pengajak sama dengan nomor pendaftar.',
        };
      }

      if (sponsor.status === 'suspended') {
        return {
          success: false,
          message: 'Kode referral tidak dapat digunakan karena akun pengajak sedang ditangguhkan.',
        };
      }

      referredById = sponsor.id;
    }

    let assignedCode = '';
    if (input.customCode && input.customCode.trim()) {
      const sanitized = input.customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const codeCheck = await this.findByCode(sanitized);
      if (!codeCheck && sanitized.length >= 3) {
        assignedCode = sanitized.startsWith('AST-') ? sanitized : `AST-${sanitized}`;
      }
    }

    if (!assignedCode) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanName = name.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      assignedCode = `AST-${cleanName || 'SALES'}-${randomSuffix}`;
    }

    let finalCode = assignedCode;
    let counter = 1;
    while (await this.findByCode(finalCode)) {
      finalCode = `${assignedCode}-${counter}`;
      counter++;
    }

    const newPartner = await prisma.salesPartner.create({
      data: {
        name,
        email,
        whatsapp,
        code: finalCode,
        referredById,
        tier: 'Standard (10%)',
        rate: 10,
        status: 'active',
      },
    });

    return {
      success: true,
      partner: newPartner,
      message: `Pendaftaran berhasil! Selamat datang di tim sales Asterra Store. Kode referral Anda: ${finalCode}`,
    };
  }

  public static async checkReferralDiscountEligibility(params: {
    referralCode?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<{
    eligible: boolean;
    discountAmount: number;
    reason?: string;
    salesPartnerName?: string;
  }> {
    if (!params.referralCode || !params.referralCode.trim()) {
      return { eligible: false, discountAmount: 0, reason: 'Tidak ada kode referral.' };
    }

    const partner = await this.findByCode(params.referralCode);
    if (!partner || partner.status !== 'active') {
      return { eligible: false, discountAmount: 0, reason: 'Kode referral tidak valid atau tidak aktif.' };
    }

    const cleanEmail = params.customerEmail?.trim().toLowerCase();
    if (cleanEmail && partner.email === cleanEmail) {
      return {
        eligible: false,
        discountAmount: 0,
        reason: 'Mitra sales tidak dapat menggunakan kode referral sendiri (Anti Self-Referral).',
      };
    }

    const cleanPhone = params.customerPhone?.replace(/\D/g, '');
    const partnerPhone = partner.whatsapp?.replace(/\D/g, '');
    if (cleanPhone && partnerPhone && cleanPhone.length >= 8 && cleanPhone === partnerPhone) {
      return {
        eligible: false,
        discountAmount: 0,
        reason: 'Nomor kontak terdaftar sebagai pemilik kode referral (Anti Self-Referral).',
      };
    }

    if (cleanEmail) {
      const alreadyUsed = await prisma.referralDiscountUsage.findFirst({
        where: { customerEmail: cleanEmail },
      });
      if (alreadyUsed) {
        return {
          eligible: false,
          discountAmount: 0,
          reason: 'Diskon referral khusus customer baru (1x per pelanggan) sudah pernah digunakan.',
        };
      }
    }

    if (cleanPhone && cleanPhone.length >= 8) {
      const alreadyUsedPhone = await prisma.referralDiscountUsage.findFirst({
        where: {
          customerPhone: cleanPhone,
        },
      });
      if (alreadyUsedPhone) {
        return {
          eligible: false,
          discountAmount: 0,
          reason: 'Nomor WhatsApp sudah pernah mengklaim diskon referral pelanggan baru.',
        };
      }
    }

    return {
      eligible: true,
      discountAmount: 1000,
      salesPartnerName: partner.name,
      reason: 'Diskon referral customer baru (Rp 1.000) valid.',
    };
  }

  public static async recordReferralDiscountUsage(params: {
    orderId: string;
    customerEmail: string;
    customerPhone?: string;
    referralCode: string;
    discountAmount: number;
  }) {
    const existing = await prisma.referralDiscountUsage.findUnique({
      where: { orderId: params.orderId },
    });

    if (existing) return existing;

    return prisma.referralDiscountUsage.create({
      data: {
        orderId: params.orderId,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone || null,
        referralCode: params.referralCode,
        discountAmount: params.discountAmount,
      },
    });
  }

  public static async recordSuccessfulOrder(params: {
    orderId: string;
    partnerId: string;
    recruiterId?: string;
    breakdown: ProfitBreakdown;
    customerEmail?: string;
    customerName?: string;
  }) {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.partnerId },
    });

    if (!partner) {
      return {
        success: false,
        commission: 0,
        message: 'Mitra sales tidak ditemukan.',
      };
    }

    if (partner.status !== 'active') {
      return {
        success: false,
        commission: 0,
        message: `Mitra sales "${partner.name}" berstatus "${partner.status}". Komisi hanya diberikan kepada akun yang berstatus aktif.`,
      };
    }

    const holdingUntilDate = new Date();
    holdingUntilDate.setDate(holdingUntilDate.getDate() + 3);

    await prisma.commission.create({
      data: {
        orderId: params.orderId,
        partnerId: params.partnerId,
        recruiterId: params.recruiterId || null,
        orderTotal: params.breakdown.netRevenue,
        netRevenue: params.breakdown.netRevenue,
        costOfGoods: params.breakdown.costOfGoods,
        transactionProfit: params.breakdown.transactionProfit,
        commissionRate: Math.round(params.breakdown.salesCommissionRate * 100),
        commissionAmount: params.breakdown.salesCommission,
        bonusRate: params.breakdown.recruitmentBonusRate > 0 ? Math.round(params.breakdown.recruitmentBonusRate * 100) : 0,
        bonusAmount: params.breakdown.recruitmentBonus || 0,
        status: 'pending',
        holdingUntil: holdingUntilDate,
      },
    });

    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        salesPartnerId: params.partnerId,
        recruiterPartnerId: params.recruiterId || null,
      },
    });

    const autoUpgradeRate = (partner.totalClicks || 0) + 1 >= 50 ? 15 : partner.rate;
    await prisma.salesPartner.update({
      where: { id: params.partnerId },
      data: {
        totalClicks: (partner.totalClicks || 0) + 1,
        rate: autoUpgradeRate,
        tier: autoUpgradeRate >= 15 ? 'VIP Sales (15%)' : 'Standard (10%)',
      },
    });

    return {
      success: true,
      commission: params.breakdown.salesCommission,
      recruitmentBonus: params.breakdown.recruitmentBonus,
      partnerName: partner.name,
      message: `Komisi Rp ${params.breakdown.salesCommission.toLocaleString('id-ID')} (${params.breakdown.salesCommissionRate * 100}% profit) berhasil dialokasikan ke ${partner.name} (Holding Garansi 3 Hari).`,
    };
  }

  public static async recordProfitLedger(params: {
    orderId: string;
    customerEmail: string;
    customerName?: string;
    productId: string;
    productNames: string;
    salesId?: string;
    salesName?: string;
    referralCode?: string;
    recruiterSalesId?: string;
    recruiterSalesName?: string;
    breakdown: ProfitBreakdown;
  }) {
    const existing = await prisma.profitLedger.findUnique({
      where: { orderId: params.orderId },
    });

    if (existing) return existing;

    const holdingUntilDate = new Date();
    holdingUntilDate.setDate(holdingUntilDate.getDate() + 3);

    return prisma.profitLedger.create({
      data: {
        orderId: params.orderId,
        customerEmail: params.customerEmail,
        customerName: params.customerName || null,
        productId: params.productId,
        productNames: params.productNames,
        salesId: params.salesId || null,
        salesName: params.salesName || null,
        referralCode: params.referralCode || null,
        recruiterSalesId: params.recruiterSalesId || null,
        recruiterSalesName: params.recruiterSalesName || null,
        saleCommissionRate: params.breakdown.salesCommissionRate,
        recruitmentBonusRate: params.breakdown.recruitmentBonusRate,
        sellingPrice: params.breakdown.sellingPrice,
        customerReferralDiscount: params.breakdown.customerDiscount,
        netRevenue: params.breakdown.netRevenue,
        costOfGoods: params.breakdown.costOfGoods,
        paymentFee: params.breakdown.paymentFee,
        otherDirectCost: params.breakdown.otherDirectCost,
        directTransactionCost: params.breakdown.directTransactionCost,
        transactionProfit: params.breakdown.transactionProfit,
        salesCommission: params.breakdown.salesCommission,
        recruitmentBonus: params.breakdown.recruitmentBonus,
        profitDistribution: params.breakdown.profitDistribution,
        ceoShare: params.breakdown.ceoShare,
        cooShare: params.breakdown.cooShare,
        businessReserve: params.breakdown.businessReserve,
        status: 'pending',
        holdingUntil: holdingUntilDate,
      },
    });
  }

  public static async handleOrderRefund(orderId: string, reason?: string) {
    const commission = await prisma.commission.findUnique({
      where: { orderId },
    });

    if (!commission) {
      return {
        success: false,
        message: 'Tidak ada alokasi komisi aktif yang terhubung dengan pesanan ini.',
      };
    }

    await prisma.commission.update({
      where: { orderId },
      data: {
        status: 'reversed',
        reversalReason: reason || 'Pesanan dibatalkan / refund',
      },
    });

    await prisma.profitLedger.updateMany({
      where: { orderId },
      data: {
        status: 'reversed',
        reversalReason: reason || 'Pesanan dibatalkan / refund',
      },
    });

    await prisma.referralDiscountUsage.deleteMany({
      where: { orderId },
    });

    return {
      success: true,
      directCommissionReversed: commission.commissionAmount,
      networkBonusReversed: commission.bonusAmount || 0,
      message: `Pembatalan komisi sukses untuk pesanan ${orderId}.`,
    };
  }

  public static async processMaturedCommissions() {
    const now = new Date();

    const maturedCommissions = await prisma.commission.findMany({
      where: {
        status: 'pending',
        holdingUntil: { lte: now },
      },
    });

    if (maturedCommissions.length > 0) {
      await prisma.commission.updateMany({
        where: {
          status: 'pending',
          holdingUntil: { lte: now },
        },
        data: { status: 'final' },
      });
    }

    const maturedLedgers = await prisma.profitLedger.findMany({
      where: {
        status: 'pending',
        holdingUntil: { lte: now },
      },
    });

    if (maturedLedgers.length > 0) {
      await prisma.profitLedger.updateMany({
        where: {
          status: 'pending',
          holdingUntil: { lte: now },
        },
        data: { status: 'available' },
      });
    }

    return { commissionsMature: maturedCommissions.length, ledgersMature: maturedLedgers.length };
  }

  public static async getFinancialSummary() {
    const ledgers = await prisma.profitLedger.findMany({
      where: { status: { not: 'reversed' } },
    });

    let totalGrossRevenue = 0;
    let totalDiscounts = 0;
    let totalNetRevenue = 0;
    let totalCostOfGoods = 0;
    let totalPaymentFees = 0;
    let totalTransactionProfit = 0;
    let totalSalesCommission = 0;
    let totalRecruitmentBonus = 0;
    let totalProfitDistribution = 0;
    let totalCeoShare = 0;
    let totalCooShare = 0;
    let totalBusinessReserve = 0;
    let pendingCommissionTotal = 0;
    let availableCommissionTotal = 0;

    for (const ledger of ledgers) {
      totalGrossRevenue += ledger.sellingPrice;
      totalDiscounts += ledger.customerReferralDiscount;
      totalNetRevenue += ledger.netRevenue;
      totalCostOfGoods += ledger.costOfGoods;
      totalPaymentFees += ledger.paymentFee;
      totalTransactionProfit += ledger.transactionProfit;
      totalSalesCommission += ledger.salesCommission;
      totalRecruitmentBonus += ledger.recruitmentBonus;
      totalProfitDistribution += ledger.profitDistribution;
      totalCeoShare += ledger.ceoShare;
      totalCooShare += ledger.cooShare;
      totalBusinessReserve += ledger.businessReserve;

      if (ledger.status === 'pending') {
        pendingCommissionTotal += ledger.salesCommission + ledger.recruitmentBonus;
      } else if (ledger.status === 'available' || ledger.status === 'withdrawn') {
        availableCommissionTotal += ledger.salesCommission + ledger.recruitmentBonus;
      }
    }

    return {
      totalOrders: ledgers.length,
      totalGrossRevenue,
      totalDiscounts,
      totalNetRevenue,
      totalCostOfGoods,
      totalPaymentFees,
      totalTransactionProfit,
      totalSalesCommission,
      totalRecruitmentBonus,
      totalProfitDistribution,
      totalCeoShare,
      totalCooShare,
      totalBusinessReserve,
      pendingCommissionTotal,
      availableCommissionTotal,
    };
  }

  public static async getTeamDataForPartner(partnerId: string) {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return null;
    }

    const downlines = await prisma.salesPartner.findMany({
      where: { referredById: partnerId },
      orderBy: { createdAt: 'desc' },
    });

    const commissions = await prisma.commission.findMany({
      where: {
        recruiterId: partnerId,
        status: { not: 'reversed' },
      },
      include: {
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTeamMembers = downlines.length;
    const totalTeamOrders = commissions.length;
    const totalTeamRevenue = commissions.reduce((sum, c) => sum + c.netRevenue, 0);

    const pendingBonus = commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.bonusAmount || 0), 0);

    const finalBonus = commissions
      .filter((c) => c.status === 'final' || c.status === 'paid')
      .reduce((sum, c) => sum + (c.bonusAmount || 0), 0);

    const reversedBonus = await prisma.commission.aggregate({
      where: {
        recruiterId: partnerId,
        status: 'reversed',
      },
      _sum: { bonusAmount: true },
    });

    const totalNetworkBonus = pendingBonus + finalBonus;

    const teamMembers = downlines.map((member) => {
      const memberCommissions = commissions.filter((c) => c.partnerId === member.id);
      const bonusFromMember = memberCommissions.reduce((sum, c) => sum + (c.bonusAmount || 0), 0);
      const revenueFromMember = memberCommissions.reduce((sum, c) => sum + c.netRevenue, 0);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        whatsapp: member.whatsapp,
        code: member.code,
        joinedAt: member.createdAt.toISOString(),
        totalOrders: memberCommissions.length,
        totalRevenue: revenueFromMember,
        status: member.status,
        bonusEarnedFromMember: bonusFromMember,
      };
    });

    const bonusLogs = commissions.map((commission) => ({
      id: commission.id,
      orderId: commission.orderId,
      fromPartnerCode: commission.partner.code,
      fromPartnerName: commission.partner.name,
      orderTotal: commission.orderTotal,
      netRevenue: commission.netRevenue,
      costOfGoods: commission.costOfGoods,
      transactionProfit: commission.transactionProfit,
      bonusAmount: commission.bonusAmount || 0,
      bonusPercentage: commission.bonusRate,
      status: commission.status,
      holdingUntil: commission.holdingUntil.toISOString(),
      releasedAt: commission.releasedAt?.toISOString(),
      reversalReason: commission.reversalReason || undefined,
      createdAt: commission.createdAt.toISOString(),
    }));

    return {
      sponsorCode: partner.code,
      totalTeamMembers,
      totalTeamOrders,
      totalTeamRevenue,
      totalNetworkBonus,
      pendingNetworkBonus: pendingBonus,
      finalNetworkBonus: finalBonus,
      reversedNetworkBonus: reversedBonus._sum.bonusAmount || 0,
      teamMembers,
      bonusLogs,
    };
  }

  public static async submitPayoutRequest(params: {
    partnerId: string;
    amount: number;
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    notes?: string;
  }) {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: params.partnerId },
    });

    if (!partner) {
      return { success: false, message: 'Mitra sales tidak ditemukan.' };
    }

    if (partner.status !== 'active') {
      return {
        success: false,
        message: `Akun mitra sales Anda berstatus "${partner.status}". Penarikan komisi hanya dapat diajukan oleh akun yang berstatus aktif.`,
      };
    }

    const amount = Math.round(Number(params.amount));
    if (isNaN(amount) || amount < 50000) {
      return { success: false, message: 'Nominal pencairan minimal Rp 50.000.' };
    }

    const availableCommissions = await prisma.commission.aggregate({
      where: {
        partnerId: params.partnerId,
        status: 'final',
      },
      _sum: {
        commissionAmount: true,
        bonusAmount: true,
      },
    });

    const availableAmount = ((availableCommissions._sum.commissionAmount || 0) + (availableCommissions._sum.bonusAmount || 0));

    if (amount > availableAmount) {
      return {
        success: false,
        message: `Saldo komisi siap tarik Anda saat ini (Rp ${availableAmount.toLocaleString('id-ID')}) tidak mencukupi untuk penarikan Rp ${amount.toLocaleString('id-ID')}.`,
      };
    }

    const request = await prisma.payoutRequest.create({
      data: {
        partnerId: params.partnerId,
        amount,
        bankName: params.bankName.trim(),
        bankAccount: params.bankAccount.trim(),
        bankAccountName: params.bankAccountName.trim(),
        notes: params.notes?.trim() || null,
        status: 'pending',
      },
    });

    return {
      success: true,
      request,
      message: `Permintaan penarikan komisi Rp ${amount.toLocaleString('id-ID')} berhasil diajukan dan sedang diproses tim keuangan.`,
    };
  }

  public static async processPayout(partnerId: string) {
    const partner = await prisma.salesPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return { success: false, amount: 0, message: 'Mitra sales tidak ditemukan.' };
    }

    const availableCommissions = await prisma.commission.aggregate({
      where: {
        partnerId,
        status: 'final',
      },
      _sum: {
        commissionAmount: true,
        bonusAmount: true,
      },
    });

    const availableAmount = (availableCommissions._sum.commissionAmount || 0) + (availableCommissions._sum.bonusAmount || 0);

    if (availableAmount <= 0) {
      return {
        success: false,
        amount: 0,
        message: 'Tidak ada saldo komisi yang tertunda untuk dicairkan.',
      };
    }

    await prisma.commission.updateMany({
      where: {
        partnerId,
        status: 'final',
      },
      data: { status: 'paid' },
    });

    return {
      success: true,
      amount: availableAmount,
      message: `Pencairan komisi Rp ${availableAmount.toLocaleString('id-ID')} untuk ${partner.name} berhasil dicatat.`,
    };
  }

  public static async getAllPartners() {
    const partners = await prisma.salesPartner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    // Enrich with financial stats for admin UI
    const enriched = await Promise.all(
      partners.map(async (p) => {
        const stats = await SalesDbService.getPartnerStats(p.id);
        return {
          ...p,
          totalRevenue: stats.totalCommission + stats.totalBonus, // combine for display
          unpaidCommission: stats.availableAmount,
          pendingCommission: stats.pendingAmount,
          paidCommission: stats.totalCommission + stats.totalBonus - stats.availableAmount - stats.pendingAmount,
          networkCommission: stats.totalBonus,
        };
      })
    );
    return enriched;
  }

  public static async getPartnerStats(partnerId: string) {
    const [directCommissions, recruitmentBonuses] = await Promise.all([
      prisma.commission.findMany({ where: { partnerId } }),
      prisma.commission.findMany({ where: { recruiterId: partnerId } }),
    ]);

    const totalCommission = directCommissions
      .filter((c) => c.status !== 'reversed')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalBonus = recruitmentBonuses
      .filter((c) => c.status !== 'reversed')
      .reduce((sum, c) => sum + c.bonusAmount, 0);
    const pendingAmount =
      directCommissions
        .filter((c) => c.status === 'pending')
        .reduce((sum, c) => sum + c.commissionAmount, 0) +
      recruitmentBonuses
        .filter((c) => c.status === 'pending')
        .reduce((sum, c) => sum + c.bonusAmount, 0);
    const availableAmount =
      directCommissions
        .filter((c) => c.status === 'final')
        .reduce((sum, c) => sum + c.commissionAmount, 0) +
      recruitmentBonuses
        .filter((c) => c.status === 'final')
        .reduce((sum, c) => sum + c.bonusAmount, 0);

    return {
      totalCommission,
      totalBonus,
      pendingAmount,
      availableAmount,
      totalTransactions: directCommissions.length,
    };
  }
}
