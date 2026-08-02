import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp up to 10 Virtual Users (VUs)
    { duration: '20s', target: 20 }, // Sustained load with 20 VUs
    { duration: '5s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    // 1. SLA Constraint: 95% of API calls respond under 1.5s over public internet to Render
    http_req_duration: ['p(95)<1500'],
    // 2. Error Rate Constraint: Failure rate must stay below 1%
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Target Live Render Deployment Endpoint
  const url = 'https://fraudflux.onrender.com/api/v1/charge/evaluate';

  // Generate dynamic transaction payloads
  const payload = JSON.stringify({
    transaction_id: `k6_tx_${Math.floor(Math.random() * 100000)}`,
    merchant_id: '677995a6-1e94-440d-9d27-79ae5d7d0e88',
    amount: parseFloat((Math.random() * 200 + 10).toFixed(2)),
    currency: 'EUR',
    issuer_country: 'US',
    billing_country: 'US',
    user_id: 'k6_simulated_user'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // Assert response integrity
  check(res, {
    'status is 200': (r) => r.status === 200,
    'decision returned': (r) => r.json() && r.json().hasOwnProperty('decision'),
  });

  sleep(0.1); // Small delay between virtual requests
}