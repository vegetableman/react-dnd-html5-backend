import * as NativeTypes from './NativeTypes';

function getDataFromDataTransfer(dataTransfer, typesToTry, defaultValue) {
  const result = typesToTry.reduce((resultSoFar, typeToTry) =>
    resultSoFar || dataTransfer.getData(typeToTry),
    null
  );

  return (result != null) ? // eslint-disable-line eqeqeq
    result :
    defaultValue;
}

const nativeTypesConfig = {
  [NativeTypes.FILE]: {
    exposeProperty: 'files',
    matchesTypes: ['Files'],
    getData: (dataTransfer) => {
      var items = Array.prototype.slice.call(dataTransfer.items);
      for (var i = 0; i < length; i++) {
        var entry = dataTransfer.items[i].webkitGetAsEntry();
        if (entry.isFile) {
          return {type: 'file', list: Array.prototype.slice.call(dataTransfer.files)}
        } else if (entry.isDirectory) {
          return {type: 'directory', list: items};
        }
      }
    }
  },
  [NativeTypes.URL]: {
    exposeProperty: 'urls',
    matchesTypes: ['Url', 'text/uri-list'],
    getData: (dataTransfer, matchesTypes) =>
      getDataFromDataTransfer(dataTransfer, matchesTypes, '').split('\n')
  },
  [NativeTypes.TEXT]: {
    exposeProperty: 'text',
    matchesTypes: ['Text', 'text/plain'],
    getData: (dataTransfer, matchesTypes) =>
      getDataFromDataTransfer(dataTransfer, matchesTypes, '')
  }
};

export function createNativeDragSource(type) {
  const {
    exposeProperty,
    matchesTypes,
    getData
  } = nativeTypesConfig[type];

  return class NativeDragSource {
    constructor() {
      this.item = {
        get [exposeProperty]() {
          console.warn( // eslint-disable-line no-console
            `Browser doesn't allow reading "${exposeProperty}" until the drop event.`
          );
          return null;
        }
      };
    }

    mutateItemByReadingDataTransfer(dataTransfer) {
      delete this.item[exposeProperty];
      this.item[exposeProperty] = getData(dataTransfer, matchesTypes);
    }

    canDrag() {
      return true;
    }

    beginDrag() {
      return this.item;
    }

    isDragging(monitor, handle) {
      return handle === monitor.getSourceId();
    }

    endDrag() { }
  };
}

export function matchNativeItemType(dataTransfer) {
  const dataTransferTypes = Array.prototype.slice.call(dataTransfer.types || []);

  return Object.keys(nativeTypesConfig).filter(nativeItemType => {
    const { matchesTypes } = nativeTypesConfig[nativeItemType];
    return matchesTypes.some(t => dataTransferTypes.indexOf(t) > -1);
  })[0] || null;
}
