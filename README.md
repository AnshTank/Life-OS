# Life OS - Technical Documentation

## 🚀 Project Overview

**Life OS** is a personal life management system built as a modern web application. It serves as your personal JARVIS for managing tasks, goals, progress tracking, and life areas with an addictive, motivating user interface.

---

## 🏗️ Architecture & Tech Stack

### **Frontend Framework**
- **Next.js 16.0.10** - React framework with App Router
- **React 19.2.0** - UI library with latest features
- **TypeScript** - Type-safe development

### **Styling & UI**
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Headless UI components for accessibility
- **Framer Motion 12.23.26** - Animation library
- **Lucide React** - Icon library
- **Custom CSS animations** - Addictive micro-interactions

### **Database & Backend**
- **MongoDB 7.0.0** - NoSQL database
- **MongoDB Atlas** - Cloud database hosting
- **Next.js API Routes** - Serverless backend functions

### **Authentication & Security**
- **Custom auth system** with bcryptjs
- **JWT tokens** with jose library
- **Environment variables** for sensitive data

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript** - Type checking

---

## 📁 Project Structure

```
Life/
├── app/                          # Next.js App Router
│   ├── (app)/                   # Protected routes group
│   │   ├── dashboard/           # Dashboard page
│   │   ├── goals/              # Goals management
│   │   ├── tasks/              # Task management
│   │   ├── progress/           # Progress tracking
│   │   ├── money/              # Money management system
│   │   ├── partner/            # Accountability partner
│   │   └── layout.tsx          # App layout with navigation
│   ├── api/                    # API routes
│   │   ├── goals/              # Goals CRUD operations
│   │   ├── tasks/              # Tasks CRUD operations
│   │   ├── progress/           # Progress tracking
│   │   ├── stats/              # Statistics endpoints
│   │   └── quotes/             # Daily quotes API
│   ├── globals.css             # Global styles & animations
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── dashboard-view.tsx  # Main dashboard layout
│   │   ├── today-focus.tsx     # Today's planned tasks
│   │   ├── unified-insights.tsx # Progress & insights
│   │   └── ...
│   ├── goals/                  # Goals-related components
│   │   ├── goals-view.tsx      # Goals page with categories
│   │   ├── goals-list.tsx      # Goals listing
│   │   └── ...
│   ├── tasks/                  # Task management components
│   ├── money/                  # Money management components
│   │   └── money-view.tsx      # Complete financial system
│   ├── ui/                     # Reusable UI components
│   │   ├── card.tsx           # Enhanced card component
│   │   ├── button.tsx         # Gradient button component
│   │   ├── progress.tsx       # Animated progress bars
│   │   ├── confetti.tsx       # Celebration animations
│   │   └── ...
│   └── universe-navigator.tsx  # Main navigation bar
├── lib/                        # Utility libraries
│   ├── db-types.ts            # TypeScript interfaces
│   ├── mongodb.ts             # Database connection
│   ├── auth.ts                # Authentication utilities
│   └── utils.ts               # Helper functions
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
├── styles/                     # Additional stylesheets
├── TODO.md                     # Feature roadmap
└── package.json               # Dependencies
```

---

## 🎨 Design System

### **Color Palette**
- **Primary Gradient**: Purple to Pink (`from-purple-500 to-pink-500`)
- **Secondary Gradient**: Blue to Cyan (`from-blue-500 to-cyan-500`)
- **Success**: Green gradients (`from-green-500 to-emerald-500`)
- **Warning**: Orange to Yellow (`from-orange-500 to-yellow-500`)
- **Destructive**: Red gradients (`from-red-500 to-pink-500`)

### **Typography**
- **Font Family**: Geist (primary), Geist Mono (monospace)
- **Hierarchy**: 
  - Headings: `text-4xl` to `text-lg` with gradient text
  - Body: `text-base` and `text-sm`
  - Captions: `text-xs`

### **Animations**
- **Entrance**: `animate-slide-up` with staggered delays
- **Interactions**: `animate-magnetic-hover` for buttons/cards
- **Progress**: `animate-progress-fill` for progress bars
- **Celebrations**: `animate-task-complete` + confetti
- **Floating**: `animate-float` for background elements

### **Components**
- **Glassmorphism**: `.glass` and `.glass-strong` classes
- **Gradient Text**: `.gradient-text` class
- **Interactive Cards**: `.interactive-card` with hover effects
- **Progress Bars**: Multiple variants (success, gradient, etc.)

---

## 🗄️ Database Schema

### **Collections**

#### **Goals**
```typescript
interface Goal {
  _id: string
  userId: string
  title: string
  description: string
  lifeArea: LifeArea
  category: GoalCategory  // NEW: home, family, house, travel, etc.
  targetDate?: Date
  status: "active" | "completed" | "paused"
  impact: number // 1-10
  createdAt: Date
  updatedAt: Date
  sharedWithPartner: boolean
}
```

#### **Tasks**
```typescript
interface Task {
  _id: string
  userId: string
  title: string
  description?: string
  lifeArea: LifeArea
  goalId?: string
  
  // Smart prioritization
  impact: number // 1-10
  urgency: number // 1-10
  effort: number // 1-10
  priorityScore: number // Computed
  
  dueDate?: Date
  scheduledFor?: Date
  status: "todo" | "in-progress" | "completed" | "cancelled"
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### **Progress Metrics**
```typescript
interface ProgressMetrics {
  _id: string
  userId: string
  period: "daily" | "weekly" | "monthly" | "yearly"
  startDate: Date
  endDate: Date
  tasksCompleted: number
  tasksTotal: number
  completionRate: number
  highImpactCompleted: number
  averageImpactScore: number
  lifeAreaBreakdown: Array<{
    area: LifeArea
    tasksCompleted: number
    progress: number
  }>
  goalsProgress: Array<{
    goalId: string
    progress: number
  }>
  createdAt: Date
}
```

---

## 🔧 Key Features Implementation

### **1. Dashboard**
- **Personalized Greeting**: Time-based with user name
- **Life Areas Slider**: 6 cards per page with pagination
- **Today's Focus**: Pre-planned daily tasks
- **Unified Insights**: Combined progress tracking
- **Daily Quotes**: ZenQuotes.io API with localStorage caching

### **2. Smart Task Prioritization**
```typescript
// Priority calculation algorithm
priorityScore = (impact * 0.4) + (urgency * 0.4) + ((10 - effort) * 0.2)
```

### **3. Goal Categories**
12 categories with icons and colors:
- 🏠 Home, 👥 Family, 🏡 House, ✈️ Travel
- ❤️ Personal, 🚗 Cars, 💻 Technology, 💼 Career
- 💚 Health, 💰 Finance, 📚 Learning, 🤝 Relationships

### **4. Animations & Micro-interactions**
- **Task Completion**: Confetti + scale animation
- **Progress Bars**: Animated fill with shimmer effect
- **Card Interactions**: Magnetic hover with lift effect
- **Page Transitions**: Staggered slide-up animations

### **5. API Optimizations**
- **Quote Caching**: localStorage with date-based invalidation
- **Lazy Loading**: Components load with animation delays
- **Error Handling**: Fallback states for all API calls

---

## 🚀 Performance Optimizations

### **Frontend**
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js built-in optimization
- **CSS Optimization**: Tailwind CSS purging
- **Animation Performance**: CSS transforms over layout changes

### **Backend**
- **MongoDB Indexing**: Optimized queries on userId and dates
- **API Caching**: localStorage for quotes, session storage for stats
- **Serverless Functions**: Next.js API routes for scalability

### **UX Optimizations**
- **Loading States**: Shimmer animations for better perceived performance
- **Optimistic Updates**: Immediate UI feedback before API confirmation
- **Error Boundaries**: Graceful error handling

---

## 🔐 Security Implementation

### **Authentication**
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Environment Variables**: Sensitive data protection

### **Data Protection**
- **Input Validation**: Zod schemas for type safety
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: React's built-in escaping

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: `< 768px` - Single column layout
- **Tablet**: `768px - 1024px` - Adjusted grid layouts
- **Desktop**: `> 1024px` - Full multi-column experience

### **Mobile Optimizations**
- **Touch Targets**: Minimum 44px for buttons
- **Floating Action Buttons**: Mobile-specific quick actions
- **Swipe Gestures**: Planned for task management

---

## 🧪 Testing Strategy

### **Current Testing**
- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality and consistency
- **Manual Testing**: Cross-browser compatibility

### **Planned Testing**
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows

---

## 🚀 Deployment

### **Current Setup**
- **Development**: `npm run dev` on localhost:3000
- **Build**: `npm run build` for production optimization
- **Environment**: Local development with MongoDB Atlas

### **Production Deployment** (Planned)
- **Platform**: Vercel (recommended for Next.js)
- **Database**: MongoDB Atlas (already configured)
- **Domain**: Custom domain setup
- **Analytics**: Vercel Analytics integration

---

## 🔄 Development Workflow

### **Git Workflow**
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Production deployment
git checkout main
git merge feature/new-feature
git push origin main
```

### **Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add MongoDB URI and other secrets

# Run development server
npm run dev
```

---

## 📊 Analytics & Monitoring

### **Current Metrics**
- **User Engagement**: Task completion rates
- **Feature Usage**: Dashboard interactions
- **Performance**: Page load times

### **Planned Monitoring**
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Web Vitals
- **User Analytics**: Privacy-focused analytics

---

## 🔮 Future Enhancements

### **High Priority**
- **Money Management Tab**: ✅ **COMPLETED** - Complete financial tracking system
  - 7 comprehensive tabs: Overview, Transactions, Budget, Investments, Portfolio, News, Calculators
  - Interactive charts with donut, line, and bar visualizations
  - Financial health scoring and detailed analytics
  - Portfolio tracking with real-time gains/losses
  - Budget management with visual progress indicators
  - Financial news feed and market overview
  - Interactive calculators (SIP, EMI, Goal Planning, etc.)
- **Mobile App**: React Native version
- **Offline Support**: PWA capabilities
- **AI Integration**: Smart task suggestions

### **Medium Priority**
- **Team Collaboration**: Shared workspaces
- **Integrations**: Calendar, Notion, etc.
- **Advanced Analytics**: Productivity insights
- **Gamification**: Achievement system

---

## 🐛 Known Issues & Limitations

### **Current Issues**
- **Mobile Optimization**: Some components need mobile-specific layouts
- **Performance**: Large datasets may need pagination
- **Browser Support**: IE11 not supported (modern browsers only)

### **Technical Debt**
- **API Error Handling**: Needs more robust error boundaries
- **Type Safety**: Some components need stricter typing
- **Testing Coverage**: Needs comprehensive test suite

---

## 📚 Learning Resources

### **Technologies Used**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### **Design Inspiration**
- [Linear](https://linear.app) - Clean, modern UI
- [Figma](https://figma.com) - Professional design tools
- [Notion](https://notion.so) - Flexible workspace design

---

## 🤝 Contributing

### **Code Style**
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Naming**: camelCase for variables, PascalCase for components

### **Component Structure**
```typescript
// Component template
"use client"

import { useState, useEffect } from "react"
import { ComponentProps } from "./types"

interface Props {
  // Define props with TypeScript
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Component logic
  
  return (
    <div className="component-styles">
      {/* JSX content */}
    </div>
  )
}
```

---

## 📞 Support & Contact

### **Development Team**
- **Lead Developer**: Ansh Tank
- **Project Type**: Personal Life Management System
- **Started**: 2024
- **Status**: Active Development

### **Getting Help**
- **Documentation**: This README file
- **Issues**: Check TODO.md for known issues
- **Features**: See TODO.md for roadmap

---

**Last Updated**: ${new Date().toLocaleDateString()}  
**Version**: 1.0.0  
**License**: Personal Use

---

*Built with ❤️ for personal productivity and life management*