# Deployment Report — LontaraSign PMD Server

**Tanggal deploy:** 2026-05-26  
**Tanggal rebuild & verified:** 2026-05-28  
**Server:** 10.11.3.190 (Kalla Group PMD)  
**Akses:** Teleport `https://teleport3.kallagroup.co.id` → user `pm-budirman`

---

## Status Deployment

| Item | Status |
|------|--------|
| Deploy awal (3 containers) | ✅ 2026-05-26 |
| Fix DB password (`@` → `.`) | ✅ 2026-05-26 |
| Fix nginx `proxy_pass` hostname | ✅ 2026-05-26 |
| Rebuild image (fix permanent) | ✅ 2026-05-28 |

---

## Test Report (2026-05-28)

### Container Status
| Container | Status |
|-----------|--------|
| `lontarasign_frontend` | ✅ Running |
| `lontarasign_backend` | ✅ Running |
| `lontarasign_mysql` | ✅ Running (healthy) |

### Connectivity
| Test | Result |
|------|--------|
| `GET /` (frontend) | ✅ HTTP 200 |
| `POST /api/v1/auth/login` (invalid creds) | ✅ HTTP 401 + JSON response |
| Response: `{"success":false,"message":"Email atau password salah"}` | ✅ DB query jalan |
| nginx `proxy_pass` | ✅ `http://backend:8000` (baked in image) |

### Cara Akses
- **Di kantor / VPN Kalla** → `http://10.11.3.190`
- **Swagger docs** → `http://10.11.3.190/api/v1/docs`

---

## Credentials
Tersimpan di: `D:\project\zidan project\config\lontarasign-pmd.env`

---

## Arsitektur To-Be (Roadmap)

```
Host nginx (Port 80)
├── lontarasign.pmd  → :8101  ← (pindah dari :80)
├── odoo-a.pmd       → :8201  (Prototipe Odoo A)
├── odoo-b.pmd       → :8202  (Prototipe Odoo B)
└── pm-dashboard.pmd → :8301  (PM Dashboard)
```

Phase:
1. ✅ LontaraSign live (port 80 sementara)
2. 🔜 Setup host nginx + pindah ke :8101
3. 🔜 Prototipe Odoo A → :8201
4. 🔜 Prototipe Odoo B → :8202
5. 🔜 PM Dashboard → :8301
