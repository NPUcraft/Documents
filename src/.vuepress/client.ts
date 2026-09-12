import { defineClientConfig } from "vuepress/client";

import ServerStatus from "./components/ServerStatus.vue";
import SkinPreview from "./components/SkinPreview.vue";

export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("ServerStatus", ServerStatus);
    app.component("SkinPreview", SkinPreview);
  },
});
