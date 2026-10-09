const clickTolerancePixels = 2

export const isClickGesture = (delta: number): boolean => delta <= clickTolerancePixels
