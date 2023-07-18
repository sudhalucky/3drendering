import { utilities as csUtils } from '@cornerstonejs/core';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

const dicosMetaData = {};

function add(imageId, imageMetaData) {
  const imageURI = csUtils.imageIdToURI(imageId);
  dicosMetaData[imageURI] = imageMetaData;
  console.log('Metadat supplied: ', imageMetaData)
}

function get(type, imageId) {
  const imageURI = csUtils.imageIdToURI(imageId);
  // ImageOrientationPatient: null; //instanceMetaData.elements[keys['SharedFunctionalGroupsSequence']].items[0].dataSet.elements[keys['PlaneOrientationSequence']].items[0].dataSet.elements[keys['ImageOrientationPatient']], //Array<number>;
  // /** Physical distance in the patient between the center of each pixel */
  // PixelSpacing: null; //instanceMetaData.elements[keys['SharedFunctionalGroupsSequence']].items[0].dataSet.elements[keys['PixelMeasuresSequence']].items[0].dataSet.elements[keys['PixelSpacing']], //Array<number>;
  // ImagePositionPatient: null;

//   let imageData = cornerstoneDICOMImageLoader.wadors.loadImage(imageId).promise;

//   imageData.then((data) => {
// console.log(data);
//   });

//   const { ImageOrientationPatient, PixelSpacing } = dicosMetaData[imageURI];

//   if (!ImageOrientationPatient)
//   {
//     let intValues = [];
//     let n =
//     imageData.elements[keys["SharedFunctionalGroupsSequence"]].items[0]
//         .dataSet.elements[keys["PlaneOrientationSequence"]].items[0].dataSet;
//     for (let i = 0; i < n.numStringValues(keys["ImageOrientationPatient"]); i++) {
//       intValues.push(n.intString(keys["ImageOrientationPatient"], i));
//     }
//     dicosMetadata.ImageOrientationPatient = intValues;  
//   }

//   let intValues1 = [];
//   n =
//     instanceMetaData.elements[keys["PerFrameFunctionalGroupsSequence"]].items[0]
//       .dataSet.elements[keys["PlanePositionSequence"]].items[0].dataSet;
//   for (let i = 0; i < n.numStringValues(keys["ImagePositionPatient"]); i++) {
//     intValues1.push(n.intString(keys["ImagePositionPatient"], i));
//   }
//   dicosMetadata.ImagePositionPatient = intValues1;

//   let floatValues = [];
//   n =
//     instanceMetaData.elements[keys["SharedFunctionalGroupsSequence"]].items[0]
//       .dataSet.elements[keys["PixelMeasuresSequence"]].items[0].dataSet;
//   for (let i = 0; i < n.numStringValues(keys["PixelSpacing"]); i++) {
//     floatValues.push(n.floatString(keys["PixelSpacing"], i));
//   }

//   dicosMetadata.PixelSpacing = floatValues;


  if (type === 'dicosMultiframeModule') {
    return dicosMetaData[imageURI];
  }
  else {
    console.log('Metdata Type requested not found: ', type, 'for image: ', imageId);
    return dicosMetaData[imageURI];
  }
}

export default { add, get };
