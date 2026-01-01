import { onRequest as __api_admin_licenses_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/admin/licenses.ts"
import { onRequest as __api_ai_extract_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/ai/extract.ts"
import { onRequest as __api_storage_upload_url_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/storage/upload-url.ts"
import { onRequest as __api_storage_view_url_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/storage/view-url.ts"
import { onRequest as __api_docs_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/docs.ts"
import { onRequest as __api_openapi_json_ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/api/openapi.json.ts"
import { onRequest as ____route___ts_onRequest } from "/Users/faiz/Desktop/personal-finance-tracker/functions/[[route]].ts"

export const routes = [
    {
      routePath: "/api/admin/licenses",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_licenses_ts_onRequest],
    },
  {
      routePath: "/api/ai/extract",
      mountPath: "/api/ai",
      method: "",
      middlewares: [],
      modules: [__api_ai_extract_ts_onRequest],
    },
  {
      routePath: "/api/storage/upload-url",
      mountPath: "/api/storage",
      method: "",
      middlewares: [],
      modules: [__api_storage_upload_url_ts_onRequest],
    },
  {
      routePath: "/api/storage/view-url",
      mountPath: "/api/storage",
      method: "",
      middlewares: [],
      modules: [__api_storage_view_url_ts_onRequest],
    },
  {
      routePath: "/api/docs",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_docs_ts_onRequest],
    },
  {
      routePath: "/api/openapi.json",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_openapi_json_ts_onRequest],
    },
  {
      routePath: "/:route*",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [____route___ts_onRequest],
    },
  ]