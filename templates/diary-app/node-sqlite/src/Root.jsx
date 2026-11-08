import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Gate } from './chrome.jsx'
import { PhotoViewer, setVoiceMap } from './cute.jsx'
import { setPhotoMap } from './ui.jsx'
import { api, isUnlocked } from './api.js'
import Story from './Story.jsx'
import Shell from './pages/Shell.jsx'
import Home from './pages/Home.jsx'
import Diary from './pages/Diary.jsx'
import Entry from './pages/Entry.jsx'
import Write from './pages/Write.jsx'
import Album from './pages/Album.jsx'
import Days from './pages/Days.jsx'
import Wishes from './pages/Wishes.jsx'
import Capsules from './pages/Capsules.jsx'
import CapsuleWrite from './pages/CapsuleWrite.jsx'
import Capsule from './pages/Capsule.jsx'
import MapPage from './pages/MapPage.jsx'
import { CrayonDefs } from './icons.jsx'
import './diary.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// 「我们的故事」要口令：输对了才加载照片和语音，再显示故事。整个页面打开期间只用输一次。
function StoryGate() {
  const nav = useNavigate()
  const [ok, setOk] = useState(isUnlocked())
  const unlock = () => {
    // 故事页的照片和语音：向后端要带签名的地址
    api('/api/story/assets')
      .then((a) => { setPhotoMap(a.photos); setVoiceMap(a.voices) })
      .catch(() => { setPhotoMap({}); setVoiceMap({}) })
      .finally(() => setOk(true))
  }
  if (!ok) return <Gate onOk={unlock} onBack={() => nav('/')} />
  return <Story />
}

export default function Root() {
  return (
    <>
      <CrayonDefs />
      <ScrollToTop />
      <Routes>
        <Route path="/story" element={<StoryGate />} />
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="diary" element={<Diary />} />
          <Route path="diary/:id" element={<Entry />} />
          <Route path="write" element={<Write />} />
          <Route path="write/:id" element={<Write />} />
          <Route path="album" element={<Album />} />
          <Route path="days" element={<Days />} />
          <Route path="wishes" element={<Wishes />} />
          <Route path="capsules" element={<Capsules />} />
          <Route path="capsules/new" element={<CapsuleWrite />} />
          <Route path="capsules/:id" element={<Capsule />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PhotoViewer />
    </>
  )
}
