import type {
  AdventureContent, ProgressState, GameState, GameAction,
  ZoneView, StepView, ZoneState,
} from './types'
import { assertNever } from './types'

export function createInitialState(adventure: AdventureContent): ProgressState {
  const zones: Record<string, ZoneState> = {}
  for (const zone of adventure.zones) {
    zones[zone.id] = { status: 'available', completedSteps: [] }
  }
  return {
    adventureVersion: adventure.version,
    zones,
    badges: [],
    lastUpdated: new Date().toISOString(),
  }
}

export function mergeState(adventure: AdventureContent, state: ProgressState): GameState {
  const zones: ZoneView[] = adventure.zones
    .sort((a, b) => a.suggestedOrder - b.suggestedOrder)
    .map(zone => {
      const zoneState: ZoneState = state.zones[zone.id] ?? { status: 'available', completedSteps: [] }
      const steps: StepView[] = zone.steps
        .sort((a, b) => a.order - b.order)
        .map(step => ({ ...step, completed: zoneState.completedSteps.includes(step.id) }))
      const stepsCompleted = steps.filter(s => s.completed).length
      const nextStep = steps.find(s => !s.completed) ?? null
      return {
        id: zone.id, name: zone.name, description: zone.description,
        narrative: zone.narrative, icon: zone.icon, suggestedOrder: zone.suggestedOrder,
        status: zoneState.status, stepsTotal: steps.length, stepsCompleted, steps, nextStep,
        badge: { ...zone.badge, unlocked: state.badges.includes(zone.badge.id) },
      }
    })

  return {
    adventureId: adventure.id,
    adventureTitle: adventure.title,
    adventureVersion: adventure.version,
    zones,
    badges: state.badges,
    totalZones: adventure.zones.length,
    completedZones: zones.filter(z => z.status === 'completed').length,
  }
}

export function applyAction(
  adventure: AdventureContent,
  state: ProgressState,
  action: GameAction
): ProgressState {
  const next = structuredClone(state)

  switch (action.type) {
    case 'complete_step': {
      const { zoneId, stepId } = action
      const zone = adventure.zones.find(z => z.id === zoneId)
      if (!zone) return state
      if (!zone.steps.some(s => s.id === stepId)) return state

      const zoneState: ZoneState = next.zones[zoneId] ?? { status: 'available', completedSteps: [] }

      if (!zoneState.completedSteps.includes(stepId)) {
        zoneState.completedSteps = [...zoneState.completedSteps, stepId]
      }

      const allDone = zone.steps.every(s => zoneState.completedSteps.includes(s.id))
      if (allDone && zoneState.status !== 'completed') {
        zoneState.status = 'completed'
        zoneState.completedAt = new Date().toISOString()
      } else if (zoneState.completedSteps.length > 0 && zoneState.status === 'available') {
        zoneState.status = 'in_progress'
      }

      next.zones[zoneId] = zoneState
      next.badges = computeBadges(adventure, next)
      next.lastUpdated = new Date().toISOString()
      return next
    }
    default:
      return state
  }
}

export function computeBadges(adventure: AdventureContent, state: ProgressState): string[] {
  const earned = new Set(state.badges)
  for (const zone of adventure.zones) {
    if (state.zones[zone.id]?.status === 'completed') earned.add(zone.badge.id)
  }
  return [...earned]
}
