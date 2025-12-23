"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { LifeArea, GoalCategory, GoalTimeframe } from "@/lib/db-types"

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  timeframe: GoalTimeframe
}

export function GoalDialog({ open, onOpenChange, onSuccess, timeframe }: GoalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lifeArea: "learning" as LifeArea,
    category: "learning" as GoalCategory,
    timeframe: timeframe,
    targetDate: "",
    impact: 5,
    sharedWithPartner: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          title: "",
          description: "",
          lifeArea: "learning",
          category: "learning",
          timeframe: timeframe,
          targetDate: "",
          impact: 5,
          sharedWithPartner: false,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to create goal:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a new {timeframe === 'long-term' ? 'long-term' : 'current'} goal</DialogTitle>
          <DialogDescription>
            {timeframe === 'long-term' 
              ? 'Define a future goal you want to work towards (6+ months)' 
              : 'Set a goal you can achieve in 21-90 days'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Get a software engineering internship"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this goal means to you and what success looks like"
              rows={4}
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: GoalCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                  <SelectItem value="house">🏡 House</SelectItem>
                  <SelectItem value="travel">✈️ Travel</SelectItem>
                  <SelectItem value="personal">❤️ Personal</SelectItem>
                  <SelectItem value="cars">🚗 Cars</SelectItem>
                  <SelectItem value="technology">💻 Technology</SelectItem>
                  <SelectItem value="career">💼 Career</SelectItem>
                  <SelectItem value="health">🏃‍♂️ Health</SelectItem>
                  <SelectItem value="finance">💰 Finance</SelectItem>
                  <SelectItem value="learning">📚 Learning</SelectItem>
                  <SelectItem value="relationships">👥 Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date (optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Impact level: {formData.impact}/10</Label>
            <Slider
              value={[formData.impact]}
              onValueChange={([value]) => setFormData({ ...formData, impact: value })}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
            <p className="text-xs text-muted-foreground">How much will achieving this goal improve your life?</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="shared">Share with accountability partner</Label>
              <p className="text-xs text-muted-foreground">Let your partner see this goal and your progress</p>
            </div>
            <Switch
              id="shared"
              checked={formData.sharedWithPartner}
              onCheckedChange={(checked) => setFormData({ ...formData, sharedWithPartner: checked })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
