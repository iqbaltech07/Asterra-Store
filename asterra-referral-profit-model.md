# Asterra Store — Referral & Profit Sharing Model

> **Status:** Draft model operasional
> 
> **Tujuan:** Menjelaskan pembagian profit Asterra antara CEO, COO, modal usaha, dan Sales Referral secara konsisten dan mudah diimplementasikan.

---

## 1. Struktur Utama

Asterra memiliki 3 pihak internal utama:

- **CEO** — menerima 40% dari profit yang tersisa setelah komisi Sales.
- **COO** — menerima 40% dari profit yang tersisa setelah komisi Sales.
- **Modal Usaha** — menerima 20% dari profit yang tersisa setelah komisi Sales untuk operasional, saldo supplier/provider, marketing, refund buffer, dan kebutuhan bisnis lainnya.
- **Sales** — mendapatkan komisi dari transaksi valid yang menggunakan referral miliknya.

CEO dan COO selalu **sama rata**.

---

## 2. Prinsip Paling Penting

### Jangan hitung komisi Sales dari omzet.

Komisi Sales dihitung dari **profit transaksi**, bukan dari harga jual.

Urutan perhitungan wajib:

```text
Harga Jual
    ↓
Kurangi Diskon Customer Referral (jika ada)
    ↓
Net Revenue
    ↓
Kurangi biaya langsung transaksi
(provider/supplier, payment fee, biaya delivery, dll.)
    ↓
Profit Transaksi
    ↓
Kurangi komisi Sales
    ↓
Kurangi recruitment bonus (jika ada)
    ↓
Profit Distribusi
    ↓
40% CEO + 40% COO + 20% Modal Usaha
```

---

## 3. Definisi Angka

### 3.1 Harga Jual

Harga produk sebelum diskon.

Contoh:

```text
Harga jual = Rp25.000
```

### 3.2 Diskon Referral Customer

Customer baru yang menggunakan kode referral Sales mendapatkan diskon **1 kali**.

Contoh:

```text
Harga jual      = Rp25.000
Diskon referral = Rp1.000
-------------------------
Customer bayar  = Rp24.000
```

Diskon harus dipotong **sebelum** menghitung profit transaksi.

### 3.3 Biaya Langsung Transaksi

Semua biaya yang benar-benar terkait dengan pemenuhan transaksi, misalnya:

- harga supplier/provider;
- fee payment gateway;
- biaya fulfillment/delivery;
- biaya lain yang secara langsung melekat pada transaksi.

Jangan memasukkan pembagian CEO/COO/modal ke dalam biaya langsung.

### 3.4 Profit Transaksi

```text
Profit Transaksi = Net Revenue - Total Biaya Langsung
```

### 3.5 Profit Distribusi

```text
Profit Distribusi = Profit Transaksi
                    - Komisi Direct Sales
                    - Recruitment Bonus
```

Profit Distribusi inilah yang dibagi:

```text
CEO        = 40%
COO        = 40%
Modal Usaha = 20%
```

---

# 4. Direct Sales Referral

Sales mendapatkan **10% dari Profit Transaksi** untuk setiap transaksi valid yang menggunakan referral miliknya.

### Rumus

```text
Komisi Direct Sales = 10% × Profit Transaksi
```

### Contoh

```text
Harga jual                    = Rp25.000
Diskon customer referral     = Rp1.000
Net revenue                  = Rp24.000
Biaya langsung               = Rp15.000
---------------------------------------
Profit Transaksi              = Rp9.000

Komisi Sales = 10% × Rp9.000
             = Rp900
```

Sisa setelah direct sales commission:

```text
Rp9.000 - Rp900 = Rp8.100
```

Jika tidak ada recruitment bonus:

| Pihak | Persentase | Nominal |
|---|---:|---:|
| CEO | 40% | Rp3.240 |
| COO | 40% | Rp3.240 |
| Modal Usaha | 20% | Rp1.620 |
| Sales | 10% dari Profit Transaksi | Rp900 |

Total = Rp9.000

---

# 5. Customer yang Menggunakan Referral

Customer referral mendapatkan:

- **Diskon 1 kali**;
- hanya untuk kondisi yang memenuhi syarat sebagai customer baru/referral baru;
- setelah diskon pertama digunakan, customer kembali ke harga normal kecuali ada promo lain.

### Contoh

```text
Harga normal = Rp25.000
Referral discount = Rp1.000
Customer membayar = Rp24.000
```

Customer tidak menerima komisi uang dari referral.

Benefit customer adalah **diskon pembelian**.

---

# 6. Sales Merekrut Sales Baru

Sales boleh mengajak orang lain menjadi Sales.

Sistem recruitment menggunakan **1 level saja**.

Contoh:

```text
Sales A
   ↓ merekrut
Sales B
   ↓ mendapatkan customer
Customer B
```

Jika customer menggunakan referral Sales B:

- **Sales B** = direct sales commission 10% dari Profit Transaksi.
- **Sales A** = recruitment bonus 2% dari Profit Transaksi Sales B.

### Rumus

```text
Direct Sales Commission = 10% × Profit Transaksi
Recruitment Bonus        = 2% × Profit Transaksi
```

### Contoh

Profit Transaksi = Rp9.000

```text
Sales B = 10% × Rp9.000 = Rp900
Sales A = 2%  × Rp9.000 = Rp180
```

Profit Distribusi:

```text
Rp9.000 - Rp900 - Rp180 = Rp7.920
```

Kemudian dibagi:

| Pihak | Persentase | Nominal |
|---|---:|---:|
| CEO | 40% | Rp3.168 |
| COO | 40% | Rp3.168 |
| Modal Usaha | 20% | Rp1.584 |
| Sales B | 10% dari Profit Transaksi | Rp900 |
| Sales A | 2% dari Profit Transaksi | Rp180 |

Total = Rp9.000

---

# 7. Recruitment Hanya 1 Level

**Tidak ada komisi bertingkat tanpa batas.**

Contoh:

```text
Sales A
  ↓
Sales B
  ↓
Sales C
  ↓
Customer C
```

Jika customer C membeli melalui referral Sales C:

- Sales C mendapat 10% direct sales commission.
- Sales B mendapat 2% recruitment bonus.
- Sales A mendapat **Rp0** dari transaksi tersebut.

Artinya bonus hanya diberikan kepada **direct recruiter** dari Sales yang menghasilkan transaksi.

### Yang TIDAK diperbolehkan

```text
A mendapat bagian dari B
A mendapat bagian dari C
A mendapat bagian dari D
... terus-menerus
```

Sistem Asterra hanya menggunakan **1 level recruitment bonus**.

---

# 8. Sumber Referral pada Setiap Order

Setiap order harus menyimpan minimal:

```text
order_id
customer_id
product_id
sales_id                  // Sales yang referral-nya menghasilkan order
referral_code             // Kode referral yang digunakan
recruiter_sales_id        // Direct recruiter dari sales_id, jika ada
sale_commission_rate      // 10%
recruitment_bonus_rate    // 2%
customer_referral_discount
net_revenue
cost_of_goods
payment_fee
other_direct_cost
transaction_profit
sales_commission
recruitment_bonus
profit_distribution
status
```

**Penting:** Recruitment bonus ditentukan dari hubungan recruiter langsung (`recruiter_sales_id`), bukan dari pencarian seluruh upline.

---

# 9. Status Transaksi dan Komisi

Komisi tidak langsung menjadi saldo yang bisa dicairkan.

Gunakan status:

```text
PENDING
   ↓
VALIDATED
   ↓
AVAILABLE
   ↓
WITHDRAWN
```

### PENDING

Order sudah dibayar tetapi masih menunggu validasi.

### VALIDATED

Order sudah dipastikan valid dan tidak masuk kondisi refund/cancel/chargeback.

### AVAILABLE

Komisi sudah dapat digunakan untuk withdrawal sesuai aturan payout.

### WITHDRAWN

Komisi sudah dibayarkan kepada Sales.

---

# 10. Transaksi yang Tidak Menghasilkan Komisi

Tidak ada komisi jika order berstatus atau terbukti sebagai:

- payment failed;
- cancelled;
- refunded;
- chargeback;
- fraud/abuse;
- order invalid;
- transaksi internal/test;
- transaksi yang melanggar aturan referral.

Jika transaksi dibatalkan setelah komisi masuk `AVAILABLE`, sistem harus memiliki mekanisme **reversal/clawback** terhadap komisi tersebut sesuai kebijakan payout Asterra.

---

# 11. Aturan Customer Referral

Default yang disarankan:

```text
1 customer = 1x referral discount
```

Customer tidak boleh berulang kali dianggap sebagai customer baru dengan cara:

- membuat akun baru untuk diri sendiri;
- menggunakan referral sendiri;
- membuat transaksi palsu;
- manipulasi referral.

Asterra dapat mengikat status customer baru berdasarkan `customer_id`, nomor/email terverifikasi, atau mekanisme anti-abuse lain yang dipilih pada implementasi.

---

# 12. Prioritas Referral

Jika customer menggunakan referral code dari Sales, sistem mencatat Sales tersebut sebagai pemilik referral untuk order tersebut.

Contoh:

```text
Customer membuka link Sales B
        ↓
Referral code B tersimpan
        ↓
Customer checkout
        ↓
Order menyimpan sales_id = B
```

Referral harus memiliki aturan attribution yang konsisten.

**Jangan menghitung referral berdasarkan siapa yang terakhir mengaku membawa customer secara manual.** Gunakan data referral yang tersimpan di sistem.

---

# 13. Model Ekonomi

Asterra tidak mengejar profit maksimum per transaksi.

Asterra mengejar:

```text
Total Profit Periode
= Total Profit dari seluruh transaksi setelah komisi
```

Sales boleh mengurangi profit per transaksi melalui komisi, selama Sales menghasilkan tambahan volume yang membuat **total profit perusahaan meningkat**.

### Contoh tanpa Sales

```text
100 transaksi
Profit/transaksi = Rp9.000

Total profit = Rp900.000
```

Pembagian:

```text
CEO         = Rp360.000
COO         = Rp360.000
Modal Usaha = Rp180.000
```

### Contoh dengan Sales

Misalkan setelah komisi Sales, profit yang tersisa untuk perusahaan adalah Rp8.100 per transaksi.

```text
300 transaksi
Profit setelah direct sales commission = Rp8.100/transaksi

Total = Rp2.430.000
```

Pembagian:

```text
CEO         = Rp972.000
COO         = Rp972.000
Modal Usaha = Rp486.000
Sales       = Rp270.000 total commission
```

**Kesimpulan ekonomi:**

Sales hanya layak dipertahankan jika tambahan volume yang mereka hasilkan lebih besar daripada profit yang diberikan sebagai komisi.

---

# 14. Guardrail Margin Produk

Produk dengan margin sangat kecil tidak boleh otomatis menggunakan komisi yang sama tanpa pengecekan.

Sistem produk sebaiknya menyimpan:

```text
sales_commission_rate
recruitment_bonus_rate
max_discount
```

Default:

```text
sales_commission_rate   = 10% dari Profit Transaksi
recruitment_bonus_rate  = 2% dari Profit Transaksi
customer_referral_discount = promo 1x
```

Namun Asterra dapat menetapkan rate berbeda per produk jika margin produk berbeda jauh.

---

# 15. Contoh Kasus Lengkap

## Kasus A — Tidak ada referral

```text
Harga jual = Rp25.000
Biaya langsung = Rp15.000
Profit Transaksi = Rp10.000
```

Tidak ada komisi Sales.

```text
CEO         = Rp4.000
COO         = Rp4.000
Modal Usaha = Rp2.000
```

---

## Kasus B — Customer menggunakan referral Sales B

```text
Harga jual              = Rp25.000
Diskon referral         = Rp1.000
Net revenue             = Rp24.000
Biaya langsung          = Rp15.000
Profit Transaksi        = Rp9.000
```

```text
Sales B = 10% × Rp9.000 = Rp900
```

Sisa:

```text
Rp9.000 - Rp900 = Rp8.100
```

```text
CEO         = Rp3.240
COO         = Rp3.240
Modal Usaha = Rp1.620
```

---

## Kasus C — Sales B direkrut Sales A

Customer menggunakan referral Sales B.

```text
Profit Transaksi = Rp9.000
```

```text
Sales B = 10% × Rp9.000 = Rp900
Sales A = 2% × Rp9.000  = Rp180
```

Sisa:

```text
Rp9.000 - Rp900 - Rp180 = Rp7.920
```

```text
CEO         = Rp3.168
COO         = Rp3.168
Modal Usaha = Rp1.584
```

---

# 16. Aturan Anti-Salah Konsep

1. **CEO dan COO tidak mengambil 40% dari omzet.** Mereka mengambil 40% dari `Profit Distribusi`.
2. **Sales tidak mengambil 10% dari omzet.** Sales mengambil 10% dari `Profit Transaksi`.
3. **Recruitment bonus bukan 2% dari omzet.** Recruitment bonus = 2% dari `Profit Transaksi`.
4. **Diskon customer mengurangi Net Revenue sebelum profit dihitung.**
5. **Recruitment hanya 1 level.** Tidak ada residual commission untuk upline di level yang lebih tinggi.
6. **Komisi hanya berasal dari transaksi valid.**
7. **Refund/cancel/chargeback harus membatalkan atau membalik komisi terkait.**
8. **CEO dan COO selalu sama rata dalam profit distribution.**
9. **Modal usaha mendapat 20% dari Profit Distribusi dan bukan sekadar “uang sisa”.**
10. **Sales tidak memiliki hak atas profit perusahaan di luar komisi yang didefinisikan sistem.**

---

# 17. Rumus Implementasi

Gunakan rumus berikut sebagai sumber kebenaran implementasi:

```text
net_revenue
  = selling_price - customer_discount

transaction_profit
  = net_revenue - direct_transaction_cost

sales_commission
  = transaction_profit * 0.10
  jika ada valid direct referral
  selain itu 0

recruitment_bonus
  = transaction_profit * 0.02
  jika sales tersebut memiliki direct recruiter yang valid
  selain itu 0

profit_distribution
  = transaction_profit - sales_commission - recruitment_bonus

ceo_share
  = profit_distribution * 0.40

coo_share
  = profit_distribution * 0.40

business_reserve
  = profit_distribution * 0.20
```

### Constraint

```text
CEO + COO + Modal Usaha = 100% dari Profit Distribusi
```

Sedangkan komisi Sales dan Recruitment Bonus merupakan **pengurang Profit Distribusi**, bukan bagian dari persentase 40/40/20.

---

# 18. Struktur Data Referral

Contoh sederhana:

```text
Sales A
  sales_id: A
  referral_code: AST-A
  recruiter_sales_id: null

Sales B
  sales_id: B
  referral_code: AST-B
  recruiter_sales_id: A

Sales C
  sales_id: C
  referral_code: AST-C
  recruiter_sales_id: B
```

Order dari customer menggunakan `AST-C`:

```text
order.sales_id = C
order.recruiter_sales_id = B
```

Maka:

```text
C = 10% direct commission
B = 2% recruitment bonus
A = 0%
```

---

# 19. Prinsip Akhir

Asterra menggunakan model:

```text
CUSTOMER
   ↓
Referral Sales
   ↓
Diskon 1x untuk customer baru
   ↓
Transaksi valid
   ↓
Hitung Profit Transaksi
   ↓
10% Direct Sales Commission
   ↓
2% Recruitment Bonus (maks. 1 level)
   ↓
Profit Distribusi
   ↓
┌─────────┬─────────┬──────────────┐
│   CEO   │   COO   │ Modal Usaha  │
│   40%   │   40%   │     20%      │
└─────────┴─────────┴──────────────┘
```

**Tujuan model:** Sales mendapatkan insentif nyata untuk menghasilkan customer, customer mendapatkan benefit melalui diskon referral, sementara CEO dan COO tetap memiliki porsi profit yang sama dan bisnis tetap menyisihkan modal untuk pertumbuhan.
