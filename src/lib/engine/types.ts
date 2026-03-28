// =============================================================================
// CONTENT TYPES — del JSON, inmutables en runtime
// =============================================================================

export type StepType = 'check' | 'photo'

export interface StepContent {
  id: string
  order: number
  text: string
  type: StepType
}

export interface ClueContent {
  id: string
  order: number
  title: string
  narrative: string
  unlockTrigger: string        // "Cuando veáis el primer elefante..."
  completionMessage: string    // Mensaje dramático al completar la pista
  nextClueHint: string         // "La siguiente pista se abre cuando..."
  steps: StepContent[]
}

export interface BadgeContent {
  id: string
  name: string
  icon: string
  completionMessage: string    // Mensaje de celebración al ganar la insignia
  nextDayHint: string          // "Mañana llega un nuevo universo..."
}

export interface MorningCardContent {
  title: string                // "Día 1 · Cabárceno"
  universe: string             // "Universo Jumanji"
  parentGuide: string          // Guía turística para padres
  ritual: string               // Texto para leer en voz alta
  watchFor: string[]           // En qué fijarse antes de llegar
  clueSchedule: {              // Cuándo abrir cada pista
    clueId: string
    trigger: string
  }[]
}

export interface ZoneContent {
  id: string
  name: string
  description: string
  icon: string
  universe: string             // "Jumanji", "Piratas del Caribe"...
  suggestedOrder: number
  morningCard: MorningCardContent
  badge: BadgeContent
  clues: ClueContent[]
}

export interface AdventureContent {
  id: string
  version: string
  title: string
  description: string
  coverImage: string
  zones: ZoneContent[]
}

// =============================================================================
// STATE TYPES — en BD como JSON blob
// =============================================================================

export type ZoneStatus  = 'locked' | 'available' | 'in_progress' | 'completed'
export type ClueStatus  = 'locked' | 'available' | 'in_progress' | 'completed'

export interface StepState {
  completed: boolean
  completedAt?: string
}

export interface ClueState {
  status: ClueStatus
  steps: Record<string, StepState>   // stepId → state
  completedAt?: string
}

export interface ZoneState {
  status: ZoneStatus
  clues: Record<string, ClueState>   // clueId → state
  completedAt?: string
}

export interface ProgressState {
  adventureVersion: string
  zones: Record<string, ZoneState>   // zoneId → state
  badges: string[]                   // badgeId[]
  lastUpdated: string
}

// =============================================================================
// GAME STATE — motor → UI
// =============================================================================

export interface StepView extends StepContent {
  completed: boolean
}

export interface ClueView {
  id: string
  order: number
  title: string
  narrative: string
  unlockTrigger: string
  completionMessage: string
  nextClueHint: string
  status: ClueStatus
  steps: StepView[]
  stepsTotal: number
  stepsCompleted: number
}

export interface ZoneView {
  id: string
  name: string
  description: string
  icon: string
  universe: string
  suggestedOrder: number
  status: ZoneStatus
  clues: ClueView[]
  cluesTotal: number
  cluesCompleted: number
  badge: BadgeContent & { unlocked: boolean }
  morningCard: MorningCardContent
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

// =============================================================================
// ACTIONS — discriminated union para PATCH /api/progress/:childId
// =============================================================================

export type GameAction =
  | { type: 'complete_step'; zoneId: string; clueId: string; stepId: string }
  | { type: 'unlock_clue';   zoneId: string; clueId: string }
// | { type: 'validate_adult'; zoneId: string; clueId: string; stepId: string }  // v3
// | { type: 'upload_photo';   zoneId: string; clueId: string; stepId: string; photoUrl: string } // v3

export function assertNever(_x: never): never {
  throw new Error('Action no manejada')
}

// =============================================================================
// ROLES
// =============================================================================

export type UserRole = 'adult' | 'child'

// =============================================================================
// API TYPES
// =============================================================================

export interface CreateAdultRequest {
  name: string
  avatar: string
  pin: string           // 4 dígitos
  adventureId: string
}

export interface LoginAdultRequest {
  adultId: string
  pin: string
}

export interface CreateChildRequest {
  name: string
  avatar: string
  parentId: string
}

export interface ActionRequest {
  action: GameAction
}

export interface ProgressResponse {
  child: { id: string; name: string; avatar: string; parentName: string }
  gameState: GameState
}

export interface AdultDashboardResponse {
  adult: { id: string; name: string; avatar: string }
  children: {
    id: string
    name: string
    avatar: string
    completedZones: number
    totalZones: number
    badges: number
  }[]
}
