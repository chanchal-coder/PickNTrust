/// <reference types="vite/client" />

// This file brings in Vite's ambient type declarations so that
// `import.meta` and `import.meta.env` are properly typed across the
// client codebase. Without this, TypeScript may report:
// "Property 'env' does not exist on type 'ImportMeta'" in files that
// reference `import.meta.env.DEV` or other env flags.