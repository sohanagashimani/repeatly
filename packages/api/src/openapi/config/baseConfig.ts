export default {
  swagger: "2.0",
  info: {
    version: "1.0.0",
    title: "Repeatly API",
    description: "Cron-as-a-Service API for scheduling and managing HTTP jobs",
  },
  host: process.env.API_GATEWAY_HOST, // Update with actual gateway host
  basePath: "/",
  schemes: ["https"],
  securityDefinitions: {
    api_key: {
      type: "apiKey",
      name: "x-api-key",
      in: "header",
    },
  },
  "x-google-backend": {
    address: process.env.API_GATEWAY_BACKEND_ADDRESS || "http://localhost:3003",
  },
  "x-google-management": {
    metrics: [
      {
        name: "requests",
        displayName: "Repeatly API Quota",
        valueType: "INT64",
        metricKind: "DELTA",
      },
    ],
    quota: {
      limits: [
        {
          name: "requests-limit",
          metric: "requests",
          unit: "1/min/{project}",
          values: {
            STANDARD: 1000,
          },
        },
      ],
    },
  },
};
