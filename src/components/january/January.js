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
    obojSelector: '.january__oboj',
    pozadina: 0xf0f0f0,
    kolkoSlika: 50,
    kamera: {
      fov: 80,
      aspect: window.innerWidth / window.innerHeight,
      near: 1,
      far: 3000,
      položaj: {
        y: 20
      },
      distanceRatio: 2,
      brzina: 1,
      swing: 100,
      ljulj: 0.0001
    },
    podloga: {
      boja: 0xf0f0ff,
      širina: 4096,
      dubina: 19200,
      visina: 256,
      angle: 90,
      repeat: {
        width: 4,
        depth: 32
      }
    },
    slika: {
      boja: 0xb8b8f8,
      širina: 512,
      visina: 1024,
      razmak: 256,
      ofset: 512,
      brzinaPada: 0.006,
      brzinaRaspada: 0.006,
      reverseSideRate: 2
    },
    linija: {
      širina: 20
    }
  }

  _cacheSelectors() {
    this._elements = {
      oboj: this._element.querySelector(this._options.obojSelector)
    }
  }
  _addEventListeners() {
    this._element.addEventListener('click', e => this._oboj(e))
  }

  /**
   * Colors the content according to data-status attribute
   * @param {Object} e - event object
   */
  _oboj(e) {
    const color = e.target.getAttribute('data-color')
    this._element.setAttribute('data-color', color)
    this.scene.background = new THREE.Color(color)
    this._render()
  }

  _postaviScenu() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this._options.pozadina)
    this.renderer = new THREE.WebGLRenderer()
    const renderWidth = this._element.offsetWidth
    const renderHeight = Math.round(renderWidth / this._options.kamera.aspect)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(renderWidth, renderHeight)
    this._element.appendChild(this.renderer.domElement)
    new THREE.TextureLoader().load('/static/img/podloga.jpg', tekstura =>
      this._postaviPodlogu(tekstura)
    )
  }

  _postaviPodlogu(tekstura) {
    const { scene, _options } = this
    const podloga = {
      geometry: new THREE.PlaneBufferGeometry(
        this._options.podloga.širina,
        this._options.podloga.dubina
      )
    }
    tekstura.wrapT = tekstura.wrapS = THREE.RepeatWrapping
    tekstura.offset.set(0, 0)
    tekstura.repeat.set(
      _options.podloga.repeat.width,
      _options.podloga.repeat.depth
    )
    podloga.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(_options.podloga.boja),
      map: tekstura,
      side: THREE.DoubleSide
    })
    podloga.mesh = new THREE.Mesh(podloga.geometry, podloga.material)
    podloga.mesh.rotation.x = THREE.Math.degToRad(_options.podloga.angle)
    podloga.mesh.position.y = -_options.podloga.visina
    podloga.mesh.position.z =
      (_options.kolkoSlika * _options.slika.razmak) /
      _options.kamera.distanceRatio
    scene.add(podloga.mesh)
    this._postaviSlike()
  }

  _postaviSlike() {
    const { scene, _options } = this
    const slika = {
      geometry: new THREE.PlaneBufferGeometry(
        this._options.slika.širina,
        this._options.slika.visina
      )
    }
    new THREE.TextureLoader().load(`/static/img/drvo.png`, tekstura => {
      for (let i = 1; i <= _options.kolkoSlika; i++) {
        slika.material = new THREE.MeshBasicMaterial({
          transparent: true,
          map: tekstura,
          side: THREE.DoubleSide
        })
        slika.mesh = new THREE.Mesh(slika.geometry, slika.material)
        slika.mesh.position.z = i * _options.slika.razmak
        slika.mesh.position.y = -250
        slika.mesh.position.x = this._isDivisibleBy(
          i,
          _options.slika.reverseSideRate
        )
          ? -_options.slika.ofset
          : _options.slika.ofset
        slika.mesh.name = `znak-${i}`
        scene.add(slika.mesh)
      }
      this.indeksAktivneSlike = 0
      this.aktivnaSlika = null
      this.f = 0
      this.kamera = null
      this._postaviKameru()
    })
  }

  _postaviKameru() {
    this.kamera = new THREE.PerspectiveCamera(
      this._options.kamera.fov,
      this._options.kamera.aspect,
      this._options.kamera.near,
      this._options.kamera.far
    )
    this.kamera.position.z =
      this._options.kolkoSlika * this._options.slika.razmak +
      this._options.kamera.far / this._options.kamera.distanceRatio
    this.kamera.position.y = -this._options.kamera.položaj.y
    this.scene.add(this.kamera)
    this._animate()
  }

  _animate = () => {
    // eslint-disable-next-line no-invalid-this
    const self = this
    const { scene, _options, kamera } = self
    let { f, aktivnaSlika, indeksAktivneSlike } = self
    kamera.position.z = kamera.position.z - _options.kamera.brzina
    kamera.position.y =
      (f * Math.sin(f / _options.kamera.swing)) / _options.kamera.far
    f++

    const kojaSlika = Math.round(
      (f / _options.slika.razmak) * _options.kamera.brzina
    )

    if (kojaSlika > indeksAktivneSlike) {
      indeksAktivneSlike = kojaSlika

      aktivnaSlika = scene.getObjectByName(
        `znak-${_options.kolkoSlika - indeksAktivneSlike + 1}`
      )
      aktivnaSlika.geometry.needsUpdate = true
    }

    self.kamera.rotateY(_options.kamera.ljulj * Math.cos(f))
    self._render()
    requestAnimationFrame(self._animate)
  }

  _render() {
    this.renderer.render(this.scene, this.kamera)
  }

  _init() {
    this._cacheSelectors()
    this._addEventListeners()
    this._postaviScenu()
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
