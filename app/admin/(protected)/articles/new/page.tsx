import { ArticleEditor } from '@/components/admin/ArticleEditor'
import { getAllCategories } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const categories = await getAllCategories()
  return <ArticleEditor categories={categories} />
}
