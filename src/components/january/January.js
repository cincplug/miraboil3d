import * as THREE from 'three'
import * as defaults from './january.json'
const merge = require('deepmerge')

/**
 * January component
 */
class January {
  constructor(element, options = {}) {
    this._element = element
    this._options = merge(defaults.options, JSON.parse(options.options))
    this._init()
  }

  _cacheSelectors() {
    this._elements = {
      color: this._element.querySelector('.january__color-switch')
    }
  }

  _addEventListeners() {
    this._element.addEventListener('click', e => this._color(e))
  }

  _color(e) {
    const color = window
      .getComputedStyle(e.target)
      .getPropertyValue('background-color')
    this._element.setAttribute('data-color', color)
    this.scene.background = new THREE.Color(color)
    this._render()
  }

  _setScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this._options.background)
    this.renderer = new THREE.WebGLRenderer()
    const renderWidth = this._element.offsetWidth
    const renderHeight = Math.round(renderWidth / this._options.camera.aspect)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(renderWidth, renderHeight)
    this._element.appendChild(this.renderer.domElement)
    this._setGround()
    this._arrangeSceneItems()
    this.activeItemIndex = 0
    this.currentFrame = 0
    this._setCamera()
  }

  _setGround() {
    const { scene, _options } = this
    new THREE.TextureLoader().load('/static/img/ground.jpg', texture => {
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
      ground.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(_options.ground.color),
        map: texture,
        side: THREE.DoubleSide
      })
      ground.mesh = new THREE.Mesh(ground.geometry, ground.material)
      ground.mesh.rotation.x = THREE.Math.degToRad(_options.ground.angle)
      ground.mesh.position.y = -_options.ground.height
      ground.mesh.position.z =
        (_options.sceneItem.count * _options.sceneItem.spacing) /
        _options.camera.distanceRatio
      scene.add(ground.mesh)
    })
  }

  _arrangeSceneItems() {
    const { scene, _options } = this
    const sceneItem = {}
    if (_options.sceneItem.shape === 'box') {
      sceneItem.geometry = new THREE.BoxBufferGeometry(
        this._options.sceneItem.width,
        this._options.sceneItem.width,
        this._options.sceneItem.width
      )
    } else if (_options.sceneItem.shape === 'lathe') {
      const points = []
      const { shapeOptions } = _options.sceneItem
      for (let i = 0; i < shapeOptions.segments; i++) {
        points.push(
          new THREE.Vector2(
            Math.sin(i * shapeOptions.y) * shapeOptions.size +
              shapeOptions.step,
            (i - shapeOptions.step) * shapeOptions.x
          )
        )
      }
      sceneItem.geometry = new THREE.LatheBufferGeometry(points)
    } else {
      sceneItem.geometry = new THREE.PlaneBufferGeometry(
        this._options.sceneItem.width,
        this._options.sceneItem.height
      )
    }

    new THREE.TextureLoader().load(
      `/static/img/${_options.sceneItem.image}.png`,
      texture => {
        for (let i = 1; i <= _options.sceneItem.count; i++) {
          sceneItem.material = new THREE.MeshBasicMaterial({
            color: _options.sceneItem.color,
            transparent: true,
            map: texture,
            side: THREE.DoubleSide
          })
          sceneItem.mesh = new THREE.Mesh(
            sceneItem.geometry,
            sceneItem.material
          )
          sceneItem.mesh.position.z = i * _options.sceneItem.spacing
          sceneItem.mesh.position.y = this._options.sceneItem.position.y
          sceneItem.mesh.position.x = this._isDivisibleBy(
            i,
            _options.sceneItem.reverseSideRate
          )
            ? -_options.sceneItem.offset
            : _options.sceneItem.offset
          sceneItem.mesh.name = `znak-${i}`
          scene.add(sceneItem.mesh)
        }
      }
    )
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
    self._moveCamera()
    self.currentFrame++
    self._moveItem()
    self._render()
    requestAnimationFrame(self._animate)
  }

  _moveCamera() {
    const { camera, _options, currentFrame } = this
    if (_options.camera.slouch) {
      camera.position.x =
        _options.sceneItem.spacing *
        Math.sin(currentFrame / _options.camera.slouch)
    }
    camera.position.y =
      (currentFrame * Math.sin(currentFrame / _options.camera.swing)) /
      _options.camera.far
    camera.position.z -= _options.camera.speed

    camera.rotateY(_options.camera.nudge * Math.cos(currentFrame))
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
      this.activeItem.geometry.needsUpdate = true
      this.activeItem.rotateZ(
        this._setItemMovementDirection(
          currentItemIndex,
          _options.sceneItem.movementSpeed
        )
      )
      if (this.previousItem) {
        this.previousItem.rotateY(
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
}

export default January
