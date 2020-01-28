const helpers = {
  capitalize: string => {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`
  },

  /**
   * Iterate through two nesting levels of object
   * @param {Object} properties - set of properties to implement
   * @param {Object} target - target object to apply properties and sub-properties
   */
  mapProperties: (properties, target) => {
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
}

export { helpers }
