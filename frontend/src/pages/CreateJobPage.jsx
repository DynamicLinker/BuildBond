import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createJob } from '../api.js'

const STEPS = ['Job Details', 'Milestones', 'Review & Confirm']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${i <= current ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              i < current ? 'bg-blue-600 border-blue-600 text-white'
              : i === current ? 'border-blue-600 text-blue-600'
              : 'border-gray-300 text-gray-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === current ? 'text-blue-600' : i < current ? 'text-blue-500' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-10 h-0.5 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function InputField({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
      />
    </div>
  )
}

export default function CreateJobPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Step 1 state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [homeownerEmail, setHomeownerEmail] = useState('')
  const [contractorEmail, setContractorEmail] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  // Step 2 state
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' },
  ])

  function addMilestone() {
    setMilestones(m => [...m, { title: '', description: '', amount: '' }])
  }

  function removeMilestone(i) {
    setMilestones(m => m.filter((_, idx) => idx !== i))
  }

  function updateMilestone(i, field, val) {
    setMilestones(m => m.map((ms, idx) => idx === i ? { ...ms, [field]: val } : ms))
  }

  const milestoneTotal = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
  const jobTotal = parseFloat(totalAmount) || 0
  const totalMatch = Math.abs(milestoneTotal - jobTotal) < 0.01

  function validateStep1() {
    if (!title.trim()) return 'Job title is required.'
    if (!homeownerEmail.trim() || !homeownerEmail.includes('@')) return 'Valid homeowner email required.'
    if (!contractorEmail.trim() || !contractorEmail.includes('@')) return 'Valid contractor email required.'
    if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) return 'Valid total amount required.'
    return ''
  }

  function validateStep2() {
    if (milestones.length === 0) return 'Add at least one milestone.'
    for (const [i, ms] of milestones.entries()) {
      if (!ms.title.trim()) return `Milestone ${i + 1}: title required.`
      if (!ms.description.trim()) return `Milestone ${i + 1}: description required.`
      if (!ms.amount || isNaN(parseFloat(ms.amount)) || parseFloat(ms.amount) <= 0) return `Milestone ${i + 1}: valid amount required.`
    }
    if (!totalMatch) return `Milestone total ($${milestoneTotal.toFixed(2)}) must equal job total ($${jobTotal.toFixed(2)}).`
    return ''
  }

  function handleNext() {
    setError('')
    let err = ''
    if (step === 0) err = validateStep1()
    if (step === 1) err = validateStep2()
    if (err) { setError(err); return }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        title,
        description,
        homeowner_email: homeownerEmail,
        contractor_email: contractorEmail,
        total_amount: parseFloat(totalAmount),
        currency: 'USD',
        milestones: milestones.map((ms, i) => ({
          sequence_num: i + 1,
          title: ms.title,
          description: ms.description,
          amount: parseFloat(ms.amount),
        })),
      }
      const job = await createJob(payload)
      navigate(`/jobs/${job.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-blue-600 font-bold text-lg">🏠 BuildBond</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 text-sm">Create Job</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Create a Protected Job</h1>
        <p className="text-gray-500 text-center mb-8">Set up milestones and lock payment in escrow</p>

        <StepIndicator current={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Job Details */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Job Details</h2>
              <InputField label="Job Title" value={title} onChange={setTitle} placeholder="e.g., Kitchen Renovation" required />
              <TextareaField label="Description" value={description} onChange={setDescription} placeholder="Describe the work to be done..." />
              <InputField label="Homeowner Email" type="email" value={homeownerEmail} onChange={setHomeownerEmail} placeholder="you@example.com" required />
              <InputField label="Contractor Email" type="email" value={contractorEmail} onChange={setContractorEmail} placeholder="contractor@example.com" required />
              <InputField label="Total Job Amount (USD)" type="number" value={totalAmount} onChange={setTotalAmount} placeholder="5000.00" required />
            </div>
          )}

          {/* Step 2: Milestones */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">🔧 Define Milestones</h2>
              <p className="text-gray-500 text-sm mb-6">Break the job into phases. Payment releases per milestone after AI verification.</p>

              <div className="space-y-5">
                {milestones.map((ms, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-5 relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-700">Milestone {i + 1}</span>
                      {milestones.length > 1 && (
                        <button
                          onClick={() => removeMilestone(i)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <InputField
                        label="Title"
                        value={ms.title}
                        onChange={v => updateMilestone(i, 'title', v)}
                        placeholder="e.g., Demo & prep"
                      />
                      <TextareaField
                        label="Description (AI uses this to verify the photo)"
                        value={ms.description}
                        onChange={v => updateMilestone(i, 'description', v)}
                        placeholder="e.g., Old cabinets removed, walls prepped and clean, ready for new installation"
                        rows={2}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            value={ms.amount}
                            onChange={e => updateMilestone(i, 'amount', e.target.value)}
                            placeholder="1000.00"
                            className="w-full border border-gray-300 rounded-lg pl-7 pr-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMilestone}
                className="mt-4 w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium"
              >
                + Add Milestone
              </button>

              {/* Total tracker */}
              <div className={`mt-6 p-4 rounded-xl border ${totalMatch ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Milestone total</span>
                  <span className={`font-bold ${totalMatch ? 'text-green-700' : 'text-yellow-700'}`}>${milestoneTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Job total</span>
                  <span className="font-bold text-gray-700">${jobTotal.toFixed(2)}</span>
                </div>
                {!totalMatch && (
                  <p className="text-yellow-700 text-xs mt-2">⚠️ Totals must match before you can proceed.</p>
                )}
                {totalMatch && (
                  <p className="text-green-700 text-xs mt-2">✅ Totals match!</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">✅ Review & Confirm</h2>
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">Job Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium text-gray-900">{title}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-bold text-blue-600">${parseFloat(totalAmount).toFixed(2)} USD</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Homeowner</span><span className="text-gray-700">{homeownerEmail}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Contractor</span><span className="text-gray-700">{contractorEmail}</span></div>
                    {description && <div className="pt-2 border-t border-gray-200"><span className="text-gray-500">Description:</span><p className="text-gray-700 mt-1">{description}</p></div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Milestones ({milestones.length})</h3>
                  <div className="space-y-3">
                    {milestones.map((ms, i) => (
                      <div key={i} className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl px-4 py-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">{i + 1}. {ms.title}</span>
                          <span className="font-bold text-blue-700">${parseFloat(ms.amount).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{ms.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  💡 After creating the job, you'll be able to lock payment via PayPal from the job detail page.
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button
                onClick={() => { setError(''); setStep(s => s - 1) }}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                ← Back
              </button>
            ) : (
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium text-sm">← Cancel</Link>
            )}

            {step < 2 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-60"
              >
                {submitting ? 'Creating Job...' : '🚀 Create Job'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
