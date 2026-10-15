# Graph Report - Asterra Store  (2026-10-15)

## Corpus Check
- Large corpus: 453 files · ~3,299,266 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2011 nodes · 4148 edges · 120 communities (86 shown, 34 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 103
- Community 105
- Community 116
- Community 117
- Community 118
- Community 119

## God Nodes (most connected - your core abstractions)
1. `react` - 101 edges
2. `@fortawesome/free-solid-svg-icons` - 57 edges
3. `@fortawesome/react-fontawesome` - 57 edges
4. `next` - 54 edges
5. `Button` - 44 edges
6. `Input` - 36 edges
7. `cn()` - 35 edges
8. `cn()` - 35 edges
9. `cn()` - 35 edges
10. `Badge()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `PromoService` --uses--> `PromoCode`  [INFERRED]
  backend/app/services/promo_service.py → backend/app/models/promo.py
- `AnalyticsService` --uses--> `OrderService`  [INFERRED]
  backend/app/services/analytics_service.py → backend/app/services/order_service.py
- `AnalyticsService` --uses--> `PartnerService`  [INFERRED]
  backend/app/services/analytics_service.py → backend/app/services/partner_service.py
- `get_admin_affiliates()` --uses--> `PartnerService`  [INFERRED]
  backend/app/main.py → backend/app/services/partner_service.py
- `get_sales_network()` --uses--> `PartnerService`  [INFERRED]
  backend/app/main.py → backend/app/services/partner_service.py

## Import Cycles
- None detected.

## Communities (120 total, 34 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (50): AppBrandBadge(), ApplicationGroupItem, FeaturedGridCard(), FeaturedGridCardSkeleton(), HomePage(), ShowcaseLoopingCard(), ShowcaseLoopingCardSkeleton(), fetchActiveProducts() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (42): NotFound(), AdminAnalyticsSuite(), AdminAnalyticsSuiteProps, AffiliatePerformanceItem, AnalyticsSuiteData, FinancialReportData, ProductPerformanceItem, SalesTimeSeriesItem (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (54): 10 Operasional Pemeliharaan  Skrip Bantu, 11 Protokol Keamanan  Hardening Produksi, 1 Backend backendenvexamplefilecIqbalDevelopmentProject20LibraryNextJSAsterra20Storebackendenvexample, 1 Gerbang Pembayaran Tripay appservicestripay_service, 1 Kloning repository, 1 Ringkasan Eksekutif  Identitas Proyek, 2 Frontend Applications frontend-envexample, 2 Setup Virtual Environment Python untuk Backend (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (43): PageTransition(), PageTransitionProps, animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage() (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (26): nextConfig, @fortawesome/free-solid-svg-icons, nextConfig, nextConfig, ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (42): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (43): author, description, autoprefixer, bcryptjs, clsx, eslint, eslint-config-next, @fortawesome/free-regular-svg-icons (+35 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (41): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (31): admin_auth_me(), api_root_redirect(), api_v1_docs_redirect(), api_v1_openapi_redirect(), create_admin_session_token(), delete_admin_product(), delete_admin_promo(), delete_admin_user() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (30): CreateOrderPayload, OrdersApi, OrdersApiResponse, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi, PromoValidationResponse (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (41): author, description, autoprefixer, bcryptjs, better-auth, clsx, eslint, eslint-config-next (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (26): DurationOption, FaqItem, getVariantDetails(), ProductDetailClient(), ProductDetailClientProps, RelatedProduct, SpecItem, VariantDetails (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (39): 10 Transaksi yang Tidak Menghasilkan Komisi, 11 Aturan Customer Referral, 12 Prioritas Referral, 13 Model Ekonomi, 14 Guardrail Margin Produk, 15 Contoh Kasus Lengkap, 16 Aturan Anti-Salah Konsep, 17 Rumus Implementasi (+31 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (6): create_admin_campaign(), delete_admin_campaign(), toggle_admin_campaign(), update_admin_campaign(), CampaignService, ReferralProfitService

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (28): CheckoutPage(), CheckoutPageContent(), GATEWAY_PAYMENT_METHODS, getStatusBadge(), getTimelineStep(), isOrderExpired(), OrderCountdownBadge(), PrivateOrderContent() (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (4): Product, AnalyticsService, CatalogService, FinanceService

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (22): better-auth, ADMIN_COOKIE_NAME, applySecurityHeaders(), config, getAdminSecret(), proxy(), verifyAdminToken(), authClient (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (19): @fortawesome/fontawesome-svg-core, metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider(), metadata, plusJakartaSans (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (19): zustand, CustomerLogoutOptions, AuthState, useAuthStore, UserProfile, CartItem, CartState, useCartStore (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (22): AdminLoginPage(), AsterraLogo(), AsterraLogoProps, Card, CardContent, CardDescription, CardFooter, CardHeader (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (14): cancel_order(), create_order(), get_admin_order_by_id(), get_admin_orders(), get_order_by_id(), get_orders(), get_user_profile(), pay_order() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (21): @fortawesome/free-brands-svg-icons, LoginFormContent(), LoginPage(), formatDate(), formatIDR(), Order, OrderItem, ProfileApiResponse (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (19): @fortawesome/react-fontawesome, AffiliatePage(), metadata, NotFound(), CartItemSummary, CheckoutCartSummary(), CheckoutCartSummaryProps, CheckoutCustomerForm() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (20): admin_auth_logout(), auth_login(), auth_register(), bulk_delete_products(), bulk_status_products(), create_admin_product(), create_admin_promo(), create_admin_user() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (8): catch_all(), get_media_file(), catch_all(), deploy_banner(), deploy_logo(), run_migration(), step1_convert_images(), step2_update_db()

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (6): delete_promo_banner(), get_promo_banner_detail(), get_promo_banners(), toggle_promo_banner_status(), upload_promo_banner(), BannerService

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (19): SalesRootPage(), SalesPortalPage(), TAB_TITLES, AdminSidebar(), AdminSidebarProps, AdminTab, NavGroup, NavSubItem (+11 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (18): @prisma/client, formatRupiah(), fs, path, prisma, { PrismaClient }, updateDatabasePrices(), fs (+10 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (20): Badge(), BadgeProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (20): @radix-ui/react-dropdown-menu, @radix-ui/react-select, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+12 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): CDPClient, delay(), getWebSocketDebuggerUrl(), runTest(), evaluate(), setViewport(), CDPClient, delay() (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.09
Nodes (23): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+15 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (15): addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, Order, OrderItem, OrderLog (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+14 more)

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.31
Nodes (7): admin_auth_login(), create_admin_affiliate(), get_sales_me(), get_sales_orders(), register_sales_affiliate(), request_sales_payout(), PartnerService

### Community 37 - "Community 37"
Cohesion: 0.10
Nodes (19): 1 Executive Summary  Problem Statement, 2 Target Visi 4 Repositori Terpisah, 3 Struktur Folder 4 Proyek Mandiri, 4 Spesifikasi Teknis FastAPI Core Backend, 5 Pembersihan Core Asterra Store Customer App, 6 Arsitektur Keamanan  Autentikasi, 7 Roadmap Eksekusi Bertahap Phased Milestones, Asterra Store  Architecture Decoupling  Multi-Project Separation Plan (+11 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (14): AdminPage(), AdminMarketingSuite(), AdminMarketingSuiteProps, BannerItem, CampaignItem, INITIAL_BANNERS, AdminPaymentSettingsTab(), AdminSidebar() (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 40 - "Community 40"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 42 - "Community 42"
Cohesion: 0.15
Nodes (15): lucide-react, AdminDashboardTabProps, AdminSidebarProps, AdminTab, NavGroup, NavSubItem, NetworkBonusLogItem, NetworkDataResponse (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (13): LogsApiResponse, addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, OrderItem, OrderLog (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (17): description, name, private, scripts, build, build:admin, build:all, build:sales (+9 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (13): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc, compat, __dirname, eslintConfig (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.16
Nodes (11): AdminAffiliateTab(), AdminAffiliateTabProps, AffiliatePartner, INITIAL_AFFILIATES, AdminPaymentSettingsTabProps, authClient, env, getAppBaseUrl() (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (11): ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, NotFound(), Button, ButtonProps, CHUNK_ERROR_PATTERNS (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (4): Settings, Config, upload_admin_media(), TripayService

### Community 50 - "Community 50"
Cohesion: 0.26
Nodes (11): TAB_TITLES, VipServicesResponse, AdminUserItem, AdminUsersTab(), AdminUsersTabProps, SelectContent, SelectItem, SelectScrollDownButton (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (14): Atau Build Individual, Build Semua 4 Sub-Proyek, Development, Jalankan Admin Console Port 3001, Jalankan FastAPI Python Engine Port 8000, Jalankan Nextjs BFF API Port 4000, Jalankan Sales Console Port 3002, Jalankan Storefront Pembeli Port 3000 (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+7 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (8): AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger(), useAlertDialog()

### Community 57 - "Community 57"
Cohesion: 0.21
Nodes (3): expire_affiliate_sessions(), track_affiliate_click(), ReferralService

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (10): SalesLoginContent(), SalesLoginPage(), AsterraLogo(), AsterraLogoProps, Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (12): exceljs, ExcelJS, fs, generateExcel(), getAccountType(), getAvailabilityStatus(), getBrandAndApp(), getCleanProductName() (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (8): OrderActorBadge(), OrderStatusBadge(), OrderDetailModalProps, OrderTableRowProps, Order, formatDateTimeIndo(), formatWhatsAppUrl(), generateOrderValidationText()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (10): @tanstack/react-query, formatRelativeTime(), getStatusBadge(), GlobalOrdersContent(), GlobalOrdersPage(), GlobalOrdersPageSkeleton(), GlobalOrdersSkeleton(), parseSafeDate() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.24
Nodes (9): AdminProductsResponse, CatalogProductsResponse, fetchCatalogProducts(), useCatalogProducts(), ProductItem, PRODUCTS_CATALOG, ManagedProduct, ManagedProductItem (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (8): ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 66 - "Community 66"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 67 - "Community 67"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 68 - "Community 68"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 69 - "Community 69"
Cohesion: 0.18
Nodes (10): Anti-Hallucination Directives  Design Hierarchy, Core Workflow Lifecycle, Direct Native Commands Ultra-Fast 10ms Execution, Moryn Agent Skill, Single Source of Truth SSOT Priority Rules, Step 1 Read Blueprint in Order Personalization  Structure  PRD  Design  Active Task, Step 2 Start the Task, Step 3 Implement Changes with Mandatory Autonomous Component Discovery (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (10): AdminFinanceSuite(), AdminFinanceSuiteProps, ExpenseItem, FinanceSummary, JournalEntry, PaymentChannel, ProfitDistributionSummary, ProfitLedgerEntry (+2 more)

### Community 72 - "Community 72"
Cohesion: 0.35
Nodes (8): AdminOrdersTab(), OrderDetailModal(), OrderFiltersBar(), OrderFiltersBarProps, OrderMetrics, OrderMetricsCards(), OrderMetricsCardsProps, OrderTableRow()

### Community 73 - "Community 73"
Cohesion: 0.20
Nodes (9): 1 Setup Python Environment, 2 Jalankan Server FastAPI, Asterra Store  Core Backend Service Pure FastAPI, Atau langsung dari folder backend, Dari root project, Install dependencies, Quick Start, Setup virtual environment (+1 more)

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (8): CreateOrderPayload, OrdersApi, OrdersApiResponse, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi, PromoValidationResponse

### Community 75 - "Community 75"
Cohesion: 0.27
Nodes (7): DaftarSalesContent(), DaftarSalesPage(), PartnerResult, Badge(), BadgeProps, Input, InputProps

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (8): 1 Perbarui python-version ke 312, 2 Selaraskan pyprojecttoml ke Python 312  Konfigurasi Vercel Entrypoint, 3 Generate  Komit uvlock Bersih, 4 Normalisasi Skema Database URI SQLAlchemy 20, Best Practice  Solution, Problem Summary, Root Cause Analysis, Troubleshooting Vercel Python uv Sync Interpreter Version Mismatch

### Community 79 - "Community 79"
Cohesion: 0.43
Nodes (4): get_admin_payment_config(), get_payment_config(), update_admin_payment_config(), PaymentConfigService

### Community 80 - "Community 80"
Cohesion: 0.25
Nodes (7): 1 Latar Belakang  Prinsip Utama, 2 Alur  Rumus Waterfall PL, 3 Komponen Teknis  Layanan, 4 Section 8 Audit Trail, Asterra Store  Referral  Profit Distribution Architecture, Hukum Mutlak Strict Zero-Tolerance Protocol, Jaminan Integer Rounding  Presisi

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 83 - "Community 83"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 84 - "Community 84"
Cohesion: 0.43
Nodes (6): ADMIN_COOKIE_NAME, applySecurityHeaders(), config, getAdminSecret(), proxy(), verifyAdminToken()

### Community 85 - "Community 85"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process brainstorm explore plan critique build critique again, Restraint and self-critique

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (6): 1 Latar Belakang  Rasional Bisnis, 2 Rincian Perubahan Harga Produk 37 Produk Utama, 3 Standardisasi Workbook  Perapihan Semua Tabel, 4 Perintah Operasional Terkait, Asterra Store  Milestone 50 Final Pricing  Database Sync, Standar Struktur 4 Sheet

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (4): tailwindcss, config, config, config

### Community 88 - "Community 88"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (5): 1 Problem Gejala Bug, 2 Root Cause Penyebab Utama, 3 Solution Solusi yang Diterapkan, 4 Verification  Results, Storefront Catalog Category and AI Tools Synchronization Fix

### Community 90 - "Community 90"
Cohesion: 0.40
Nodes (4): 1 Executive Summary  Design Constitution, 2 Component Structure, 4 Sales Partner Registration System daftar-sales, Asterra Store Admin Console  Modular Architecture  24 Menu Directives

### Community 92 - "Community 92"
Cohesion: 0.40
Nodes (4): Hasil Verifikasi Integrasi, Integrasi Backend FastAPI Asterra Store, Ringkasan Masalah  Akar Penyebab 404, Solusi  Integrasi yang Diterapkan

## Knowledge Gaps
- **232 isolated node(s):** `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `asterra-backend`, `clsx` (+227 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 930 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 22` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 11`, `Community 14`, `Community 17`, `Community 19`, `Community 21`, `Community 26`, `Community 28`, `Community 29`, `Community 38`, `Community 42`, `Community 46`, `Community 47`, `Community 50`, `Community 51`, `Community 52`, `Community 56`, `Community 60`, `Community 62`, `Community 63`, `Community 65`, `Community 71`, `Community 72`, `Community 75`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }` to the rest of the system?**
  _232 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06384180790960452 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 6`, `Community 11`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 21`, `Community 22`, `Community 26`, `Community 42`, `Community 47`, `Community 50`, `Community 60`, `Community 63`, `Community 65`, `Community 75`, `Community 84`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07811447811447811 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-query` connect `Community 63` to `Community 0`, `Community 1`, `Community 4`, `Community 6`, `Community 9`, `Community 11`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 22`, `Community 26`, `Community 42`, `Community 50`, `Community 60`, `Community 64`, `Community 72`, `Community 75`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._