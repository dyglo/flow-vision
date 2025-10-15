import type { DetectionResponse } from '@/types/detection'
import { apiClient } from './api'

export type DetectionRequest = {
  file: File
  classes: string[]
}

export async function detectSingleImage({ file, classes }: DetectionRequest): Promise<DetectionResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams()
  classes.forEach((className) => params.append('classes', className))
  const query = params.toString()

  const response = await apiClient.post<DetectionResponse>(query ? `/detection/image?${query}` : '/detection/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}
