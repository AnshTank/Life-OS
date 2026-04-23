// Re-export all page components
// These are the main view components used by the Next.js App Router pages

export { LandingPage } from './LandingPage';

// The following components are still in @/pages and will be re-exported here
// once they are migrated to src/views
export { DashboardPage } from '@/pages/DashboardPage';
export { TasksPage } from '@/pages/TasksPage';
export { GoalsPage } from '@/pages/GoalsPage';
export { HabitsPage } from '@/pages/HabitsPage';
export { MoneyPage } from '@/pages/MoneyPage';
export { PartnerPage } from '@/pages/PartnerPage';
export { ProjectsPage } from '@/pages/ProjectsPage';
export { CalendarPage } from '@/pages/CalendarPage';
export { AIAgentPage } from '@/pages/AIAgentPage';
export { JournalPage } from '@/pages/JournalPage';
