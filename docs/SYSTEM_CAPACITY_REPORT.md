# ⚡ Tabibi AI (طبيبي) — System Capacity & Performance Scaling Analysis

> **Scope**: Technical load capacity, hardware sizing, database latency, throughput limits, and horizontal scaling roadmap.

---

## 1. Resource Consumption per Doctor (Benchmark Metrics)

Based on a typical doctor receiving **50 patient conversations / day** (~250 incoming messages / day):

- **Database Storage**: ~1.5 MB / month per doctor (Messages, Appointments, Analytics).
- **RAM Footprint**: ~15 MB active memory per doctor context.
- **Network Bandwidth**: ~2.5 MB / month per doctor for Webhook payloads.
- **OpenAI Token Consumption**: ~10 LLM calls / day per doctor (due to 80%+ code-first rule matching).

---

## 2. Infrastructure Capacity Matrix

| Doctor Scale | RAM Requirement | CPU Specs | Database Specs | Infrastructure Sizing | Scaling Bottleneck |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **10 Doctors** | 2 GB RAM | 1 vCPU | SQLite / PostgreSQL | Single VPS (€6/mo) | None (0% CPU pressure) |
| **25 Doctors** | 4 GB RAM | 2 vCPU | PostgreSQL | Single VPS (€12/mo) | SQLite file lock if not using PG |
| **50 Doctors** | 8 GB RAM | 4 vCPU | PostgreSQL + Redis | Dedicated VPS (€24/mo) | Concurrent Webhook HTTP connections |
| **100 Doctors**| 16 GB RAM | 8 vCPU | Managed PostgreSQL | 2 Load Balanced Nodes | Managed DB connection pooling (PgBouncer) |
| **250 Doctors**| 32 GB RAM | 16 vCPU | Managed PG + Redis | Cluster (3 Web Nodes) | External WhatsApp Webhook rate limits |
| **500 Doctors**| 64 GB RAM | 32 vCPU | Multi-AZ PG Cluster | Cluster (5 Web Nodes) | n8n execution queue delay |
| **1000 Doctors**| 128 GB RAM | 64 vCPU | Sharded DB Cluster | Microservices Stack | OpenAI API rate limit tier (Tier 4 required) |

---

## 3. Recommended Production Stack per Scale

### Phase 1: 1 – 50 Doctors (Single Node Architecture)
- **Host**: Hetzner Cloud CPX31 (4 vCPU, 8GB RAM, 160GB NVMe). Cost: ~€14 / month.
- **Database**: Local PostgreSQL container inside Docker Compose.
- **Capacity**: Easily handles 2,500 daily conversations with average response time **< 350ms**.

### Phase 2: 50 – 250 Doctors (Distributed Multi-Node Stack)
- **Host**: Hetzner Cloud Cluster or DigitalOcean Kubernetes.
- **Database**: Managed PostgreSQL + PgBouncer connection pooler + Redis cache.
- **n8n**: Multi-worker queue mode (`n8n-worker`).
