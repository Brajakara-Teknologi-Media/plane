# Production Deployment Steps

## Phase 1: Prepare Infrastructure (Server Prod)

### Step 1 — Create New Database
```bash
psql -h 10.20.0.13 -p 2800 -U plane -c "CREATE DATABASE plane_new;"
```

### Step 2 — Copy Files to Server
```bash
# Di server prod, buat folder:
mkdir -p /opt/plane
cd /opt/plane

# Copy dari build machine:
# - docker-compose.prod.yml
# - .env.production
```

### Step 3 — Login to Registry
```bash
docker login docker-registry.blitztechnology.tech
```

---

## Phase 2: Build Images (Build Machine)

### Step 4 — Build & Push All Images
```bash
cd /home/lazarus/aviao
chmod +x build-prod.sh
./build-prod.sh http://10.20.0.11:8082
```
Tunggu hingga semua image ter-push ke registry.

---

## Phase 3: Deploy (Server Prod)

### Step 5 — Migrate Database Structure (Create Tables)
```bash
cd /opt/plane
docker compose -f docker-compose.prod.yml run --rm api-ts bunx prisma migrate deploy
```
Output harusnya: `5 migrations have been applied`.

### Step 6 — Seed Database (Create Default Roles & Admin User)
```bash
docker compose -f docker-compose.prod.yml run --rm api-ts bun run scripts/seed.ts
```

### Step 7 — Migrate Data from Plane CE Old DB
```bash
docker compose -f docker-compose.prod.yml run --rm sac-migrator
```
Tunggu hingga selesai (bisa lama tergantung ukuran data).

### Step 8 — Start All Services
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Step 9 — Verify Services Running
```bash
docker compose -f docker-compose.prod.yml ps
```
Pastikan semua `running`.

### Step 10 — Test Access
- Web: `http://10.20.0.11:8082`
- Admin: `http://10.20.0.11:8082/god-mode`
- API Health: `http://10.20.0.11:8082/api/v1/health/`

### Step 11 — Configure S3/Minio (via Admin Panel)
1. Login ke `http://10.20.0.11:8082/god-mode` dengan credentials dari seeder
2. Go to **Instance Configuration**
3. Fill S3 Settings:
   - Endpoint: `https://minio.blitztechnology.tech`
   - Bucket: `plane-uploads`
   - Access Key: `plane-access`
   - Secret Key: `pl4ne0ngh0st`
   - Region: `us-east-1`

---

## For Future Updates

### Build New Images
```bash
./build-prod.sh http://10.20.0.11:8082
```

### Deploy Updated Images
```bash
cd /opt/plane
docker compose -f docker-compose.prod.yml up -d --pull always
```

### If Database Schema Changes
```bash
docker compose -f docker-compose.prod.yml run --rm api-ts bunx prisma migrate deploy
```
