export interface Script {
  id: string
  title: string
  content: string
  translatedContent?: string
  sections?: Section[]
  createdAt: string
  updatedAt: string
  userId?: string
}

export interface Section {
  id: string
  scriptId: string
  sectionNumber: number
  englishContent: string
  koreanContent?: string
} 