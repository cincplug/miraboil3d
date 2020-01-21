import * as THREE from 'three'
import * as defaults from './january.json'
import { examples } from './examples.json'
import { geometryHelpers } from 'utils/helpers/geometryHelpers'
const merge = require('deepmerge')

/**
 * January component
 */
class January {
  constructor(element, options = {}) {
    this._element = element
    this._options = merge(defaults, JSON.parse(options.options))
    this._init()
  }

  _cacheSelectors() {
    this._elements = {
      title: this._element.querySelector('.january__title'),
      navButton: this._element.querySelector('.january__nav-button'),
      canvasWrap: this._element.querySelector('.january__canvas-wrap'),
      canvas: this._element.querySelector('canvas')
    }
  }

  _addEventListeners() {
    this._element.addEventListener('click', e => this._handleClick(e))
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

  _handleClick(e) {
    if (e.target.className.match(/\bjanuary__color-switch\b/)) {
      const { color } = e.target.dataset
      this._element.dataset.color = color
      this.light.color = this.scene.background = new THREE.Color(color)
      this._render()
    }
    if (e.target.className.match(/\bjanuary__nav-button\b/)) {
      this._setExample(e.target.dataset.direction)
    }
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

  _setExample(direction) {
    cancelAnimationFrame(this.requestFrameId)
    this.canvas.remove()
    let item = Number(this._element.dataset.item)
    if (direction === 'next') {
      item++
      if (item === examples.length) {
        item = 0
      }
    }
    if (direction === 'prev') {
      item--
      if (item < 0) {
        item = examples.length - 1
      }
    }
    this._element.dataset.item = item
    this._options = merge(defaults.options, examples[item])
    this._elements.title.innerHTML = this._options.sceneItem.shape
    this._setScene()
  }

  _setBackground() {
    if (this._options.background.image) {
      this.scene.background = new THREE.TextureLoader().load(
        `/static/img/${this._options.background.image}`
      )
    } else {
      this.scene.background = new THREE.Color(this._options.background)
    }
  }

  _setScene() {
    this.scene = new THREE.Scene()
    this._setBackground()
    this.renderer = new THREE.WebGLRenderer()
    const renderWidth = this._elements.canvasWrap.offsetWidth
    const renderHeight = Math.round(renderWidth / this._options.camera.aspect)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(renderWidth, renderHeight)
    this.canvas = this._elements.canvasWrap.appendChild(
      this.renderer.domElement
    )
    this._setGround()
    this._arrangeSceneItems()
    this.activeItemIndex = 0
    this.currentFrame = 0
    this._setLight()
    this._setCamera()
  }

  _setGround() {
    const { scene, _options } = this
    new THREE.TextureLoader().load(
      `/static/img/${_options.ground.image}`,
      texture => {
        const ground = {
          geometry: new THREE.PlaneBufferGeometry(
            this._options.ground.width,
            this._options.ground.depth
          )
        }
        texture.wrapT = texture.wrapS = THREE.RepeatWrapping
        texture.offset.set(0, 0)
        texture.repeat.set(
          _options.ground.repeat.width,
          _options.ground.repeat.depth
        )
        ground.material = new THREE.MeshLambertMaterial({
          color: new THREE.Color(_options.ground.color),
          map: texture,
          side: THREE.DoubleSide
        })
        ground.mesh = new THREE.Mesh(ground.geometry, ground.material)
        ground.mesh.rotation.x = THREE.Math.degToRad(_options.ground.angle)
        ground.mesh.position.y = -_options.ground.position.y
        ground.mesh.position.z =
          (_options.sceneItem.count * _options.sceneItem.spacing) /
          _options.camera.distanceRatio
        scene.add(ground.mesh)
      }
    )
  }

  _setSceneItemShape() {
    const { _options } = this
    const { shape, geometry, geometryHelper } = _options.sceneItem
    const geometryName = `${shape.charAt(0).toUpperCase()}${shape.slice(
      1
    )}BufferGeometry`
    const geometryParameters = THREE[geometryName]
      .toString()
      .replace(/(.+?this\.parameters={)(.+?)(}.+?)$/, '$2')
      .split(',')
    const args = geometryParameters.map(param => {
      return _options.sceneItem.geometry[param.replace(/(.+?):.+$/, '$1')]
    })
    if (geometryHelper) {
      args[0] = geometryHelpers[shape][geometryHelper](geometry)
    }
    return new THREE[geometryName](...args)
  }

  _arrangeSceneItems() {
    const { scene, _options } = this
    const {
      image,
      color,
      count,
      spacing,
      reverseSideRate,
      offset
    } = _options.sceneItem
    const sceneItem = {
      geometry: this._setSceneItemShape()
    }
    new THREE.TextureLoader().load(`/static/img/${image}`, texture => {
      const materialProperties = {
        color,
        transparent: true,
        side: THREE.DoubleSide
      }
      for (let i = 1; i <= count; i++) {
        sceneItem.material = new THREE.MeshLambertMaterial({
          ...materialProperties,
          ...{ map: texture }
        })
        sceneItem.mesh = new THREE.Mesh(sceneItem.geometry, sceneItem.material)
        sceneItem.mesh.position.z = i * spacing
        sceneItem.mesh.position.y = _options.sceneItem.position.y
        sceneItem.mesh.position.x = this._isDivisibleBy(i, reverseSideRate)
          ? -offset
          : offset

        this._adjustSceneItem(sceneItem)

        sceneItem.mesh.name = `znak-${i}`
        scene.add(sceneItem.mesh)
      }
    })
  }

  _adjustSceneItem(sceneItem) {
    const { adjustments } = this._options.sceneItem
    for (const property in adjustments) {
      if (adjustments[property]) {
        for (const subProperty in adjustments[property]) {
          if (adjustments[property][subProperty]) {
            sceneItem.mesh[property][subProperty] =
              adjustments[property][subProperty]
          }
        }
      }
    }
  }

  _setLight() {
    this.light = new THREE.AmbientLight(new THREE.Color('#ffffff'))
    this.scene.add(this.light)
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this._options.camera.fov,
      this._options.camera.aspect,
      this._options.camera.near,
      this._options.camera.far
    )
    this.camera.position.z =
      this._options.sceneItem.count * this._options.sceneItem.spacing +
      this._options.camera.far / this._options.camera.distanceRatio
    this.camera.position.y = -this._options.camera.position.y
    this.scene.add(this.camera)
    this._animate()
  }

  _animate = () => {
    // eslint-disable-next-line no-invalid-this
    const self = this
    if (self._isInView()) {
      self._moveCamera()
      self.currentFrame++
      self._moveItem()
      self._render()
    }
    self.requestFrameId = requestAnimationFrame(self._animate)
  }

  _moveCamera() {
    const { camera, _options, currentFrame } = this
    if (_options.camera.swing) {
      for (const axis in _options.camera.swing) {
        if (_options.camera.swing[axis]) {
          camera.position[axis] =
            _options.sceneItem.spacing *
            Math.sin(currentFrame / _options.camera.swing[axis])
        }
      }
    }
    camera.position.z -= _options.camera.speed
  }

  _moveItem() {
    const { scene, _options, currentFrame } = this
    const currentItemIndex = Math.round(
      (currentFrame / _options.sceneItem.spacing) * _options.camera.speed
    )
    if (currentItemIndex > this.activeItemIndex) {
      this.activeItemIndex = currentItemIndex
      if (this.activeItem) {
        this.previousItem = this.activeItem
      }
      this.activeItem = scene.getObjectByName(
        `znak-${_options.sceneItem.count - this.activeItemIndex + 1}`
      )
    }
    if (this.activeItem) {
      this.activeItem[_options.sceneItem.movementType](
        this._setItemMovementDirection(
          currentItemIndex,
          _options.sceneItem.movementSpeed
        )
      )
      if (this.previousItem) {
        this.previousItem[_options.sceneItem.secondaryMovementType](
          this._setItemMovementDirection(
            currentItemIndex,
            _options.sceneItem.secondaryMovementSpeed
          )
        )
      }
    }
  }

  _setItemMovementDirection(index, speed) {
    const { _options } = this
    return (
      speed *
      (this._isDivisibleBy(index, _options.sceneItem.reverseSideRate) ? 1 : -1)
    )
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _init() {
    this._cacheSelectors()
    this._addEventListeners()
    this._setScene()
  }

  /**
   * Check if number is divisible by given divisor
   * @param {Number} number - number to check
   * @param {Number} divisor - divisor against which check is performed
   * @returns {Boolean}
   */
  _isDivisibleBy = (number, divisor) => {
    return number % divisor === 0
  }

  _isInView() {
    const isInView =
      this._element.offsetTop - this._options.visibilityOffset <
        window.scrollY &&
      this._element.offsetTop + this._options.visibilityOffset > window.scrollY
    return isInView
  }
}

export default January
