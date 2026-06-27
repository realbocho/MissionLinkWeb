import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import CreateMission from './pages/CreateMission.jsx'
import MissionDetail from './pages/MissionDetail.jsx'
import MyMissions from './pages/MyMissions.jsx'
import CreatorProfile from './pages/CreatorProfile.jsx'
import RequestMission from './pages/RequestMission.jsx'
import IncomingRequests from './pages/IncomingRequests.jsx'
import Login from './pages/Login.jsx'
import Notifications from './pages/Notifications.jsx'
import OpenchatGuide from './pages/OpenchatGuide.jsx'
import { isLoggedIn } from './utils/auth.js'

const HIDE_NAV = ['/mission/', '/creator/', '/requests', '/login', '/notifications']

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p))
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<PrivateRoute><CreateMission /></PrivateRoute>} />
        <Route path="/mission/:id" element={<MissionDetail />} />
        <Route path="/my" element={<PrivateRoute><MyMissions /></PrivateRoute>} />
        <Route path="/creator/:creatorId" element={<CreatorProfile />} />
        <Route path="/creator/:creatorId/request" element={<PrivateRoute><RequestMission /></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><IncomingRequests /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/guide/openchat" element={<OpenchatGuide />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  )
}
