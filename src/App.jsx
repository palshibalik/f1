import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

import Header            from "./components/Header";
import Footer            from "./components/Footer";
import Home              from "./pages/Home";
import NextRace          from "./pages/NextRace";
import Sessions          from "./pages/Sessions";
import Drivers           from "./pages/Drivers";
import DriverPerformance from "./pages/DriverPerformance";
import Circuit           from "./pages/Circuit";
import Progress          from "./pages/Progress";
import Live              from "./pages/live";
import Strategy          from "./pages/Strategy";
import Lineup            from "./pages/Lineup";          // was LineUp — casing fix
import News              from "./pages/News";
import RaceStory         from "./pages/Racestory";       // was RaceStory — casing fix
import MyF1              from "./pages/Myf1";            // was MyF1 — casing fix
import Notes             from "./pages/Notes";
import About            from "./pages/About";

// ─── Scroll to top on every navigation ───────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ─── Animated page wrapper ────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location    = useLocation();
  const wrapperRef  = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.classList.remove("page-enter");
    void el.offsetWidth;          // force reflow so animation re-triggers
    el.classList.add("page-enter");
  }, [location.pathname]);

  return (
    <div ref={wrapperRef} className="page-enter">
      <Routes location={location}>
        <Route path="/"                    element={<Home />} />
        <Route path="/next-race"           element={<NextRace />} />
        <Route path="/sessions"            element={<Sessions />} />
        <Route path="/drivers"             element={<Drivers />} />
        <Route path="/driver-performance"  element={<DriverPerformance />} />
        <Route path="/circuit"             element={<Circuit />} />
        <Route path="/progress"            element={<Progress />} />
        <Route path="/live"                element={<Live />} />
        <Route path="/strategy"            element={<Strategy />} />
        <Route path="/lineup"              element={<Lineup />} />
        <Route path="/news"                element={<News />} />
        <Route path="/race-story"          element={<RaceStory />} />
        <Route path="/my-f1"               element={<MyF1 />} />
        <Route path="/notes"               element={<Notes />} />
        <Route path="/about"               element={<About />} />

        {/* 404 fallback — redirects unknown paths back to home */}
        <Route path="*"                    element={<Home />} />
      </Routes>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <AnimatedRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;