# Graph Report - Asterra-Store  (2026-10-29)

## Corpus Check
- 445 files · ~3,157,981 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: .css 6, (none) 5, .example 4)

## Summary
- 3446 nodes · 8148 edges · 182 communities (152 shown, 30 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 327 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac682861`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sales.py
- CatalogService
- OrderService
- frontend-user/package.json
- README.md
- typing
- datetime
- frontend-user/src/lib/animations/gsap-utils.ts
- frontend-admin/src/lib/animations/gsap-utils.ts
- sales.py
- frontend-sales/src/lib/animations/gsap-utils.ts
- frontend-sales/src/lib/orders-data.ts
- ref_next
- checkout/page.tsx
- deploy_capcut_logo.py
- asterra-referral-profit-model.md
- checkout/page.tsx
- ref_react
- frontend-admin/src/components/ui/input.tsx
- ref_fortawesome_free_solid_svg_icons
- v1/auth.py
- assets.mjs
- [id]/page.tsx
- ref_react
- frontend-user/src/app/page.tsx
- admin/page.tsx
- sales/sales-trend-chart.tsx
- draw.mjs
- inspect.mjs
- cn
- frontend-user/src/lib/orders-data.ts
- Input
- frontend-sales/src/components/sales/tabs/sales-overview-tab.tsx
- admin-analytics-suite.tsx
- orders/page.tsx
- order_service.py
- compilerOptions
- compilerOptions
- cn
- frontend-sales/src/proxy.ts
- scripts
- frontend-admin/eslint.config.mjs
- dependencies
- PromoService
- frontend-admin/src/components/ui/button.tsx
- SmartCache
- dependencies
- frontend-sales/src/lib/utils/auth-logout.ts
- dependencies
- AdminUserService
- ReferralService
- frontend-admin/package.json
- frontend-user/src/components/ui/heroui-alert-dialog.tsx
- devDependencies
- Button
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
- frontend-admin/src/lib/api-client.ts
- NotificationAudioPlayer
- frontend-admin/src/app/layout.tsx
- frontend-sales/src/lib/utils/url.ts
- frontend-sales/src/lib/utils.ts
- auth.ts
- frontend-sales/package.json
- troubleshooting-vercel-python-uv-deployment.md
- frontend-admin/src/lib/utils/chunk-recovery.ts
- frontend-admin/src/components/ui/dropdown-menu.tsx
- realtime_broadcaster.py
- NotificationSoundPlayer
- asterra-referral-profit-architecture.md
- scripts
- UserNotificationAudioPlayer
- 6. Recipes
- frontend-sales/src/lib/utils/auth-logout.ts
- scripts
- sync-supabase-to-json.js
- charts.js
- asterra-milestone-50-pricing-sync.md
- admin-promos-tab.tsx
- frontend-admin/src/store/use-navigation-store.ts
- ref_tailwindcss
- daftar-sales/page.tsx
- apply_excel_prices_to_db.js
- use-store-operating-hours.tsx
- troubleshooting-catalog-category-sync-fix.md
- homepage-preloader.tsx
- Admin Console Modular Architecture.md
- asterra-fastapi-unified-integration.md
- tailwindcss
- frontend-admin/src/lib/utils/promo-pricing.ts
- frontend-sales/src/lib/utils/promo-pricing.ts
- PromoBanner
- PartnerService
- BannerService
- app-draw.mjs
- frontend-admin/src/lib/utils/referral.ts
- frontend-sales/src/lib/utils/referral.ts
- postcss-load-config
- frontend-sales/postcss.config.mjs
- PasswordResetService
- frontend-user/postcss.config.mjs
- order/page.tsx
- Imagery
- cdp.mjs
- { signIn, signOut, useSession }
- StoreOperatingHoursService
- { signIn, signOut, useSession }
- EmailService
- passlib_context
- HomepageSectionService
- asterra-backend
- Request
- The run
- The study
- use-dynamic-orders.ts
- lint.mjs
- devDependencies
- Layout
- scenes.mjs
- Request
- Colour
- Scroll scenes
- admin-homepage-ordering.tsx
- App screens
- Tells — the dated registry
- Type
- frontend-user/src/lib/utils/referral.ts
- Stage
- 7. Tables and lists
- Words
- product-relevance.ts
- 2. The run for an app screen
- Critique — judging the render
- ASTERRASTORE: ADMIN CONSOLE & SALES PORTAL
- get_cached_brands
- app.json
- tasteskill v2 (`design-taste-frontend`)
- 9. Type and colour
- kinds
- 3. The shell
- 4. The canvas and the page title
- 6. Charts
- Q: kenapa ketika klik checkout, load lama sekali?
- Q: optimasi performa klik bayar sekarang checkout
- Q: semua frontend fetch data sudah pake upstash redis?
- builder
- commerce
- community
- creator
- devtools
- finance
- markets
- report
- smb-admin
- support
- wallet
- workspace
- 8. Forms and settings
- root_tripay_webhook
- fallback_handler
- overrides

## God Nodes (most connected - your core abstractions)
1. `Button` - 70 edges
2. `PartnerService` - 63 edges
3. `OrderService` - 58 edges
4. `Input` - 58 edges
5. `CatalogService` - 53 edges
6. `Badge()` - 52 edges
7. `RealtimeBroadcaster` - 44 edges
8. `VipService` - 43 edges
9. `Button` - 42 edges
10. `CampaignService` - 37 edges

## Surprising Connections (you probably didn't know these)
- `6.4 Marks` --references--> `short()`  [INFERRED]
  .agents/skills/design-taste-frontend/references/app-screens.md → .agents/skills/design-taste-frontend/scripts/assets.mjs
- `test_mandatory_10_scenarios()` --uses--> `PartnerService`  [INFERRED]
  scripts/test_sales_and_masking.py → backend/app/services/partner_service.py
- `test_mandatory_10_scenarios()` --uses--> `AnalyticsService`  [INFERRED]
  scripts/test_sales_and_masking.py → backend/app/services/analytics_service.py
- `test_mandatory_10_scenarios()` --uses--> `FinanceService`  [INFERRED]
  scripts/test_sales_and_masking.py → backend/app/services/finance_service.py
- `test_mandatory_10_scenarios()` --uses--> `ReferralProfitService`  [INFERRED]
  scripts/test_sales_and_masking.py → backend/app/services/referral_profit_service.py

## Import Cycles
- None detected.

## Communities (182 total, 30 thin omitted)

### Community 0 - "sales.py"
Cohesion: 0.08
Nodes (11): create_admin_campaign(), delete_admin_campaign(), evaluate_product_campaign_price(), toggle_admin_campaign(), update_admin_campaign(), lifespan(), periodic_vip_stock_sync_worker(), PromoCampaign (+3 more)

### Community 1 - "CatalogService"
Cohesion: 0.06
Nodes (30): delete_admin_user(), bulk_delete_products(), bulk_status_products(), create_admin_category(), create_admin_product(), delete_admin_category(), delete_admin_product(), get_admin_categories() (+22 more)

### Community 2 - "OrderService"
Cohesion: 0.05
Nodes (39): get_user_profile(), update_user_profile(), acquire_idempotency_lock(), admin_fulfill_order_vip(), admin_sync_order_vip_status(), cancel_order(), create_admin_promo(), create_order() (+31 more)

### Community 3 - "frontend-user/package.json"
Cohesion: 0.06
Nodes (35): author, description, autoprefixer, better-auth, clsx, eslint, eslint-config-next, @eslint/eslintrc (+27 more)

### Community 4 - "README.md"
Cohesion: 0.08
Nodes (40): LogsApiResponse, AdminOrdersTab(), AdminToastCard(), AdminToastCardProps, AdminToastContainer(), AdminToastContainerProps, AdminToastItem, AdminToastMetadata (+32 more)

### Community 5 - "typing"
Cohesion: 0.05
Nodes (27): catch_all(), get_media_file(), upload_admin_media(), get_brand_icon(), create_admin_session_token(), get_admin_auth_secret(), get_current_admin(), get_current_sales_or_admin() (+19 more)

### Community 6 - "datetime"
Cohesion: 0.04
Nodes (54): 10 Operasional Pemeliharaan  Skrip Bantu, 11 Protokol Keamanan  Hardening Produksi, 1 Backend backendenvexamplefilecIqbalDevelopmentProject20LibraryNextJSAsterra20Storebackendenvexample, 1 Gerbang Pembayaran Tripay appservicestripay_service, 1 Kloning repository, 1 Ringkasan Eksekutif  Identitas Proyek, 2 Frontend Applications frontend-envexample, 2 Setup Virtual Environment Python untuk Backend (+46 more)

### Community 7 - "frontend-user/src/lib/animations/gsap-utils.ts"
Cohesion: 0.09
Nodes (12): Commission, Order, OrderItem, SalesPartner, PaymentSetting, Product, ProfitLedger, PromoCode (+4 more)

### Community 8 - "frontend-admin/src/lib/animations/gsap-utils.ts"
Cohesion: 0.09
Nodes (35): checkExistingSession(), POST(), AdminDashboardTabProps, AdminTab, SalesConsoleSuite(), SalesAcademyTab(), SalesCatalogTab(), SalesCatalogTabProps (+27 more)

### Community 9 - "sales.py"
Cohesion: 0.10
Nodes (43): PageTransition(), PageTransitionProps, animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage() (+35 more)

### Community 10 - "frontend-sales/src/lib/animations/gsap-utils.ts"
Cohesion: 0.12
Nodes (39): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+31 more)

### Community 11 - "frontend-sales/src/lib/orders-data.ts"
Cohesion: 0.07
Nodes (25): nextConfig, GET(), POST(), nextConfig, nextConfig, GlobalError(), GlobalErrorProps, FloatingSupport() (+17 more)

### Community 12 - "ref_next"
Cohesion: 0.12
Nodes (39): animateButton(), animateCenterReveal(), animateDaftarSalesPage(), animateFadeUp(), animateFloatingButton(), animateGeneralSubpage(), animateHeroMasterSequence, animateHomepageHero() (+31 more)

### Community 13 - "checkout/page.tsx"
Cohesion: 0.06
Nodes (30): CreateOrderPayload, OrdersApi, OrdersApiResponse, PaymentConfigApi, PaymentConfigResponse, ProductsApi, PromosApi, PromoValidationResponse (+22 more)

### Community 15 - "asterra-referral-profit-model.md"
Cohesion: 0.05
Nodes (39): 10 Transaksi yang Tidak Menghasilkan Komisi, 11 Aturan Customer Referral, 12 Prioritas Referral, 13 Model Ekonomi, 14 Guardrail Margin Produk, 15 Contoh Kasus Lengkap, 16 Aturan Anti-Salah Konsep, 17 Rumus Implementasi (+31 more)

### Community 16 - "checkout/page.tsx"
Cohesion: 0.07
Nodes (39): CheckoutPage(), CheckoutPageContent(), GATEWAY_PAYMENT_METHODS, CheckoutCustomerForm(), CheckoutCustomerFormProps, CheckoutManualModalProps, ManualPaymentModalData, CheckoutPaymentMethods() (+31 more)

### Community 17 - "ref_react"
Cohesion: 0.11
Nodes (38): LoginFormContent(), LoginPage(), formatDate(), formatIDR(), Order, OrderItem, ProfileApiResponse, ProfilePage() (+30 more)

### Community 18 - "frontend-admin/src/components/ui/input.tsx"
Cohesion: 0.11
Nodes (14): addGlobalLog(), addGlobalOrder(), globalForOrders, INITIAL_LOGS, INITIAL_ORDERS, OrderItem, OrderLog, PurchasedDetails (+6 more)

### Community 19 - "ref_fortawesome_free_solid_svg_icons"
Cohesion: 0.10
Nodes (25): NotFound(), AffiliatePage(), dynamic, metadata, revalidate, ErrorBoundary(), ErrorProps, NotFound() (+17 more)

### Community 20 - "v1/auth.py"
Cohesion: 0.11
Nodes (29): ProductDetailClient(), ProductDetailFaqs(), ProductDetailFaqsProps, ProductDetailRelated(), ProductDetailSpecs(), ProductDetailSpecsProps, ProductDetailTabs(), ProductDetailTabsProps (+21 more)

### Community 21 - "assets.mjs"
Cohesion: 0.07
Nodes (85): AIC_FIELDS, AIC_HEADERS, applyThumb(), ARCHIVE_LICENCE, args, argv, base(), clock() (+77 more)

### Community 22 - "[id]/page.tsx"
Cohesion: 0.11
Nodes (19): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap (+11 more)

### Community 23 - "ref_react"
Cohesion: 0.07
Nodes (38): OrderFiltersBarProps, OrderMetrics, OrderMetricsCards(), OrderMetricsCardsProps, BAR_COLORS, calculateYAxisTicks(), PERIOD_TABS, SalesDataPoint (+30 more)

### Community 24 - "frontend-user/src/app/page.tsx"
Cohesion: 0.11
Nodes (43): HomePage(), ProductsContent(), ProductsPage(), SORT_OPTIONS, AppBrandBadge(), ApplicationGroupItem, FeaturedGridCard(), FeaturedGridCardSkeleton() (+35 more)

### Community 25 - "admin/page.tsx"
Cohesion: 0.08
Nodes (54): AdminPage(), AdminPageContent(), RESTRICTED_FOR_OPERATIONAL_ADMIN, TAB_TITLES, AdminAffiliateTab(), AdminAnalyticsSuite(), AdminCategoriesTab(), AdminCategoriesTabProps (+46 more)

### Community 26 - "sales/sales-trend-chart.tsx"
Cohesion: 0.09
Nodes (36): AnimatedBarRevenue(), BAR_COLORS, calculateYAxisTicks(), DAILY_BUCKETS, formatTickLabel(), PERIOD_TABS, SalesDataPoint, SalesPeriod (+28 more)

### Community 27 - "draw.mjs"
Cohesion: 0.10
Nodes (41): adjustments(), argv, assetQueries(), ASSETS_PATH, briefStop(), briefWords(), deal(), dealHero() (+33 more)

### Community 28 - "inspect.mjs"
Cohesion: 0.07
Nodes (26): allow, appMode, args, asJson, dealtFonts, fails, film, HEIGHT (+18 more)

### Community 29 - "cn"
Cohesion: 0.14
Nodes (30): AdminLoginPage(), AdminForgotPasswordContent(), AdminForgotPasswordPage(), AdminResetPasswordContent(), AdminResetPasswordPage(), AsterraLogo(), AsterraLogoProps, Card (+22 more)

### Community 30 - "frontend-user/src/lib/orders-data.ts"
Cohesion: 0.21
Nodes (11): fetchActiveProducts, fetchProductById, generateMetadata(), PageProps, ProductDetailPage(), DEFAULT_STORE_OPERATING_STATUS, getStoreOperatingHoursServer(), ParsedProductSpecs (+3 more)

### Community 31 - "Input"
Cohesion: 0.15
Nodes (12): CDPClient, delay(), getWebSocketDebuggerUrl(), runTest(), evaluate(), setViewport(), CDPClient, delay() (+4 more)

### Community 32 - "frontend-sales/src/components/sales/tabs/sales-overview-tab.tsx"
Cohesion: 0.12
Nodes (42): AdminTab, SalesConsoleSuite(), SalesTrendChartProps, SalesCatalogTab(), SalesCatalogTabProps, Chapter, CHAPTERS, SalesGuidebookTab() (+34 more)

### Community 33 - "admin-analytics-suite.tsx"
Cohesion: 0.13
Nodes (15): AdminAnalyticsSuiteProps, AffiliatePerformanceItem, AnalyticsSuiteData, FinancialReportData, formatRupiahShort(), PeriodBreakdownItem, PeriodDetail, PeriodKpiData (+7 more)

### Community 34 - "orders/page.tsx"
Cohesion: 0.23
Nodes (12): getStatusBadge(), GlobalOrdersContent(), GlobalOrdersPage(), GlobalOrdersPageSkeleton(), GlobalOrdersSkeleton(), STATUS_FILTERS, clearLegacySyntheticTimelineStorage(), formatRelativeTime() (+4 more)

### Community 35 - "order_service.py"
Cohesion: 0.07
Nodes (20): get_admin_customers(), get_admin_logs(), get_analytics_overview(), get_analytics_suite(), get_finance_summary(), get_profit_distribution(), AnalyticsService, AuditLogService (+12 more)

### Community 36 - "compilerOptions"
Cohesion: 0.10
Nodes (19): 1 Executive Summary  Problem Statement, 2 Target Visi 4 Repositori Terpisah, 3 Struktur Folder 4 Proyek Mandiri, 4 Spesifikasi Teknis FastAPI Core Backend, 5 Pembersihan Core Asterra Store Customer App, 6 Arsitektur Keamanan  Autentikasi, 7 Roadmap Eksekusi Bertahap Phased Milestones, Asterra Store  Architecture Decoupling  Multi-Project Separation Plan (+11 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (18): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger (+10 more)

### Community 38 - "cn"
Cohesion: 0.16
Nodes (18): Badge(), BadgeProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+10 more)

### Community 39 - "frontend-sales/src/proxy.ts"
Cohesion: 0.09
Nodes (20): authClient, CustomerLogoutOptions, AuthState, useAuthStore, UserProfile, applySecurityHeaders(), config, getActiveAuthSession() (+12 more)

### Community 40 - "scripts"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "frontend-admin/eslint.config.mjs"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 42 - "dependencies"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 43 - "PromoService"
Cohesion: 0.09
Nodes (5): delete_admin_promo(), get_admin_promos(), update_admin_promo(), PromoService, TestPromoValidation

### Community 44 - "frontend-admin/src/components/ui/button.tsx"
Cohesion: 0.09
Nodes (19): AdminAffiliateTabProps, AffiliatePartner, PayoutRequestItem, AdminFinanceSuiteProps, ExpenseItem, FinanceSummary, JournalEntry, PaymentChannel (+11 more)

### Community 45 - "SmartCache"
Cohesion: 0.11
Nodes (17): description, name, private, scripts, build, build:admin, build:all, build:sales (+9 more)

### Community 46 - "dependencies"
Cohesion: 0.13
Nodes (12): compat, __dirname, eslintConfig, __filename, compat, __dirname, eslintConfig, __filename (+4 more)

### Community 47 - "frontend-sales/src/lib/utils/auth-logout.ts"
Cohesion: 0.29
Nodes (4): CustomerLogoutOptions, AuthState, useAuthStore, UserProfile

### Community 48 - "dependencies"
Cohesion: 0.12
Nodes (16): ACTIVE_CATALOG_PRODUCTS, activeCatalog, browserA, browserB_Incognito, browserC_DifferentDevice, catalogPath, fs, genuineOrdersPath (+8 more)

### Community 49 - "AdminUserService"
Cohesion: 0.17
Nodes (6): create_admin_user(), get_admin_users(), update_admin_user(), admin_auth_login(), admin_auth_me(), AdminUserService

### Community 50 - "ReferralService"
Cohesion: 0.12
Nodes (16): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap, lucide-react (+8 more)

### Community 51 - "frontend-admin/package.json"
Cohesion: 0.06
Nodes (34): author, description, autoprefixer, better-auth, clsx, eslint, eslint-config-next, @eslint/eslintrc (+26 more)

### Community 52 - "frontend-user/src/components/ui/heroui-alert-dialog.tsx"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 53 - "devDependencies"
Cohesion: 0.12
Nodes (16): dependencies, better-auth, clsx, @fortawesome/fontawesome-svg-core, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, gsap, lucide-react (+8 more)

### Community 54 - "Button"
Cohesion: 0.11
Nodes (23): DaftarSalesContent(), DaftarSalesPage(), PartnerResult, NotFound(), ActivePromoCard(), ActivePromoCardProps, COMMISSION_PRESETS, CommissionPreset (+15 more)

### Community 55 - "devDependencies"
Cohesion: 0.17
Nodes (9): AlertDialog, AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger() (+1 more)

### Community 56 - "admin/login/page.tsx"
Cohesion: 0.17
Nodes (3): expire_affiliate_sessions(), ReferralSession, ReferralService

### Community 57 - "devDependencies"
Cohesion: 0.13
Nodes (14): Atau Build Individual, Build Semua 4 Sub-Proyek, Development, Jalankan Admin Console Port 3001, Jalankan FastAPI Python Engine Port 8000, Jalankan Nextjs BFF API Port 4000, Jalankan Sales Console Port 3002, Jalankan Storefront Pembeli Port 3000 (+6 more)

### Community 58 - "frontend-user/src/app/layout.tsx"
Cohesion: 0.18
Nodes (8): AlertDialogBackdrop(), AlertDialogCloseTrigger(), AlertDialogContainer(), AlertDialogContext, AlertDialogContextType, AlertDialogFooter(), AlertDialogTrigger(), useAlertDialog()

### Community 60 - "better-auth"
Cohesion: 0.23
Nodes (9): POST(), SalesRootPage(), checkExistingSession(), authClient, env, getAdminBaseUrl(), getAppBaseUrl(), getStoreBaseUrl() (+1 more)

### Community 61 - "NotificationSoundPlayer"
Cohesion: 0.29
Nodes (16): SalesLoginContent(), SalesLoginPage(), SalesForgotPasswordContent(), SalesForgotPasswordPage(), SalesResetPasswordContent(), SalesResetPasswordPage(), AsterraLogo(), AsterraLogoProps (+8 more)

### Community 62 - "frontend-sales/src/app/error.tsx"
Cohesion: 0.28
Nodes (5): delete_cron_job(), get_qstash_client(), list_cron_jobs(), publish_background_job(), register_cron_job()

### Community 63 - "frontend-sales/src/app/layout.tsx"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+5 more)

### Community 64 - "sales/login/page.tsx"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+5 more)

### Community 65 - "NotificationSoundPlayer"
Cohesion: 0.29
Nodes (7): metadata, organizationJsonLd, plusJakartaSans, RootLayout(), StoreOperatingHoursProvider(), GsapProvider(), QueryProvider()

### Community 66 - "moryn/SKILL.md"
Cohesion: 0.25
Nodes (10): fs, generateExcel(), getAccountType(), getAvailabilityStatus(), getBrandAndApp(), getCleanProductName(), path, prisma (+2 more)

### Community 67 - "frontend-admin/src/lib/api-client.ts"
Cohesion: 0.06
Nodes (36): AdminProductsResponse, VipServicesResponse, AdminPromosTabProps, AdminSidebar(), AdminSidebarProps, NavGroup, NavSubItem, NotificationBadge() (+28 more)

### Community 68 - "NotificationAudioPlayer"
Cohesion: 0.13
Nodes (8): AudioQueueItem, notificationAudio, NotificationAudioPlayer, notificationSound, NotificationSoundType, PlayOptions, playOrderNotificationSound(), SoundType

### Community 69 - "frontend-admin/src/app/layout.tsx"
Cohesion: 0.24
Nodes (8): ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 70 - "frontend-sales/src/lib/utils/url.ts"
Cohesion: 0.29
Nodes (5): metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider()

### Community 71 - "frontend-sales/src/lib/utils.ts"
Cohesion: 0.27
Nodes (4): notificationSound, NotificationSoundPlayer, playOrderNotificationSound(), SoundType

### Community 72 - "auth.ts"
Cohesion: 0.18
Nodes (10): Anti-Hallucination Directives  Design Hierarchy, Core Workflow Lifecycle, Direct Native Commands Ultra-Fast 10ms Execution, Moryn Agent Skill, Single Source of Truth SSOT Priority Rules, Step 1 Read Blueprint in Order Personalization  Structure  PRD  Design  Active Task, Step 2 Start the Task, Step 3 Implement Changes with Mandatory Autonomous Component Discovery (+2 more)

### Community 73 - "frontend-sales/package.json"
Cohesion: 0.06
Nodes (34): author, description, autoprefixer, better-auth, clsx, eslint, eslint-config-next, @eslint/eslintrc (+26 more)

### Community 74 - "troubleshooting-vercel-python-uv-deployment.md"
Cohesion: 0.20
Nodes (9): 1 Setup Python Environment, 2 Jalankan Server FastAPI, Asterra Store  Core Backend Service Pure FastAPI, Atau langsung dari folder backend, Dari root project, Install dependencies, Quick Start, Setup virtual environment (+1 more)

### Community 75 - "frontend-admin/src/lib/utils/chunk-recovery.ts"
Cohesion: 0.33
Nodes (5): metadata, plusJakartaSans, RootLayout(), GsapProvider(), QueryProvider()

### Community 76 - "frontend-admin/src/components/ui/dropdown-menu.tsx"
Cohesion: 0.22
Nodes (4): fs, path, projects, targetArg

### Community 77 - "realtime_broadcaster.py"
Cohesion: 0.16
Nodes (4): event_generator(), sse_events(), sse_options(), _dispatch()

### Community 78 - "NotificationSoundPlayer"
Cohesion: 0.22
Nodes (8): 1 Perbarui python-version ke 312, 2 Selaraskan pyprojecttoml ke Python 312  Konfigurasi Vercel Entrypoint, 3 Generate  Komit uvlock Bersih, 4 Normalisasi Skema Database URI SQLAlchemy 20, Best Practice  Solution, Problem Summary, Root Cause Analysis, Troubleshooting Vercel Python uv Sync Interpreter Version Mismatch

### Community 79 - "asterra-referral-profit-architecture.md"
Cohesion: 0.24
Nodes (8): ErrorBoundary(), ErrorProps, GlobalError(), GlobalErrorProps, CHUNK_ERROR_PATTERNS, CHUNK_RECOVERY_KEY, isChunkLoadError(), tryRecoverFromChunkError()

### Community 80 - "scripts"
Cohesion: 0.27
Nodes (7): SalesPortalContent(), SalesPortalPage(), TAB_TITLES, AdminSidebar(), AdminSidebarProps, NavGroup, NavSubItem

### Community 81 - "UserNotificationAudioPlayer"
Cohesion: 0.17
Nodes (8): AudioQueueItem, notificationAudio, notificationSound, NotificationSoundType, PlayOptions, playOrderNotificationSound(), SoundType, UserNotificationAudioPlayer

### Community 82 - "6. Recipes"
Cohesion: 0.06
Nodes (31): 10. Rules for motion, 1. The budget, 2. What strong pages do with motion, 3. Four questions before any animation, 4. Tokens, 5. Scroll behaviours, ranked, 6. Recipes, 7. Signature moves (+23 more)

### Community 83 - "frontend-sales/src/lib/utils/auth-logout.ts"
Cohesion: 0.25
Nodes (7): 1 Latar Belakang  Prinsip Utama, 2 Alur  Rumus Waterfall PL, 3 Komponen Teknis  Layanan, 4 Section 8 Audit Trail, Asterra Store  Referral  Profit Distribution Architecture, Hukum Mutlak Strict Zero-Tolerance Protocol, Jaminan Integer Rounding  Presisi

### Community 84 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 85 - "sync-supabase-to-json.js"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 86 - "charts.js"
Cohesion: 0.21
Nodes (24): axes(), bars(), dayHeads(), diverging(), frame(), hits(), kindStyle(), lane() (+16 more)

### Community 87 - "asterra-milestone-50-pricing-sync.md"
Cohesion: 0.25
Nodes (8): scripts, build, dev, export:excel, format, format:check, lint, start

### Community 88 - "admin-promos-tab.tsx"
Cohesion: 0.32
Nodes (7): exportAll(), formatProduct(), fs, mapCategory(), path, prisma, { PrismaClient }

### Community 89 - "frontend-admin/src/store/use-navigation-store.ts"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process brainstorm explore plan critique build critique again, Restraint and self-critique

### Community 90 - "ref_tailwindcss"
Cohesion: 0.29
Nodes (6): 1 Latar Belakang  Rasional Bisnis, 2 Rincian Perubahan Harga Produk 37 Produk Utama, 3 Standardisasi Workbook  Perapihan Semua Tabel, 4 Perintah Operasional Terkait, Asterra Store  Milestone 50 Final Pricing  Database Sync, Standar Struktur 4 Sheet

### Community 91 - "daftar-sales/page.tsx"
Cohesion: 0.29
Nodes (4): NavigationState, useNavigationStore, NavigationState, useNavigationStore

### Community 92 - "apply_excel_prices_to_db.js"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 93 - "use-store-operating-hours.tsx"
Cohesion: 0.22
Nodes (13): HeroBannerSwiper, StoreClosedAnnouncementBar(), StoreClosedBanner(), StoreHoursApi, StoreOperatingHoursStatus, fetchHeroBanners(), INITIAL_STOREFRONT_BANNERS, PromoBannerItem (+5 more)

### Community 94 - "troubleshooting-catalog-category-sync-fix.md"
Cohesion: 0.29
Nodes (7): @prisma/client, formatRupiah(), fs, path, prisma, { PrismaClient }, updateDatabasePrices()

### Community 96 - "Admin Console Modular Architecture.md"
Cohesion: 0.33
Nodes (5): 1 Problem Gejala Bug, 2 Root Cause Penyebab Utama, 3 Solution Solusi yang Diterapkan, 4 Verification  Results, Storefront Catalog Category and AI Tools Synchronization Fix

### Community 97 - "asterra-fastapi-unified-integration.md"
Cohesion: 0.40
Nodes (4): 1 Executive Summary  Design Constitution, 2 Component Structure, 4 Sales Partner Registration System daftar-sales, Asterra Store Admin Console  Modular Architecture  24 Menu Directives

### Community 98 - "tailwindcss"
Cohesion: 0.40
Nodes (4): Hasil Verifikasi Integrasi, Integrasi Backend FastAPI Asterra Store, Ringkasan Masalah  Akar Penyebab 404, Solusi  Integrasi yang Diterapkan

### Community 102 - "PartnerService"
Cohesion: 0.22
Nodes (4): get_admin_affiliates(), get_admin_payout_requests(), PayoutRequest, PartnerService

### Community 103 - "BannerService"
Cohesion: 0.13
Nodes (5): delete_promo_banner(), toggle_promo_banner_status(), upload_promo_banner(), PromoBanner, BannerService

### Community 104 - "app-draw.mjs"
Cohesion: 0.11
Nodes (22): argv, deal(), dealScreen(), dealShell(), dealStyle(), fontLink(), HERE, kebab() (+14 more)

### Community 109 - "postcss-load-config"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 111 - "PasswordResetService"
Cohesion: 0.19
Nodes (3): forgot_password_request_otp(), PasswordResetService, TestPasswordResetFlow

### Community 113 - "order/page.tsx"
Cohesion: 0.16
Nodes (20): cleanCustomerNotes(), isSafeLicenseCredential(), PrivateOrderContent(), PrivateOrderPage(), CheckoutManualModal(), CredentialItem, OrderCredentialsCard(), OrderCredentialsCardProps (+12 more)

### Community 117 - "Imagery"
Cohesion: 0.09
Nodes (22): 10. Markup and credits, 11. Video, 12. Where pictures and footage go, 1. What the study measured, 2. Decide what imagery exists, 3. Real pictures from the open collections, 4. The dealt photographs, 5. Cropping and placing (+14 more)

### Community 120 - "cdp.mjs"
Cohesion: 0.16
Nodes (6): alive(), Browser, findChrome(), Page, sleep(), sweepProfiles()

### Community 125 - "StoreOperatingHoursService"
Cohesion: 0.15
Nodes (4): get_admin_store_operating_hours(), get_store_operating_hours(), update_admin_store_operating_hours(), StoreOperatingHoursService

### Community 129 - "HomepageSectionService"
Cohesion: 0.17
Nodes (3): update_admin_homepage_section(), HomepageProductSection, HomepageSectionService

### Community 131 - "Request"
Cohesion: 0.18
Nodes (14): create_admin_affiliate(), get_active_campaigns(), get_admin_campaigns(), get_sales_campaigns(), get_sales_me(), get_sales_network(), get_sales_orders(), process_admin_affiliate_payout() (+6 more)

### Community 132 - "The run"
Cohesion: 0.11
Nodes (17): 10. Report, 1. Read the brief and the project, 2. Write the argument, 3. Draw the direction, 4. Find the idea, 5. Write the words, 6. Build it, still, 7. Gate (+9 more)

### Community 133 - "The study"
Cohesion: 0.12
Nodes (15): 10. The 25 highest-scored sites and their ideas, 11. How the skill was tested, 12. The October 2026 study: 100 Sites of the Day, 13. The app-screen study, 1. Method and its limits, 2. Scores, 3. Where the idea comes from, 4. Headlines (+7 more)

### Community 134 - "use-dynamic-orders.ts"
Cohesion: 0.18
Nodes (14): ACTIVE_CATALOG_PRODUCTS, generateMaskedCustomerName(), getDeterministicSimulationOrders(), getDynamicSoldCount(), getProductSoldConfig(), GLOBAL_SIMULATION_EPOCH, hashPRNG(), INDONESIAN_FIRST_NAMES (+6 more)

### Community 135 - "lint.mjs"
Cohesion: 0.14
Nodes (13): APP_LEVEL, appMode, args, asJson, byId, EXT, files, findings (+5 more)

### Community 136 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, exceljs, postcss, prettier (+6 more)

### Community 137 - "Layout"
Cohesion: 0.15
Nodes (12): 10. How pages fail, 1. What strong pages do, 2. Margins and the grid, 3. Where text sits, 4. Empty space, 5. The frame: margins, balance and titles, 6. Sections: carry the idea, vary the arrangement, 7. Navigation (+4 more)

### Community 138 - "scenes.mjs"
Cohesion: 0.19
Nodes (9): args, go(), only, outDir, problems, rel(), run(), sheet() (+1 more)

### Community 139 - "Request"
Cohesion: 0.26
Nodes (10): admin_auth_logout(), auth_login(), auth_register(), forgot_password_request_link(), forgot_password_resend_otp(), forgot_password_reset(), forgot_password_reset_with_token(), forgot_password_verify_otp() (+2 more)

### Community 140 - "Colour"
Cohesion: 0.17
Nodes (11): 1. What the study measured, 2. The roles, 3. Proportion, 4. Surfaces without lines or shadows, 5. Colour fields, 6. Dark pages, 7. Colour and photographs, 8. Contrast (+3 more)

### Community 141 - "Scroll scenes"
Cohesion: 0.17
Nodes (11): 1. What a scene is, 2. Putting a scene on a page, 3. Filling it, 4. Fitting it to the page, 5. The phone, reduced motion, no script, 6. Checking it, 7. Rules for scenes, 8. When no scene in the library fits (+3 more)

### Community 142 - "admin-homepage-ordering.tsx"
Cohesion: 0.21
Nodes (10): ADMIN_PRODUCT_DEFINITIONS, AdminProductGroup, AdminProductItem, HomepageProductItem, ProductBrandLogo(), SectionKey, SectionsResponse, BRAND_ICONS_MAP (+2 more)

### Community 143 - "App screens"
Cohesion: 0.18
Nodes (10): 10. Density, 11. Empty, zero, loading and error states, 12. The phone, 13. House rules for app screens, 14. Tells of generated dashboards, 1. When this applies, 5. KPIs, App screens (+2 more)

### Community 144 - "Tells — the dated registry"
Cohesion: 0.18
Nodes (10): 1. First wave (2023–2024), 2. Second wave (2025), 3. Third wave (2025–2026): the "fix" that became the look, 4. Gallery fashion, banned as house style, 5. Structural tells, 6. Copy tells, 7. Motion tells, 8. Why removal is not enough (+2 more)

### Community 145 - "Type"
Cohesion: 0.18
Nodes (10): 1. What the study measured, 2. The scale: few sizes, far apart, 3. Setting display type, 4. Setting text, 5. Loading the fonts properly, 6. One family or two, 7. Details that separate set type from typed text, 8. Mistakes the inspector cannot see (+2 more)

### Community 146 - "frontend-user/src/lib/utils/referral.ts"
Cohesion: 0.31
Nodes (7): ReferralTracker(), ReferralTrackerInner(), fetchActiveCampaigns(), clearCampaignSession(), getActiveReferralParams(), getReferralSessionId(), removeCampaignUrlParams()

### Community 148 - "7. Tables and lists"
Cohesion: 0.20
Nodes (10): 7.1 Rows, 7.2 Header, 7.3 Dividers, 7.4 Figures and alignment, 7.5 Ink inside rows, 7.6 Status pills, 7.7 Media, 7.8 Actions and paging (+2 more)

### Community 149 - "Words"
Cohesion: 0.20
Nodes (9): 1. Write the argument first, 2. The two-line headline, 3. Headline shapes that work, 4. Supporting line, body, buttons, 5. Proof without inventing it, 6. Things that read as generated, 7. Micro-typography, Contents (+1 more)

### Community 150 - "product-relevance.ts"
Cohesion: 0.27
Nodes (9): AI_KEYWORDS, DESIGN_KEYWORDS, extractCoreBrand(), extractDuration(), findRelevantProducts(), getEcosystem(), PRODUCTIVITY_KEYWORDS, ScoredProduct (+1 more)

### Community 151 - "2. The run for an app screen"
Cohesion: 0.22
Nodes (9): 2.1 Inventory the data and the jobs, 2.2 Name the screen's one question, 2.3 Choose a style, 2.4 Build the shell, 2.5 Put in the data, 2.6 Build the states, 2.7 The check, 2.8 Report (+1 more)

### Community 152 - "Critique — judging the render"
Cohesion: 0.22
Nodes (8): 1. How to look, 2. The score, 3. Caps, 4. Writing the critique, 5. What to fix first, 6. When to stop, Contents, Critique — judging the render

### Community 153 - "ASTERRASTORE: ADMIN CONSOLE & SALES PORTAL"
Cohesion: 0.22
Nodes (8): 1. ADMIN CONSOLE ASTERRASTORE, 2. SALES PORTAL ASTERRASTORE (PORTAL MITRA PENJUALAN), 3. PRINSIP DESAIN VISUAL & MOTION (STANDAR MONETIRA), 4. INTEGRASI & KEAMANAN SISTEM, A. Fitur & Komponen Utama Halaman Admin, A. Fitur & Komponen Utama Halaman Sales, ASTERRASTORE: ADMIN CONSOLE & SALES PORTAL, DOKUMENTASI & DESKRIPSI LENGKAP

### Community 154 - "get_cached_brands"
Cohesion: 0.38
Nodes (4): get_cached_brands(), _load_disk_cache(), _save_to_disk_cache(), search_brands()

### Community 155 - "app.json"
Cohesion: 0.33
Nodes (5): about, patterns, shells, styles, version

### Community 156 - "tasteskill v2 (`design-taste-frontend`)"
Cohesion: 0.33
Nodes (6): Contents, How it works, Install, Notes, Requirements, tasteskill v2 (`design-taste-frontend`)

### Community 157 - "9. Type and colour"
Cohesion: 0.33
Nodes (6): 9.1 Type, 9.2 Colour on light screens, 9.3 Colour on dark screens, 9.4 Surfaces, radius, icons, spacing, 9.5 Default tokens, 9. Type and colour

### Community 158 - "kinds"
Cohesion: 0.40
Nodes (5): note, screens, styles, kinds, analytics

### Community 159 - "3. The shell"
Cohesion: 0.40
Nodes (5): 3.1 Five archetypes, 3.2 Sidebar, 3.3 Top bar, 3.4 Right rail and pinned columns, 3. The shell

### Community 160 - "4. The canvas and the page title"
Cohesion: 0.40
Nodes (5): 4.1 Width and gutters, 4.2 One left edge, one right edge, 4.3 The title, 4.4 Tabs, filters and the date range, 4. The canvas and the page title

### Community 161 - "6. Charts"
Cohesion: 0.40
Nodes (5): 6.1 Which chart for which question, 6.2 One question, one series, 6.3 Axes and gridlines, 6.4 Marks, 6. Charts

### Community 162 - "Q: kenapa ketika klik checkout, load lama sekali?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: kenapa ketika klik checkout, load lama sekali?, Source Nodes

### Community 163 - "Q: optimasi performa klik bayar sekarang checkout"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: optimasi performa klik bayar sekarang checkout, Source Nodes

### Community 164 - "Q: semua frontend fetch data sudah pake upstash redis?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: semua frontend fetch data sudah pake upstash redis?, Source Nodes

### Community 165 - "builder"
Cohesion: 0.50
Nodes (4): note, screens, styles, builder

### Community 166 - "commerce"
Cohesion: 0.50
Nodes (4): note, screens, styles, commerce

### Community 167 - "community"
Cohesion: 0.50
Nodes (4): note, screens, styles, community

### Community 168 - "creator"
Cohesion: 0.50
Nodes (4): note, screens, styles, creator

### Community 169 - "devtools"
Cohesion: 0.50
Nodes (4): note, screens, styles, devtools

### Community 170 - "finance"
Cohesion: 0.50
Nodes (4): note, screens, styles, finance

### Community 171 - "markets"
Cohesion: 0.50
Nodes (4): markets, note, screens, styles

### Community 172 - "report"
Cohesion: 0.50
Nodes (4): report, note, screens, styles

### Community 173 - "smb-admin"
Cohesion: 0.50
Nodes (4): smb-admin, note, screens, styles

### Community 174 - "support"
Cohesion: 0.50
Nodes (4): support, note, screens, styles

### Community 175 - "wallet"
Cohesion: 0.50
Nodes (4): wallet, note, screens, styles

### Community 176 - "workspace"
Cohesion: 0.50
Nodes (4): workspace, note, screens, styles

### Community 177 - "8. Forms and settings"
Cohesion: 0.50
Nodes (4): 8.1 Fields, 8.2 Settings layout, 8.3 Buttons, 8. Forms and settings

## Knowledge Gaps
- **271 isolated node(s):** `asterra-backend`, `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `@radix-ui/react-dropdown-menu` (+266 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1540 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@fortawesome/free-brands-svg-icons` connect `ref_react` to `checkout/page.tsx`, `frontend-sales/src/lib/orders-data.ts`, `frontend-user/package.json`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `asterra-backend`, `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons` to the rest of the system?**
  _271 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sales.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08048103607770583 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `troubleshooting-catalog-category-sync-fix.md` to `admin-promos-tab.tsx`, `moryn/SKILL.md`, `frontend-user/package.json`, `frontend-sales/src/proxy.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `CatalogService` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._
- **Why does `OrderService` connect `OrderService` to `sales.py`, `HomepageSectionService`, `CatalogService`, `order_service.py`, `typing`, `PartnerService`, `frontend-user/src/lib/animations/gsap-utils.ts`, `PromoService`, `admin/login/page.tsx`, `EmailService`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Should `OrderService` be split into smaller, more focused modules?**
  _Cohesion score 0.04686868686868687 - nodes in this community are weakly interconnected._