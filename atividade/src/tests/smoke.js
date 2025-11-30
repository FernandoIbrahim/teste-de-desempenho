import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,                // 1 usuário virtual
  duration: '30s',       // por 30 segundos
  thresholds: {
    http_req_failed: ['rate==0'],   // 100% de sucesso (nenhuma falha)
  },
};

export default function () {
  const res = http.get('http://localhost:3000/health');

  check(res, {
    'status é 200': (r) => r.status === 200,
  });

  sleep(1); // pequeno intervalo para não floodar
}