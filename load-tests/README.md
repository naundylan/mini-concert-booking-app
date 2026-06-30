# Concert Booking - Concurrent Request Load Testing (k6)

This load testing suite is designed to test the concert ticket booking flow under high concurrency (e.g. 1,000 concurrent customers). It uses **k6**, a modern, lightweight load testing tool built in Go, which is highly resource-efficient and perfect for running on a VPS.

---

## 1. Prerequisites

### Install k6
- **Windows (using Winget):**
  ```bash
  winget install grafana.k6
  ```
- **macOS (using Homebrew):**
  ```bash
  brew install k6
  ```
- **Linux (Debian/Ubuntu VPS):**
  ```bash
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17DEC7390287
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

---

## 2. Database Preparation (Seeding)

Since the production system uses Google OAuth for customers, automating customer login directly in load tests is not feasible. The k6 load test uses the **Staff POS flow**.

To allow `k6` virtual users to log in and make bookings, you must seed **1,000 local staff accounts**, as well as **2,000 available seats** and customer accounts into the database.

Run the following commands in your terminal from the project root:

```bash
# 1. Seed events, seats, and load customers
Get-Content load-tests\sql\seed_customers.sql -Raw | docker exec -i ticket_postgres psql -U postgres -d "mini-concert-booking-app"

# 2. Seed 1,000 staff users for k6 virtual users authentication
Get-Content load-tests\sql\seed_staff.sql -Raw | docker exec -i ticket_postgres psql -U postgres -d "mini-concert-booking-app"
```

---

## 3. Running the Load Test

### Local Execution (Default Staging Load)
Runs the test against your local development environment:
```bash
k6 run load-tests/scripts/booking_load_test.js
```

### VPS Execution (Custom Concurrency)
To run the test against your VPS deployment, pass the `BASE_URL` environment variable and override the virtual users (`--vus`) and duration (`--duration`):

```bash
# Simulate 1,000 concurrent staff users booking tickets via POS for 30 seconds
k6 run --vus 1000 --duration 30s -e BASE_URL=https://mini-concert-booking-app.duckdns.org/api/v1 load-tests/scripts/booking_load_test.js
```

---

## 4. VPS Tuning for High Concurrency (1,000+ Requests)

When running 1,000+ concurrent connections, Linux OS defaults on a VPS can block requests due to connection limitations. Execute these optimizations on your VPS before launching high-concurrency tests:

### A. Increase Open File Descriptor Limits
The default maximum open files per process on Linux is usually `1024`, which is insufficient for 1,000+ concurrent connections.
```bash
# Check current limit
ulimit -n

# Set limit to 65535 temporarily for the current terminal session
ulimit -n 65535
```

To make it permanent, append the following to `/etc/security/limits.conf`:
```text
* soft nofile 65535
* hard nofile 65535
```

### B. Optimize TCP Port/Socket Recycling
Under high load, sockets enter a `TIME_WAIT` state after closing, which can exhaust the ephemeral port range. Add these sysctl tunings to `/etc/sysctl.conf` and apply with `sudo sysctl -p`:
```text
# Enable fast recycling of TIME_WAIT sockets
net.ipv4.tcp_tw_reuse = 1

# Increase max backlog queue size for connections
net.core.somaxconn = 8192

# Increase ephemeral port range
net.ipv4.ip_local_port_range = 1024 65000
```
