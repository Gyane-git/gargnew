/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "dentalnepal.com",
    "www.dentalnepal.com",
    "gargdental.vercel.app",
    "localhost:3000",
    "192.168.1.220:3000",
  ],

  async redirects() {
    return [
      {
        source: "/index.php",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/index.plx",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Local Laravel
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },

      // Production
      {
        protocol: "https",
        hostname: "gargdemo.omsok.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "garg.omsok.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gargdental.omsok.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dentalnepal.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gargdental.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gargdental.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "dentalnepal.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gargdental.vercel.app",
        pathname: "/**",
      },

      // This Next.js app's own host, now that NEXT_PUBLIC_MEDIA_BASE_URL makes
      // utils/apiFormatters.js assetUrl() return absolute (not relative) image URLs.
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.220",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gargdental.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "gargdental.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
