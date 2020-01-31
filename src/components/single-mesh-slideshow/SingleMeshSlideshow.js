import * as THREE from 'three'
import * as defaults from './single-mesh-slideshow.json'
import Scene from '../scene/Scene'
const merge = require('deepmerge')

/**
 * Slideshow component
 */
class Slideshow extends Scene {
  constructor(element, options = {}) {
    super(element, options)
  }

  _cacheSelectors() {
    this._elements = {
      title: this._element.querySelector('.slideshow__title'),
      navButton: this._element.querySelector('.slideshow__nav-button'),
      canvasWrap: this._element.querySelector('.slideshow__canvas-wrap'),
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
    if (e.target.className.match(/\bslideshow__color-switch\b/)) {
      const { color } = e.target.dataset
      this._element.dataset.color = color
      const threeColor = new THREE.Color(color)
      this.scene.background = threeColor
      this._options.lights.forEach((light, index) => {
        if (light) {
          this.scene.getObjectByName(`svetlo-${index}`).color = threeColor
        }
      })
      this._render()
    }
    if (e.target.className.match(/\bslideshow__nav-button\b/)) {
      this._setExample(e.target.dataset.direction)
    }
  }

  _resetExistingExample() {
    const { canvas, requestFrameId } = this
    if (requestFrameId) cancelAnimationFrame(requestFrameId)
    if (canvas) canvas.remove()
  }

  _setExample(direction) {
    const { examples } = this
    const { options } = defaults
    this._resetExistingExample()
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
    const example = examples[item]
    this._options = merge(options, example)
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

export default Slideshow
