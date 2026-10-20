# Bugfix Requirements Document

## Introduction

Setelah migrasi deployment backend FastAPI ke cloud platform (Railway, Render, Fly.io, atau sejenisnya), semua HTTP request dari frontend menghasilkan error `Unexpected token 'T', "The deploy"... is not valid JSON`. Backend tetap berjalan dan tidak crash, namun cloud platform mengembalikan HTML error page atau non-JSON response ketika ada konfigurasi yang salah — misalnya route tidak ditemukan, env vars tidak ter-set, CORS blocked, atau entrypoint ASGI yang keliru. Akibatnya admin dan sales tidak bisa login, dan seluruh komunikasi API antara frontend dan backend terputus.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN frontend mengirim request HTTP ke endpoint API backend yang telah di-deploy di cloud THEN the system mengembalikan response non-JSON (HTML error page seperti `"The deployment..."`) sehingga JSON parser di frontend throws `Unexpected token 'T'`

1.2 WHEN admin atau sales mengirim POST ke `/api/v1/admin/auth/login` THEN the system mengembalikan non-JSON response dari cloud platform sehingga login gagal dan frontend tidak dapat mem-parse response

1.3 WHEN cloud platform tidak menemukan route atau ASGI handler yang valid THEN the system mengembalikan halaman HTML default dari reverse proxy cloud alih-alih JSON error dari FastAPI

1.4 WHEN environment variables kritis (seperti `DATABASE_URL`, `SECRET_KEY`, `ADMIN_SESSION_SECRET`) tidak ter-set di production THEN the system gagal melakukan operasi yang memerlukan variabel tersebut dan mengembalikan server error yang tidak terstruktur

1.5 WHEN request dari frontend production domain dikirim ke backend THEN the system menolak request karena CORS policy tidak mencakup domain production yang benar, sehingga cloud platform/browser mengembalikan error non-JSON

1.6 WHEN FastAPI app di-deploy dengan entrypoint ASGI yang salah atau `root_path` yang tidak dikonfigurasi untuk cloud platform THEN the system tidak dapat me-route request dengan benar, menyebabkan cloud platform mengembalikan error page HTML

### Expected Behavior (Correct)

2.1 WHEN frontend mengirim request HTTP ke endpoint API backend yang telah di-deploy di cloud THEN the system SHALL selalu mengembalikan JSON response yang valid, baik untuk sukses maupun error

2.2 WHEN admin atau sales mengirim POST ke `/api/v1/admin/auth/login` THEN the system SHALL memproses request dan mengembalikan JSON response dengan `success: true` dan token sesi, atau `success: false` dengan pesan error yang terstruktur dalam JSON

2.3 WHEN cloud platform tidak menemukan route atau ASGI handler yang valid THEN the system SHALL mengembalikan JSON `{"success": false, "error": "..."}` dengan HTTP status code yang sesuai (404, 500) langsung dari FastAPI

2.4 WHEN environment variables kritis tidak ter-set di production THEN the system SHALL mendeteksi kondisi ini pada startup dan mencatat peringatan yang jelas, serta mengembalikan JSON error yang informatif daripada crash tanpa pesan

2.5 WHEN request dari frontend production domain dikirim ke backend THEN the system SHALL menerima request karena CORS policy dikonfigurasi dengan benar untuk semua domain production (`asterrastore.biz.id`, `admin.asterrastore.biz.id`, `sales.asterrastore.biz.id`)

2.6 WHEN FastAPI app di-deploy ke cloud platform THEN the system SHALL dikonfigurasi dengan entrypoint ASGI yang benar dan `root_path` yang sesuai agar semua route dapat di-resolve dengan tepat oleh reverse proxy cloud

### Unchanged Behavior (Regression Prevention)

3.1 WHEN backend berjalan di environment development (localhost) THEN the system SHALL CONTINUE TO merespons semua endpoint API seperti sebelumnya tanpa perubahan perilaku

3.2 WHEN admin mengirim request ke endpoint yang memerlukan autentikasi dengan token yang valid THEN the system SHALL CONTINUE TO memproses request dan mengembalikan data yang diotorisasi

3.3 WHEN request berasal dari IP yang melebihi rate limit THEN the system SHALL CONTINUE TO mengembalikan HTTP 429 dengan JSON `{"success": false, "error": {"code": "TOO_MANY_REQUESTS", ...}}`

3.4 WHEN endpoint `/health` dipanggil THEN the system SHALL CONTINUE TO mengembalikan JSON status `{"status": "ok", ...}` tanpa autentikasi

3.5 WHEN admin/sales mencoba login dengan credential yang salah THEN the system SHALL CONTINUE TO mengembalikan HTTP 401 dengan JSON `{"success": false, "error": {"code": "INVALID_CREDENTIALS", ...}}`

3.6 WHEN request dikirim ke endpoint yang tidak memerlukan autentikasi (storefront catalog, checkout) THEN the system SHALL CONTINUE TO melayani request tersebut tanpa memerlukan session token
