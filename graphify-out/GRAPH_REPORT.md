# Graph Report - Asterra-Store  (2026-10-21)

## Corpus Check
- 365 files · ~3,719,866 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2153 nodes · 4608 edges · 134 communities (93 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 141 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- OrderService
- CatalogService
- frontend-user/package.json
- product-detail-client.tsx
- README.md
- profile/page.tsx
- datetime
- frontend-user/src/lib/animations/gsap-utils.ts
- frontend-admin/src/lib/animations/gsap-utils.ts
- sales.py
- frontend-sales/src/lib/animations/gsap-utils.ts
- frontend-sales/src/lib/orders-data.ts
- ref_next
- checkout/page.tsx
- app/main.py
- asterra-referral-profit-model.md
- CampaignService
- ref_react
- frontend-admin/src/components/ui/input.tsx
- typing
- v1/auth.py
- frontend-admin/src/components/sales/sales-console-suite.tsx
- [id]/page.tsx
- storefront-shell.tsx
- frontend-user/src/components/ui/dropdown-menu.tsx
- os
- Button
- admin/page.tsx
- frontend-sales/src/components/sales/sales-console-suite.tsx
- runTest
- frontend-user/src/lib/orders-data.ts
- Input
- asterra-architecture-decoupling-plan.md
- frontend-admin/src/lib/orders-data.ts
- ref_tanstack_react_query
- frontend-admin/src/proxy.ts
- compilerOptions
- compilerOptions
- compilerOptions
- orders/page.tsx
- scripts
- frontend-admin/eslint.config.mjs
- dependencies
- verify-simulation-audit.js
- admin.py
- SmartCache
- dependencies
- frontend-admin/src/components/ui/heroui-alert-dialog.tsx
- dependencies
- frontend-sales/src/components/ui/heroui-alert-dialog.tsx
- ReferralService
- asterra-architecture-decoupling-complete.md
- frontend-user/src/components/ui/heroui-alert-dialog.tsx
- devDependencies
- .load_promos
- devDependencies
- admin/login/page.tsx
- devDependencies
- frontend-user/src/app/layout.tsx
- generate-product-excel.js
- better-auth
- NotificationSoundPlayer
- frontend-sales/src/app/error.tsx
- frontend-sales/src/app/layout.tsx
- sales/login/page.tsx
- NotificationSoundPlayer
- moryn/SKILL.md
- frontend-user/src/store/use-auth-store.ts
- backend/README.md
- frontend-admin/src/app/layout.tsx
- frontend-sales/src/lib/utils/url.ts
- frontend-sales/src/lib/utils.ts
- auth.ts
- ref_path
- troubleshooting-vercel-python-uv-deployment.md
- frontend-admin/src/lib/utils/chunk-recovery.ts
- frontend-admin/src/components/ui/dropdown-menu.tsx
- frontend-sales/src/components/ui/dropdown-menu.tsx
- NotificationSoundPlayer
- asterra-referral-profit-architecture.md
- scripts
- scripts
- frontend-sales/src/components/ui/select.tsx
- frontend-sales/src/lib/utils/auth-logout.ts
- scripts
- sync-supabase-to-json.js
- frontend/SKILL.md
- asterra-milestone-50-pricing-sync.md
- admin-promos-tab.tsx
- frontend-admin/src/store/use-navigation-store.ts
- ref_tailwindcss
- daftar-sales/page.tsx
- apply_excel_prices_to_db.js
- InMemoryRateLimiter
- troubleshooting-catalog-category-sync-fix.md
- homepage-preloader.tsx
- Admin Console Modular Architecture.md
- asterra-fastapi-unified-integration.md
- frontend-admin/src/lib/utils/promo-pricing.ts
- frontend-sales/src/lib/utils/promo-pricing.ts
- PromoBanner
- SalesPartner
- Product
- PromoCode
- frontend-admin/src/lib/utils/referral.ts
- frontend-sales/src/lib/utils/referral.ts
- frontend-admin/postcss.config.mjs
- frontend-sales/postcss.config.mjs
- overrides
- frontend-user/postcss.config.mjs
- { signIn, signOut, useSession }
- { signIn, signOut, useSession }
- { signIn, signOut, useSession }
- asterra-backend

## God Nodes (most connected - your core abstractions)
1. `OrderService` - 47 edges
2. `Button` - 47 edges
3. `CatalogService` - 41 edges
4. `Input` - 39 edges
5. `PartnerService` - 35 edges
6. `CampaignService` - 33 edges
7. `Button` - 33 edges
8. `prefersReducedMotion()` - 26 edges
9. `prefersReducedMotion()` - 26 edges
10. `prefersReducedMotion()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `ScoredProduct` --references--> `ProductItem`  [EXTRACTED]
  frontend-user/src/lib/services/product-relevance.ts → frontend-user/src/lib/products-data.ts
- `ReferralService` --uses--> `CampaignService`  [INFERRED]
  backend/app/services/referral_service.py → backend/app/services/campaign_service.py
- `lifespan()` --uses--> `OrderService`  [INFERRED]
  backend/app/main.py → backend/app/services/order_service.py
- `admin_auth_login()` --uses--> `PartnerService`  [INFERRED]
  backend/app/api/v1/auth.py → backend/app/services/partner_service.py
- `validate_referral()` --uses--> `OrderService`  [INFERRED]
  backend/app/api/v1/sales.py → backend/app/services/order_service.py

## Import Cycles
- None detected.

## Communities (134 total, 41 thin omitted)

### Community 0 - "OrderService"
Cohesion: 0.05
Nodes (36): get_user_profile(), acquire_idempotency_lock(), cancel_order(), create_admin_promo(), create_order(), delete_admin_promo(), get_admin_order_by_id(), get_admin_orders() (+28 more)

### Community 1 - "CatalogService"
Cohesion: 0.06
Nodes (23): bulk_delete_products(), bulk_status_products(), create_admin_product(), delete_admin_product(), delete_promo_banner(), get_admin_products(), get_admin_vip_services(), get_media_file() (+15 more)

### Community 2 - "frontend-user/package.json"
Cohesion: 0.05
Nodes (58): author, description, clsx, gsap, next, postcss, prettier, react (+50 more)

### Community 3 - "product-detail-client.tsx"
Cohesion: 0.09
Nodes (49): AppBrandBadge(), ApplicationGroupItem, FeaturedGridCard(), FeaturedGridCardSkeleton(), FeaturedSectionCountdownBadge(), HomePage(), ShowcaseLoopingCard(), ShowcaseLoopingCardSkeleton() (+41 more)

### Community 4 - "README.md"
Cohesion: 0.04
Nodes (54): 10 Operasional Pemeliharaan  Skrip Bantu, 11 Protokol Keamanan  Hardening Produksi, 1 Backend backendenvexamplefilecIqbalDevelopmentProject20LibraryNextJSAsterra20Storebackendenvexample, 1 Gerbang Pembayaran Tripay appservicestripay_service, 1 Kloning repository, 1 Ringkasan Eksekutif  Identitas Proyek, 2 Frontend Applications frontend-envexample, 2 Setup Virtual Environment Python untuk Backend (+46 more)

### Community 5 - "profile/page.tsx"
Cohesion: 0.10
Nodes (37): LoginFormContent(), LoginPage(), formatDate(), formatIDR(), Order, OrderItem, ProfileApiResponse, ProfilePage() (+29 more)

### Community 6 - "datetime"
Cohesion: 0.11
Nodes (8): AdminUser, Commission, Order, OrderItem, PaymentSetting, ProfitLedger, ReferralProfitService, test_7_sales_commission_from_profit()

### Community 7 - "frontend-user/src/lib/animations/gsap-utils.ts"
Cohesion: 0.11
Nodes (42): PageTransition(), PageTransitionProps, animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateGeneralSubpage(), animateHeroMasterSequence (+34 more)

### Community 8 - "frontend-admin/src/lib/animations/gsap-utils.ts"
Cohesion: 0.11
Nodes (41): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+33 more)

### Community 9 - "sales.py"
Cohesion: 0.13
Nodes (20): create_admin_affiliate(), create_admin_campaign(), evaluate_product_campaign_price(), expire_affiliate_sessions(), get_active_campaigns(), get_admin_affiliates(), get_admin_campaigns(), get_sales_campaigns() (+12 more)

### Community 10 - "frontend-sales/src/lib/animations/gsap-utils.ts"
Cohesion: 0.11
Nodes (41): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+33 more)

### Community 11 - "frontend-sales/src/lib/orders-data.ts"
Cohesion: 0.06
Nodes (30): CreateOrderPayload, OrdersApi, OrdersApiResponse, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi, PromoValidationResponse (+22 more)

### Community 12 - "ref_next"
Cohesion: 0.08
Nodes (18): nextConfig, nextConfig, nextConfig, AffiliatePage(), metadata, ErrorBoundary(), ErrorProps, NotFound() (+10 more)

### Community 13 - "checkout/page.tsx"
Cohesion: 0.10
Nodes (31): CheckoutPage(), CheckoutPageContent(), GATEWAY_PAYMENT_METHODS, getStatusBadge(), getTimelineStep(), isOrderExpired(), OrderCountdownBadge(), PrivateOrderContent() (+23 more)

### Community 14 - "app/main.py"
Cohesion: 0.11
Nodes (14): fallback_handler(), create_admin_session_token(), get_admin_auth_secret(), get_current_admin(), get_current_sales_or_admin(), verify_admin_session_token(), get_client_ip(), security_and_rate_limit_middleware() (+6 more)

### Community 15 - "asterra-referral-profit-model.md"
Cohesion: 0.05
Nodes (39): 10 Transaksi yang Tidak Menghasilkan Komisi, 11 Aturan Customer Referral, 12 Prioritas Referral, 13 Model Ekonomi, 14 Guardrail Margin Produk, 15 Contoh Kasus Lengkap, 16 Aturan Anti-Salah Konsep, 17 Rumus Implementasi (+31 more)

### Community 16 - "CampaignService"
Cohesion: 0.10
Nodes (6): delete_admin_campaign(), lifespan(), PromoCampaign, CampaignService, get_campaign_sort_key(), parse_wib_datetime()

### Community 17 - "ref_react"
Cohesion: 0.13
Nodes (24): AdminOrdersTab(), OrderActorBadge(), OrderStatusBadge(), OrderDetailModal(), OrderDetailModalProps, OrderFiltersBar(), OrderFiltersBarProps, OrderMetrics (+16 more)

### Community 18 - "frontend-admin/src/components/ui/input.tsx"
Cohesion: 0.09
Nodes (26): lucide-react, AdminFinanceSuite(), AdminFinanceSuiteProps, ExpenseItem, FinanceSummary, JournalEntry, PaymentChannel, ProfitDistributionSummary (+18 more)

### Community 19 - "typing"
Cohesion: 0.12
Nodes (6): event_generator(), sse_events(), sse_options(), Settings, Config, run_tests()

### Community 20 - "v1/auth.py"
Cohesion: 0.13
Nodes (10): admin_auth_login(), admin_auth_logout(), admin_auth_me(), auth_login(), auth_register(), update_user_profile(), create_access_token(), get_password_hash() (+2 more)

### Community 21 - "frontend-admin/src/components/sales/sales-console-suite.tsx"
Cohesion: 0.09
Nodes (25): AdminAffiliateTab(), AdminAffiliateTabProps, AffiliatePartner, INITIAL_AFFILIATES, AdminDashboardTab(), AdminDashboardTabProps, AdminSidebar(), AdminSidebarProps (+17 more)

### Community 22 - "[id]/page.tsx"
Cohesion: 0.10
Nodes (24): fetchActiveProducts, fetchProductById, generateMetadata(), PageProps, ProductDetailPage(), ProductDetailData, ParsedProductSpecs, parseProductDurations() (+16 more)

### Community 23 - "storefront-shell.tsx"
Cohesion: 0.13
Nodes (20): GlobalError(), GlobalErrorProps, FloatingSupport(), Footer(), FooterProps, Header(), LainnyaSidebar(), MobileBottomNav() (+12 more)

### Community 24 - "frontend-user/src/components/ui/dropdown-menu.tsx"
Cohesion: 0.10
Nodes (19): tailwind-merge, Badge(), BadgeProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem (+11 more)

### Community 25 - "os"
Cohesion: 0.11
Nodes (9): catch_all(), get_qstash_client(), publish_background_job(), catch_all(), deploy_banner(), deploy_logo(), run_migration(), step1_convert_images() (+1 more)

### Community 26 - "Button"
Cohesion: 0.11
Nodes (20): ErrorBoundary(), ErrorProps, NotFound(), AdminAnalyticsSuite(), AdminAnalyticsSuiteProps, AffiliatePerformanceItem, AnalyticsSuiteData, FinancialReportData (+12 more)

### Community 27 - "admin/page.tsx"
Cohesion: 0.15
Nodes (18): AdminPage(), AdminProductsResponse, TAB_TITLES, VipServicesResponse, AdminCategoriesTab(), AdminCategoriesTabProps, CategoryItem, INITIAL_CATEGORIES (+10 more)

### Community 28 - "frontend-sales/src/components/sales/sales-console-suite.tsx"
Cohesion: 0.14
Nodes (18): NotFound(), SalesPortalPage(), TAB_TITLES, AdminSidebar(), AdminSidebarProps, AdminTab, NavGroup, NavSubItem (+10 more)

### Community 29 - "runTest"
Cohesion: 0.15
Nodes (12): CDPClient, delay(), getWebSocketDebuggerUrl(), runTest(), evaluate(), setViewport(), CDPClient, delay() (+4 more)

### Community 30 - "frontend-user/src/lib/orders-data.ts"
Cohesion: 0.11
Nodes (15): addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, Order, OrderItem, OrderLog (+7 more)

### Community 31 - "Input"
Cohesion: 0.14
Nodes (16): AdminMarketingSuite(), AdminMarketingSuiteProps, BannerItem, CampaignItem, INITIAL_BANNERS, AdminPaymentSettingsTab(), AdminPaymentSettingsTabProps, ACCEPTED_TYPES (+8 more)

### Community 32 - "asterra-architecture-decoupling-plan.md"
Cohesion: 0.10
Nodes (19): 1 Executive Summary  Problem Statement, 2 Target Visi 4 Repositori Terpisah, 3 Struktur Folder 4 Proyek Mandiri, 4 Spesifikasi Teknis FastAPI Core Backend, 5 Pembersihan Core Asterra Store Customer App, 6 Arsitektur Keamanan  Autentikasi, 7 Roadmap Eksekusi Bertahap Phased Milestones, Asterra Store  Architecture Decoupling  Multi-Project Separation Plan (+11 more)

### Community 33 - "frontend-admin/src/lib/orders-data.ts"
Cohesion: 0.13
Nodes (14): AdminLogsTab(), LogsApiResponse, addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, OrderItem (+6 more)

### Community 34 - "ref_tanstack_react_query"
Cohesion: 0.15
Nodes (14): CatalogProductsResponse, fetchCatalogProducts(), useCatalogProducts(), ProductItem, PRODUCTS_CATALOG, ManagedProduct, ManagedProductItem, VipRawService (+6 more)

### Community 35 - "frontend-admin/src/proxy.ts"
Cohesion: 0.18
Nodes (12): applySecurityHeaders(), config, getActiveAuthSession(), proxy(), applySecurityHeaders(), config, getActiveAuthSession(), proxy() (+4 more)

### Community 36 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 37 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 38 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 39 - "orders/page.tsx"
Cohesion: 0.22
Nodes (16): getStatusBadge(), GlobalOrdersContent(), GlobalOrdersPage(), GlobalOrdersPageSkeleton(), GlobalOrdersSkeleton(), STATUS_FILTERS, ACTIVE_CATALOG_PRODUCTS, clearLegacySyntheticTimelineStorage() (+8 more)

### Community 40 - "scripts"
Cohesion: 0.11
Nodes (17): description, name, private, scripts, build, build:admin, build:all, build:sales (+9 more)

### Community 41 - "frontend-admin/eslint.config.mjs"
Cohesion: 0.13
Nodes (13): compat, __dirname, eslintConfig, __filename, compat, __dirname, eslintConfig, __filename (+5 more)

### Community 42 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap (+9 more)

### Community 43 - "verify-simulation-audit.js"
Cohesion: 0.12
Nodes (16): ACTIVE_CATALOG_PRODUCTS, activeCatalog, browserA, browserB_Incognito, browserC_DifferentDevice, catalogPath, fs, genuineOrdersPath (+8 more)

### Community 44 - "admin.py"
Cohesion: 0.18
Nodes (10): create_admin_user(), delete_admin_user(), get_admin_customers(), get_admin_logs(), get_admin_users(), get_analytics_overview(), get_analytics_suite(), get_finance_summary() (+2 more)

### Community 46 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap, lucide-react (+8 more)

### Community 47 - "frontend-admin/src/components/ui/heroui-alert-dialog.tsx"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 48 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap, lucide-react (+8 more)

### Community 49 - "frontend-sales/src/components/ui/heroui-alert-dialog.tsx"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 51 - "asterra-architecture-decoupling-complete.md"
Cohesion: 0.13
Nodes (14): Atau Build Individual, Build Semua 4 Sub-Proyek, Development, Jalankan Admin Console Port 3001, Jalankan FastAPI Python Engine Port 8000, Jalankan Nextjs BFF API Port 4000, Jalankan Sales Console Port 3002, Jalankan Storefront Pembeli Port 3000 (+6 more)

### Community 52 - "frontend-user/src/components/ui/heroui-alert-dialog.tsx"
Cohesion: 0.18
Nodes (8): AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger(), useAlertDialog()

### Community 53 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 55 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+5 more)

### Community 56 - "admin/login/page.tsx"
Cohesion: 0.33
Nodes (9): AdminLoginPage(), AsterraLogo(), AsterraLogoProps, Card, CardContent, CardDescription, CardFooter, CardHeader (+1 more)

### Community 57 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+5 more)

### Community 58 - "frontend-user/src/app/layout.tsx"
Cohesion: 0.23
Nodes (8): metadata, organizationJsonLd, plusJakartaSans, RootLayout(), ReferralTracker(), ReferralTrackerInner(), fetchActiveCampaigns(), GsapProvider()

### Community 59 - "generate-product-excel.js"
Cohesion: 0.21
Nodes (11): ExcelJS, fs, generateExcel(), getAccountType(), getAvailabilityStatus(), getBrandAndApp(), getCleanProductName(), path (+3 more)

### Community 60 - "better-auth"
Cohesion: 0.18
Nodes (7): authClient, CustomerLogoutOptions, AuthState, useAuthStore, UserProfile, better-auth, zustand

### Community 61 - "NotificationSoundPlayer"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 62 - "frontend-sales/src/app/error.tsx"
Cohesion: 0.24
Nodes (8): ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 63 - "frontend-sales/src/app/layout.tsx"
Cohesion: 0.23
Nodes (7): metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider(), @tanstack/react-query, QueryProvider()

### Community 64 - "sales/login/page.tsx"
Cohesion: 0.38
Nodes (9): SalesLoginContent(), SalesLoginPage(), AsterraLogo(), Card, CardContent, CardDescription, CardFooter, CardHeader (+1 more)

### Community 65 - "NotificationSoundPlayer"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 66 - "moryn/SKILL.md"
Cohesion: 0.18
Nodes (10): Anti-Hallucination Directives  Design Hierarchy, Core Workflow Lifecycle, Direct Native Commands Ultra-Fast 10ms Execution, Moryn Agent Skill, Single Source of Truth SSOT Priority Rules, Step 1 Read Blueprint in Order Personalization  Structure  PRD  Design  Active Task, Step 2 Start the Task, Step 3 Implement Changes with Mandatory Autonomous Component Discovery (+2 more)

### Community 67 - "frontend-user/src/store/use-auth-store.ts"
Cohesion: 0.22
Nodes (7): CustomerLogoutOptions, AuthState, useAuthStore, UserProfile, CartItem, CartState, useCartStore

### Community 68 - "backend/README.md"
Cohesion: 0.20
Nodes (9): 1 Setup Python Environment, 2 Jalankan Server FastAPI, Asterra Store  Core Backend Service Pure FastAPI, Atau langsung dari folder backend, Dari root project, Install dependencies, Quick Start, Setup virtual environment (+1 more)

### Community 69 - "frontend-admin/src/app/layout.tsx"
Cohesion: 0.29
Nodes (6): metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider(), @fortawesome/fontawesome-svg-core

### Community 70 - "frontend-sales/src/lib/utils/url.ts"
Cohesion: 0.31
Nodes (6): SalesRootPage(), authClient, env, getAppBaseUrl(), getStoreBaseUrl(), getStoreUrl

### Community 71 - "frontend-sales/src/lib/utils.ts"
Cohesion: 0.31
Nodes (6): AsterraLogoProps, Badge(), BadgeProps, Label, LabelProps, cn()

### Community 72 - "auth.ts"
Cohesion: 0.24
Nodes (7): GET, POST, appBaseUrl, auth, globalForPrisma, prisma, @prisma/client

### Community 73 - "ref_path"
Cohesion: 0.22
Nodes (4): fs, path, projects, targetArg

### Community 74 - "troubleshooting-vercel-python-uv-deployment.md"
Cohesion: 0.22
Nodes (8): 1 Perbarui python-version ke 312, 2 Selaraskan pyprojecttoml ke Python 312  Konfigurasi Vercel Entrypoint, 3 Generate  Komit uvlock Bersih, 4 Normalisasi Skema Database URI SQLAlchemy 20, Best Practice  Solution, Problem Summary, Root Cause Analysis, Troubleshooting Vercel Python uv Sync Interpreter Version Mismatch

### Community 75 - "frontend-admin/src/lib/utils/chunk-recovery.ts"
Cohesion: 0.31
Nodes (6): GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 76 - "frontend-admin/src/components/ui/dropdown-menu.tsx"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 77 - "frontend-sales/src/components/ui/dropdown-menu.tsx"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 79 - "asterra-referral-profit-architecture.md"
Cohesion: 0.25
Nodes (7): 1 Latar Belakang  Prinsip Utama, 2 Alur  Rumus Waterfall PL, 3 Komponen Teknis  Layanan, 4 Section 8 Audit Trail, Asterra Store  Referral  Profit Distribution Architecture, Hukum Mutlak Strict Zero-Tolerance Protocol, Jaminan Integer Rounding  Presisi

### Community 80 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 81 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 82 - "frontend-sales/src/components/ui/select.tsx"
Cohesion: 0.32
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 83 - "frontend-sales/src/lib/utils/auth-logout.ts"
Cohesion: 0.29
Nodes (4): CustomerLogoutOptions, AuthState, useAuthStore, UserProfile

### Community 84 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 85 - "sync-supabase-to-json.js"
Cohesion: 0.32
Nodes (7): exportAll(), formatProduct(), fs, mapCategory(), path, prisma, { PrismaClient }

### Community 86 - "frontend/SKILL.md"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process brainstorm explore plan critique build critique again, Restraint and self-critique

### Community 87 - "asterra-milestone-50-pricing-sync.md"
Cohesion: 0.29
Nodes (6): 1 Latar Belakang  Rasional Bisnis, 2 Rincian Perubahan Harga Produk 37 Produk Utama, 3 Standardisasi Workbook  Perapihan Semua Tabel, 4 Perintah Operasional Terkait, Asterra Store  Milestone 50 Final Pricing  Database Sync, Standar Struktur 4 Sheet

### Community 88 - "admin-promos-tab.tsx"
Cohesion: 0.33
Nodes (5): AdminPromosTab(), AdminPromosTabProps, PromoCode, PromoUsage, PromoValidationResult

### Community 89 - "frontend-admin/src/store/use-navigation-store.ts"
Cohesion: 0.29
Nodes (4): NavigationState, useNavigationStore, NavigationState, useNavigationStore

### Community 90 - "ref_tailwindcss"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 91 - "daftar-sales/page.tsx"
Cohesion: 0.43
Nodes (5): DaftarSalesContent(), DaftarSalesPage(), PartnerResult, Input, InputProps

### Community 92 - "apply_excel_prices_to_db.js"
Cohesion: 0.33
Nodes (6): formatRupiah(), fs, path, prisma, { PrismaClient }, updateDatabasePrices()

### Community 94 - "troubleshooting-catalog-category-sync-fix.md"
Cohesion: 0.33
Nodes (5): 1 Problem Gejala Bug, 2 Root Cause Penyebab Utama, 3 Solution Solusi yang Diterapkan, 4 Verification  Results, Storefront Catalog Category and AI Tools Synchronization Fix

### Community 95 - "homepage-preloader.tsx"
Cohesion: 0.33
Nodes (4): HomepagePreloaderProps, PreloaderTaskState, TASK_WEIGHTS, TaskStatus

### Community 96 - "Admin Console Modular Architecture.md"
Cohesion: 0.40
Nodes (4): 1 Executive Summary  Design Constitution, 2 Component Structure, 4 Sales Partner Registration System daftar-sales, Asterra Store Admin Console  Modular Architecture  24 Menu Directives

### Community 97 - "asterra-fastapi-unified-integration.md"
Cohesion: 0.40
Nodes (4): Hasil Verifikasi Integrasi, Integrasi Backend FastAPI Asterra Store, Ringkasan Masalah  Akar Penyebab 404, Solusi  Integrasi yang Diterapkan

## Knowledge Gaps
- **208 isolated node(s):** `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `10 Transaksi yang Tidak Menghasilkan Komisi`, `11 Aturan Customer Referral` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 990 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@fortawesome/free-brands-svg-icons` connect `storefront-shell.tsx` to `checkout/page.tsx`, `frontend-user/package.json`, `product-detail-client.tsx`, `profile/page.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `OrderService` (e.g. with `get_user_profile()` and `cancel_order()`) actually correct?**
  _`OrderService` has 29 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }`, `{ signIn, signOut, useSession }` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OrderService` be split into smaller, more focused modules?**
  _Cohesion score 0.05459770114942529 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `frontend-admin/src/components/ui/input.tsx` to `frontend-user/package.json`, `admin/page.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `CatalogService` be split into smaller, more focused modules?**
  _Cohesion score 0.06383619391749473 - nodes in this community are weakly interconnected._
- **Why does `better-auth` connect `better-auth` to `auth.ts`, `frontend-user/package.json`, `profile/page.tsx`, `frontend-sales/src/lib/utils/url.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._