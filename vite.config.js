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
            entry: path.resolve(
                __dirname,
                'lib/bespoken-audio-player.ts'
            ),
            name: 'bespoken-audio-player',
            fileName: (format) =>
                `bespoken-audio-player.${format}.js`,
        },
        minify: false,
    },
    plugins: [
        banner(
            `/**\n * name: ${pkg.name}\n * version: v${pkg.version}\n * description: ${pkg.description}\n * author: ${pkg.author}\n * repository: ${pkg.repository.url}\n * build date: ${now} \n */`
        ),
    ],
}))
