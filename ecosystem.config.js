// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/index.js", // or "src/index.ts" with ts-node
      env: {
        PORT: 3002,
        NODE_ENV: "production",
      },
    },
  ],
};
