import { utilities as csUtils } from '@cornerstonejs/core';

const dicosMetaData = {};

function addInstance(imageId, imageMetaData) {
  const imageURI = csUtils.imageIdToURI(imageId);
  dicosMetaData[imageURI] = imageMetaData;
}

function get(type, imageId) {
  if (type === 'dicosMultiframeModule') {
    const imageURI = csUtils.imageIdToURI(imageId);
    return dicosMetaData[imageURI];
  }
}

export default { addInstance, get };
