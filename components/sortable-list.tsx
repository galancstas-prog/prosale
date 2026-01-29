'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode
  disabled?: boolean
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  if (disabled) {
    return (
      <>
        {items.map((item) => renderItem(item, {}))}
      </>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {(dragHandleProps) => renderItem(item, dragHandleProps)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

interface SortableItemProps {
  id: string
  children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const dragHandleProps = {
    ...attributes,
    ...listeners,
    className: 'cursor-grab active:cursor-grabbing',
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandleProps)}
    </div>
  )
}

// Компонент иконки перетаскивания
interface DragHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function DragHandle({ className, ...props }: DragHandleProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-none',
        className
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}
