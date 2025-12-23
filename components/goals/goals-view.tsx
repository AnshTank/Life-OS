"use client";

import { useState, useEffect } from "react";
import type { User } from "@/lib/auth";
import type {
  Goal,
  Problem,
  GoalCategory,
  GoalTimeframe,
} from "@/lib/db-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Filter,
  Home,
  Users,
  Car,
  Laptop,
  Plane,
  Heart,
  Briefcase,
  DollarSign,
  BookOpen,
  UserCheck,
  Target,
  Zap,
  Brain,
} from "lucide-react";
import { GoalsList } from "./goals-list";
import { ProblemsList } from "./problems-list";
import { GoalDialog } from "./goal-dialog";
import { ProblemDialog } from "./problem-dialog";

interface GoalsViewProps {
  user: User;
}

const goalCategories: {
  value: GoalCategory;
  label: string;
  icon: any;
  color: string;
}[] = [
  {
    value: "home",
    label: "Home & Living",
    icon: Home,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "family",
    label: "Family & Kids",
    icon: Users,
    color: "from-pink-500 to-rose-500",
  },
  {
    value: "house",
    label: "Real Estate",
    icon: Home,
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "travel",
    label: "Travel & Adventure",
    icon: Plane,
    color: "from-purple-500 to-violet-500",
  },
  {
    value: "personal",
    label: "Personal Growth",
    icon: Heart,
    color: "from-red-500 to-pink-500",
  },
  {
    value: "cars",
    label: "Vehicles & Transport",
    icon: Car,
    color: "from-orange-500 to-yellow-500",
  },
  {
    value: "technology",
    label: "Tech & Digital",
    icon: Laptop,
    color: "from-indigo-500 to-blue-500",
  },
  {
    value: "career",
    label: "Career & Business",
    icon: Briefcase,
    color: "from-gray-600 to-gray-800",
  },
  {
    value: "health",
    label: "Health & Fitness",
    icon: Heart,
    color: "from-green-400 to-emerald-600",
  },
  {
    value: "finance",
    label: "Money & Investment",
    icon: DollarSign,
    color: "from-yellow-500 to-orange-500",
  },
  {
    value: "learning",
    label: "Education & Skills",
    icon: BookOpen,
    color: "from-purple-600 to-indigo-600",
  },
  {
    value: "relationships",
    label: "Social & Romance",
    icon: UserCheck,
    color: "from-pink-400 to-rose-600",
  },
];

export function GoalsView({ user }: GoalsViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [currentGoalDialogOpen, setCurrentGoalDialogOpen] = useState(false);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    GoalCategory | "all"
  >("all");

  // Dummy long-term goals (6+ months)
  const dummyLongTermGoals: Goal[] = [
    {
      _id: "1",
      userId: "user1",
      title: "Build Dream Home",
      description:
        "Design and construct a modern 3-bedroom house with smart home features",
      lifeArea: "personal",
      category: "house",
      timeframe: "long-term",
      targetDate: new Date("2025-12-31"),
      status: "active",
      impact: 9,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      sharedWithPartner: true,
    },
    {
      _id: "2",
      userId: "user1",
      title: "Launch SaaS Startup",
      description: "Build and launch a profitable SaaS product with $10k MRR",
      lifeArea: "finance",
      category: "career",
      timeframe: "long-term",
      targetDate: new Date("2024-12-31"),
      status: "active",
      impact: 10,
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
      sharedWithPartner: false,
    },
    {
      _id: "3",
      userId: "user1",
      title: "Buy Tesla Model 3",
      description: "Save $50k and purchase a Tesla Model 3 Performance variant",
      lifeArea: "finance",
      category: "cars",
      timeframe: "long-term",
      targetDate: new Date("2024-10-15"),
      status: "active",
      impact: 7,
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-05"),
      sharedWithPartner: true,
    },
    {
      _id: "9",
      userId: "user1",
      title: "Complete Marathon",
      description:
        "Train for and successfully complete a full 42km marathon race",
      lifeArea: "health",
      category: "health",
      timeframe: "long-term",
      targetDate: new Date("2024-11-15"),
      status: "completed",
      impact: 8,
      createdAt: new Date("2023-06-01"),
      updatedAt: new Date("2024-01-20"),
      sharedWithPartner: false,
    },
    {
      _id: "10",
      userId: "user1",
      title: "Learn Spanish Fluently",
      description:
        "Achieve conversational fluency in Spanish through daily practice",
      lifeArea: "learning",
      category: "learning",
      timeframe: "long-term",
      targetDate: new Date("2024-08-01"),
      status: "completed",
      impact: 7,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2024-01-15"),
      sharedWithPartner: true,
    },
  ];

  // Dummy current goals (21-90 days)
  const dummyCurrentGoals: Goal[] = [
    {
      _id: "c1",
      userId: "user1",
      title: "Master React Hooks",
      description:
        "Complete advanced React course and build 3 projects using hooks",
      lifeArea: "learning",
      category: "technology",
      timeframe: "current",
      targetDate: new Date("2024-03-15"),
      status: "active",
      impact: 8,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
      sharedWithPartner: false,
    },
    {
      _id: "c2",
      userId: "user1",
      title: "Get Six Pack Abs",
      description: "Follow strict diet and workout plan for 60 days",
      lifeArea: "health",
      category: "health",
      timeframe: "current",
      targetDate: new Date("2024-03-01"),
      status: "active",
      impact: 8,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      sharedWithPartner: false,
    },
    {
      _id: "c3",
      userId: "user1",
      title: "Plan Europe Trip",
      description:
        "Research destinations, book flights and accommodations for summer trip",
      lifeArea: "travel",
      category: "travel",
      timeframe: "current",
      targetDate: new Date("2024-02-28"),
      status: "active",
      impact: 7,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      sharedWithPartner: false,
    },
    {
      _id: "c4",
      userId: "user1",
      title: "Build Home Gym",
      description:
        "Set up complete home gym with weights, cardio equipment, and mirrors",
      lifeArea: "health",
      category: "home",
      timeframe: "current",
      targetDate: new Date("2024-02-15"),
      status: "completed",
      impact: 6,
      createdAt: new Date("2023-12-01"),
      updatedAt: new Date("2024-01-10"),
      sharedWithPartner: false,
    },
  ];

  // Dummy problems data with solutions
  const dummyProblems: Problem[] = [
    {
      _id: "p1",
      userId: "user1",
      title: "Slow LeetCode Problem Solving",
      description:
        "Taking too long to solve medium-level problems. Need to improve pattern recognition.",
      lifeArea: "placement-prep",
      status: "in-progress",
      priority: "high",
      hasSolution: true,
      solution:
        "Practice 2 problems daily, focus on common patterns, use spaced repetition for review",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      _id: "p2",
      userId: "user1",
      title: "Inconsistent Sleep Schedule",
      description:
        "Going to bed too late and waking up tired. Affecting productivity.",
      lifeArea: "health",
      status: "open",
      priority: "medium",
      hasSolution: false,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
    {
      _id: "p3",
      userId: "user1",
      title: "Budget Overspending",
      description: "Spending more than planned on food and entertainment.",
      lifeArea: "finance",
      status: "in-progress",
      priority: "medium",
      hasSolution: true,
      solution:
        "Use expense tracking app, set weekly budgets, cook more meals at home",
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-18"),
    },
  ];

  useEffect(() => {
    setGoals([...dummyLongTermGoals, ...dummyCurrentGoals]);
    setProblems(dummyProblems);
    setLoading(false);
  }, []);

  const longTermGoals = goals.filter((g) => g.timeframe === "long-term");
  const currentGoals = goals.filter((g) => g.timeframe === "current");

  const filteredLongTermGoals =
    selectedCategory === "all"
      ? longTermGoals
      : longTermGoals.filter((goal) => goal.category === selectedCategory);

  const filteredCurrentGoals =
    selectedCategory === "all"
      ? currentGoals
      : currentGoals.filter((goal) => goal.category === selectedCategory);

  const getCategoryStats = () => {
    const stats = goalCategories.map((cat) => ({
      ...cat,
      count: goals.filter((g) => g.category === cat.value).length,
      completed: goals.filter(
        (g) => g.category === cat.value && g.status === "completed"
      ).length,
    }));
    return stats.filter((s) => s.count > 0);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Header */}
      <div className="glass-strong border-b relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="animate-slide-up">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Goals & Vision
                </span>
                <span className="text-3xl md:text-4xl">🎯</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Organize your future goals and current challenges by category
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
        {/* Category Overview */}
        <div
          className="mb-6 md:mb-8 animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Goal Categories
            </span>
            <span className="text-lg md:text-xl">📋</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {getCategoryStats().map((category, index) => {
              const Icon = category.icon;
              const completionRate =
                category.count > 0
                  ? Math.round((category.completed / category.count) * 100)
                  : 0;
              return (
                <div
                  key={category.value}
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl glass hover:shadow-lg transition-all duration-300 ease-out cursor-pointer animate-slide-up ${
                    selectedCategory === category.value
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.value
                        ? "all"
                        : category.value
                    )
                  }
                >
                  <div className="text-center">
                    <div
                      className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r ${category.color} w-fit mx-auto mb-2 md:mb-3`}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm mb-1 leading-tight truncate px-1">
                      {category.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1 md:mb-2 truncate">
                      {category.count} goals
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {completionRate}% done
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="long-term" className="space-y-4">
          <div
            className="flex justify-center animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger
                value="long-term"
                className="flex items-center gap-2 px-4 py-3"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Long-term</span>
              </TabsTrigger>
              <TabsTrigger
                value="current"
                className="flex items-center gap-2 px-4 py-3"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Current</span>
              </TabsTrigger>
              <TabsTrigger
                value="problems"
                className="flex items-center gap-2 px-4 py-3"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Problems</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as GoalCategory | "all")
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {goalCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setGoalDialogOpen(true)}
                className="animate-magnetic-hover bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-white font-medium hidden sm:inline">
                  Long-term Goal
                </span>
                <span className="text-white font-medium sm:hidden">
                  Long-term
                </span>
              </Button>
              <Button
                onClick={() => setCurrentGoalDialogOpen(true)}
                className="animate-magnetic-hover bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-white font-medium hidden sm:inline">
                  Current Goal
                </span>
                <span className="text-white font-medium sm:hidden">
                  Current
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setProblemDialogOpen(true)}
                className="animate-magnetic-hover border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="font-medium">Problem</span>
              </Button>
            </div>
          </div>

          <TabsContent
            value="long-term"
            className="animate-slide-up"
            style={{ animationDelay: "500ms" }}
          >
            <GoalsList
              goals={filteredLongTermGoals}
              loading={loading}
              onUpdate={() => {}}
            />
          </TabsContent>

          <TabsContent
            value="current"
            className="animate-slide-up"
            style={{ animationDelay: "500ms" }}
          >
            <GoalsList
              goals={filteredCurrentGoals}
              loading={loading}
              onUpdate={() => {}}
            />
          </TabsContent>

          <TabsContent
            value="problems"
            className="animate-slide-up"
            style={{ animationDelay: "500ms" }}
          >
            <ProblemsList
              problems={problems}
              loading={loading}
              onUpdate={() => {}}
            />
          </TabsContent>
        </Tabs>
      </div>

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onSuccess={() => {}}
        timeframe="long-term"
      />
      <GoalDialog
        open={currentGoalDialogOpen}
        onOpenChange={setCurrentGoalDialogOpen}
        onSuccess={() => {}}
        timeframe="current"
      />
      <ProblemDialog
        open={problemDialogOpen}
        onOpenChange={setProblemDialogOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
