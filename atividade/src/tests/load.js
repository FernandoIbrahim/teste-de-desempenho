import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp-up: 0 -> 50 VUs em 1 minuto
    { duration: '2m', target: 50 }, // Platô: 50 VUs por 2 minutos
    { duration: '30s', target: 0 }, // Ramp-down: 50 -> 0 VUs em 30s
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // erros < 1%
    http_req_duration: ['p(95)<500'], // p95 de latência < 500ms
  },
};

export default function () {
  const url = 'http://localhost:3000/checkout/simple';

  const payload = JSON.stringify({
    // corpo simples só pra simular um checkout
    amount: 100,
    currency: 'BRL',
    items: [
      { id: 'prod-1', quantity: 1 },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status é 201': (r) => r.status === 201,
    'retorna id':     (r) => !!(r.json('id')),
    'status APPROVED': (r) => r.json('status') === 'APPROVED',
  });

  // Pequena pausa para simular comportamento mais realista
  sleep(1);
}