# Graph Report - Asterra Store  (2026-10-13)

## Corpus Check
- Large corpus: 439 files · ~3,206,948 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2010 nodes · 4145 edges · 112 communities (83 shown, 29 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Catalog: Page
- Catalog: Gsap Utils
- Catalog: Campaign Service
- Payment: Order
- Payment: Readme
- Catalog: Page
- Catalog: Gsap Utils
- Catalog: Gsap Utils
- Payment: Main
- Auth: Package
- Orders: Admin System Settings Suite
- Affiliate: Use Auth Store
- Payment: Orders Data
- Auth: Package
- Auth: Package
- Orders: Asterra Referral Profit Model
- Payment: Page
- Orders: Main
- Orders: Orders Data
- Payment: Select
- Orders: Error
- Catalog: Catalog Service
- Admin: Dropdown Menu
- Catalog: Product Relevance
- Orders: Page
- Payment: Admin Finance Suite
- Marketing: Banner Service
- Core: Dropdown Menu
- Auth: Package
- Orders: Orders Data
- Motion: Test Motion System
- Affiliate: Next
- Payment: Api Client
- Orders: Partner Service
- Auth: Package
- Auth: Package
- Affiliate: Asterra Architecture Decoupling Plan
- Affiliate: Layout
- Core: Tsconfig
- Core: Tsconfig
- Core: Tsconfig
- Admin: Admin User Service
- Core: Eslint
- Payment: Admin Marketing Suite
- Affiliate: Package
- Marketing: Heroui Alert Dialog
- Marketing: Heroui Alert Dialog
- Auth: Use Auth Store
- Catalog: Asterra Architecture Decoupling Complete
- Core: Package
- Auth: Route
- Marketing: Heroui Alert Dialog
- Core: Package
- Core: Package
- Catalog: Generate Product Excel
- Orders: Notification Sound
- Orders: Notification Sound
- Orders: Notification Sound
- Orders: Skill
- Core: Index
- Payment: Payment Config Service
- Core: Readme
- Core: Chunk Recovery
- Affiliate: Switch Env
- Core: Troubleshooting Vercel Python Uv Deployment
- Orders: Page
- Core: Security
- Affiliate: Asterra Referral Profit Architecture
- Core: Package
- Admin: Proxy
- Core: Package
- Admin: Proxy
- Core: Package
- Admin: Proxy
- Catalog: Sync Supabase To Json
- Core: Skill
- Core: Asterra Milestone 50 Pricing Sync
- Core: Postcss
- Catalog: Admin Analytics Suite
- Core: Tailwind
- Core: Use Cart Store
- Core: Apply Excel Prices To Db
- Catalog: Troubleshooting Catalog Category Sync Fix
- Affiliate: Admin Console Modular Architecture
- Payment: Tripay Service
- Core: Asterra Fastapi Unified Integration
- Core: Config
- Admin: Audit Log Service
- Core: Promo Pricing
- Core: Promo Pricing
- Core: Test Audit
- Affiliate: Referral
- Affiliate: Referral
- Core: Package
- Core: Package
- Core: Package
- Auth: Auth Client
- Auth: Auth Client
- Auth: Auth Client
- Core: Pyproject

## God Nodes (most connected - your core abstractions)
1. `Button` - 48 edges
2. `Input` - 40 edges
3. `Button` - 40 edges
4. `CatalogService` - 35 edges
5. `Badge()` - 35 edges
6. `cn()` - 35 edges
7. `cn()` - 35 edges
8. `cn()` - 35 edges
9. `PartnerService` - 27 edges
10. `AdminPage()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `create_admin_product()` --uses--> `CatalogService`  [INFERRED]
  backend/app/main.py → backend/app/services/catalog_service.py
- `update_admin_product()` --uses--> `CatalogService`  [INFERRED]
  backend/app/main.py → backend/app/services/catalog_service.py
- `bulk_status_products()` --uses--> `CatalogService`  [INFERRED]
  backend/app/main.py → backend/app/services/catalog_service.py
- `bulk_delete_products()` --uses--> `CatalogService`  [INFERRED]
  backend/app/main.py → backend/app/services/catalog_service.py
- `import_admin_vip_service()` --uses--> `CatalogService`  [INFERRED]
  backend/app/main.py → backend/app/services/catalog_service.py

## Import Cycles
- None detected.

## Communities (112 total, 29 thin omitted)

### Community 0 - "Catalog: Page"
Cohesion: 0.05
Nodes (61): DaftarSalesContent(), DaftarSalesPage(), PartnerResult, ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, NotFound() (+53 more)

### Community 1 - "Catalog: Gsap Utils"
Cohesion: 0.06
Nodes (63): GlobalError(), GlobalErrorProps, metadata, organizationJsonLd, plusJakartaSans, RootLayout(), ReferralTracker(), ReferralTrackerInner() (+55 more)

### Community 2 - "Catalog: Campaign Service"
Cohesion: 0.06
Nodes (14): create_admin_campaign(), delete_admin_campaign(), delete_admin_promo(), evaluate_product_campaign_price(), get_active_campaigns(), get_admin_campaigns(), get_admin_promos(), toggle_admin_campaign() (+6 more)

### Community 3 - "Payment: Order"
Cohesion: 0.09
Nodes (8): get_media_file(), upload_admin_media(), AdminUser, PromoBanner, Order, OrderItem, SalesPartner, PromoCode

### Community 4 - "Payment: Readme"
Cohesion: 0.04
Nodes (54): 10 Operasional Pemeliharaan  Skrip Bantu, 11 Protokol Keamanan  Hardening Produksi, 1 Backend backendenvexamplefilecIqbalDevelopmentProject20LibraryNextJSAsterra20Storebackendenvexample, 1 Gerbang Pembayaran Tripay appservicestripay_service, 1 Kloning repository, 1 Ringkasan Eksekutif  Identitas Proyek, 2 Frontend Applications frontend-envexample, 2 Setup Virtual Environment Python untuk Backend (+46 more)

### Community 5 - "Catalog: Page"
Cohesion: 0.10
Nodes (38): AppBrandBadge(), ApplicationGroupItem, FeaturedGridCard(), FeaturedGridCardSkeleton(), HomePage(), ShowcaseLoopingCard(), ShowcaseLoopingCardSkeleton(), DurationOption (+30 more)

### Community 6 - "Catalog: Gsap Utils"
Cohesion: 0.11
Nodes (41): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+33 more)

### Community 7 - "Catalog: Gsap Utils"
Cohesion: 0.11
Nodes (41): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+33 more)

### Community 8 - "Payment: Main"
Cohesion: 0.11
Nodes (32): admin_auth_logout(), admin_auth_me(), auth_login(), auth_register(), bulk_delete_products(), bulk_status_products(), create_admin_affiliate(), create_admin_product() (+24 more)

### Community 9 - "Auth: Package"
Cohesion: 0.05
Nodes (43): author, description, autoprefixer, bcryptjs, better-auth, clsx, eslint, eslint-config-next (+35 more)

### Community 10 - "Orders: Admin System Settings Suite"
Cohesion: 0.08
Nodes (29): AdminAffiliateTabProps, AffiliatePartner, INITIAL_AFFILIATES, AdminCategoriesTabProps, CategoryItem, INITIAL_CATEGORIES, AdminCustomersTabProps, CustomerItem (+21 more)

### Community 11 - "Affiliate: Use Auth Store"
Cohesion: 0.06
Nodes (24): authClient, env, CustomerLogoutOptions, getAppBaseUrl(), AuthState, useAuthStore, UserProfile, CartItem (+16 more)

### Community 12 - "Payment: Orders Data"
Cohesion: 0.06
Nodes (30): CreateOrderPayload, OrdersApi, OrdersApiResponse, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi, PromoValidationResponse (+22 more)

### Community 13 - "Auth: Package"
Cohesion: 0.05
Nodes (41): author, description, autoprefixer, bcryptjs, better-auth, clsx, eslint, eslint-config-next (+33 more)

### Community 14 - "Auth: Package"
Cohesion: 0.05
Nodes (41): author, description, autoprefixer, bcryptjs, better-auth, clsx, eslint, eslint-config-next (+33 more)

### Community 15 - "Orders: Asterra Referral Profit Model"
Cohesion: 0.05
Nodes (39): 10 Transaksi yang Tidak Menghasilkan Komisi, 11 Aturan Customer Referral, 12 Prioritas Referral, 13 Model Ekonomi, 14 Guardrail Margin Produk, 15 Contoh Kasus Lengkap, 16 Aturan Anti-Salah Konsep, 17 Rumus Implementasi (+31 more)

### Community 16 - "Payment: Page"
Cohesion: 0.09
Nodes (30): CheckoutPage(), CheckoutPageContent(), GATEWAY_PAYMENT_METHODS, getStatusBadge(), getTimelineStep(), isOrderExpired(), OrderCountdownBadge(), PrivateOrderContent() (+22 more)

### Community 17 - "Orders: Main"
Cohesion: 0.11
Nodes (19): api_root_redirect(), api_v1_docs_redirect(), api_v1_openapi_redirect(), cancel_order(), get_admin_customers(), get_admin_order_by_id(), get_admin_orders(), get_analytics_overview() (+11 more)

### Community 18 - "Orders: Orders Data"
Cohesion: 0.11
Nodes (27): LogsApiResponse, AdminOrdersTab(), OrderActorBadge(), OrderStatusBadge(), OrderDetailModal(), OrderDetailModalProps, OrderFiltersBar(), OrderMetricsCards() (+19 more)

### Community 19 - "Payment: Select"
Cohesion: 0.20
Nodes (30): AdminPage(), TAB_TITLES, AdminAffiliateTab(), AdminAnalyticsSuite(), AdminCategoriesTab(), AdminCustomersTab(), AdminDashboardTab(), AdminFinanceSuite() (+22 more)

### Community 20 - "Orders: Error"
Cohesion: 0.13
Nodes (17): ErrorProps, NotFound(), AffiliatePage(), metadata, ErrorBoundary(), ErrorProps, NotFound(), AuthRequiredModalProps (+9 more)

### Community 21 - "Catalog: Catalog Service"
Cohesion: 0.15
Nodes (9): delete_admin_product(), get_admin_products(), get_admin_vip_services(), get_product_by_id(), get_products(), sync_vip_services(), toggle_admin_product_status(), Product (+1 more)

### Community 22 - "Admin: Dropdown Menu"
Cohesion: 0.16
Nodes (22): AdminLoginPage(), AsterraLogo(), AsterraLogoProps, Card, CardContent, CardDescription, CardFooter, CardHeader (+14 more)

### Community 23 - "Catalog: Product Relevance"
Cohesion: 0.11
Nodes (25): fetchActiveProducts(), fetchProductById(), generateMetadata(), PageProps, ProductDetailPage(), ProductDetailData, ParsedProductSpecs, parseProductDurations() (+17 more)

### Community 24 - "Orders: Page"
Cohesion: 0.21
Nodes (20): LoginFormContent(), LoginPage(), formatDate(), formatIDR(), Order, OrderItem, ProfileApiResponse, ProfilePage() (+12 more)

### Community 25 - "Payment: Admin Finance Suite"
Cohesion: 0.10
Nodes (21): AdminDashboardTabProps, AdminFinanceSuiteProps, ExpenseItem, FinanceSummary, JournalEntry, PaymentChannel, ProfitDistributionSummary, ProfitLedgerEntry (+13 more)

### Community 26 - "Marketing: Banner Service"
Cohesion: 0.16
Nodes (5): delete_promo_banner(), get_promo_banner_detail(), get_promo_banners(), upload_promo_banner(), BannerService

### Community 27 - "Core: Dropdown Menu"
Cohesion: 0.15
Nodes (18): Badge(), BadgeProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+10 more)

### Community 28 - "Auth: Package"
Cohesion: 0.08
Nodes (24): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+16 more)

### Community 29 - "Orders: Orders Data"
Cohesion: 0.11
Nodes (16): OrdersApiResponse, addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, Order, OrderItem (+8 more)

### Community 30 - "Motion: Test Motion System"
Cohesion: 0.15
Nodes (12): CDPClient, delay(), getWebSocketDebuggerUrl(), runTest(), evaluate(), setViewport(), CDPClient, delay() (+4 more)

### Community 31 - "Affiliate: Next"
Cohesion: 0.09
Nodes (8): nextConfig, nextConfig, nextConfig, INITIAL_STOREFRONT_BANNERS, PromoBannerItem, Header(), HeaderProps, AsterraLogoProps

### Community 32 - "Payment: Api Client"
Cohesion: 0.11
Nodes (18): AdminProductsResponse, VipServicesResponse, CreateOrderPayload, OrdersApi, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi (+10 more)

### Community 33 - "Orders: Partner Service"
Cohesion: 0.27
Nodes (7): get_admin_affiliates(), get_sales_campaigns(), get_sales_me(), get_sales_network(), get_sales_orders(), validate_referral(), PartnerService

### Community 34 - "Auth: Package"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+14 more)

### Community 35 - "Auth: Package"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons (+14 more)

### Community 36 - "Affiliate: Asterra Architecture Decoupling Plan"
Cohesion: 0.10
Nodes (19): 1 Executive Summary  Problem Statement, 2 Target Visi 4 Repositori Terpisah, 3 Struktur Folder 4 Proyek Mandiri, 4 Spesifikasi Teknis FastAPI Core Backend, 5 Pembersihan Core Asterra Store Customer App, 6 Arsitektur Keamanan  Autentikasi, 7 Roadmap Eksekusi Bertahap Phased Milestones, Asterra Store  Architecture Decoupling  Multi-Project Separation Plan (+11 more)

### Community 37 - "Affiliate: Layout"
Cohesion: 0.15
Nodes (10): metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider(), metadata, plusJakartaSans, RootLayout() (+2 more)

### Community 38 - "Core: Tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 39 - "Core: Tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 40 - "Core: Tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "Admin: Admin User Service"
Cohesion: 0.24
Nodes (4): admin_auth_login(), delete_admin_user(), get_admin_users(), AdminUserService

### Community 42 - "Core: Eslint"
Cohesion: 0.13
Nodes (12): compat, __dirname, eslintConfig, __filename, compat, __dirname, eslintConfig, __filename (+4 more)

### Community 43 - "Payment: Admin Marketing Suite"
Cohesion: 0.13
Nodes (11): AdminMarketingSuiteProps, BannerItem, CampaignItem, INITIAL_BANNERS, AdminPaymentSettingsTabProps, ACCEPTED_TYPES, ImageUploadDropzoneProps, UploadMode (+3 more)

### Community 44 - "Affiliate: Package"
Cohesion: 0.12
Nodes (16): description, name, private, scripts, build:admin, build:all, build:sales, build:user (+8 more)

### Community 45 - "Marketing: Heroui Alert Dialog"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 46 - "Marketing: Heroui Alert Dialog"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 47 - "Auth: Use Auth Store"
Cohesion: 0.22
Nodes (9): LainnyaSidebar(), MobileBottomNav(), CustomerLogoutOptions, performCustomerLogout(), AuthState, useAuthStore, UserProfile, NavigationState (+1 more)

### Community 48 - "Catalog: Asterra Architecture Decoupling Complete"
Cohesion: 0.13
Nodes (14): Atau Build Individual, Build Semua 4 Sub-Proyek, Development, Jalankan Admin Console Port 3001, Jalankan FastAPI Python Engine Port 8000, Jalankan Nextjs BFF API Port 4000, Jalankan Sales Console Port 3002, Jalankan Storefront Pembeli Port 3000 (+6 more)

### Community 49 - "Core: Package"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+7 more)

### Community 50 - "Auth: Route"
Cohesion: 0.18
Nodes (9): GET, POST, appBaseUrl, auth, env, globalForPrisma, prisma, getAppBaseUrl() (+1 more)

### Community 51 - "Marketing: Heroui Alert Dialog"
Cohesion: 0.18
Nodes (8): AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger(), useAlertDialog()

### Community 52 - "Core: Package"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 53 - "Core: Package"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 54 - "Catalog: Generate Product Excel"
Cohesion: 0.21
Nodes (11): ExcelJS, fs, generateExcel(), getAccountType(), getAvailabilityStatus(), getBrandAndApp(), getCleanProductName(), path (+3 more)

### Community 55 - "Orders: Notification Sound"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 56 - "Orders: Notification Sound"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 57 - "Orders: Notification Sound"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 58 - "Orders: Skill"
Cohesion: 0.18
Nodes (10): Anti-Hallucination Directives  Design Hierarchy, Core Workflow Lifecycle, Direct Native Commands Ultra-Fast 10ms Execution, Moryn Agent Skill, Single Source of Truth SSOT Priority Rules, Step 1 Read Blueprint in Order Personalization  Structure  PRD  Design  Active Task, Step 2 Start the Task, Step 3 Implement Changes with Mandatory Autonomous Component Discovery (+2 more)

### Community 60 - "Payment: Payment Config Service"
Cohesion: 0.31
Nodes (4): get_admin_payment_config(), get_payment_config(), PaymentSetting, PaymentConfigService

### Community 61 - "Core: Readme"
Cohesion: 0.20
Nodes (9): 1 Setup Python Environment, 2 Jalankan Server FastAPI, Asterra Store  Core Backend Service Pure FastAPI, Atau langsung dari folder backend, Dari root project, Install dependencies, Quick Start, Setup virtual environment (+1 more)

### Community 62 - "Core: Chunk Recovery"
Cohesion: 0.27
Nodes (7): ErrorBoundary(), GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 63 - "Affiliate: Switch Env"
Cohesion: 0.22
Nodes (4): fs, path, projects, targetArg

### Community 64 - "Core: Troubleshooting Vercel Python Uv Deployment"
Cohesion: 0.22
Nodes (8): 1 Perbarui python-version ke 312, 2 Selaraskan pyprojecttoml ke Python 312  Konfigurasi Vercel Entrypoint, 3 Generate  Komit uvlock Bersih, 4 Normalisasi Skema Database URI SQLAlchemy 20, Best Practice  Solution, Problem Summary, Root Cause Analysis, Troubleshooting Vercel Python uv Sync Interpreter Version Mismatch

### Community 65 - "Orders: Page"
Cohesion: 0.39
Nodes (8): formatRelativeTime(), getStatusBadge(), GlobalOrdersContent(), GlobalOrdersPage(), GlobalOrdersPageSkeleton(), GlobalOrdersSkeleton(), PublicOrder, STATUS_FILTERS

### Community 67 - "Affiliate: Asterra Referral Profit Architecture"
Cohesion: 0.25
Nodes (7): 1 Latar Belakang  Prinsip Utama, 2 Alur  Rumus Waterfall PL, 3 Komponen Teknis  Layanan, 4 Section 8 Audit Trail, Asterra Store  Referral  Profit Distribution Architecture, Hukum Mutlak Strict Zero-Tolerance Protocol, Jaminan Integer Rounding  Presisi

### Community 68 - "Core: Package"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 69 - "Admin: Proxy"
Cohesion: 0.43
Nodes (6): ADMIN_COOKIE_NAME, applySecurityHeaders(), config, getAdminSecret(), proxy(), verifyAdminToken()

### Community 70 - "Core: Package"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 71 - "Admin: Proxy"
Cohesion: 0.43
Nodes (6): ADMIN_COOKIE_NAME, applySecurityHeaders(), config, getAdminSecret(), proxy(), verifyAdminToken()

### Community 72 - "Core: Package"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 73 - "Admin: Proxy"
Cohesion: 0.43
Nodes (6): ADMIN_COOKIE_NAME, applySecurityHeaders(), config, getAdminSecret(), proxy(), verifyAdminToken()

### Community 74 - "Catalog: Sync Supabase To Json"
Cohesion: 0.32
Nodes (7): exportAll(), formatProduct(), fs, mapCategory(), path, prisma, { PrismaClient }

### Community 75 - "Core: Skill"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process brainstorm explore plan critique build critique again, Restraint and self-critique

### Community 76 - "Core: Asterra Milestone 50 Pricing Sync"
Cohesion: 0.29
Nodes (6): 1 Latar Belakang  Rasional Bisnis, 2 Rincian Perubahan Harga Produk 37 Produk Utama, 3 Standardisasi Workbook  Perapihan Semua Tabel, 4 Perintah Operasional Terkait, Asterra Store  Milestone 50 Final Pricing  Database Sync, Standar Struktur 4 Sheet

### Community 77 - "Core: Postcss"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 78 - "Catalog: Admin Analytics Suite"
Cohesion: 0.29
Nodes (6): AdminAnalyticsSuiteProps, AffiliatePerformanceItem, AnalyticsSuiteData, FinancialReportData, ProductPerformanceItem, SalesTimeSeriesItem

### Community 79 - "Core: Tailwind"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 80 - "Core: Use Cart Store"
Cohesion: 0.38
Nodes (5): CartDrawer(), CartDrawerProps, CartItem, CartState, useCartStore

### Community 81 - "Core: Apply Excel Prices To Db"
Cohesion: 0.33
Nodes (6): formatRupiah(), fs, path, prisma, { PrismaClient }, updateDatabasePrices()

### Community 82 - "Catalog: Troubleshooting Catalog Category Sync Fix"
Cohesion: 0.33
Nodes (5): 1 Problem Gejala Bug, 2 Root Cause Penyebab Utama, 3 Solution Solusi yang Diterapkan, 4 Verification  Results, Storefront Catalog Category and AI Tools Synchronization Fix

### Community 83 - "Affiliate: Admin Console Modular Architecture"
Cohesion: 0.40
Nodes (4): 1 Executive Summary  Design Constitution, 2 Component Structure, 4 Sales Partner Registration System daftar-sales, Asterra Store Admin Console  Modular Architecture  24 Menu Directives

### Community 85 - "Core: Asterra Fastapi Unified Integration"
Cohesion: 0.40
Nodes (4): Hasil Verifikasi Integrasi, Integrasi Backend FastAPI Asterra Store, Ringkasan Masalah  Akar Penyebab 404, Solusi  Integrasi yang Diterapkan

## Knowledge Gaps
- **292 isolated node(s):** `asterra-backend`, `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-brands-svg-icons`, `@fortawesome/free-regular-svg-icons`, `@fortawesome/free-solid-svg-icons` (+287 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 976 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `swiper` connect `Auth: Package` to `Affiliate: Next`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `asterra-backend`, `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-brands-svg-icons` to the rest of the system?**
  _292 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog: Page` be split into smaller, more focused modules?**
  _Cohesion score 0.051061388410786 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `Auth: Route` to `Core: Apply Excel Prices To Db`, `Auth: Package`, `Catalog: Sync Supabase To Json`, `Catalog: Generate Product Excel`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Catalog: Gsap Utils` be split into smaller, more focused modules?**
  _Cohesion score 0.06027306027306027 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Auth: Package` to `Auth: Package`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `Catalog: Campaign Service` be split into smaller, more focused modules?**
  _Cohesion score 0.057859703020993344 - nodes in this community are weakly interconnected._