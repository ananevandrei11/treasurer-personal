import { DashboardView } from '@/views/dashboard'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const pageNum = Math.max(1, Number(page) || 1)
  return <DashboardView page={pageNum} />
}
