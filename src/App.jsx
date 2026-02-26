import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import Solve from './pages/Solve'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solve" element={<Solve />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </AuthProvider>
  )
}
