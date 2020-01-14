import { Vector2 } from 'three'

const geometryHelpers = {
  lathe: {
    plantPot(geometry) {
      const points = []
      for (let i = 0; i < geometry.segments; i++) {
        points.push(
          new Vector2(
            Math.sin(i * geometry.curvature) * geometry.width,
            i * geometry.height
          )
        )
      }
      return points
    }
  },

  parametric: {
    bentPicture(geometry) {
      return function(u, v, target) {
        const x = u * geometry.width
        const y = v * geometry.height
        const z = Math.sin(v + u) * geometry.curvature
        target.set(x, y, z)
      }
    }
  }
}

export { geometryHelpers }
