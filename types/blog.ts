export interface BlogCategory {
  id: string
  name: string
  slug: string
  postCount: number
  parent_name?: string | null
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  featuredImage: string
  author: string
  writer?: { name: string; role_name: string; profile_image: string; bio?: string }
  category: { id?: string; name: string; slug: string } | null
  tags: { name: string; slug: string }[]
  publishedAt: string | null
  updatedAt: string | null
  date: string
  readTime: string
}

export interface BlogArticle extends BlogPost {
  contentHtml: string
  seoTitle: string
  seoDescription: string
}

export interface BlogListResponse {
  ok: true
  blogs: BlogPost[]
  categories: BlogCategory[]
  pagination: { total: number; count: number; page: number; totalPages: number; category: string | null }
}

export interface BlogDetailResponse {
  ok: true
  blog: BlogArticle
  related: BlogPost[]
}
