import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import WorldMap from './pages/WorldMap.jsx';
import ErrorDistrict from './pages/ErrorDistrict.jsx';
import VVHeadquarters from './pages/VVHeadquarters.jsx';
import TestMatrixTower from './pages/TestMatrixTower.jsx';
import ArtefactArchive from './pages/ArtefactArchive.jsx';
import FinalInspection from './pages/FinalInspection.jsx';
import OfficeInterior from './pages/OfficeInterior.jsx';

function PageTransition({ children }) {
  const reduced = useReducedMotion();
  const motionProps = reduced
    ? {
        initial: false,
        animate: {},
        exit: {},
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2, ease: 'easeOut' },
      };
  return (
    <motion.div className="route-transition" {...motionProps}>
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<PageTransition><WorldMap /></PageTransition>}
        />
        <Route
          path="/zone/error-district"
          element={<PageTransition><ErrorDistrict /></PageTransition>}
        />
        <Route
          path="/zone/vv-headquarters"
          element={<PageTransition><VVHeadquarters /></PageTransition>}
        />
        <Route
          path="/zone/matrix-tower"
          element={<PageTransition><TestMatrixTower /></PageTransition>}
        />
        <Route
          path="/zone/artefact-archive"
          element={<PageTransition><ArtefactArchive /></PageTransition>}
        />
        <Route
          path="/final-inspection"
          element={<PageTransition><FinalInspection /></PageTransition>}
        />
        <Route
          path="/office/:zoneId"
          element={<PageTransition><OfficeInterior /></PageTransition>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
