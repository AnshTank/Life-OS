"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TaskFiltersProps {
  filters: {
    status: string
    lifeArea: string
    sortBy: string
  }
  onChange: (filters: any) => void
}

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  return (
    <div className="mt-6 p-4 rounded-lg border bg-card space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={(value) => onChange({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Life area</Label>
          <Select value={filters.lifeArea} onValueChange={(value) => onChange({ ...filters, lifeArea: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
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
          <Label>Sort by</Label>
          <Select value={filters.sortBy} onValueChange={(value) => onChange({ ...filters, sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority score</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
              <SelectItem value="urgency">Urgency</SelectItem>
              <SelectItem value="effort">Effort (low first)</SelectItem>
              <SelectItem value="dueDate">Due date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
