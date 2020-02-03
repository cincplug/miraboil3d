import * as THREE from 'three'
import { helpers } from 'utils/helpers/helpers'
import { geometryHelpers } from 'utils/helpers/geometryHelpers'
import * as defaults from './scene.json'
const merge = require('deepmerge')

/**
 * Scene component
 */
class Scene {
  constructor(element, options = {}) {
    this._element = element
    this._options = merge(defaults, JSON.parse(options.options))
    this.examples = JSON.parse(options.scenes || '{}')
    this._init()
  }

  _cacheSelectors() {
    this._elements = {
      canvasWrap: this._element.querySelector('.scene__canvas-wrap'),
      canvas: this._element.querySelector('canvas')
    }
  }

  _addEventListeners() {
    this._elements.canvasWrap.addEventListener(
      'mousedown',
      e => this._handleMouseDown(e),
      false
    )
    this._elements.canvasWrap.addEventListener(
      'mouseup',
      e => this._handleMouseUp(e),
      false
    )
    this._elements.canvasWrap.addEventListener(
      'mouseleave',
      e => this._handleMouseLeave(e),
      false
    )
    this._elements.canvasWrap.addEventListener(
      'mousemove',
      e => this._handleMouseMove(e),
      false
    )
  }

  _handleMouseDown(e) {
    this.isMousePressed = true
    if (!this.cursorPosition) {
      this.cursorPosition = { x: e.clientX, y: e.clientY }
    }
    if (this.lastCursorPosition) {
      this.cursorPosition.x += e.clientX - this.lastCursorPosition.x
      this.cursorPosition.y += e.clientY - this.lastCursorPosition.y
    }
  }

  _handleMouseUp(e) {
    this._resetCursorPosition(e)
  }

  _handleMouseLeave(e) {
    this._resetCursorPosition(e)
  }

  _handleMouseMove(e) {
    if (this.isMousePressed) {
      this.camera.position.x = -(this.cursorPosition.x - e.clientX)
      this.camera.position.y = this.cursorPosition.y - e.clientY
    }
  }

  _resetCursorPosition(e) {
    this.isMousePressed = false
    this.lastCursorPosition = { x: e.clientX, y: e.clientY }
  }

  _setRenderer() {
    // reference: https://threejs.org/docs/#api/en/renderers/WebGLRenderer
    const { renderer, camera } = this._options
    this.renderer = new THREE.WebGLRenderer(renderer)
    const renderWidth = this._elements.canvasWrap.offsetWidth
    const renderHeight = Math.round(renderWidth / camera.aspect)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(renderWidth, renderHeight)
    this.canvas = this._elements.canvasWrap.appendChild(
      this.renderer.domElement
    )
  }

  _setScene() {
    // reference: https://threejs.org/docs/#api/en/scenes/Scene
    const { scene } = this._options
    this._setRenderer()
    this.currentFrame = 0
    this.scene = new THREE.Scene(scene)
    this._setSceneBackground()
    this._setSceneItems()
    this._setLights()
    this._setCamera()
    this._animate()
  }

  _setSceneBackground() {
    const { background } = this._options.scene
    if (background) {
      if (background.image) {
        this.scene.background = new THREE.TextureLoader().load(
          `/static/img/${background.image}`
        )
      } else if (background.color) {
        this.scene.background = new THREE.Color(background.color)
      }
    }
  }

  _setGeometry(mesh) {
    // reference: https://threejs.org/docs/#api/en/core/Geometry
    // reference: https://threejs.org/docs/#api/en/core/BufferGeometry

    // By default we use buffer geometry here because of better performance
    // That's why parameter geometry.isBuffer is true by default
    // If you need non-buffered geometry, set this parameter to false

    const { geometryName, geometryHelper } = mesh
    const geometry = merge(this._options.geometry, mesh.geometry)
    const isBufferGeometry =
      this._options.isBufferGeometry && mesh.isBufferGeometry !== false
    const threeGeometryName = `${helpers.capitalize(geometryName)}${
      isBufferGeometry ? 'Buffer' : ''
    }Geometry`
    const geometryParameters = THREE[threeGeometryName]
      .toString()
      .replace(/(.+?this\.parameters={)(.+?)(}.+?)$/, '$2')
      .split(',')
    const args = geometryParameters.map(param => {
      return mesh.geometry[param.replace(/(.+?):.+$/, '$1')]
    })
    if (geometryHelper) {
      args[0] = geometryHelpers[geometryName][geometryHelper](geometry)
    }
    return new THREE[threeGeometryName](...args)
  }

  _setMaterial(item, texture = null) {
    // reference: https://threejs.org/docs/#api/en/materials/Material
    const { color } = item
    const materialName = item.materialName || this._options.materialName
    const material = item.material || this._options.material
    const materialProperties = {
      ...{
        color,
        transparent: true,
        side: THREE.DoubleSide
      },
      ...material
    }
    const threeMaterialName = `Mesh${helpers.capitalize(materialName)}Material`
    const meshMaterial = new THREE[threeMaterialName](
      texture
        ? {
            ...materialProperties,
            ...{ map: texture }
          }
        : materialProperties
    )
    return meshMaterial
  }

  _setSceneItems() {
    const { _options } = this
    _options.meshes.forEach((item, index) => {
      const { image } = item
      if (image) {
        new THREE.TextureLoader().load(`/static/img/${image}`, texture =>
          this._addSceneItem(texture, item, index)
        )
      } else {
        this._addSceneItem(null, item, index)
      }
    })
  }

  _addSceneItem(texture, item, index) {
    // reference: https://threejs.org/docs/#api/en/objects/Mesh
    const { scene } = this
    const meshGeometry = this._setGeometry(item)
    const meshMaterial = this._setMaterial(
      item,
      item.repeat ? helpers.makePattern(item, texture) : texture
    )
    const group = new THREE.Group()
    for (let i = 0; i < (item.count || 1); i++) {
      const mesh = new THREE.Mesh(meshGeometry, meshMaterial)
      const { properties } = this._options.meshes[index]
      helpers.mapProperties(properties, mesh)
      // eslint-disable-next-line no-magic-numbers
      mesh.position.z += i * 200
      group.add(mesh)
    }
    group.name = `znak-${index}`
    scene.add(group)
  }

  _setLights() {
    // reference: https://threejs.org/docs/#api/en/lights/Light
    const { lights } = this._options
    lights.forEach((light, index) => {
      if (light && light.type) {
        const threeLightName = `${helpers.capitalize(light.type)}Light`
        const newLight = new THREE[threeLightName](
          new THREE.Color(light.color),
          light.intensity
        )
        newLight.name = `svetlo-${index}`
        this.scene.add(newLight)
      }
    })
  }

  _setCamera() {
    // reference: https://threejs.org/docs/#api/en/cameras/Camera
    const { cameraName, camera } = this._options
    const threeCameraName = `${helpers.capitalize(cameraName)}Camera`
    this.camera = new THREE[threeCameraName](
      camera.fov,
      camera.aspect,
      camera.near,
      camera.far
    )
    this.camera.position.x = camera.position.x
    this.camera.position.y = camera.position.y
    this.camera.position.z = camera.position.z
    this.scene.add(this.camera)
  }

  _animate() {
    const { meshes } = this._options
    meshes.forEach((mesh, index) => {
      const targetMesh = this.scene.getObjectByName(`znak-${index}`)
      if (mesh.frameMovement && targetMesh) {
        helpers.mapProperties(mesh.frameMovement, targetMesh)
      }
    })
    helpers.mapProperties(this._options.camera.frameMovement, this.camera)
    this.requestFrameId = requestAnimationFrame(() => this._animate())
    this._render()
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _init() {
    this._cacheSelectors()
    this._addEventListeners()
    if (this.examples && this._setExample) {
      this._setExample('next')
    } else {
      this._setScene()
    }
  }
}

export default Scene
