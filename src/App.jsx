import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import NovelList from './pages/NovelList'
import NovelDetail from './pages/NovelDetail'
import ChapterReader from './pages/ChapterReader'
import Login from './pages/Login'
import Admin from './pages/Admin'

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<NovelList />} />
        <Route path="/novel/:slug" element={<NovelDetail />} />
        <Route path="/novel/:slug/chapter/:number" element={<ChapterReader />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}
