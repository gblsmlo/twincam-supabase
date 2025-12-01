import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import type { NextConfig } from 'next'

const jiti = createJiti(fileURLToPath(import.meta.url))

// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
jiti('./src/infra/env/index')

const nextConfig: NextConfig = {
	reactCompiler: true,
	transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
}

export default nextConfig
