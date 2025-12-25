'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, Clock, Circle, Search } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { format } from 'date-fns'

interface ProgressRow {
  manager_email: string
  manager_name: string | null
  doc_title: string
  status: 'not_started' | 'in_progress' | 'completed'
  updated_at: string | null
}

interface ProgressTableProps {
  rows: ProgressRow[]
}

export function ProgressTable({ rows }: ProgressTableProps) {
  const [search, setSearch] = useState('')

  const statusConfig = {
    not_started: {
      label: 'Not Started',
      icon: Circle,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    in_progress: {
      label: 'In Progress',
      icon: Clock,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    completed: {
      label: 'Completed',
      icon: Check,
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
  }

  const filteredRows = rows.filter((row) => {
    const searchLower = search.toLowerCase()
    return (
      row.manager_email.toLowerCase().includes(searchLower) ||
      row.doc_title.toLowerCase().includes(searchLower) ||
      (row.manager_name && row.manager_name.toLowerCase().includes(searchLower))
    )
  })

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Circle}
        title="No progress data yet"
        description="Training progress will appear here once users start completing training documents"
      />
    )
  }

  const stats = {
    total: rows.length,
    completed: rows.filter((r) => r.status === 'completed').length,
    in_progress: rows.filter((r) => r.status === 'in_progress').length,
    not_started: rows.filter((r) => r.status === 'not_started').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.not_started}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress Details</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by manager or document..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, idx) => {
                    const StatusIcon = statusConfig[row.status].icon
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{row.manager_email}</div>
                            {row.manager_name && (
                              <div className="text-sm text-slate-500">{row.manager_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.doc_title}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig[row.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[row.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.updated_at
                            ? format(new Date(row.updated_at), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
