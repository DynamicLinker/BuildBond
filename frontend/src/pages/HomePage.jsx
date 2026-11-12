import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-600">🏠 BuildBond</span>
        <div className="flex gap-4">
          <Link to="/create" className="text-sm text-gray-600 hover:text-blue-600">Create Job</Link>
          <Link to="/create" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🛡️ AI-Powered Contractor Protection
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Stop losing deposits to<br />
          <span className="text-blue-600">ghost contractors</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          BuildBond holds payment in escrow. AI verifies work. Funds release only when milestones are genuinely complete.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/create"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            🏠 Create a Job
          </Link>
          <Link
            to="/jobs"
            className="bg-white text-blue-600 border-2 border-blue-200 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-400 transition-colors"
          >
            🔧 Browse Jobs (Contractor)
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-900 text-white py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-red-400 mb-2">85%</div>
            <div className="text-gray-300">of homeowners have experienced contractor issues</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-400 mb-2">$6B</div>
            <div className="text-gray-300">lost to contractor fraud yearly in the US</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How BuildBond works</h2>
        <p className="text-center text-gray-500 mb-14">Three simple steps. Zero contractor scams.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">💰</div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Step 1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Create & Lock Payment</h3>
            <p className="text-gray-500 leading-relaxed">
              Homeowner creates the job with milestone breakdowns and locks the total payment via PayPal. Money is authorized but not yet released.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">📸</div>
            <div className="text-sm font-semibold text-orange-500 uppercase tracking-wide mb-2">Step 2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Contractor Submits Proof</h3>
            <p className="text-gray-500 leading-relaxed">
              Contractor completes each milestone, then uploads a photo as proof of completion — directly from their phone or computer.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">🤖</div>
            <div className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">Step 3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Verifies & Releases</h3>
            <p className="text-gray-500 leading-relaxed">
              Our AI inspects the photo against the milestone description. If work is complete, payment releases instantly. No arguments, no delays.
            </p>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why homeowners trust BuildBond</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🔒', title: 'Escrow Protection', desc: 'Your money is held safely. The contractor cannot touch it until each milestone is verified.' },
              { icon: '🤖', title: 'AI Photo Inspection', desc: 'GPT-4o vision model analyzes every photo. It is skeptical by design — it does not approve blurry or unfinished work.' },
              { icon: '⚡', title: 'Instant Releases', desc: 'Once a milestone is approved, funds hit the contractor\'s PayPal within seconds. No manual approvals needed.' },
              { icon: '🚩', title: 'Dispute Protection', desc: 'Disagree with an AI decision? Flag the milestone for human review — protecting both sides.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 flex gap-4 shadow-sm">
                <div className="text-3xl">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to hire with confidence?</h2>
        <p className="text-gray-500 mb-8">Create your first protected job in under 2 minutes.</p>
        <Link
          to="/create"
          className="bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 inline-block"
        >
          Create a Job — Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <span className="font-semibold text-gray-600">🏠 BuildBond</span> — Milestone-locked contractor payments powered by AI
      </footer>
    </div>
  )
}
