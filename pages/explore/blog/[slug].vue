<script setup lang="ts">
import BlogArticle from '~/components/blogs/BlogArticle.vue'

definePageMeta({ key: route => route.path })
</script>

<template>
  <BlogArticle />
</template>
