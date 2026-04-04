import { QuickPublish } from '@/components/admin/QuickPublish'
import { getAllCategories } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function QuickPublishPage() {
  const categories = await getAllCategories()
  return <QuickPublish categories={categories} />
}
