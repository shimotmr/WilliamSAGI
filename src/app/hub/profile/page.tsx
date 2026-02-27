export default function ProfilePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">個人資料</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">W</div>
          <div><h2 className="text-xl font-semibold">William Hsiao</h2><p className="text-gray-500">williamhsiao@aurotek.com</p></div>
        </div>
        <hr />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">職位</span><p className="font-medium">通路營業管理</p></div>
          <div><span className="text-gray-500">部門</span><p className="font-medium">機器人事業處</p></div>
          <div><span className="text-gray-500">公司</span><p className="font-medium">和椿科技 (6215.TW)</p></div>
          <div><span className="text-gray-500">時區</span><p className="font-medium">GMT+8 台灣</p></div>
        </div>
      </div>
    </div>
  )
}
