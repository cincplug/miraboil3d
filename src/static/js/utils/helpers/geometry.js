import { Vector2 } from 'three'

const lathePoints = {
  treePot(geometry) {
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
}

const parametricGeometries = {
  bentPicture(geometry) {
    return function(u, v, target) {
      const x = u * geometry.width
      const y = v * geometry.height
      const z = Math.sin(v + u) * geometry.curvature
      target.set(x, y, z)
    }
  }
}

export { lathePoints, parametricGeometries }
