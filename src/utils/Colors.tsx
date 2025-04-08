export const Purple = '#8A2BE2'
export const PurpleLight = '#9370DB'
export const Pink = '#FF6B6B'
export const Blue = '#2D3047'
export const Green = '#93E1D8'
export const Yellow = '#FFD166'
export const Gray = '#999999'

/**
 * Returns the color for a game status
 * @param status The game status
 * @returns The color as a hex string
 */
export function getStatusColor(status: string = 'created'): string {
  switch (status) {
    case 'completed': return Blue
    case 'pending': return Yellow
    case 'created': return Green
    default: return Gray
  }
}