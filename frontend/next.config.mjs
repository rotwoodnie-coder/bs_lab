/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bs-lab/ui", "dompurify"],
  async rewrites() {
    /**
     * 本地开发：将前端同源路径 /v2/* 代理到后端服务，方便浏览器直接访问并验证 Cookie Session。
     * - 前端 dev server: http://localhost:4200
     * - 后端 core api:   http://localhost:4100
     */
    return [
      {
        source: "/v2/:path*",
        destination: "http://localhost:4100/v2/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/console/settings/experiments/catalog",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/settings/experiments/catalog/:path*",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/resources/experiment-catalog",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/resources/experiment-catalog/:path*",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/researcher/curriculum-standards",
        destination: "/console/settings/experiments",
        permanent: false,
      },
      {
        source: "/researcher/curriculum-standards/:path*",
        destination: "/console/settings/experiments",
        permanent: false,
      },
      {
        source: "/researcher/standards/experiments",
        destination: "/experiment-manage",
        permanent: false,
      },
      {
        source: "/researcher/standards/experiments/:path*",
        destination: "/experiment-manage",
        permanent: false,
      },
      {
        source: "/researcher/standards",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      { source: "/console/system/:path*", destination: "/console/settings/system/:path*", permanent: true },
      { source: "/console/system", destination: "/console/settings/system/users", permanent: true },
      {
        source: "/console/resources/subject-grades",
        destination: "/console/settings/education/subject-grades",
        permanent: true,
      },
      {
        source: "/console/resources/subject-grades/:path*",
        destination: "/console/settings/education/subject-grades/:path*",
        permanent: true,
      },
      { source: "/console/resources/textbooks", destination: "/console/settings/textbooks", permanent: true },
      {
        source: "/console/resources/textbooks/:path*",
        destination: "/console/settings/textbooks/:path*",
        permanent: true,
      },
      {
        source: "/console/resources/experiments",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/resources/experiments/:path*",
        destination: "/console/settings/experiments/:path*",
        permanent: true,
      },
      {
        source: "/console/resources/config/experiment-catalog",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/resources/config/experiment-catalog/:path*",
        destination: "/console/settings/experiments",
        permanent: true,
      },
      {
        source: "/console/resources/config/experimental-materials",
        destination: "/console/settings/dictionaries",
        permanent: true,
      },
      {
        source: "/console/resources/config/experimental-materials/:path*",
        destination: "/console/settings/dictionaries",
        permanent: true,
      },
      {
        source: "/console/settings/materials/experimental-materials",
        destination: "/console/settings/dictionaries",
        permanent: true,
      },
      {
        source: "/console/settings/materials/experimental-materials/:path*",
        destination: "/console/settings/dictionaries",
        permanent: true,
      },
      {
        source: "/console/resources/config/teacher-materials",
        destination: "/console/settings/materials/teacher-materials",
        permanent: true,
      },
      {
        source: "/console/resources/config/teacher-materials/:path*",
        destination: "/console/settings/materials/teacher-materials/:path*",
        permanent: true,
      },
      {
        source: "/console/resources/config/textbook-reference",
        destination: "/console/settings/textbooks/textbook-reference",
        permanent: true,
      },
      {
        source: "/console/resources/config/textbook-reference/:path*",
        destination: "/console/settings/textbooks/textbook-reference/:path*",
        permanent: true,
      },
      { source: "/console/resources/media", destination: "/console/settings/materials/media", permanent: true },
      {
        source: "/console/resources/media/:path*",
        destination: "/console/settings/materials/media/:path*",
        permanent: true,
      },
      {
        source: "/console/platform/notifications",
        destination: "/console/operations/notifications",
        permanent: true,
      },
      {
        source: "/console/platform/notifications/:path*",
        destination: "/console/operations/notifications/:path*",
        permanent: true,
      },
      {
        source: "/console/platform/deployments",
        destination: "/console/operations/deployments",
        permanent: true,
      },
      {
        source: "/console/platform/deployments/:path*",
        destination: "/console/operations/deployments/:path*",
        permanent: true,
      },
      { source: "/console/platform/audit-log", destination: "/console/operations/audit-log", permanent: true },
      {
        source: "/console/platform/audit-log/:path*",
        destination: "/console/operations/audit-log/:path*",
        permanent: true,
      },
      { source: "/console/platform", destination: "/console/operations/notifications", permanent: true },
      { source: "/console/ai/strategies", destination: "/console/operations/ai-strategies", permanent: true },
      {
        source: "/console/ai/strategies/:path*",
        destination: "/console/operations/ai-strategies/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
