// tests/spike.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const URL = `${BASE_URL}/checkout/simple`;

const TIMEOUT = __ENV.TIMEOUT || "10s";
const THINK_TIME = Number(__ENV.SLEEP || 0.1);

const simpleLatency = new Trend("simple_latency_ms");
const appFailRate = new Rate("app_fail_rate");

export const options = {
  scenarios: {
    spike_simple: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "30s", target: 10 },   // carga baixa por 30s
        { duration: "10s", target: 300 },  // salto imediato p/ 300 em 10s
        { duration: "1m", target: 300 },   // manter 1 minuto
        { duration: "1s", target: 10 },    // queda imediata para 10
        { duration: "20s", target: 10 },   // estabiliza um pouco p/ observação
      ],
      gracefulRampDown: "0s", // queda "seca"
    },
  },

  thresholds: {
    app_fail_rate: ["rate<0.10"],
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<1500"], // ajuste conforme expectativa do seu /checkout/simple
  },
};

export default function () {
  const res = http.post(URL, null, {
    timeout: TIMEOUT,
    tags: { name: "POST /checkout/simple" },
  });

  simpleLatency.add(res.timings.duration);

  const ok = check(res, {
    "status is 2xx/3xx": (r) => r.status >= 200 && r.status < 400,
  });

  appFailRate.add(!ok);

  sleep(THINK_TIME);
}