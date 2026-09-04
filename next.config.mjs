const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true' && repositoryName.length > 0;
const basePath = isGitHubPagesBuild ? `/${repositoryName}` : '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath,
};

export default nextConfig;
