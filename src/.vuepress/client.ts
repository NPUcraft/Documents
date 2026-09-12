import { defineClientConfig } from "vuepress/client";

import SkinPreview from "./components/SkinPreview.vue";

export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("SkinPreview", SkinPreview);
  },
});
