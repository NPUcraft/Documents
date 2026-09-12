<template>
  <section class="server-status" aria-label="Minecraft 服务器实时状态">
    <header class="server-status__header">
      <div class="server-status__title">
        <span class="server-status__icon" aria-hidden="true">
          <img
            v-if="!logoFailed"
            class="server-status__logo"
            :src="logoSrc"
            alt=""
            width="44"
            height="44"
            @error="logoFailed = true"
          />
          <span v-else>⛏️</span>
        </span>
        <span>NPUcraft群组服</span>
      </div>
      <p class="server-status__badge" :class="`server-status__badge--${statusKind}`">
        <span class="server-status__dot" aria-hidden="true" />
        <span>{{ statusLabel }}</span>
      </p>
    </header>

    <div class="server-status__stats">
      <div class="server-status__stat">
        <p class="server-status__label">当前在线</p>
        <p class="server-status__value">{{ playerText }}</p>
      </div>
      <div class="server-status__stat">
        <p class="server-status__label">服务器版本</p>
        <p class="server-status__value server-status__value--version">{{ versionText }}</p>
      </div>
    </div>

    <div v-if="motdHtml" class="server-status__motd" v-html="motdHtml" />

    <div class="server-status__addresses">
      <p class="server-status__label">连接地址</p>
      <div class="server-status__lines">
        <div
          v-for="item in serverAddresses"
          :key="item.host"
          class="server-status__address"
        >
          <span
            class="server-status__lane"
            :class="`server-status__lane--${item.tone}`"
          >{{ item.label }}</span>
          <code class="server-status__host">{{ item.host }}</code>
          <button
            type="button"
            class="server-status__copy"
            :class="{ 'server-status__copy--done': copied[item.host] }"
            :title="copied[item.host] ? '已复制' : '复制地址'"
            :aria-label="copied[item.host] ? `${item.host} 已复制` : `复制 ${item.host}`"
            @click="copyAddress(item.host)"
          >
            <VPIcon :icon="copied[item.host] ? 'check' : 'copy'" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="updatedText" class="server-status__updated">{{ updatedText }}</p>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { withBase } from "vuepress/client";

const STATUS_HOST = "mc.npucraft.com";
const STATUS_API =
  "https://uapis.cn/api/v1/game/minecraft/serverstatus?server=" +
  encodeURIComponent(STATUS_HOST);
const REFRESH_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;
const COPY_RESET_MS = 1_500;
const logoSrc = withBase("/NPUcraftLogo.png");
const serverAddresses = [
  { host: "mc.npucraft.com", label: "推荐", tone: "recommend" },
  { host: "mc2.npucraft.com", label: "高峰备用", tone: "backup" },
];

const statusKind = ref("loading");
const hasSnapshot = ref(false);
const playersOnline = ref(null);
const playersMax = ref(null);
const versionName = ref("");
const motdHtml = ref("");
const logoFailed = ref(false);
const lastSuccessAt = ref(null);
const copied = reactive({
  "mc.npucraft.com": false,
  "mc2.npucraft.com": false,
});

const copyResetTimers = {};
let refreshTimer = 0;
let inFlight = null;
let disposed = false;

const statusLabel = computed(() => {
  if (statusKind.value === "loading") return "正在获取状态";
  if (statusKind.value === "online") return "正常运行";
  if (statusKind.value === "offline") return "服务器离线";
  return "状态暂时不可用";
});

const playerText = computed(() => {
  const online = Number.isFinite(playersOnline.value) ? playersOnline.value : "--";
  const max = Number.isFinite(playersMax.value) ? playersMax.value : "--";
  return `${online} / ${max}`;
});

const versionText = computed(() => versionName.value || "--");

const updatedText = computed(() => {
  if (!lastSuccessAt.value) return "";
  const time = new Date(lastSuccessAt.value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return statusKind.value === "unknown" ? `上次成功更新于 ${time}` : `更新于 ${time}`;
});

const toCount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const unwrapPayload = (data) => {
  if (!data || typeof data !== "object") return null;
  if (typeof data.online === "boolean") return data;
  if (data.data && typeof data.data === "object" && typeof data.data.online === "boolean") {
    return data.data;
  }
  return data;
};

const escapeText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const sanitizeStyle = (style) => {
  if (!style) return "";
  const allowed = [];
  for (const part of style.split(";")) {
    const index = part.indexOf(":");
    if (index === -1) continue;
    const prop = part.slice(0, index).trim().toLowerCase();
    const val = part.slice(index + 1).trim();
    if (!val || /expression|url\s*\(|javascript:/i.test(val)) continue;
    if (
      prop === "color" &&
      /^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/i.test(
        val,
      )
    ) {
      allowed.push(`color: ${val}`);
    } else if (prop === "font-weight" && /^(normal|bold|bolder|[1-9]00)$/i.test(val)) {
      allowed.push(`font-weight: ${val}`);
    } else if (prop === "font-style" && /^(normal|italic|oblique)$/i.test(val)) {
      allowed.push(`font-style: ${val}`);
    } else if (
      prop === "text-decoration" &&
      /^(none|underline|line-through)(\s+(none|underline|line-through))*$/i.test(val)
    ) {
      allowed.push(`text-decoration: ${val}`);
    }
  }
  return allowed.join("; ");
};

const sanitizeMotdHtml = (html) => {
  if (typeof document === "undefined" || typeof DOMParser === "undefined") return "";
  if (typeof html !== "string" || !html.trim()) return "";

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body?.firstElementChild;
  if (!root) return "";

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName;
    if (tag === "BR") return "<br>";
    if (tag !== "SPAN") return Array.from(node.childNodes).map(walk).join("");
    const inner = Array.from(node.childNodes).map(walk).join("");
    const style = sanitizeStyle(node.getAttribute("style"));
    return style ? `<span style="${style}">${inner}</span>` : `<span>${inner}</span>`;
  };

  return Array.from(root.childNodes).map(walk).join("").trim();
};

const copyTextFallback = (value) => {
  if (typeof document === "undefined") return false;

  try {
    const onCopy = (event) => {
      event.clipboardData?.setData("text/plain", value);
      event.preventDefault();
    };
    document.addEventListener("copy", onCopy);
    const copiedByEvent = document.execCommand("copy");
    document.removeEventListener("copy", onCopy);
    if (copiedByEvent) return true;
  } catch {
    // continue to the textarea fallback
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

const copyText = async (value) => {
  const canUseClipboard =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard?.writeText);

  if (!canUseClipboard) return copyTextFallback(value);

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return copyTextFallback(value);
  }
};

const copyAddress = async (host) => {
  const ok = await copyText(host);
  if (!ok) return;

  copied[host] = true;
  if (copyResetTimers[host]) clearTimeout(copyResetTimers[host]);
  copyResetTimers[host] = window.setTimeout(() => {
    copied[host] = false;
    copyResetTimers[host] = 0;
  }, COPY_RESET_MS);
};

const applyStatus = (data) => {
  const body = unwrapPayload(data);
  if (typeof body?.online !== "boolean") {
    statusKind.value = "unknown";
    return;
  }

  const hasServerFields =
    typeof body.ip === "string" ||
    typeof body.port === "number" ||
    typeof body.version === "string" ||
    typeof body.motd_html === "string" ||
    typeof body.motd_clean === "string" ||
    body.players != null ||
    body.max_players != null;
  if (!hasServerFields) {
    statusKind.value = "unknown";
    return;
  }

  statusKind.value = body.online ? "online" : "offline";
  playersOnline.value = toCount(body.players);
  playersMax.value = toCount(body.max_players);
  versionName.value = typeof body.version === "string" ? body.version.trim() : "";
  motdHtml.value = sanitizeMotdHtml(body.motd_html);
  lastSuccessAt.value = Date.now();
  hasSnapshot.value = true;
};

const fetchStatus = async () => {
  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (!hasSnapshot.value) statusKind.value = "loading";

  try {
    const response = await fetch(STATUS_API, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (disposed) return;
    applyStatus(data);
  } catch (error) {
    if (disposed) return;
    if (error?.name === "AbortError" && inFlight !== controller) return;
    statusKind.value = "unknown";
    console.warn("[ServerStatus] 无法获取 Minecraft 服务器状态");
  } finally {
    window.clearTimeout(timeoutId);
    if (inFlight === controller) inFlight = null;
  }
};

onMounted(() => {
  fetchStatus();
  refreshTimer = window.setInterval(fetchStatus, REFRESH_MS);
});

onBeforeUnmount(() => {
  disposed = true;
  if (refreshTimer) window.clearInterval(refreshTimer);
  inFlight?.abort();
  Object.keys(copyResetTimers).forEach((host) => {
    if (copyResetTimers[host]) window.clearTimeout(copyResetTimers[host]);
  });
});
</script>

<style scoped>
.server-status {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0.15rem 0 1rem;
  padding: 0.9rem 1rem 0.75rem;
  overflow-x: hidden;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  border-radius: 12px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text, #303133);
}

.server-status__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 0.9rem;
  margin-bottom: 0.75rem;
}

.server-status__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.35;
}

.server-status__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 8px;
  background: transparent;
  font-size: 1.2rem;
  line-height: 1;
}

.server-status__logo {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.server-status__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  margin: 0;
  color: var(--vp-c-text-mute, #6b7280);
  font-size: 0.86rem;
  line-height: 1.3;
}

.server-status__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--vp-c-text-mute, #6b7280);
}

.server-status__badge--online {
  color: #16a34a;
}

.server-status__badge--online .server-status__dot {
  background: #22c55e;
}

.server-status__badge--offline {
  color: #dc2626;
}

.server-status__badge--offline .server-status__dot {
  background: #ef4444;
}

.server-status__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.server-status__stat {
  min-width: 0;
  padding: 0.45rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-border, #e5e7eb) 70%, transparent);
  border-radius: 8px;
  background: var(--vp-c-bg-soft, var(--vp-c-bg-alt, #f6f7f9));
}

.server-status__label {
  margin: 0 0 0.12rem;
  color: var(--vp-c-text-mute, #6b7280);
  font-size: 0.74rem;
  font-weight: 500;
}

.server-status__value {
  margin: 0;
  font-size: 1.22rem;
  font-weight: 700;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.server-status__value--version {
  font-size: 0.98rem;
  font-weight: 650;
}

.server-status__motd {
  margin: 0.65rem 0 0.1rem;
  padding: 0;
  background: transparent;
  font-size: 0.92rem;
  line-height: 1.45;
}

.server-status__motd :deep(span) {
  background: transparent;
}

.server-status__addresses {
  margin-top: 0.75rem;
}

.server-status__lines {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--vp-c-border, #e5e7eb) 70%, transparent);
  border-radius: 8px;
  background: var(--vp-c-bg-soft, var(--vp-c-bg-alt, #f6f7f9));
}

.server-status__address {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas: "host lane copy";
  align-items: center;
  gap: 0.45rem 0.7rem;
  min-width: 0;
  padding: 0.48rem 0.7rem;
}

.server-status__address + .server-status__address {
  border-top: 1px solid color-mix(in srgb, var(--vp-c-border, #e5e7eb) 70%, transparent);
}

.server-status__host {
  grid-area: host;
  overflow: hidden;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--vp-c-text, #303133);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-status__lane {
  grid-area: lane;
  display: inline-flex;
  align-items: center;
  justify-self: start;
  width: max-content;
  max-width: 100%;
  padding: 0.08rem 0.42rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 650;
  line-height: 1.4;
  white-space: nowrap;
}

.server-status__lane--recommend {
  background: color-mix(in srgb, #22c55e 16%, transparent);
  color: #15803d;
}

.server-status__lane--backup {
  background: color-mix(in srgb, #f59e0b 16%, transparent);
  color: #b45309;
}

.server-status__copy {
  grid-area: copy;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-mute, #6b7280);
  cursor: pointer;
}

.server-status__copy:hover {
  border-color: var(--vp-c-border, #e5e7eb);
  background: var(--vp-c-control, color-mix(in srgb, var(--vp-c-text, #111) 6%, transparent));
  color: var(--vp-c-accent, var(--theme-color, #096dd9));
}

.server-status__copy :deep(.vp-icon) {
  pointer-events: none;
}

.server-status__copy--done {
  color: #16a34a;
}

.server-status__updated {
  margin: 0.55rem 0 0;
  color: var(--vp-c-text-mute, #6b7280);
  font-size: 0.72rem;
}

@media (max-width: 37.5rem) {
  .server-status {
    padding: 0.85rem 0.8rem 0.7rem;
  }

  .server-status__stats {
    grid-template-columns: 1fr;
  }

  .server-status__address {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "lane lane"
      "host copy";
  }

  .server-status__host {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

html[data-theme="dark"] .server-status__lane--recommend {
  color: #86efac;
}

html[data-theme="dark"] .server-status__lane--backup {
  color: #fdba74;
}
</style>
