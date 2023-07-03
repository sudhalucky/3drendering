import dicomParser from 'dicom-parser';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;
const { preferSizeOverAccuracy, useNorm16Texture } =
  cornerstone.getConfiguration().rendering;

export default function initCornerstoneDICOMImageLoader() {
  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
  cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
  cornerstoneDICOMImageLoader.configure({
    useWebWorkers: true,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
      use16BitDataType: preferSizeOverAccuracy || useNorm16Texture,
    },
    beforeSend: function (xhr) {
      // Add custom headers here (e.g. auth tokens)
      // xhr.setRequestHeader('Authorization', 'Bearer some sample token');
      // xhr.setRequestHeader('Accept', 'multipart/related; type="application/octet-stream"; transfer-syntax=*');
    },
  });

  let maxWebWorkers = 1;

  if (navigator.hardwareConcurrency) {
    maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7);
  }

  var config = {
    maxWebWorkers,
    startWebWorkersOnDemand: false,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        strict: false,
      },
    },
  };

  cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
}
