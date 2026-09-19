import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NovelList from './pages/NovelList'
import NovelDetail from './pages/NovelDetail'
import ChapterReader from './pages/ChapterReader'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Settings from './pages/Settings'
import Leaderboard from './pages/Leaderboard'
import { About, Contact, Privacy } from './pages/StaticPages'
import BackToTop from './components/BackToTop'
import { useScrollToAnchor } from './lib/useScrollToAnchor'

export default function App() {
  useScrollToAnchor()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<NovelList />} />
          <Route path="/novel/:slug" element={<NovelDetail />} />
          <Route path="/novel/:slug/chapter/:number" element={<ChapterReader />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/pembaca/:userId" element={<PublicProfile />} />
          <Route path="/pengaturan" element={<Settings />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/tentang" element={<About />} />
          <Route path="/kontak" element={<Contact />} />
          <Route path="/kebijakan-privasi" element={<Privacy />} />
        </Routes>
      </div>
      <Footer />
      <BackToTop />
    </div>
  )
}
