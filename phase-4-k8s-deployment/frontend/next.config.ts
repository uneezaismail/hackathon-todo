import type { NextConfig } from "next";

// Backend URL - use Kubernetes service name for container deployment
// In local dev, use localhost:8000
const BACKEND_URL = process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://todo-app-backend:8000'
    : 'http://localhost:8000');

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 95],
  },
  async rewrites() {
    return [
      {
        // Proxy task API endpoints to backend
        source: '/api/:userId/tasks/:path*',
        destination: `${BACKEND_URL}/api/:userId/tasks/:path*`,
      },
      {
        // Proxy chatkit endpoint to backend
        source: '/api/chatkit',
        destination: `${BACKEND_URL}/api/chatkit`,
      },
      // Note: /api/auth/* endpoints are handled by frontend Better Auth
      // Do NOT proxy them to backend
    ];
  },
};

export default nextConfig;
