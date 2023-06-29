import { api } from 'dicomweb-client';
import dcmjs from 'dcmjs';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';
import { getPTImageIdInstanceMetadata } from './getPTImageIdInstanceMetadata';
import { utilities } from '@cornerstonejs/core';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

import ptScalingMetaDataProvider from './ptScalingMetaDataProvider';
import getPixelSpacingInformation from './getPixelSpacingInformation';
import { convertMultiframeImageIds } from './convertMultiframeImageIds';
import removeInvalidTags from './removeInvalidTags';

const { DicomMetaDictionary } = dcmjs.data;
const { calibratedPixelSpacingMetadataProvider } = utilities;

/**
/**
 * Uses dicomweb-client to fetch metadata of a study, cache it in cornerstone,
 * and return a list of imageIds for the frames.
 *
 * Uses the app config to choose which study to fetch, and which
 * dicom-web server to fetch it from.
 *
 * @returns {string[]} An array of imageIds for instances in the study.
 */

export default async function createImageIdsAndCacheMetaData({
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID = null,
  wadoRsRoot,
  client = null,
}) {
  const SOP_INSTANCE_UID = '00080018';
  const SERIES_INSTANCE_UID = '0020000E';
  const MODALITY = '00080060';

  const studySearchOptions = {
    studyInstanceUID: StudyInstanceUID,
    seriesInstanceUID: SeriesInstanceUID,
  };

  client = client || new api.DICOMwebClient({ url: wadoRsRoot, 
    headers: {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiJodHRwczovL2RpY29tLmhlYWx0aGNhcmVhcGlzLmF6dXJlLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzJmODU1NmVmLTRiY2QtNDQwOC1hOWM2LTI3YmUwMGYwYjAyOS8iLCJpYXQiOjE2ODc4MzY4NzUsIm5iZiI6MTY4NzgzNjg3NSwiZXhwIjoxNjg3ODQyNDQ3LCJhY3IiOiIxIiwiYWlvIjoiQVZRQXEvOFRBQUFBR1ZJRzMwSXpPTWNCWlQrMGtnSzhiRXpSazRBY1JqTzNneEhmTm8zcWxGVWNzbnMzbW9jYUY3ZEhrdDFmeGhsUUdoYkJ0OTBGM21SZTdaN0hiQmdmZDBJTVNCNHhLbi91Nzh0aThwZ0xabGM9IiwiYW1yIjpbInB3ZCIsIm1mYSJdLCJhcHBpZCI6IjA0YjA3Nzk1LThkZGItNDYxYS1iYmVlLTAyZjllMWJmN2I0NiIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiZGhvbmRpIiwiZ2l2ZW5fbmFtZSI6InN1ZGhha2VyIiwiaXBhZGRyIjoiMTY1LjIyNS4xMDYuMTMzIiwibmFtZSI6InN1ZGhha2VyIGRob25kaSIsIm9pZCI6ImM1NWZlMWE4LTczNGMtNDUwOC1hNDkxLTMyODljYTJjNGYzNCIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0zMTIzNDU2ODc2LTIzNzIwMjYzNTAtOTc4MDU0ODEyLTcxMjIiLCJwdWlkIjoiMTAwMzIwMDI1QTY5NjlDNiIsInJoIjoiMC5BWGtBNzFhRkw4MUxDRVNweGllLUFQQ3dLYjhsNTNYT1p1cE1tNXBjVEtybGZ6TjVBTWsuIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiOTB3QXVMdWs4WUQ1cGJ3MHBGd2pfOGVrbjU5Ym1Cd0ZKVm53dHB4dF9jYyIsInRpZCI6IjJmODU1NmVmLTRiY2QtNDQwOC1hOWM2LTI3YmUwMGYwYjAyOSIsInVuaXF1ZV9uYW1lIjoic3VkaGFrZXIuZGhvbmRpQGNzbWFuZGV2LmNvbSIsInVwbiI6InN1ZGhha2VyLmRob25kaUBjc21hbmRldi5jb20iLCJ1dGkiOiJXLXdxVk1HUWFVdXd5Tk5aLUhwQ0FBIiwidmVyIjoiMS4wIn0.CkNR7Wg_wJe_WBwLIO0OPXHQ0w1m2dBcuEDpUEJP2FWSW4lwfP_Ips7dpml29AZvwR7Qm-p57oSZ58lucIY04-oLzTLpjDBebbclfiRp13OwUnON10ypAScWLSHij6SQdtuAHnPtSGnkUbnQj1pWqpDpAOUQLBXCLK_Pe8bgz2U4dr4PL2P87fJZugvftEK_2QezhCh0PHmN6MfJQZasWYP0L76QAOw4IQFMILBw59eT6mJDpdLhKMU4DOVwvyXisc45opQwtjFKSnQjBi8SwXknEfd1udU-LZYX7RQiYRIEq6EcXALk4HNXn4VnIQnNYzChrSSMWPhbMhKp9r7HNw'}
  });
  const instances = await client.retrieveSeriesMetadata(studySearchOptions);
  const modality = instances[0][MODALITY].Value[0];
  let imageIds = instances.map((instanceMetaData) => {
    const SeriesInstanceUID = instanceMetaData[SERIES_INSTANCE_UID].Value[0];
    const SOPInstanceUIDToUse =
      SOPInstanceUID || instanceMetaData[SOP_INSTANCE_UID].Value[0];

    const prefix = 'wadors:';

    const imageId =
      prefix +
      wadoRsRoot +
      '/studies/' +
      StudyInstanceUID +
      '/series/' +
      SeriesInstanceUID +
      '/instances/' +
      SOPInstanceUIDToUse +
      '/frames/1';

    cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
      imageId,
      instanceMetaData
    );
    return imageId;
  });

  // if the image ids represent multiframe information, creates a new list with one image id per frame
  // if not multiframe data available, just returns the same list given
  imageIds = convertMultiframeImageIds(imageIds);

  imageIds.forEach((imageId) => {
    let instanceMetaData =
      cornerstoneDICOMImageLoader.wadors.metaDataManager.get(imageId);

    // It was using JSON.parse(JSON.stringify(...)) before but it is 8x slower
    instanceMetaData = removeInvalidTags(instanceMetaData);

    if (instanceMetaData) {
      // Add calibrated pixel spacing
      const metadata = DicomMetaDictionary.naturalizeDataset(instanceMetaData);
      const pixelSpacing = getPixelSpacingInformation(metadata);

      if (pixelSpacing) {
        calibratedPixelSpacingMetadataProvider.add(imageId, {
          rowPixelSpacing: parseFloat(pixelSpacing[0]),
          columnPixelSpacing: parseFloat(pixelSpacing[1]),
        });
      }
    }
  });

  // we don't want to add non-pet
  // Note: for 99% of scanners SUV calculation is consistent bw slices
  if (modality === 'PT') {
    const InstanceMetadataArray = [];
    imageIds.forEach((imageId) => {
      const instanceMetadata = getPTImageIdInstanceMetadata(imageId);

      // TODO: Temporary fix because static-wado is producing a string, not an array of values
      // (or maybe dcmjs isn't parsing it correctly?)
      // It's showing up like 'DECY\\ATTN\\SCAT\\DTIM\\RAN\\RADL\\DCAL\\SLSENS\\NORM'
      // but calculate-suv expects ['DECY', 'ATTN', ...]
      if (typeof instanceMetadata.CorrectedImage === 'string') {
        instanceMetadata.CorrectedImage =
          instanceMetadata.CorrectedImage.split('\\');
      }

      if (instanceMetadata) {
        InstanceMetadataArray.push(instanceMetadata);
      }
    });
    if (InstanceMetadataArray.length) {
      try {
        const suvScalingFactors = calculateSUVScalingFactors(
          InstanceMetadataArray
        );
        InstanceMetadataArray.forEach((instanceMetadata, index) => {
          ptScalingMetaDataProvider.addInstance(
            imageIds[index],
            suvScalingFactors[index]
          );
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  return imageIds;
}
