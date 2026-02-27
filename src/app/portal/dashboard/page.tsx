export default function PortalDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">業務儀表板</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><h2 className="font-semibold text-gray-500 text-sm">本月業績</h2><p className="text-3xl font-bold mt-2">-</p></div>
        <div className="bg-white rounded-xl shadow p-4"><h2 className="font-semibold text-gray-500 text-sm">待處理案件</h2><p className="text-3xl font-bold mt-2">-</p></div>
        <div className="bg-white rounded-xl shadow p-4"><h2 className="font-semibold text-gray-500 text-sm">本週活動</h2><p className="text-3xl font-bold mt-2">-</p></div>
      </div>
    </div>
  )
}
