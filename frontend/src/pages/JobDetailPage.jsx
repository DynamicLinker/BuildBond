import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { getJob, initiatePayment, disputeMilestone } from '../api.js'

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    active: 'bg-blue-100 text-blue-700 border-blue-300',
    complete: 'bg-green-100 text-green-700 border-green-300',
    disputed: 'bg-red-100 text-red-700 border-red-300',
    paid: 'bg-green-100 text-green-700 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    rejected: 'bg-red-100 text-red-700 border-red-300',
  }
  const current = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${current}`}>
      {status}
    </span>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lockingPayment, setLockingPayment] = useState(false)
  const [disputingId, setDisputingId] = useState(null)
  const [copied, setCopied] = useState(false)

  const paymentParam = searchParams.get('payment')

  const fetchJobData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await getJob(id)
      setJob(data)
      setError('')
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load job details')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobData()
    const interval = setInterval(() => {
      fetchJobData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  const handleLockPayment = async () => {
    try {
      setLockingPayment(true)
      const data = await initiatePayment(id)
      if (data && data.approveUrl) {
        window.location.href = data.approveUrl
      } else {
        alert('Payment initiated, but no approval URL returned.')
      }
    } catch (err) {
      alert(`Error initiating payment: ${err.message}`)
    } finally {
      setLockingPayment(false)
    }
  }

  const handleDispute = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to dispute this milestone verdict? It will freeze verification.')) {
      return
    }
    try {
      setDisputingId(milestoneId)
      await disputeMilestone(milestoneId)
      await fetchJobData(true)
    } catch (err) {
      alert(`Failed to dispute milestone: ${err.message}`)
    } finally {
      setDisputingId(null)
    }
  }

  const contractorUrl = `${window.location.origin}/jobs/${id}/contractor`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(contractorUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Job</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const milestones = job?.milestones || []

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-blue-600 font-bold text-lg">🏠 BuildBond</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm font-medium">Homeowner Dashboard</span>
        </div>
        <Link to="/create" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          + Create Another Job
        </Link>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* URL Param Toasts */}
        {paymentParam === 'authorized' && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
            <span className="text-xl">✅</span>
            <div className="text-sm font-medium">
              Payment authorized! Funds held in escrow. Contractor can now begin submitting milestones.
            </div>
          </div>
        )}

        {paymentParam === 'cancelled' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <div className="text-sm font-medium">
              Payment was cancelled or not completed. The job remains in draft status until funds are authorized.
            </div>
          </div>
        )}

        {/* Job Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-gray-500 text-sm">{job.description || 'No description provided.'}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider block">Total Amount</span>
              <span className="text-3xl font-extrabold text-blue-600">
                ${Number(job.total_amount).toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-1">{job.currency || 'USD'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-gray-400 block text-xs font-semibold uppercase mb-1">Homeowner</span>
              <span className="font-medium text-gray-800 break-all">{job.homeowner_email}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-gray-400 block text-xs font-semibold uppercase mb-1">Contractor</span>
              <span className="font-medium text-gray-800 break-all">{job.contractor_email}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Escrow Security Status</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {job.status === 'draft'
                  ? 'Funds must be authorized in escrow before contractor proof verification begins.'
                  : 'Funds are securely locked in PayPal escrow and capture milestone-by-milestone upon verified proof.'}
              </p>
            </div>

            <div>
              {job.status === 'draft' ? (
                <button
                  onClick={handleLockPayment}
                  disabled={lockingPayment}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-60 whitespace-nowrap"
                >
                  {lockingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirecting to PayPal...
                    </>
                  ) : (
                    <>
                      <span>🔒</span> Lock Payment with PayPal
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap">
                  <span>✓</span> ${Number(job.total_amount).toFixed(2)} Secured in Escrow
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share with Contractor Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-blue-900 font-bold text-sm flex items-center gap-2">
                <span>🔗</span> Share this link with your contractor:
              </h3>
              <p className="text-blue-700 text-xs mt-1">
                Contractors use this link to upload photo proof for each milestone without needing a password.
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <input
                type="text"
                readOnly
                value={contractorUrl}
                className="bg-white border border-blue-200 text-blue-950 px-3 py-2 rounded-lg text-xs flex-1 sm:w-80 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Milestones Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔧</span> Milestones ({milestones.length})
          </h2>
          <span className="text-xs text-gray-500">Live updating every 5s</span>
        </div>

        {/* Milestones List */}
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
              No milestones defined for this job.
            </div>
          ) : (
            milestones.map((m) => {
              const statusColors = {
                paid: 'border-l-green-500',
                approved: 'border-l-blue-500',
                pending: 'border-l-yellow-400',
                rejected: 'border-l-red-500',
                disputed: 'border-l-red-600',
              }
              const borderLeftClass = statusColors[m.status] || 'border-l-gray-300'

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderLeftClass} p-5 transition`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                        {m.sequence_num}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600 text-sm">
                        ${Number(m.amount).toFixed(2)}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 ml-9 mb-4">{m.description}</p>

                  {/* AI Verdict Box if available */}
                  {(m.ai_verdict !== null && m.ai_verdict !== undefined) && (
                    <div className="ml-9 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 flex items-center gap-1.5">
                          <span>🤖</span> AI Inspector Verdict:
                          <span className={m.ai_verdict ? 'text-green-600' : 'text-red-600'}>
                            {m.ai_verdict ? 'PASSED / APPROVED' : 'FAILED / REJECTED'}
                          </span>
                        </span>
                        {m.ai_confidence && (
                          <span className="text-gray-500 font-medium">
                            Confidence: {(m.ai_confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      {/* Confidence bar */}
                      {m.ai_confidence && (
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full ${m.ai_verdict ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(10, m.ai_confidence * 100))}%` }}
                          />
                        </div>
                      )}

                      <p className="text-gray-700 mb-3 leading-relaxed">
                        <strong className="text-gray-900">Analysis:</strong> {m.ai_reasoning || 'No explanation provided.'}
                      </p>

                      {/* Dispute action */}
                      {m.status !== 'disputed' && (
                        <div className="flex justify-end pt-2 border-t border-gray-200">
                          <button
                            onClick={() => handleDispute(m.id)}
                            disabled={disputingId === m.id}
                            className="text-red-600 hover:text-red-700 hover:underline font-semibold text-xs flex items-center gap-1"
                          >
                            <span>🚩</span>
                            {disputingId === m.id ? 'Filing dispute...' : 'Dispute AI Verdict'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
