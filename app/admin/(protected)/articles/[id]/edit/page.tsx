import { ArticleEditor } from '@/components/admin/ArticleEditor'
import { getAllCategories, getArticleById } from '@/lib/db/queries'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [categories, article] = await Promise.all([
    getAllCategories(),
    getArticleById(parseInt(id)),
  ])
  if (!article) notFound()
  return <ArticleEditor categories={categories} article={article} />
}
