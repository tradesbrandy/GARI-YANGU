import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import RequireRole from './components/RequireRole.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import CarDetail from './pages/CarDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PostRequest from './pages/buyer/PostRequest.jsx'
import MyOffers from './pages/buyer/MyOffers.jsx'
import Dashboard from './pages/dealer/Dashboard.jsx'
import ManageListings from './pages/dealer/ManageListings.jsx'
import OpenRequests from './pages/dealer/OpenRequests.jsx'
import VerifyDealers from './pages/admin/VerifyDealers.jsx'

function NotFound() {
  return (
    <div className="placeholder">
      <h1>Page not found</h1>
      <p>That page doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  )
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

const buyer = (el) => <RequireRole roles={['buyer']}>{el}</RequireRole>
const dealer = (el) => <RequireRole roles={['dealer']}>{el}</RequireRole>
const admin = (el) => <RequireRole roles={['admin']}>{el}</RequireRole>

export default function App() {
  return (
    <>
      <ScrollTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Open to guests so they can fill the form; posting requires a buyer login. */}
          <Route path="/post-request" element={<PostRequest />} />
          <Route path="/my-offers" element={buyer(<MyOffers />)} />
          <Route path="/dealer" element={dealer(<Dashboard />)} />
          <Route path="/dealer/listings" element={dealer(<ManageListings />)} />
          <Route path="/dealer/requests" element={dealer(<OpenRequests />)} />
          <Route path="/admin/dealers" element={admin(<VerifyDealers />)} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
