import { ArrowRight } from 'lucide-react'

export default function ShowcasePage() {
  const agents = [
    {
      id: 'travis',
      name: 'Travis',
      title: '系統指揮官',
      description: '統籌全局，確保所有 Agent 高效運作',
      image: '/agents/showcase/travis-male.jpg',
      color: 'bg-gradient-to-br from-blue-400 to-blue-600'
    },
    {
      id: 'blake',
      name: 'Blake',
      title: '技術架構師',
      description: '寫程式是藝術，架構是思想',
      image: '/agents/showcase/blake-male.jpg',
      color: 'bg-gradient-to-br from-green-400 to-emerald-600'
    },
    {
      id: 'rex',
      name: 'Rex',
      title: '情報分析師',
      description: '深度調查，交叉比對，挖掘真相',
      image: '/agents/showcase/rex-male.jpg',
      color: 'bg-gradient-to-br from-teal-400 to-blue-500'
    },
    {
      id: 'oscar',
      name: 'Oscar',
      title: '行政協調官',
      description: '郵件、行程、會議，一切井井有條',
      image: '/agents/showcase/oscar-male.jpg',
      color: 'bg-gradient-to-br from-amber-400 to-orange-500'
    },
    {
      id: 'warren',
      name: 'Warren',
      title: '數據分析師',
      description: '在數字中發現未來的趨勢',
      image: '/agents/showcase/warren-male.jpg',
      color: 'bg-gradient-to-br from-gray-400 to-gray-600'
    },
    {
      id: 'griffin',
      name: 'Griffin',
      title: '品質守門員',
      description: '零容忍瑕疵，上線前的最後防線',
      image: '/agents/showcase/griffin-male.jpg',
      color: 'bg-gradient-to-br from-red-400 to-red-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-pink-50 to-purple-50">
      {/* 背景裝飾球 */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
      <div className="fixed top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="fixed bottom-20 left-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-7xl">
        {/* 標題區 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            AI Agent Team
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            ✨ 6 位 AI 助理，各有所長 ✨
          </p>
        </div>

        {/* 角色卡片網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 角色圖片 */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
                {/* 漸層遮罩 */}
                <div className={`absolute inset-0 ${agent.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
              </div>

              {/* 卡片內容 */}
              <div className="p-6">
                <h3 className="text-2xl font-black mb-2 text-gray-800">
                  {agent.name}
                </h3>
                <p className="text-sm font-bold text-purple-600 mb-3">
                  {agent.title}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {agent.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA 按鈕 */}
        <div className="text-center">
          <a
            href="https://william-ai-office-game.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <span>體驗互動版</span>
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  )
}
