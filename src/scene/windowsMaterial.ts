import { MeshStandardMaterial } from 'three'

export type WindowGlowUniform = {
  value: number
}

const vertexDeclarations = [
  'attribute float aLit;',
  'attribute float aSeed;',
  'varying float vLit;',
  'varying float vSeed;',
  'varying vec3 vWindowFaceNormal;',
  'varying vec3 vWindowSize;',
].join('\n')

const vertexAssignments = [
  'vLit = aLit;',
  'vSeed = aSeed;',
  'vWindowFaceNormal = normal;',
  'vWindowSize = vec3(',
  '  length(instanceMatrix[0].xyz),',
  '  length(instanceMatrix[1].xyz),',
  '  length(instanceMatrix[2].xyz)',
  ');',
].join('\n')

const fragmentDeclarations = [
  'uniform float uGlow;',
  'varying float vLit;',
  'varying float vSeed;',
  'varying vec3 vWindowFaceNormal;',
  'varying vec3 vWindowSize;',
  'float cityWindowHash(vec2 cell, float seed) {',
  '  return fract(sin(dot(vec3(cell, seed), vec3(12.9898, 78.233, 37.719))) * 43758.5453);',
  '}',
].join('\n')

const fragmentWindows = [
  'vec2 facadeSize = abs(vWindowFaceNormal.x) > 0.5',
  '  ? vec2(vWindowSize.z, vWindowSize.y)',
  '  : vec2(vWindowSize.x, vWindowSize.y);',
  // Whole columns only, stretched to fill the facade width, so no window is ever cut at a corner.
  'float windowCols = max(1.0, floor(facadeSize.x / 0.42 + 0.5));',
  // Floors are fixed in world units and counted from the ground: while a building rises,
  // new floors appear one by one instead of the whole grid stretching.
  'float crownHeight = 0.3;',
  'float windowRows = floor(max(facadeSize.y - crownHeight - 0.15, 0.0) / 0.54);',
  'vec2 windowGrid = vec2(vUv.x * windowCols, vUv.y * facadeSize.y / 0.54);',
  'vec2 windowCell = floor(windowGrid);',
  'vec2 windowLocal = fract(windowGrid);',
  // Anti-aliased edges: soften each border by one pixel so distant facades do not shimmer.
  'vec2 windowAa = max(fwidth(windowGrid), vec2(1e-4));',
  'vec2 windowLo = smoothstep(vec2(0.14, 0.18) - windowAa, vec2(0.14, 0.18) + windowAa, windowLocal);',
  'vec2 windowHi = 1.0 - smoothstep(vec2(0.86, 0.80) - windowAa, vec2(0.86, 0.80) + windowAa, windowLocal);',
  'float windowFrame = windowLo.x * windowLo.y * windowHi.x * windowHi.y;',
  // When a window is smaller than a couple of pixels, fade to its average coverage instead of aliasing.
  'float windowFar = smoothstep(0.25, 0.6, max(windowAa.x, windowAa.y));',
  'windowFrame = mix(windowFrame, 0.48, windowFar);',
  'windowFrame *= step(windowCell.y, windowRows - 1.0);',
  'float isWall = 1.0 - step(0.5, abs(vWindowFaceNormal.y));',
  'float windowIsLit = step(cityWindowHash(windowCell, vSeed), clamp(vLit, 0.0, 1.0));',
  'totalEmissiveRadiance += vec3(1.0, 0.42, 0.13) * windowFrame * isWall * windowIsLit * uGlow;',
// Neon crown: a band in the district colour along the top of each facade, plus a faint roof glow.
  'float crown = step(1.0 - crownHeight / max(vWindowSize.y, 0.6), vUv.y) * isWall;',
  'float roof = step(0.5, vWindowFaceNormal.y);',
  'totalEmissiveRadiance += vColor.rgb * (crown * 1.1 + roof * 0.22) * uGlow;',
].join('\n')

// At night the facades darken so windows and neon carry the scene.
const nightFacade = 'diffuseColor.rgb *= 1.0 - 0.5 * clamp(uGlow / 1.5, 0.0, 1.0);'

const replaceShaderInclude = (source: string, include: string, additions: string): string => {
  if (!source.includes(include)) {
    throw new Error('No se encontró el fragmento de shader esperado: ' + include)
  }

  return source.replace(include, include + '\n' + additions)
}

export const createWindowsMaterial = (windowGlow: WindowGlowUniform): MeshStandardMaterial => {
  const material = new MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.7,
    metalness: 0.08,
  })
  material.defines = { USE_UV: '' }

  material.onBeforeCompile = (shader): void => {
    shader.uniforms.uGlow = windowGlow
    shader.vertexShader = replaceShaderInclude(shader.vertexShader, '#include <common>', vertexDeclarations)
    shader.vertexShader = replaceShaderInclude(shader.vertexShader, '#include <begin_vertex>', vertexAssignments)
    shader.fragmentShader = replaceShaderInclude(shader.fragmentShader, '#include <common>', fragmentDeclarations)
    shader.fragmentShader = replaceShaderInclude(shader.fragmentShader, '#include <color_fragment>', nightFacade)
    shader.fragmentShader = replaceShaderInclude(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      fragmentWindows,
    )
  }

  material.customProgramCacheKey = (): string => 'github-city-windows-v3'
  return material
}
