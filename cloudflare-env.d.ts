/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  IMAGES: Fetcher;
  CATALOG_BUCKET: R2Bucket;
  CUSTOMERDATA_BUCKET: R2Bucket;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var env: CloudflareEnv;
}