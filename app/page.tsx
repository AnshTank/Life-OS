"use client";

import { DashboardPage } from '@/views/DashboardPage';

export default function Home() {
  // The root page renders the dashboard
  // ClientLayout handles authentication and shows LandingPage if not authenticated
  return <DashboardPage />;
}
