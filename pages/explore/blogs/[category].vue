<script setup lang="ts">
import BlogListing from '~/components/blogs/BlogListing.vue'

definePageMeta({ key: route => route.fullPath })
</script>

<template>
  <BlogListing />
</template>
