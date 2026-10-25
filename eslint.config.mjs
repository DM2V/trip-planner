import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Next 16 removed `next lint`; ESLint runs directly with the flat config Next ships.
const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "public/maplibre/**", "next-env.d.ts"],
  },
];

export default config;
