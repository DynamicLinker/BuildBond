const BASE_URL = 'http://localhost:3001'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export function createJob(data) {
  return request('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function getJob(id) {
  return request(`/api/jobs/${id}`)
}

export function listJobs() {
  return request('/api/jobs')
}

export function initiatePayment(jobId) {
  return request(`/api/jobs/${jobId}/initiate-payment`, { method: 'POST' })
}

export function submitMilestone(milestoneId, photoFile) {
  const form = new FormData()
  form.append('photo', photoFile)
  return request(`/api/milestones/${milestoneId}/submit`, {
    method: 'POST',
    body: form,
  })
}

export function disputeMilestone(milestoneId) {
  return request(`/api/milestones/${milestoneId}/dispute`, { method: 'POST' })
}
