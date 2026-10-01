/** @type {import('next').NextConfig} */
const nextConfig = {
  // The API routes and server components read the pre-built JSON index at runtime with fs.
  // Tell Vercel's file tracer to ship those files with every serverless function.
  outputFileTracingIncludes: {
    '/*': ['./data/processed/**/*', './data/eval/**/*'],
    '/**/*': ['./data/processed/**/*', './data/eval/**/*'],
  },
};
export default nextConfig;
