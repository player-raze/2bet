<script setup lang="ts">
import BlogListing from '~/components/blogs/BlogListing.vue'

definePageMeta({ key: route => route.fullPath })

const route = useRoute()
if (typeof route.query.category === 'string' && route.query.category.trim()) {
  const { category, ...query } = route.query
  await navigateTo({ path: `/blogs/${encodeURIComponent(category.trim())}`, query }, { redirectCode: 301, replace: true })
}
</script>

<template>
  <BlogListing />
</template>
