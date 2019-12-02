import * as THREE from 'three'

/**
 * January component
 */
class January {
  constructor(element, options = {}) {
    this._element = element
    this._options = { ...January.options, ...options }
    this._init()
  }

  static options = {
    colorSelector: '.january__color-switch',
    background: 0xf0f0f0,
    imageCount: 50,
    camera: {
      fov: 80,
      aspect: window.innerWidth / window.innerHeight,
      near: 1,
      far: 3000,
      position: {
        y: 20
      },
      distanceRatio: 2,
      speed: 1,
      swing: 100,
      nudge: 0.0001
    },
    ground: {
      color: 0xf0f0ff,
      width: 4096,
      depth: 19200,
      height: 256,
      angle: 90,
      repeat: {
        width: 4,
        depth: 32
      }
    },
    sceneItem: {
      color: 0xb8b8f8,
      width: 512,
      height: 1024,
      spacing: 256,
      offset: 512,
      movementSpeed: 0.006,
      secondaryMovementSpeed: 0.006,
      reverseSideRate: 2
    },
    line: {
      width: 20
    }
  }

  _cacheSelectors() {
    this._elements = {
      color: this._element.querySelector(this._options.colorSelector)
    }
  }
  _addEventListeners() {
    this._element.addEventListener('click', e => this._color(e))
  }

  /**
   * Colors the content according to data-status attribute
   * @param {Object} e - event object
   */
  _color(e) {
    const color = e.target.getAttribute('data-color')
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
    new THREE.TextureLoader().load('/static/img/ground.jpg', texture =>
      this._setGround(texture)
    )
  }

  _setGround(texture) {
    const { scene, _options } = this
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
      (_options.imageCount * _options.sceneItem.spacing) /
      _options.camera.distanceRatio
    scene.add(ground.mesh)
    this._arrangeSceneItems()
  }

  _arrangeSceneItems() {
    const { scene, _options } = this
    const sceneItem = {
      geometry: new THREE.PlaneBufferGeometry(
        this._options.sceneItem.width,
        this._options.sceneItem.height
      )
    }
    new THREE.TextureLoader().load(`/static/img/tree.png`, texture => {
      for (let i = 1; i <= _options.imageCount; i++) {
        sceneItem.material = new THREE.MeshBasicMaterial({
          transparent: true,
          map: texture,
          side: THREE.DoubleSide
        })
        sceneItem.mesh = new THREE.Mesh(sceneItem.geometry, sceneItem.material)
        sceneItem.mesh.position.z = i * _options.sceneItem.spacing
        sceneItem.mesh.position.y = -250
        sceneItem.mesh.position.x = this._isDivisibleBy(
          i,
          _options.sceneItem.reverseSideRate
        )
          ? -_options.sceneItem.offset
          : _options.sceneItem.offset
        sceneItem.mesh.name = `znak-${i}`
        scene.add(sceneItem.mesh)
      }
      this.activeItemIndex = 0
      this.activeItem = null
      this.f = 0
      this.camera = null
      this._setCamera()
    })
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this._options.camera.fov,
      this._options.camera.aspect,
      this._options.camera.near,
      this._options.camera.far
    )
    this.camera.position.z =
      this._options.imageCount * this._options.sceneItem.spacing +
      this._options.camera.far / this._options.camera.distanceRatio
    this.camera.position.y = -this._options.camera.position.y
    this.scene.add(this.camera)
    this._animate()
  }

  _animate = () => {
    // eslint-disable-next-line no-invalid-this
    const self = this
    const { scene, _options, camera } = self
    let { f, activeItem, activeItemIndex } = self
    camera.position.z = camera.position.z - _options.camera.speed
    camera.position.y =
      (f * Math.sin(f / _options.camera.swing)) / _options.camera.far
    f++

    const currentItemIndex = Math.round(
      (f / _options.sceneItem.spacing) * _options.camera.speed
    )

    if (currentItemIndex > activeItemIndex) {
      activeItemIndex = currentItemIndex

      activeItem = scene.getObjectByName(
        `znak-${_options.imageCount - activeItemIndex + 1}`
      )
      activeItem.geometry.needsUpdate = true
    }

    camera.rotateY(_options.camera.nudge * Math.cos(f))
    self._render()
    requestAnimationFrame(self._animate)
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
