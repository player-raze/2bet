<script setup lang="ts">
const props = withDefaults(defineProps<{ src?: string; alt: string; eager?: boolean }>(), {
  src: '',
  eager: false,
})
const failed = ref(false)
const { effectiveTheme } = useSiteTheme()
watch(() => props.src, () => { failed.value = false })
</script>

<template>
  <div class="blog-image" :class="{ 'blog-image--fallback': !src || failed }">
    <img v-if="src && !failed" :src="src" :alt="alt" :loading="eager ? 'eager' : 'lazy'" decoding="async" @error="failed = true">
    <img v-else :src="effectiveTheme === 'light' ? '/brand/2bet-light.webp' : '/brand/2bet-logo.webp'" :alt="alt" loading="lazy" decoding="async">
  </div>
</template>

<style scoped>
.blog-image { overflow: hidden; width: 100%; height: 100%; min-width: 0; background: #18271f; }
.blog-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.blog-image--fallback { display: grid; place-items: center; background: linear-gradient(130deg,#0c3823,#11271b); }
.blog-image--fallback img { width: 46%; max-width: 150px; height: auto; max-height: 70%; object-fit: contain; }
html[data-theme='light'] .blog-image { background: #e3eee7; }
html[data-theme='light'] .blog-image--fallback { background: linear-gradient(130deg,#eaf7ef,#d4e9dc); }
</style>
