import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function resetSalesData() {
  console.log('--- START RESETTING SALES DATA ---');

  // 1. Delete Commissions from database
  try {
    const deletedCommissions = await prisma.commission.deleteMany();
    console.log(`[DB] Deleted ${deletedCommissions.count} commission records.`);
  } catch (err) {
    console.warn('[DB] Commission delete skipped/failed:', err);
  }

  // 2. Delete PayoutRequests from database
  try {
    const deletedPayouts = await prisma.payoutRequest.deleteMany();
    console.log(`[DB] Deleted ${deletedPayouts.count} payout requests.`);
  } catch (err) {
    console.warn('[DB] PayoutRequest delete skipped/failed:', err);
  }

  // 3. Delete ReferralDiscountUsages from database
  try {
    const deletedRefUsages = await prisma.referralDiscountUsage.deleteMany();
    console.log(`[DB] Deleted ${deletedRefUsages.count} referral discount usages.`);
  } catch (err) {
    console.warn('[DB] ReferralDiscountUsage delete skipped/failed:', err);
  }

  // 4. Disconnect sales partner & referral fields from Orders
  try {
    const updatedOrders = await prisma.order.updateMany({
      where: {
        OR: [
          { salesPartnerId: { not: null } },
          { recruiterPartnerId: { not: null } },
          { referralCode: { not: null } },
        ],
      },
      data: {
        salesPartnerId: null,
        recruiterPartnerId: null,
        referralCode: null,
      },
    });
    console.log(`[DB] Cleared sales attribution on ${updatedOrders.count} orders.`);
  } catch (err) {
    console.warn('[DB] Order sales attribution update skipped/failed:', err);
  }

  // 5. Delete ProfitLedgers associated with sales or all test profit ledgers
  try {
    const deletedLedgers = await prisma.profitLedger.deleteMany();
    console.log(`[DB] Deleted ${deletedLedgers.count} profit ledger records.`);
  } catch (err) {
    console.warn('[DB] ProfitLedger delete skipped/failed:', err);
  }

  // 6. Delete SalesPartners
  try {
    const deletedPartners = await prisma.salesPartner.deleteMany();
    console.log(`[DB] Deleted ${deletedPartners.count} sales partner records.`);
  } catch (err) {
    console.warn('[DB] SalesPartner delete skipped/failed:', err);
  }

  // 7. Delete AdminUser with role 'sales' ONLY (Keep admin & superadmin)
  try {
    const salesAdmins = await prisma.adminUser.findMany({
      where: { role: 'sales' },
      select: { id: true, email: true, username: true, role: true },
    });
    console.log(`[DB] Found ${salesAdmins.length} sales user accounts to delete:`, salesAdmins);

    const deletedAdmins = await prisma.adminUser.deleteMany({
      where: { role: 'sales' },
    });
    console.log(`[DB] Successfully deleted ${deletedAdmins.count} sales accounts from admin_users.`);
  } catch (err) {
    console.error('[DB] Failed to delete sales accounts from admin_users:', err);
  }

  console.log('--- ALL SALES ACCOUNTS AND RELATED DATABASE TABLES HAVE BEEN CLEANED SUCCESSFULLY! ---');
}

resetSalesData()
  .catch((e) => {
    console.error('Fatal error during reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
