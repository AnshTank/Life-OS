"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CustomChart } from "@/components/ui/custom-chart";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Target,
  Calculator,
  Newspaper,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Calendar,
  Zap,
} from "lucide-react";

export function MoneyView() {
  const [activeTab, setActiveTab] = useState("overview");

  // Dummy data for visualization
  const financialOverview = {
    totalBalance: 125000,
    monthlyIncome: 85000,
    monthlyExpenses: 45000,
    savings: 40000,
    investments: 180000,
    netWorth: 345000,
    savingsRate: 47,
  };

  const recentTransactions = [
    {
      id: 1,
      type: "expense",
      category: "food",
      amount: 1200,
      description: "Grocery Shopping",
      date: "2024-01-15",
      account: "Credit Card",
    },
    {
      id: 2,
      type: "income",
      category: "salary",
      amount: 85000,
      description: "Monthly Salary",
      date: "2024-01-01",
      account: "Bank Account",
    },
    {
      id: 3,
      type: "expense",
      category: "transport",
      amount: 800,
      description: "Uber Rides",
      date: "2024-01-14",
      account: "Debit Card",
    },
    {
      id: 4,
      type: "investment",
      category: "stocks",
      amount: 15000,
      description: "NIFTY 50 ETF",
      date: "2024-01-10",
      account: "Investment Account",
    },
    {
      id: 5,
      type: "expense",
      category: "entertainment",
      amount: 2500,
      description: "Movie & Dinner",
      date: "2024-01-13",
      account: "Credit Card",
    },
  ];

  const budgetData = [
    { category: "food", limit: 15000, spent: 8500, percentage: 57 },
    { category: "transport", limit: 8000, spent: 6200, percentage: 78 },
    { category: "entertainment", limit: 10000, spent: 4500, percentage: 45 },
    { category: "shopping", limit: 12000, spent: 9800, percentage: 82 },
    { category: "bills", limit: 20000, spent: 18500, percentage: 93 },
  ];

  const portfolio = [
    {
      symbol: "NIFTY50",
      name: "Nifty 50 ETF",
      quantity: 100,
      buyPrice: 180,
      currentPrice: 195,
      value: 19500,
      gain: 1500,
      gainPercent: 8.33,
    },
    {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      quantity: 50,
      buyPrice: 2400,
      currentPrice: 2580,
      value: 129000,
      gain: 9000,
      gainPercent: 7.5,
    },
    {
      symbol: "TCS",
      name: "Tata Consultancy Services",
      quantity: 25,
      buyPrice: 3200,
      currentPrice: 3450,
      value: 86250,
      gain: 6250,
      gainPercent: 7.81,
    },
    {
      symbol: "GOLD",
      name: "Gold ETF",
      quantity: 200,
      buyPrice: 45,
      currentPrice: 48,
      value: 9600,
      gain: 600,
      gainPercent: 6.67,
    },
  ];

  const financialNews = [
    {
      title: "RBI Keeps Repo Rate Unchanged at 6.5%",
      source: "Economic Times",
      time: "2 hours ago",
      category: "Policy",
    },
    {
      title: "Nifty 50 Hits New All-Time High",
      source: "Moneycontrol",
      time: "4 hours ago",
      category: "Markets",
    },
    {
      title: "Gold Prices Rise on Global Uncertainty",
      source: "Business Standard",
      time: "6 hours ago",
      category: "Commodities",
    },
    {
      title: "New Tax Benefits for ELSS Investments",
      source: "Mint",
      time: "1 day ago",
      category: "Tax",
    },
  ];

  const expenseChartData = [
    { name: "Food", value: 8500, color: "#10b981" },
    { name: "Transport", value: 6200, color: "#3b82f6" },
    { name: "Entertainment", value: 4500, color: "#8b5cf6" },
    { name: "Shopping", value: 9800, color: "#f59e0b" },
    { name: "Bills", value: 18500, color: "#ef4444" },
  ];

  const monthlyTrendData = [
    { month: "Oct", income: 80000, expenses: 42000, savings: 38000 },
    { month: "Nov", income: 82000, expenses: 44000, savings: 38000 },
    { month: "Dec", income: 85000, expenses: 45000, savings: 40000 },
    { month: "Jan", income: 85000, expenses: 47500, savings: 37500 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 pt-6 pb-8">
      <div className="container mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Money Management
            </h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Take control of your financial future
            </p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Badge variant="outline" className="px-2 md:px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 flex-1 lg:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="glass-card border-emerald-200/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Net Worth
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-emerald-600">
                    ₹{(financialOverview.netWorth / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-200/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Monthly Income
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    ₹{(financialOverview.monthlyIncome / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-200/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Monthly Expenses
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    ₹{(financialOverview.monthlyExpenses / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-200/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {financialOverview.savingsRate}%
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex justify-center animate-slide-up">
            <div className="w-full max-w-5xl overflow-x-auto">
              <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-max">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Transactions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="budget"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Budget</span>
                </TabsTrigger>
                <TabsTrigger
                  value="investments"
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Investments</span>
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">Portfolio</span>
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="data-[state=active]:bg-pink-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <Newspaper className="h-4 w-4" />
                  <span className="text-sm">News</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calculators"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                >
                  <Calculator className="h-4 w-4" />
                  <span className="text-sm">Calculators</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Monthly Expenses Breakdown
                  </CardTitle>
                  <CardDescription>
                    Current month spending by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomChart
                    type="donut"
                    data={expenseChartData}
                    className="h-64"
                  />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Income vs Expenses Trend
                  </CardTitle>
                  <CardDescription>
                    Last 4 months financial flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomChart
                    type="line"
                    data={monthlyTrendData.map(item => ({
                      name: item.month,
                      value: item.income,
                      color: "#10b981"
                    }))}
                    className="h-64"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-emerald-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-emerald-600" />
                    Savings Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Monthly Savings
                    </span>
                    <span className="font-semibold text-emerald-600">
                      ₹{financialOverview.savings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Savings Rate
                    </span>
                    <span className="font-semibold">
                      {financialOverview.savingsRate}%
                    </span>
                  </div>
                  <Progress
                    value={financialOverview.savingsRate}
                    className="h-2 [&>div]:bg-emerald-500"
                  />
                  <div className="text-xs text-muted-foreground">
                    Target: 50% • You're{" "}
                    {financialOverview.savingsRate >= 50
                      ? "on track!"
                      : `${50 - financialOverview.savingsRate}% away`}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-blue-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Monthly Inflow
                    </span>
                    <span className="font-semibold text-green-600">
                      +₹{financialOverview.monthlyIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Monthly Outflow
                    </span>
                    <span className="font-semibold text-red-600">
                      -₹{financialOverview.monthlyExpenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Net Flow</span>
                      <span className="font-bold text-emerald-600">
                        +₹
                        {(
                          financialOverview.monthlyIncome -
                          financialOverview.monthlyExpenses
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Investment Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Portfolio Value
                    </span>
                    <span className="font-semibold">
                      ₹{(financialOverview.investments / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Monthly Growth
                    </span>
                    <span className="font-semibold text-emerald-600">
                      +12.5%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      YTD Returns
                    </span>
                    <span className="font-semibold text-emerald-600">
                      +₹17.35K
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense Category Breakdown */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Expense Category Analysis
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {expenseChartData.slice(0, 3).map((category, index) => {
                      const percentage =
                        (category.value /
                          expenseChartData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ₹{category.value.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This month
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-4">
                    {expenseChartData.slice(3).map((category, index) => {
                      const percentage =
                        (category.value /
                          expenseChartData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ₹{category.value.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This month
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Financial Health Score</CardTitle>
                <CardDescription>
                  Comprehensive analysis of your financial wellness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Overall Score</span>
                  <span className="text-3xl font-bold text-emerald-600">
                    85/100
                  </span>
                </div>
                <Progress value={85} className="h-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">
                      A+
                    </div>
                    <div className="text-sm font-medium mb-1">Savings Rate</div>
                    <div className="text-xs text-muted-foreground">
                      47% - Excellent discipline
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      B+
                    </div>
                    <div className="text-sm font-medium mb-1">
                      Budget Control
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Good spending habits
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      A
                    </div>
                    <div className="text-sm font-medium mb-1">
                      Investment Mix
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Well diversified
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Emergency Fund</span>
                    <span className="font-semibold text-emerald-600">
                      6 months ✓
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Debt-to-Income</span>
                    <span className="font-semibold text-emerald-600">
                      12% ✓
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Investment Rate</span>
                    <span className="font-semibold text-blue-600">25%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Credit Score</span>
                    <span className="font-semibold text-emerald-600">
                      785 ✓
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Recent Transactions</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {recentTransactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                        index !== recentTransactions.length - 1
                          ? "border-b"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "income"
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : transaction.type === "expense"
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight
                              className={`w-5 h-5 text-emerald-600`}
                            />
                          ) : transaction.type === "expense" ? (
                            <ArrowDownRight
                              className={`w-5 h-5 text-red-600`}
                            />
                          ) : (
                            <TrendingUp className={`w-5 h-5 text-blue-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.account} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === "income"
                              ? "text-emerald-600"
                              : transaction.type === "expense"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {transaction.type === "expense" ? "-" : "+"}₹
                          {transaction.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Monthly Budget Tracking</h3>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="w-4 h-4 mr-2" />
                Set Budget
              </Button>
            </div>

            <div className="grid gap-4">
              {budgetData.map((budget) => (
                <Card key={budget.category} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold capitalize">
                          {budget.category}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{budget.spent.toLocaleString()} of ₹
                          {budget.limit.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          budget.percentage > 90
                            ? "destructive"
                            : budget.percentage > 75
                            ? "secondary"
                            : "default"
                        }
                      >
                        {budget.percentage}%
                      </Badge>
                    </div>
                    <Progress
                      value={budget.percentage}
                      className={`h-2 ${
                        budget.percentage > 90
                          ? "[&>div]:bg-red-500"
                          : budget.percentage > 75
                          ? "[&>div]:bg-orange-500"
                          : "[&>div]:bg-emerald-500"
                      }`}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>
                        Remaining: ₹
                        {(budget.limit - budget.spent).toLocaleString()}
                      </span>
                      <span>
                        {budget.percentage > 100
                          ? "Over budget!"
                          : `${100 - budget.percentage}% left`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Investment Overview</h3>
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Investment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-emerald-200/50">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    ₹{(financialOverview.investments / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Portfolio Value
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600 font-medium">
                      +12.5%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-blue-200/50">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ₹17.35K
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Gains
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">
                      +10.7%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-200/50">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">4</div>
                  <div className="text-sm text-muted-foreground">
                    Active Holdings
                  </div>
                  <div className="text-sm text-purple-600 font-medium mt-2">
                    Diversified
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomChart
                  type="donut"
                  data={[
                    { name: "Stocks", value: 70, color: "#3b82f6" },
                    { name: "ETFs", value: 20, color: "#10b981" },
                    { name: "Gold", value: 10, color: "#f59e0b" },
                  ]}
                  className="h-64"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Stock Portfolio</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-emerald-600 border-emerald-600"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +₹17,350 (10.7%)
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              {portfolio.map((stock) => (
                <Card
                  key={stock.symbol}
                  className="glass-card hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{stock.symbol}</h4>
                          <p className="text-sm text-muted-foreground">
                            {stock.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stock.quantity} shares @ ₹{stock.currentPrice}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          ₹{stock.value.toLocaleString()}
                        </p>
                        <div
                          className={`flex items-center gap-1 ${
                            stock.gain > 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {stock.gain > 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            ₹{Math.abs(stock.gain).toLocaleString()} (
                            {stock.gainPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Financial News & Updates
              </h3>
              <Badge variant="outline">
                <Zap className="w-3 h-3 mr-1" />
                Live Feed
              </Badge>
            </div>

            <div className="grid gap-4">
              {financialNews.map((news, index) => (
                <Card
                  key={index}
                  className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {news.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {news.source}
                          </span>
                        </div>
                        <h4 className="font-semibold text-lg mb-2">
                          {news.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {news.time}
                        </p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card border-blue-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      22,150
                    </div>
                    <div className="text-sm text-muted-foreground">
                      NIFTY 50
                    </div>
                    <div className="text-xs text-emerald-600">+1.2%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      73,850
                    </div>
                    <div className="text-sm text-muted-foreground">SENSEX</div>
                    <div className="text-xs text-blue-600">+0.8%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      ₹6,180
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Gold (10g)
                    </div>
                    <div className="text-xs text-orange-600">+0.3%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      ₹83.25
                    </div>
                    <div className="text-sm text-muted-foreground">USD/INR</div>
                    <div className="text-xs text-red-600">-0.1%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculators Tab */}
          <TabsContent value="calculators" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Financial Calculators</h3>
              <Badge variant="outline">
                <Calculator className="w-3 h-3 mr-1" />
                Interactive Tools
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <PiggyBank className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold mb-2">SIP Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    Calculate returns on systematic investment plans
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">EMI Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    Calculate loan EMIs and payment schedules
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Goal Planner</h4>
                  <p className="text-sm text-muted-foreground">
                    Plan investments for financial goals
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Compound Interest</h4>
                  <p className="text-sm text-muted-foreground">
                    Calculate compound interest growth
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-pink-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Affordability Check</h4>
                  <p className="text-sm text-muted-foreground">
                    Check what you can afford to buy
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-cyan-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Retirement Planner</h4>
                  <p className="text-sm text-muted-foreground">
                    Plan for your retirement corpus
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Affordability Check</CardTitle>
                <CardDescription>
                  See what you can afford based on your current financial
                  situation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="text-2xl font-bold text-emerald-600">
                      ₹25K
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Safe Monthly Spend
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600">₹5L</div>
                    <div className="text-sm text-muted-foreground">
                      Emergency Purchase
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹15L
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Max Loan Eligible
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
