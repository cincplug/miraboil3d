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
    const { scene } = this._options
    this._setRenderer()
    this.scene = new THREE.Scene(scene)
    this._setSceneBackground()
    this._arrangeMeshes()
    this.activeItemIndex = 0
    this.currentFrame = 0
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
    const { geometryName, geometryHelper } = mesh
    const geometry = mesh.geometry || this._options.geometry
    const meshGeometryName = `${helpers.capitalize(geometryName)}BufferGeometry`
    const geometryParameters = THREE[meshGeometryName]
      .toString()
      .replace(/(.+?this\.parameters={)(.+?)(}.+?)$/, '$2')
      .split(',')
    const args = geometryParameters.map(param => {
      return mesh.geometry[param.replace(/(.+?):.+$/, '$1')]
    })
    if (geometryHelper) {
      args[0] = geometryHelpers[geometryName][geometryHelper](geometry)
    }
    return new THREE[meshGeometryName](...args)
  }

  _setMaterial(item, texture = null) {
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
    const meshMaterialName = `Mesh${helpers.capitalize(materialName)}Material`
    const meshMaterial = new THREE[meshMaterialName](
      texture
        ? {
            ...materialProperties,
            ...{ map: texture }
          }
        : materialProperties
    )
    return meshMaterial
  }

  _arrangeMeshes() {
    const { _options } = this
    _options.meshes.forEach((item, index) => {
      const { image } = item
      if (image) {
        new THREE.TextureLoader().load(`/static/img/${image}`, texture =>
          this._addMesh(texture, item, index)
        )
      } else {
        this._addMesh(null, item, index)
      }
    })
  }

  _addMesh(texture, item, index) {
    const { scene } = this
    const meshGeometry = this._setGeometry(item)
    const meshMaterial = this._setMaterial(item, texture)
    const mesh = new THREE.Mesh(meshGeometry, meshMaterial)
    this._adjustMesh(mesh, index)
    mesh.name = `znak-${index}`
    scene.add(mesh)
  }

  _adjustMesh(mesh, index) {
    const { properties } = this._options.meshes[index]
    this._mapProperties(properties, mesh)
  }

  _setLights() {
    const { lights } = this._options
    lights.forEach(light => {
      if (light && light.type) {
        const sceneLightName = `${helpers.capitalize(light.type)}Light`
        this.scene.add(
          new THREE[sceneLightName](
            new THREE.Color(light.color),
            light.intensity
          )
        )
      }
    })
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this._options.camera.fov,
      this._options.camera.aspect,
      this._options.camera.near,
      this._options.camera.far
    )

    this.camera.position.x = this._options.camera.position.x
    this.camera.position.y = this._options.camera.position.y
    this.camera.position.z = this._options.camera.position.z
    this.scene.add(this.camera)
  }

  /**
   * Iterate through two nesting levels of object
   * @param {Object} properties - set of properties to implement
   * @param {Object} target - target object to apply properties and sub-properties
   */
  _mapProperties = (properties, target) => {
    for (const property in properties) {
      if (properties[property]) {
        for (const subProperty in properties[property]) {
          if (properties[property][subProperty]) {
            target[property][subProperty] += properties[property][subProperty]
          }
        }
      }
    }
  }

  _animate = () => {
    // eslint-disable-next-line no-invalid-this
    const self = this
    const { meshes } = self._options
    meshes.forEach((mesh, index) => {
      const targetMesh = self.scene.getObjectByName(`znak-${index}`)
      if (mesh.frameMovement && targetMesh) {
        self._mapProperties(
          mesh.frameMovement,
          self.scene.getObjectByName(`znak-${index}`)
        )
      }
    })
    self._mapProperties(self._options.camera.frameMovement, self.camera)

    self.requestFrameId = requestAnimationFrame(self._animate)
    self._render()
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _init() {
    this._cacheSelectors()
    this._addEventListeners()
    this._setScene()
  }
}

export default Scene
