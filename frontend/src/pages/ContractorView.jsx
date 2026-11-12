import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getJob, submitMilestone } from '../api.js'

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    active: 'bg-blue-100 text-blue-700 border-blue-300',
    complete: 'bg-green-100 text-green-700 border-green-300',
    disputed: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    paid: 'bg-green-100 text-green-700 border-green-300',
    approved: 'bg-blue-100 text-blue-700 border-blue-300',
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

function MilestoneSubmitCard({ milestone, onSubmitted }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submissionResult, setSubmissionResult] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setError('')
      setSubmissionResult(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select an image file to upload.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const result = await submitMilestone(milestone.id, file)
      setSubmissionResult(result)
      onSubmitted(result.milestone)
    } catch (err) {
      setError(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isResubmitting = milestone.status === 'rejected'

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Loading state during inspection */}
      {submitting && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-base font-bold text-blue-900">🔍 AI is inspecting your work...</p>
          <p className="text-xs text-blue-700 mt-1">Analyzing photo quality, completeness, and adherence to milestone requirements.</p>
        </div>
      )}

      {/* Upload Form (when not currently loading) */}
      {!submitting && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
              ⚠️ {error}
            </div>
          )}

          {isResubmitting && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-xs font-medium">
              ℹ️ Previous submission was rejected. Upload an updated photo showing the completed work to resubmit.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              📸 Upload Photo Proof (JPG, PNG, WebP)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-xl"
            />
          </div>

          {preview && (
            <div className="relative inline-block border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-xs">
              <img src={preview} alt="Selected preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!file}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              🤖 Submit for AI Inspection
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ContractorView() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJob = async () => {
    try {
      setLoading(true)
      const data = await getJob(id)
      setJob(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load contractor view')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  const handleMilestoneUpdated = (updatedMilestone) => {
    setJob((prev) => {
      if (!prev) return prev
      const updatedList = prev.milestones.map((m) =>
        m.id === updatedMilestone.id ? updatedMilestone : m
      )
      return { ...prev, milestones: updatedList }
    })
  }

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading contractor portal...</p>
        </div>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
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
      {/* Top Bar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-blue-600 font-bold text-lg">🏠 BuildBond</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm font-medium">Contractor Portal</span>
        </div>
        <div className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
          🔧 Contractor Access
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Job Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-gray-500 text-sm">{job.description || 'No description provided.'}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider block">Total Job Payout</span>
              <span className="text-3xl font-extrabold text-blue-600">
                ${Number(job.total_amount).toFixed(2)}
                <span className="text-sm font-normal text-gray-500 ml-1">{job.currency || 'USD'}</span>
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 bg-blue-50/50 rounded-xl p-4 text-xs text-gray-600 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <strong>How payouts work:</strong> Funds are locked in escrow. For each milestone, upload clear photos of your finished work. Once the AI verifies completion, your payment is immediately released to your PayPal account.
            </div>
          </div>
        </div>

        {/* Milestones Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📋</span> Work Milestones ({milestones.length})
          </h2>
        </div>

        {/* Milestones List */}
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
              No milestones found.
            </div>
          ) : (
            milestones.map((m) => {
              const statusColors = {
                paid: 'border-l-green-500',
                approved: 'border-l-blue-500',
                pending: 'border-l-yellow-400',
                rejected: 'border-l-red-500',
                disputed: 'border-l-yellow-500',
              }
              const borderLeftClass = statusColors[m.status] || 'border-l-gray-300'
              const canSubmit = m.status === 'pending' || m.status === 'rejected'

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderLeftClass} p-5 sm:p-6 transition`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                        {m.sequence_num}
                      </span>
                      <h3 className="font-bold text-gray-900 text-lg">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600 text-base">
                        ${Number(m.amount).toFixed(2)}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 ml-10 mb-4">{m.description}</p>

                  {/* Status Banner */}
                  <div className="ml-10">
                    {m.status === 'paid' && (
                      <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
                        <span>✅</span> Paid — ${Number(m.amount).toFixed(2)}
                      </div>
                    )}

                    {m.status === 'approved' && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
                        <span>✅</span> Approved — awaiting capture
                      </div>
                    )}

                    {m.status === 'disputed' && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
                        <span>⚠️</span> Disputed by homeowner — verification paused
                      </div>
                    )}

                    {/* AI Verdict Card (if approved or rejected) */}
                    {m.ai_verdict !== null && m.ai_verdict !== undefined && (
                      <div className="mt-3">
                        {m.ai_verdict === 1 ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs">
                            <p className="font-bold text-green-900 text-sm mb-1">
                              ✅ Milestone Approved! ${Number(m.amount).toFixed(2)} has been released to your PayPal account.
                            </p>
                            <p className="text-green-800 mb-2">
                              <strong>AI Reasoning:</strong> {m.ai_reasoning}
                            </p>
                            {m.ai_confidence && (
                              <p className="text-green-700 font-medium">
                                Confidence Score: {(m.ai_confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs mb-3">
                            <p className="font-bold text-red-900 text-sm mb-1">
                              ❌ Not Approved. Improve and resubmit.
                            </p>
                            <p className="text-red-800 mb-2">
                              <strong>AI Reasoning:</strong> {m.ai_reasoning}
                            </p>
                            {m.ai_confidence && (
                              <p className="text-red-700 font-medium">
                                Confidence Score: {(m.ai_confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload form for pending or rejected */}
                    {canSubmit && (
                      <MilestoneSubmitCard
                        milestone={m}
                        onSubmitted={handleMilestoneUpdated}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
