import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

// Base URL of the API. Can be overridden via env: -e BASE_URL=https://mini-concert-booking-app.duckdns.org/api/v1
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081/api/v1';

// Default options for k6. Can be overridden via command line
export const options = {
  stages: [
    { duration: '15s', target: 200 },  // Ramp-up to 200 VUs
    { duration: '15s', target: 500 },  // Ramp-up to 500 VUs
    { duration: '30s', target: 1000 }, // Ramp-up to 1000 VUs
    { duration: '30s', target: 1000 }, // Hold 1000 VUs
    { duration: '15s', target: 0 },    // Ramp-down to 0
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

// Setup phase: runs once at the beginning to fetch active event, available seats, and a shared login token
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
    token: token // Share the token with all VUs
  };
}

// VU (Virtual User) phase: runs concurrently for each user
export default function (data) {
  const vuId = exec.vu.idInTest; // 1-indexed Virtual User ID across the entire test
  const totalVUs = exec.instance.vusInitialized; // Total initialized VUs for the scenario

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`
  };

  // 2. Select a unique seat for this VU and iteration to prevent collisions.
  // We divide the available seats equally among all VUs to ensure they never overlap.
  const seatsPerVU = Math.floor(data.seatIds.length / totalVUs);
  if (seatsPerVU === 0) {
    throw new Error(`Not enough seats (${data.seatIds.length}) for the number of VUs (${totalVUs})`);
  }
  const seatIndex = (vuId - 1) * seatsPerVU + (__ITER % seatsPerVU);
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
