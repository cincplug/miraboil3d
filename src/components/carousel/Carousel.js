/**
 * Carousel component
 */
class Carousel {
  constructor(element, options = {}) {
    this._element = element
    this._options = { ...Carousel.options, ...options }
    this._init()
  }

  _cacheSelectors() {
    this._elements = {
      slide: this._element.querySelector('.january'),
      slideButton: this._element.querySelector('.january__slide'),
      display: this._element.querySelector('.carousel__display')
    }
  }

  _addEventListeners() {
    this._element.addEventListener('click', e => this._handleClick(e))
  }

  _handleClick(e) {
    if (e.target.className.match(/\bjanuary__slide\b/)) {
      const activeItem = Number(this._element.dataset.activeItem)
      const nextItem = activeItem + 1
      this._element.dataset.activeItem = nextItem
      window.scrollTo(nextItem.offsetTop)
    }
  }

  _init() {
    this._cacheSelectors()
    this._addEventListeners()
  }
}

export default Carousel
