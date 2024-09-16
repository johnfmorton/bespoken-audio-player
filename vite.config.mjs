// This is the config file used to compile the module that will be published to NPM.
import path from 'node:path'
import { defineConfig } from 'vite'
import banner from 'vite-plugin-banner'
import pkg from './package.json'

// Now in UTC time. Format time as YYYY-MM-DDTHH:mm:ss.sssZ.
const now = new Date().toISOString()

export default defineConfig(({ mode }) => ({
   publicDir: mode === 'development' ? 'static' : false, // Static assets only in dev mode
    build: {
        lib: {
            entry: path.resolve(__dirname, 'lib/bespoken-audio-player.ts'),
            name: 'bespoken-audio-player', // Library name
            formats: ['es', 'umd'], // Output both ESM and UMD formats
            fileName: (format) => `bespoken-audio-player.${format}.js`, // Naming for both formats
        },
        rollupOptions: {
            output: {
                globals: {
                    // Define any globals if needed for UMD builds
                },
            },
        },
        minify: false, // Adjust based on your needs
    },
    plugins: [
        banner(
            `/**\n * name: ${pkg.name}\n * version: v${pkg.version}\n * description: ${pkg.description}\n * author: ${pkg.author}\n * repository: ${pkg.repository.url}\n * build date: ${now} \n */`
        ),
    ],
}))
