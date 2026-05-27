import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Solve from './pages/Solve'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'
import Archive from './pages/Archive'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solve" element={<Solve />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/login" element={<Login />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Analytics />
    </AuthProvider>
  )
}
