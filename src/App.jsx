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
import Titles from './pages/Titles'
import { About, Contact, Privacy, Rules } from './pages/StaticPages'
import BackToTop from './components/BackToTop'
import AdsterraAd from './components/AdsterraAd'
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
          <Route path="/gelar" element={<Titles />} />
          <Route path="/tentang" element={<About />} />
          <Route path="/kontak" element={<Contact />} />
          <Route path="/peraturan" element={<Rules />} />
          <Route path="/kebijakan-privasi" element={<Privacy />} />
        </Routes>
      </div>
      <Footer />

      <AdsterraAd
        type="socialbar"
        scriptSrc="https://pl31414162.profitableratecpmnetwork.com/f9237b127bf03def083602edd29801ff/invoke.js"
        containerId="container-f9237b127bf03def083602edd29801ff"
      />

      <BackToTop />
    </div>
  )
}
