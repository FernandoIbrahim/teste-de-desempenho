// tests/stress.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const URL = `${BASE_URL}/checkout/crypto`;

const TIMEOUT = __ENV.TIMEOUT || "10s";
const THINK_TIME = Number(__ENV.SLEEP || 0.05); // baixo, para estressar

const cryptoLatency = new Trend("crypto_latency_ms");
const appFailRate = new Rate("app_fail_rate");

export const options = {
  scenarios: {
    stress_crypto: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 200 },  // 0 -> 200 em 2 min
        { duration: "2m", target: 500 },  // 200 -> 500 em 2 min
        { duration: "2m", target: 1000 }, // 500 -> 1000 em 2 min
        { duration: "30s", target: 1000 }, // segurar pico p/ observar
        { duration: "30s", target: 0 },    // ramp down
      ],
      gracefulRampDown: "30s",
    },
  },

  // Não “quebra” o teste se falhar, mas deixa muito claro no output
  thresholds: {
    app_fail_rate: ["rate<0.20"],          // ajuste: tolerância durante stress
    http_req_failed: ["rate<0.20"],
    http_req_duration: ["p(95)<5000"],     // p95 < 5s (ajuste conforme meta)
  },
};

export default function () {
  const res = http.post(URL, null, {
    timeout: TIMEOUT,
    tags: { name: "POST /checkout/crypto" },
  });

  cryptoLatency.add(res.timings.duration);

  const ok = check(res, {
    "status is 201": (r) => r.status === 201,
  });

  appFailRate.add(!ok);

  sleep(THINK_TIME);
}