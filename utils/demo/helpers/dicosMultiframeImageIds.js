import { metaData } from '@cornerstonejs/core';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

/**
 * Receives a list of imageids possibly referring to multiframe dicos images
 * and returns a list of imageid where each imageid referes to one frame.
 * For each imageId representing a multiframe image with n frames,
 * it will create n new imageids, one for each frame, and returns the new list of imageids
 * If a particular imageid no refer to a mutiframe image data, it will be just copied into the new list
 * @returns new list of imageids where each imageid represents a frame
 */
async function dicosMultiframeImageIds(imageId) {
    const newImageIds = [];

    await cornerstoneDICOMImageLoader.wadouri.loadImage(imageId)
      .promise;

    let imageIds = getDiscoFrames(imageId);

    imageIds.forEach((imageFrame) => {
      const { imageIdFrameless } = getFrameInformation(imageFrame);
      const instanceMetaData = metaData.get('dicosMultiframeModule', imageFrame);
      if (
        instanceMetaData &&
        instanceMetaData.NumberOfFrames &&
        instanceMetaData.NumberOfFrames > 1
      ) {
        const NumberOfFrames = instanceMetaData.NumberOfFrames;
        for (let i = 0; i < NumberOfFrames; i++) {
          const newImageId = imageIdFrameless + (i + 1);
          newImageIds.push(newImageId);
        }
      } else newImageIds.push(imageFrame);
    });
    return newImageIds;
  }
  
  export { dicosMultiframeImageIds };
  