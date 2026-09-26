import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NovelList from './pages/NovelList'
import NovelDetail from './pages/NovelDetail'
import ChapterReader from './pages/ChapterReader'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminMembership from './pages/AdminMembership'
import Membership from './pages/Membership'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import AuthorPage from './pages/AuthorPage'
import Settings from './pages/Settings'
import Leaderboard from './pages/Leaderboard'
import Titles from './pages/Titles'
import NotFound from './pages/NotFound'
import { About, Contact, Privacy, Rules } from './pages/StaticPages'
import BackToTop from './components/BackToTop'
import RouteTransition from './components/RouteTransition'
import MonetagAds from './components/MonetagAds'
import { useScrollToAnchor } from './lib/useScrollToAnchor'

export default function App() {
  useScrollToAnchor()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MonetagAds />
      <Navbar />
      <div style={{ flex: 1 }}>
        <RouteTransition>
          <Routes>
            <Route path="/" element={<NovelList />} />
            <Route path="/novel/:slug" element={<NovelDetail />} />
            <Route path="/novel/:slug/chapter/:number" element={<ChapterReader />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/membership" element={<AdminMembership />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/pembaca/:userId" element={<PublicProfile />} />
            <Route path="/author/:slug" element={<AuthorPage />} />
            <Route path="/pengaturan" element={<Settings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/gelar" element={<Titles />} />
            <Route path="/tentang" element={<About />} />
            <Route path="/kontak" element={<Contact />} />
            <Route path="/peraturan" element={<Rules />} />
            <Route path="/kebijakan-privasi" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteTransition>
      </div>
      <Footer />
      <BackToTop />
    </div>
  )
}
