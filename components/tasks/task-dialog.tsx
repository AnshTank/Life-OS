"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { LifeArea } from "@/lib/db-types"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TaskDialog({ open, onOpenChange, onSuccess }: TaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lifeArea: "learning" as LifeArea,
    goalId: "none",
    impact: 5,
    urgency: 5,
    effort: 5,
    dueDate: "",
    scheduledFor: "",
  })

  useEffect(() => {
    if (open) {
      loadGoals()
    }
  }, [open])

  async function loadGoals() {
    try {
      const response = await fetch("/api/goals")
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals.filter((g: any) => g.status === "active"))
      }
    } catch (error) {
      console.error("[v0] Failed to load goals:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate priority score
      // Formula: (Impact * 2) + (Urgency * 1.5) - (Effort * 0.5)
      // This prioritizes high impact, urgent tasks that require less effort
      const priorityScore = formData.impact * 2 + formData.urgency * 1.5 - formData.effort * 0.5

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priorityScore,
          goalId: formData.goalId === "none" ? undefined : formData.goalId,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          title: "",
          description: "",
          lifeArea: "learning",
          goalId: "none",
          impact: 5,
          urgency: 5,
          effort: 5,
          dueDate: "",
          scheduledFor: "",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to create task:", error)
    } finally {
      setLoading(false)
    }
  }

  const priorityScore = formData.impact * 2 + formData.urgency * 1.5 - formData.effort * 0.5

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>Add a task with intelligent prioritization</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Practice 5 medium DSA problems"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more context about this task"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lifeArea">Life area</Label>
              <Select
                value={formData.lifeArea}
                onValueChange={(value: LifeArea) => setFormData({ ...formData, lifeArea: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placement-prep">Placement Prep</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="buy-list">Buy List</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalId">Link to goal (optional)</Label>
              <Select value={formData.goalId} onValueChange={(value) => setFormData({ ...formData, goalId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal._id} value={goal._id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium text-sm">Smart prioritization</h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Impact: {formData.impact}/10</Label>
                  <span className="text-xs text-muted-foreground">How much does this move the needle?</span>
                </div>
                <Slider
                  value={[formData.impact]}
                  onValueChange={([value]) => setFormData({ ...formData, impact: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Urgency: {formData.urgency}/10</Label>
                  <span className="text-xs text-muted-foreground">How time-sensitive is this?</span>
                </div>
                <Slider
                  value={[formData.urgency]}
                  onValueChange={([value]) => setFormData({ ...formData, urgency: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Effort: {formData.effort}/10</Label>
                  <span className="text-xs text-muted-foreground">How much work is required?</span>
                </div>
                <Slider
                  value={[formData.effort]}
                  onValueChange={([value]) => setFormData({ ...formData, effort: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculated priority score:</span>
                <span className="text-lg font-bold text-primary">{priorityScore.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Higher scores appear first in your task list</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Scheduled for (optional)</Label>
              <Input
                id="scheduledFor"
                type="date"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
