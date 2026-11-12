import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import CreateJobPage from './pages/CreateJobPage.jsx'
import JobDetailPage from './pages/JobDetailPage.jsx'
import ContractorView from './pages/ContractorView.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateJobPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />
      <Route path="/jobs/:id/contractor" element={<ContractorView />} />
    </Routes>
  )
}
