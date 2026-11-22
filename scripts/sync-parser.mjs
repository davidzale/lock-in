// Copies the app's command parser into the Siri edge function (deploy bundles only supabase/functions/*).
import { copyFileSync } from 'node:fs'
copyFileSync('src/lib/localParse.ts', 'supabase/functions/quick/localParse.ts')
console.log('parser synced')
