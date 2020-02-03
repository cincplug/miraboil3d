import { RepeatWrapping } from 'three'

const helpers = {
  capitalize: string => {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`
  },

  /**
   * Iterate through two nesting levels of object and implement properties on another object
   * @param {Object} properties - set of properties to implement
   * @param {Object} target - target object to apply properties and sub-properties
   * @param {Number} modifierIndex - coefficient with which to multiply sequence transformation properties
   */
  mapProperties: (properties, target, modifierIndex = 0) => {
    for (const property in properties) {
      if (properties[property]) {
        for (const subProperty in properties[property]) {
          if (properties[property][subProperty]) {
            target[property][subProperty] +=
              properties[property][subProperty] * (modifierIndex + 1)
          }
        }
      }
    }
  },

  makePattern: (item, texture) => {
    texture.wrapT = texture.wrapS = RepeatWrapping
    texture.offset.set(0, 0)
    texture.repeat.set(item.repeat.width, item.repeat.height)
    return texture
  }
}

export { helpers }
