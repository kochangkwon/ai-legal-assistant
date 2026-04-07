import { LegalCategory } from '../types'

export interface CategoryItem {
  id: LegalCategory
  label: string
  icon: string
  description: string
}

export const LEGAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'civil',
    label: '민사',
    icon: '⚖️',
    description: '계약, 손해배상, 부동산 등',
  },
  {
    id: 'criminal',
    label: '형사',
    icon: '🔨',
    description: '폭행, 사기, 명예훼손 등',
  },
  {
    id: 'family',
    label: '가사',
    icon: '👨‍👩‍👧',
    description: '이혼, 양육권, 상속 등',
  },
  {
    id: 'labor',
    label: '노동',
    icon: '💼',
    description: '해고, 임금, 산재 등',
  },
  {
    id: 'realestate',
    label: '부동산',
    icon: '🏠',
    description: '임대차, 등기, 매매 등',
  },
]
