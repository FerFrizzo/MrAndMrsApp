export const Purple = '#8A2BE2'
export const PurpleLight = '#9370DB'
export const Pink = '#FF6B6B'
export const Blue = '#2D3047'
export const Green = '#2AC4B1'
export const Yellow = '#FFD166'
export const Gray = '#999999'
export const Orange = '#FFA500'

/**
 * Returns the color for a game status
 * @param status The game status
 * @returns The color as a hex string
 */
export function getStatusColor(status: string = 'created'): string {
  switch (status) {
    case 'completed': return Blue
    case 'ready_to_play': return Purple
    case 'in_creation': return Yellow
    case 'playing': return Green
    case 'answered': return Orange
    case 'results_revealed': return Pink
    default: return Gray
  }
}