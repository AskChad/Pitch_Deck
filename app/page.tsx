export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Pitch Deck Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create stunning pitch decks powered by AI. Extract brand colors from websites,
            generate custom graphics with Leonardo.ai, and present with beautiful animations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📐</div>
            <h3 className="text-xl font-bold mb-2">Professional Templates</h3>
            <p className="text-gray-600">
              Pre-designed slide templates and infographics. AI fills content, you control the design.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2">Brand Extraction</h3>
            <p className="text-gray-600">
              Automatically extract brand colors, logos, and assets from any website URL
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Animated Infographics</h3>
            <p className="text-gray-600">
              5 pre-designed data visualization templates with smooth SVG animations
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">Presentation Mode</h3>
            <p className="text-gray-600">
              Present online with smooth animations, transitions, and keyboard navigation
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-3xl mx-auto bg-white p-12 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Sign up now and start creating amazing pitch decks with AI
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/templates"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              View Templates
            </a>
            <a
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign Up Free
            </a>
            <a
              href="/login"
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Login
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Powered by</p>
          <div className="flex justify-center gap-6 flex-wrap">
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              Next.js 15
            </span>
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              TypeScript
            </span>
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              Framer Motion
            </span>
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              Leonardo.ai
            </span>
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              IconKit.ai
            </span>
            <span className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium">
              Supabase
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
