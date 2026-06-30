import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

// Base URL of the API. Can be overridden via env: -e BASE_URL=https://mini-concert-booking-app.duckdns.org/api/v1
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081/api/v1';

// Default options for k6. Can be overridden via command line: k6 run --vus 100 --duration 30s
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp-up to 50 concurrent users
    { duration: '20s', target: 100 }, // Stay at 100 users
    { duration: '10s', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    http_req_duration: ['p(95)<800'], // 95% of requests must complete within 800ms
  },
};

// Helper function to extract token from Set-Cookie header
function extractToken(res) {
  const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie'];
  if (setCookie) {
    const match = setCookie.match(/accessToken=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Setup phase: runs once at the beginning to fetch active event and available seats
export function setup() {
  const loginUrl = `${BASE_URL}/auth/sign-in`;
  const loginPayload = JSON.stringify({
    username: 'staff_load_1',
    password: 'change-me',
  });
  const headers = { 'Content-Type': 'application/json' };

  // Log in as a staff user to get access cookies
  const loginRes = http.post(loginUrl, loginPayload, { headers });
  
  if (loginRes.status !== 200) {
    throw new Error(`Failed to log in during setup phase: ${loginRes.status} ${loginRes.body}`);
  }

  const token = extractToken(loginRes);
  if (!token) {
    throw new Error(`Failed to extract accessToken from login cookies during setup`);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Get active events from staff POS endpoint
  const eventsUrl = `${BASE_URL}/orders/pos/events`;
  const eventsRes = http.get(eventsUrl, { headers: authHeaders });
  
  if (eventsRes.status !== 200) {
    throw new Error(`Failed to fetch POS events during setup: ${eventsRes.status} ${eventsRes.body}`);
  }

  const eventsData = JSON.parse(eventsRes.body);
  const activeEvent = eventsData.data.find(e => e.status === 'ONSALE');

  if (!activeEvent) {
    throw new Error('No ONSALE events found in the database. Please create or update an event to ONSALE.');
  }

  const eventId = activeEvent.id;

  // Get seat catalog for the event
  const catalogUrl = `${BASE_URL}/orders/pos/events/${eventId}/catalog`;
  const catalogRes = http.get(catalogUrl, { headers: authHeaders });

  if (catalogRes.status !== 200) {
    throw new Error(`Failed to fetch seat catalog: ${catalogRes.status} ${catalogRes.body}`);
  }

  const catalogData = JSON.parse(catalogRes.body);
  const availableSeats = catalogData.data.seats
    .filter(s => s.status === 'AVAILABLE')
    .map(s => s.id);

  if (availableSeats.length === 0) {
    throw new Error('No AVAILABLE seats found for the event. Please run the SQL seeding script.');
  }

  console.log(`Setup complete. Target Event: "${activeEvent.name}" (${eventId}). Available Seats: ${availableSeats.length}`);

  return {
    eventId: eventId,
    seatIds: availableSeats,
  };
}

// Global variable within the VU context. Each VU runs in its own JS runtime instance,
// so this token variable is local to each VU and persists across all iterations of the VU.
let token = null;

// VU (Virtual User) phase: runs concurrently for each user
export default function (data) {
  const vuId = exec.vu.idInTest; // 1-indexed Virtual User ID across the entire test
  const totalVUs = exec.instance.vusInitialized; // Total initialized VUs for the scenario
  const username = `staff_load_${vuId}`;
  
  // 1. Sign In as Staff - ONLY ON THE FIRST ITERATION
  if (__ITER === 0 || !token) {
    const loginUrl = `${BASE_URL}/auth/sign-in`;
    const loginPayload = JSON.stringify({
      username: username,
      password: 'change-me',
    });
    const headers = { 'Content-Type': 'application/json' };
    
    const loginRes = http.post(loginUrl, loginPayload, { headers });
    
    const loginCheck = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
    });

    if (!loginCheck) {
      console.error(`VU ${vuId} failed to log in: ${loginRes.status} ${loginRes.body}`);
      sleep(1);
      return;
    }

    token = extractToken(loginRes);
    if (!token) {
      console.error(`VU ${vuId} failed to extract accessToken from login cookies`);
      sleep(1);
      return;
    }
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Select a unique seat for this VU and iteration to prevent collisions.
  // We use exec.vu.idInTest and exec.instance.vusInitialized to distribute seats sequentially.
  // e.g. For 5 VUs:
  //      Iter 0: VU 1 -> index 0, VU 2 -> index 1, ..., VU 5 -> index 4
  //      Iter 1: VU 1 -> index 5, VU 2 -> index 6, ..., VU 5 -> index 9
  const seatIndex = ((vuId - 1) + (__ITER * totalVUs)) % data.seatIds.length;
  const selectedSeatId = data.seatIds[seatIndex];

  // 3. Create POS Order (CASH payment)
  const orderUrl = `${BASE_URL}/orders/pos`;
  const orderPayload = JSON.stringify({
    eventId: data.eventId,
    phone: `09` + String(vuId).padStart(8, '0'),
    fullName: `POS Customer ${vuId}`,
    email: `pos_cust_${vuId}@example.com`,
    seatIds: [selectedSeatId],
    payment: {
      paymentMethod: 'CASH',
      amountReceived: 100000000 // 100M VND, guaranteed to be >= ticket price
    }
  });

  const orderRes = http.post(orderUrl, orderPayload, { headers: authHeaders });
  
  const orderCheck = check(orderRes, {
    'create order status is 200': (r) => r.status === 200,
  });

  if (!orderCheck) {
    console.warn(`VU ${vuId} (Iter ${__ITER}) failed to create POS order for seat ${selectedSeatId}: ${orderRes.status} ${orderRes.body}`);
    sleep(1);
    return;
  }

  const orderData = JSON.parse(orderRes.body);
  const orderCode = orderData.data.orderCode;

  // 4. Get POS Order Details (Verification)
  const getOrderUrl = `${BASE_URL}/orders/pos/${orderCode}`;
  const getOrderRes = http.get(getOrderUrl, { headers: authHeaders });
  
  check(getOrderRes, {
    'get order status is 200': (r) => r.status === 200,
  });

  // Introduce a brief sleep to mimic staff operation pause
  sleep(1);
}
