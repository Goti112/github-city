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
  'vec2 windowGrid = vUv * facadeSize / vec2(0.42, 0.54);',
  'vec2 windowCell = floor(windowGrid);',
  'vec2 windowLocal = fract(windowGrid);',
  'float windowFrame = step(0.1, windowLocal.x)',
  '  * (1.0 - step(0.9, windowLocal.x))',
  '  * step(0.15, windowLocal.y)',
  '  * (1.0 - step(0.82, windowLocal.y));',
  'float isWall = 1.0 - step(0.5, abs(vWindowFaceNormal.y));',
  'float windowIsLit = step(cityWindowHash(windowCell, vSeed), clamp(vLit, 0.0, 1.0));',
  'totalEmissiveRadiance += vec3(1.0, 0.42, 0.13) * windowFrame * isWall * windowIsLit * uGlow;',
  // Neon crown: a band in the district colour along the top of each facade, plus a faint roof glow.
  'float crown = step(1.0 - 0.3 / max(vWindowSize.y, 0.6), vUv.y) * isWall;',
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

  material.customProgramCacheKey = (): string => 'github-city-windows-v2'
  return material
}
