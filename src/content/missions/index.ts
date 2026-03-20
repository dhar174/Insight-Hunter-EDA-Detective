import type { MissionDefinition, ScenarioPack } from '../../types/game'
import { getTables } from '../datasets'
import { ecommerceAdvancedMissions } from './ecommerceAdvanced'
import { hrMissions } from './hr'
import { onboardingAndCoreMissions } from './onboardingAndCore'
import { schoolMissions } from './school'

export const orderedMissions: MissionDefinition[] = [
  ...onboardingAndCoreMissions,
  ...ecommerceAdvancedMissions,
  ...hrMissions,
  ...schoolMissions,
].sort((left, right) => left.sequence - right.sequence)

export const scenarioPacks: ScenarioPack[] = [
  {
    id: 'onboarding',
    title: 'Onboarding',
    summary: 'Start in the warehouse, load SQL data into pandas, and get mission control online.',
    accent: '#1c7ed6',
    missions: orderedMissions.filter((mission) => mission.packId === 'onboarding'),
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Operations',
    summary: 'Work like a revenue analyst solving customer, order, and product questions for leadership.',
    accent: '#ea580c',
    missions: orderedMissions.filter((mission) => mission.packId === 'ecommerce'),
  },
  {
    id: 'hr',
    title: 'HR Analytics',
    summary: 'Connect roster, department, and review systems to answer people-operations questions.',
    accent: '#0f766e',
    missions: orderedMissions.filter((mission) => mission.packId === 'hr'),
  },
  {
    id: 'school',
    title: 'School Analytics',
    summary: 'Use enrollment, program, and performance data to surface student-success signals.',
    accent: '#7c3aed',
    missions: orderedMissions.filter((mission) => mission.packId === 'school'),
  },
]

export const missionMap = Object.fromEntries(
  orderedMissions.map((mission) => [mission.id, mission]),
) as Record<string, MissionDefinition>

export const firstMissionId = orderedMissions[0]?.id ?? null

export function getMissionById(missionId: string) {
  return missionMap[missionId]
}

export function getMissionTables(mission: MissionDefinition) {
  return getTables(mission.availableTables)
}

export function getNextMissionId(missionId: string) {
  const currentIndex = orderedMissions.findIndex((mission) => mission.id === missionId)
  return orderedMissions[currentIndex + 1]?.id ?? null
}
