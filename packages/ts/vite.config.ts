import { definePackageConfig } from "../../vite.shared";

export default definePackageConfig(import.meta.url, {
    test: { environment: "node" },
});
