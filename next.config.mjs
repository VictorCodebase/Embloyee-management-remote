// next.config.mjs
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: (config) => {
		config.resolve.alias["@"] = path.join(__dirname, "src");
		return config;
	},
};

export default nextConfig;
