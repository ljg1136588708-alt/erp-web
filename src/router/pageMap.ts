const modules = import.meta.glob('@/views/**/*.vue')

export function resolvePage(path: string) {
  const key = `/src/views${path}.vue`
  return modules[key] ?? (() => import('@/views/Home.vue'))
}
