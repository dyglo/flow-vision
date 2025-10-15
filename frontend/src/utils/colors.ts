import { CLASS_COLORS } from '@/constants/yoloClasses'

export function getClassColor(className: string): string {
  const normalized = className.toLowerCase()
  const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % CLASS_COLORS.length
  return CLASS_COLORS[index]
}
