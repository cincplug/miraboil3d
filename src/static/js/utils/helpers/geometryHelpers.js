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
    plane(geometry) {
      return function(u, v, target) {
        const x = u * geometry.width
        const y = v * geometry.height
        const z = 0
        target.set(x, y, z)
      }
    },
    basket(geometry) {
      const { emboss, range } = geometry
      return function(u, v, target) {
        const x = u * geometry.width
        const y = v * geometry.height
        let z = 0
        if (
          u > range.startX &&
          u < range.endX &&
          v > range.startY &&
          v < range.endY
        ) {
          z += emboss
        }
        target.set(x, y, z)
      }
    },
    bentPicture(geometry) {
      return function(u, v, target) {
        const x = u * geometry.width
        const y = v * geometry.height
        const z = Math.sin(v + u) * geometry.curvature
        target.set(x, y, z)
      }
    },
    folderBox(geometry) {
      const { emboss, range } = geometry
      return function(u, v, target) {
        const x = u * geometry.width
        let y = v * geometry.height
        let z = Math.sin(v * geometry.emboss) * geometry.curvature
        if (
          u > range.startX &&
          u < range.endX &&
          v > range.startY &&
          v < range.endY
        ) {
          y += emboss
          z -= emboss
        }
        target.set(x, y, z)
      }
    }
  }
}

export { geometryHelpers }
