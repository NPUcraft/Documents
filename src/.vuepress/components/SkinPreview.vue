<template>
  <div class="skin-preview">
    <div class="skin-preview__header">
      <div class="skin-preview__title">
        <span>{{ title }}</span>
        <span v-if="indicator" class="skin-preview__badge">{{ indicator }}</span>
      </div>
      <div class="skin-preview__actions">
        <button type="button" title="切换动画" @click="cycleAnimation">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M13.5 5.5A2 2 0 1 0 11.5 3.5 2 2 0 0 0 13.5 5.5M9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6z"
            />
          </svg>
        </button>
        <button type="button" title="自动旋转" @click="toggleRotate">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5 0 .8-.2 1.5-.5 2.1l1.5 1.5c.6-1.1 1-2.3 1-3.6 0-3.9-3.1-7-7-7m0 12c-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.1L6 9.4C5.4 10.5 5 11.7 5 13c0 3.9 3.1 7 7 7v3l4-4-4-4v3z"
            />
          </svg>
        </button>
        <button type="button" :title="paused ? '继续' : '暂停'" @click="togglePause">
          <svg v-if="!paused" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 5h4v14H6V5m8 0h4v14h-4V5z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </button>
        <button type="button" title="停止" @click="stopMotion">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h12v12H6V6z" />
          </svg>
        </button>
      </div>
    </div>

    <div ref="stageRef" class="skin-preview__stage" :style="{ minHeight: `${height}px` }">
      <canvas ref="canvasRef" />
      <p v-if="error" class="skin-preview__error">{{ error }}</p>
    </div>

    <div class="skin-preview__footer">
      <div class="skin-preview__swatches">
        <button
          type="button"
          class="skin-preview__swatch skin-preview__swatch--white"
          title="白色背景"
          @click="setBackground('#ffffff')"
        />
        <button
          type="button"
          class="skin-preview__swatch skin-preview__swatch--black"
          title="黑色背景"
          @click="setBackground('#000000')"
        />
        <button
          type="button"
          class="skin-preview__swatch skin-preview__swatch--gray"
          title="灰色背景"
          @click="setBackground('#6c757d')"
        />
        <button
          type="button"
          class="skin-preview__swatch skin-preview__swatch--green"
          title="向左转"
          @click="nudge(-Math.PI / 6)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" />
          </svg>
        </button>
        <button
          type="button"
          class="skin-preview__swatch skin-preview__swatch--green"
          title="向右转"
          @click="nudge(Math.PI / 6)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z" />
          </svg>
        </button>
      </div>
      <p v-if="note" class="skin-preview__note">{{ note }}</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { withBase } from "vuepress/client";

const props = defineProps({
  src: { type: String, default: "/assets/PlayerProfiles/steve.png" },
  cape: { type: String, default: "" },
  title: { type: String, default: "人物皮肤" },
  indicator: { type: String, default: "" },
  note: { type: String, default: "" },
  height: { type: Number, default: 420 },
});

const canvasRef = ref(null);
const stageRef = ref(null);
const paused = ref(false);
const error = ref("");
const skinview = shallowRef(null);

let viewer = null;
let resizeObserver = null;
let animationIndex = 0;

const resolveAsset = (value) => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return withBase(value);
};

const animationFactories = () => {
  const lib = skinview.value;
  if (!lib) return [];
  return [
    () => new lib.WalkingAnimation(),
    () => new lib.RunningAnimation(),
    () => new lib.IdleAnimation(),
    () => new lib.FlyingAnimation(),
  ];
};

const applyAnimation = () => {
  if (!viewer) return;
  const factories = animationFactories();
  const factory = factories[animationIndex];
  if (!factory) {
    viewer.animation = null;
    return;
  }
  const animation = factory();
  animation.paused = paused.value;
  viewer.animation = animation;
};

const resizeViewer = () => {
  if (!viewer || !stageRef.value) return;
  const width = Math.max(stageRef.value.clientWidth, 1);
  const height = Math.max(stageRef.value.clientHeight, props.height);
  viewer.setSize(width, height);
};

const loadTextures = async () => {
  if (!viewer) return;
  error.value = "";
  try {
    await viewer.loadSkin(resolveAsset(props.src));
    await viewer.loadCape(props.cape ? resolveAsset(props.cape) : null);
  } catch {
    error.value = "皮肤加载失败，请稍后重试。";
  }
};

const cycleAnimation = () => {
  animationIndex = (animationIndex + 1) % 4;
  paused.value = false;
  applyAnimation();
};

const toggleRotate = () => {
  if (!viewer) return;
  viewer.autoRotate = !viewer.autoRotate;
};

const togglePause = () => {
  if (!viewer) return;
  if (!viewer.animation) applyAnimation();
  paused.value = !paused.value;
  if (viewer.animation) viewer.animation.paused = paused.value;
  if (paused.value) viewer.autoRotate = false;
};

const stopMotion = () => {
  if (!viewer) return;
  viewer.animation = null;
  viewer.autoRotate = false;
  paused.value = false;
};

const setBackground = (color) => {
  if (!viewer) return;
  viewer.background = color;
};

const nudge = (delta) => {
  if (!viewer) return;
  viewer.autoRotate = false;
  viewer.playerWrapper.rotation.y += delta;
};

onMounted(async () => {
  const canvas = canvasRef.value;
  const stage = stageRef.value;
  if (!canvas || !stage) return;

  const lib = await import("skinview3d");
  skinview.value = lib;

  viewer = new lib.SkinViewer({
    canvas,
    width: Math.max(stage.clientWidth, 1),
    height: Math.max(stage.clientHeight, props.height),
    skin: resolveAsset(props.src),
    cape: props.cape ? resolveAsset(props.cape) : undefined,
    zoom: 0.72,
  });
  viewer.autoRotate = true;
  applyAnimation();
  await loadTextures();

  resizeObserver = new ResizeObserver(resizeViewer);
  resizeObserver.observe(stage);
  resizeViewer();
});

watch(
  () => [props.src, props.cape],
  () => {
    loadTextures();
  },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  viewer?.dispose();
  viewer = null;
});
</script>

<style scoped>
.skin-preview {
  margin: 1.1rem 0 1.4rem;
  overflow: hidden;
  border: 1px solid var(--vp-c-border, #e5e7eb);
  border-radius: 10px;
  background: var(--vp-c-bg, #fff);
}

.skin-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--vp-c-border, #e5e7eb);
}

.skin-preview__title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--vp-c-text, #303133);
  font-size: 0.98rem;
  font-weight: 600;
}

.skin-preview__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.08rem 0.42rem;
  border-radius: 4px;
  background: #28a745;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.4;
}

.skin-preview__actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.skin-preview__actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--vp-c-text, #303133);
  cursor: pointer;
}

.skin-preview__actions button:hover {
  color: #555;
}

.skin-preview__actions svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: currentColor;
}

.skin-preview__stage {
  position: relative;
  width: 100%;
  background: #fff;
}

.skin-preview__stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.skin-preview__error {
  position: absolute;
  inset: auto 0 1rem;
  margin: 0;
  color: #c45656;
  font-size: 0.85rem;
  text-align: center;
}

.skin-preview__footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.85rem 1rem 1rem;
  background: var(--vp-c-bg-soft, #f6f7f9);
}

.skin-preview__swatches {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.skin-preview__note {
  margin: 0;
  color: var(--vp-c-text-mute, #6b7280);
  font-size: 0.82rem;
  line-height: 1.45;
}

.skin-preview__swatch {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 999px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 16%);
  cursor: pointer;
}

.skin-preview__swatch--white {
  background: #fff;
}

.skin-preview__swatch--black {
  background: #111;
}

.skin-preview__swatch--gray {
  background: #6c757d;
}

.skin-preview__swatch--green {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #28a745;
  color: #fff;
}

.skin-preview__swatch--green svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: currentColor;
}
</style>
