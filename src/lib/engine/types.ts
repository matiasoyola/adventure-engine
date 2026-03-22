export type StepType = 'check' | 'photo'

export interface StepContent {
  id: string
  order: number
  text: string
  type: StepType
}

export interface BadgeContent {
  id: string
  name: string
  icon: string
}

export interface ZoneContent {
  id: string
  name: string
  description: string
  narrative: string
  icon: string
  suggestedOrder: number
  badge: BadgeContent
  steps: StepContent[]
}

export interface AdventureContent {
  id: string
  version: string
  title: string
  description: string
  coverImage: string
  zones: ZoneContent[]
}

export type ZoneStatus = 'available' | 'in_progress' | 'completed'

export interface ZoneState {
  status: ZoneStatus
  completedSteps: string[]
  completedAt?: string
}

export interface ProgressState {
  adventureVersion: string
  zones: Record<string, ZoneState>
  badges: string[]
  lastUpdated: string
}

export interface StepView extends StepContent {
  completed: boolean
}

export interface ZoneView {
  id: string
  name: string
  description: string
  narrative: string
  icon: string
  suggestedOrder: number
  status: ZoneStatus
  stepsTotal: number
  stepsCompleted: number
  steps: StepView[]
  nextStep: StepView | null
  badge: BadgeContent & { unlocked: boolean }
}

export interface GameState {
  adventureId: string
  adventureTitle: string
  adventureVersion: string
  zones: ZoneView[]
  badges: string[]
  totalZones: number
  completedZones: number
}

export type GameAction =
  | { type: 'complete_step'; zoneId: string; stepId: string }

export function assertNever(x: never): never {
  throw new Error(`Action no manejada: ${JSON.stringify(x)}`)
}

export interface CreateUserRequest {
  name: string
  avatar: string
  adventureId: string
}

export interface ActionRequest {
  action: GameAction
}

export interface ProgressResponse {
  user: { id: string; name: string; avatar: string }
  gameState: GameState
}
