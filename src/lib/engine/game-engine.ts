import type {
  AdventureContent, ProgressState, GameState, GameAction,
  ZoneView, ClueView, StepView, ZoneState, ClueState,
} from './types'

// =============================================================================
// ESTADO INICIAL
// =============================================================================

export function createInitialState(adventure: AdventureContent): ProgressState {
  const zones: Record<string, ZoneState> = {}

  for (const zone of adventure.zones) {
    const clues: Record<string, ClueState> = {}

    for (const clue of zone.clues) {
      const steps: Record<string, { completed: boolean }> = {}
      for (const step of clue.steps) {
        steps[step.id] = { completed: false }
      }
      // Solo la primera pista de cada zona empieza disponible
      clues[clue.id] = {
        status: clue.order === 1 ? 'available' : 'locked',
        steps,
      }
    }

    // Todas las zonas disponibles desde el inicio (mapa libre)
    zones[zone.id] = {
      status: 'available',
      clues,
    }
  }

  return {
    adventureVersion: adventure.version,
    zones,
    badges: [],
    lastUpdated: new Date().toISOString(),
  }
}

// =============================================================================
// MERGE STATE — content + state → GameState para la UI
// =============================================================================

export function mergeState(adventure: AdventureContent, state: ProgressState): GameState {
  const zones: ZoneView[] = adventure.zones
    .sort((a, b) => a.suggestedOrder - b.suggestedOrder)
    .map(zone => {
      const zoneState: ZoneState = state.zones[zone.id] ?? {
        status: 'locked',
        clues: {},
      }

      const clues: ClueView[] = zone.clues
        .sort((a, b) => a.order - b.order)
        .map(clue => {
          const clueState: ClueState = zoneState.clues[clue.id] ?? {
            status: 'locked',
            steps: {},
          }

          const steps: StepView[] = clue.steps
            .sort((a, b) => a.order - b.order)
            .map(step => ({
              ...step,
              completed: clueState.steps[step.id]?.completed ?? false,
            }))

          const stepsCompleted = steps.filter(s => s.completed).length

          return {
            id: clue.id,
            order: clue.order,
            title: clue.title,
            narrative: clue.narrative,
            unlockTrigger: clue.unlockTrigger,
            completionMessage: clue.completionMessage,
            nextClueHint: clue.nextClueHint,
            status: clueState.status,
            steps,
            stepsTotal: steps.length,
            stepsCompleted,
          }
        })

      const cluesCompleted = clues.filter(c => c.status === 'completed').length

      return {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        icon: zone.icon,
        universe: zone.universe,
        suggestedOrder: zone.suggestedOrder,
        status: zoneState.status,
        clues,
        cluesTotal: clues.length,
        cluesCompleted,
        badge: {
          ...zone.badge,
          unlocked: state.badges.includes(zone.badge.id),
        },
        morningCard: zone.morningCard,
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

// =============================================================================
// APPLY ACTION — inmutable, devuelve nuevo estado
// =============================================================================

export function applyAction(
  adventure: AdventureContent,
  state: ProgressState,
  action: GameAction
): ProgressState {
  const next = structuredClone(state)

  switch (action.type) {

    case 'complete_step': {
      const { zoneId, clueId, stepId } = action

      const zone = adventure.zones.find(z => z.id === zoneId)
      if (!zone) return state

      const clue = zone.clues.find(c => c.id === clueId)
      if (!clue) return state

      if (!clue.steps.some(s => s.id === stepId)) return state

      // Inicializar estado de zona si no existe
      if (!next.zones[zoneId]) {
        next.zones[zoneId] = { status: 'available', clues: {} }
      }

      const zoneState = next.zones[zoneId]

      // Inicializar estado de pista si no existe
      if (!zoneState.clues[clueId]) {
        zoneState.clues[clueId] = { status: 'available', steps: {} }
      }

      const clueState = zoneState.clues[clueId]

      // Marcar paso como completado (idempotente)
      clueState.steps[stepId] = { completed: true, completedAt: new Date().toISOString() }

      // Actualizar estado de pista
      const allStepsDone = clue.steps.every(s => clueState.steps[s.id]?.completed)

      if (allStepsDone && clueState.status !== 'completed') {
        clueState.status = 'completed'
        clueState.completedAt = new Date().toISOString()

        // Desbloquear la siguiente pista automáticamente
        const nextClue = zone.clues.find(c => c.order === clue.order + 1)
        if (nextClue && zoneState.clues[nextClue.id]) {
          zoneState.clues[nextClue.id].status = 'available'
        } else if (nextClue) {
          zoneState.clues[nextClue.id] = {
            status: 'available',
            steps: Object.fromEntries(nextClue.steps.map(s => [s.id, { completed: false }])),
          }
        }

        // Comprobar si toda la zona está completada
        const allCluesDone = zone.clues.every(c => zoneState.clues[c.id]?.status === 'completed')
        if (allCluesDone) {
          zoneState.status = 'completed'
          zoneState.completedAt = new Date().toISOString()

          // Desbloquear la siguiente zona
          const nextZone = adventure.zones.find(z => z.suggestedOrder === zone.suggestedOrder + 1)
          if (nextZone) {
            if (!next.zones[nextZone.id]) {
              next.zones[nextZone.id] = { status: 'available', clues: {} }
            } else {
              next.zones[nextZone.id].status = 'available'
            }
          }
        } else if (zoneState.status === 'available') {
          zoneState.status = 'in_progress'
        }
      } else if (clueState.status === 'available') {
        clueState.status = 'in_progress'
        if (zoneState.status === 'available') {
          zoneState.status = 'in_progress'
        }
      }

      next.badges = computeBadges(adventure, next)
      next.lastUpdated = new Date().toISOString()
      return next
    }

    case 'unlock_clue': {
      const { zoneId, clueId } = action

      const zone = adventure.zones.find(z => z.id === zoneId)
      if (!zone) return state

      const clue = zone.clues.find(c => c.id === clueId)
      if (!clue) return state

      if (!next.zones[zoneId]) {
        next.zones[zoneId] = { status: 'available', clues: {} }
      }

      const zoneState = next.zones[zoneId]

      if (!zoneState.clues[clueId]) {
        zoneState.clues[clueId] = {
          status: 'available',
          steps: Object.fromEntries(clue.steps.map(s => [s.id, { completed: false }])),
        }
      } else {
        zoneState.clues[clueId].status = 'available'
      }

      next.lastUpdated = new Date().toISOString()
      return next
    }

    default:
      return state
  }
}

// =============================================================================
// COMPUTE BADGES
// =============================================================================

export function computeBadges(adventure: AdventureContent, state: ProgressState): string[] {
  const earned = new Set(state.badges)
  for (const zone of adventure.zones) {
    if (state.zones[zone.id]?.status === 'completed') {
      earned.add(zone.badge.id)
    }
  }
  return [...earned]
}
