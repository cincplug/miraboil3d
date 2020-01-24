import * as THREE from 'three'
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

  _setScene() {
    const { scene } = this._options
    this.scene = new THREE.Scene(scene)
    this._setSceneBackground()
    this.renderer = new THREE.WebGLRenderer(this._options.renderer)
    const renderWidth = this._elements.canvasWrap.offsetWidth
    const renderHeight = Math.round(renderWidth / this._options.camera.aspect)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(renderWidth, renderHeight)
    this.canvas = this._elements.canvasWrap.appendChild(
      this.renderer.domElement
    )
    this._arrangeSceneItems()
    this.activeItemIndex = 0
    this.currentFrame = 0
    this._setLight()
    this._setCamera()
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

  /**
   * Set scene item geometry according to parameters
   * @param {Object} sceneItem - the scene item to set shape for
   * @returns {Func} THREE.js geometry for given shape with parameters
   */
  _setGeometry = sceneItem => {
    const { shape, geometry, geometryHelper } = sceneItem
    const geometryName = `${shape.charAt(0).toUpperCase()}${shape.slice(
      1
    )}BufferGeometry`
    const geometryParameters = THREE[geometryName]
      .toString()
      .replace(/(.+?this\.parameters={)(.+?)(}.+?)$/, '$2')
      .split(',')
    const args = geometryParameters.map(param => {
      return sceneItem.geometry[param.replace(/(.+?):.+$/, '$1')]
    })
    if (geometryHelper) {
      args[0] = geometryHelpers[shape][geometryHelper](geometry)
    }
    return new THREE[geometryName](...args)
  }

  _arrangeSceneItems() {
    const { scene, _options } = this
    _options.sceneItems.forEach((item, index) => {
      const { image, color } = item
      const sceneItem = {
        geometry: this._setGeometry(item)
      }
      new THREE.TextureLoader().load(`/static/img/${image}`, texture => {
        const materialProperties = {
          color,
          transparent: true,
          side: THREE.DoubleSide
        }
        sceneItem.material = new THREE.MeshLambertMaterial({
          ...materialProperties,
          ...{ map: texture }
        })
        sceneItem.mesh = new THREE.Mesh(sceneItem.geometry, sceneItem.material)
        this._adjustSceneItem(sceneItem, index)
        sceneItem.mesh.name = `znak-${index}`
        scene.add(sceneItem.mesh)
      })
    })
  }

  _adjustSceneItem(sceneItem, index) {
    const { properties } = this._options.sceneItems[index]
    for (const property in properties) {
      if (properties[property]) {
        for (const subProperty in properties[property]) {
          if (properties[property][subProperty]) {
            sceneItem.mesh[property][subProperty] =
              properties[property][subProperty]
          }
        }
      }
    }
  }

  _setLight() {
    this.light = new THREE.AmbientLight(
      new THREE.Color(this._options.light.color)
    )
    this.scene.add(this.light)
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
    this._animate()
  }

  _animate = () => {
    // eslint-disable-next-line no-invalid-this
    const self = this
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
