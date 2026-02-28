import Header from '@/components/Header'
import Breadcrumb from '@/components/Breadcrumb'

export default function BoardPage() {
  return (
    <div className="p-6">
      <Header context="hub" />
      <Breadcrumb items={[{label:'Hub',href:'/hub'},{label:'任務看板'}]} />
      <h1 className="text-2xl font-bold mt-4">任務看板</h1>
      <p className="text-gray-500 mt-2">任務看板功能開發中...</p>
    </div>
  )
}
