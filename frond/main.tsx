import GroupesPage from './GroupesPage'
import AnimateursPage from './AnimateursPage'
import GroupeDetailPage from './GroupeDetailPage'
import AnimateurDetailPage from './AnimateurDetailPage'
import FichePresencePage from './FichePresencePage'
import VisiteursPage from './VisiteursPage'
import DonsPage from './DonsPage'
import RapportPage from './RapportPage'
import EnseignementsPage from './EnseignementsPage'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import CampsPage from './CampsPage'
import DashboardPage from './DashboardPage'
import LoginPage from './LoginPage'
import PlanningPage from './PlanningPage'
import CaissePage from './CaissePage'
import {
  CampDetailPage,
  CampFormPage,
  DocumentsPage,
  MessagesPage,
  MedicalPage,
  ParticipantsPage,
  SettingsPage,
  StatistiquesPage,
} from './ModulePages'
import ProtectedRoute from './ProtectedRoute'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="camps" element={<CampsPage />} />
          <Route path="groupes" element={<GroupesPage />} />
          <Route path="animateurs" element={<AnimateursPage />} />
          <Route path="camps/nouveau" element={<CampFormPage />} />
          <Route path="camps/:id" element={<CampDetailPage />} />
          <Route path="participants" element={<ParticipantsPage />} />
          <Route path="medical" element={<MedicalPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="paiements" element={<CaissePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="statistiques" element={<StatistiquesPage />} />
          <Route path="parametres" element={<SettingsPage />} />
         
          <Route path="groupes/:id" element={<GroupeDetailPage />} />
          <Route path="animateurs/:id" element={<AnimateurDetailPage />} />
          <Route path="presence" element={<FichePresencePage />} />
          <Route path="visiteurs" element={<VisiteursPage />} />
          <Route path="dons" element={<DonsPage />} />
          <Route path="rapport" element={<RapportPage />} />
          <Route path="enseignements" element={<EnseignementsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
