import { useQuery } from '@tanstack/react-query'
import { ChatSession } from '../types'
import { getHistory } from '../services/api'

export function useHistory() {
  return useQuery<ChatSession[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await getHistory()
      if (response.success) {
        return response.data as ChatSession[]
      }
      return []
    },
  })
}
