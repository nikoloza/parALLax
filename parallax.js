'use strict'

import { isMobile } from './devices'

class Parallax {
  constructor (items = []) {
    var isArray = Array.isArray(items)
    this.items = isArray ? items : [items]

    this._stamp = 0
    this._scrollX = window.scrollX
    this._scrollY = window.scrollY

    window.requestAnimationFrame(this.parallax.bind(this))
  }

  parallax () {
    // detect if scroll change has been applied
    var { scrollY, scrollX } = window
    var { _scrollX, _scrollY, _stamp } = this

    var scrollXhasChanged = (scrollX !== _scrollX)
    var scrollYhasChanged = (scrollY !== _scrollY)

    // send request again
    window.requestAnimationFrame(this.parallax.bind(this))

    // detect if change, and assign to cached version
    if (!scrollXhasChanged && !scrollYhasChanged && _stamp) return
    if (scrollXhasChanged) this._scrollX = scrollX
    if (scrollYhasChanged) this._scrollY = scrollY

    // perform desired action
    var { scroll, visible, items } = this

    var style = document.querySelector('#parellax-styles')
    var methods = { scroll, visible }

    if (!style) {
      style = document.createElement('style')
      style.setAttribute('id', 'parellax-styles')
      document.head.appendChild(style)
    }

    var rules = ''
    items.forEach((el) => {
      var rule = methods[el.when || 'scroll'].call(this, el) || ''
      rules += rule
    })
    style.innerHTML = rules

    this._stamp++
  }

  scroll (el) {
    if (isMobile) return
    document.body.classList.add('is-parallax-active')

    var { selector, property, initial, direction, force, bind, wrap } = el
    var splitRegex = /^([-]?[0-9]*)(.*)/

    if (!initial) initial = '0px 0px'
    if (!direction) direction = {}
    if (!bind) bind = {
      x: 'y',
      y: 'y'
    }

    if (!force) force = {x: 1, y: 1}
    else if (typeof force === 'number') force = {x: force, y: force}

    var pareseInitial = initial.split(' ').map((v) => v.match(splitRegex))
    var parseX = parseFloat(pareseInitial[0][1])
    var parseY = parseFloat(pareseInitial[1][1])
    var unitX = pareseInitial[0][2]
    var unitY = pareseInitial[1][2]

    var calculatedBySettingX = (direction.x || 0) * (force.x || 1)
    var calculatedBySettingY = (direction.y || 0) * (force.y || 1)

    var currentPosition
    var currentX = calculatedBySettingX
      ? parseX + (calculatedBySettingX * scrollX) + unitX
      : initial.split(' ')[0]
    var currentY = calculatedBySettingY
      ? parseY + (calculatedBySettingY * scrollY) + unitY
      : initial.split(' ')[1]

    console.log(currentX, currentY)

    if (property === 'background-position')
      currentPosition = `${currentX} ${currentY}`
    if (property === 'transform')
      currentPosition = `translate3d(${currentX}, ${currentY}, 0)`

    var rules = `${selector} {
      ${property}: ${currentPosition};
    }`

    if (wrap && Array.isArray(wrap)) rules = wrap[0] + rules + wrap[1]

    return rules
  }

  visible (el) {
    var { scrollY, scrollX, innerWidth, innerHeight } = window
    var { selector } = el

    var areVisible = this[selector]
    if (!areVisible)
      areVisible = this[selector] = document.querySelectorAll(selector)
    var bodyPositions = document.body.getBoundingClientRect()

    areVisible.forEach((dom, key) => {
      var { init, before, after, animation, once } = el
      var { _inCanvas, _prevent, _timeout } = dom
      var { _stamp } = this

      var positions = dom.getBoundingClientRect()
      var offsetTop = positions.top - bodyPositions.top
      var offsetBottom = positions.bottom - bodyPositions.top
      var inCanvas = scrollY < (isMobile ? offsetTop : offsetBottom) &&
        offsetTop < (scrollY + innerHeight)

      if (_inCanvas === inCanvas || _prevent) return
      else dom._inCanvas = inCanvas

      if (_timeout) window.clearTimeout(_timeout)
      if (typeof init === 'function' && _stamp === 0) init(dom, key)
      if (typeof before === 'function') before(dom, key)

      if (inCanvas) {
        dom.classList.remove(...animation.out.split(' '), 'hidden')
        dom.classList.add(
          ...animation.basic.split(' '), ...animation.in.split(' ')
        )
        if (once) dom._prevent = true
      } else {
        dom.classList.remove(...animation.in.split(' '))
        dom.classList.add(
          ...animation.basic.split(' '), ...animation.out.split(' ')
        )
      }

      if (typeof after === 'function') after(dom, key)

      dom._timeout = window.setTimeout(() => {
        dom.classList.remove(
          ...animation.basic.split(' '),
          ...animation.in.split(' '),
          ...animation.out.split(' ')
        )
        window.clearTimeout(dom._timeout)
      }, 2500)
    })
  }

  add (config = {}) {
    this.items.push(config)
  }
}

export default Parallax
