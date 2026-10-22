import type { NextConfig } from "next";

// GitHub Pagesのプロジェクトサイト(https://<user>.github.io/<repo>/)は
// サブパス配下での公開になるため、CIビルド時のみ basePath を付与する。
// ローカル開発(npm run dev)やローカルビルドではルート直下のまま。
const repoBasePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repoBasePath,
  assetPrefix: repoBasePath || undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
