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
      xhr.setRequestHeader('Authorization', 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiJodHRwczovL2RpY29tLmhlYWx0aGNhcmVhcGlzLmF6dXJlLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzJmODU1NmVmLTRiY2QtNDQwOC1hOWM2LTI3YmUwMGYwYjAyOS8iLCJpYXQiOjE2ODc4MzY4NzUsIm5iZiI6MTY4NzgzNjg3NSwiZXhwIjoxNjg3ODQyNDQ3LCJhY3IiOiIxIiwiYWlvIjoiQVZRQXEvOFRBQUFBR1ZJRzMwSXpPTWNCWlQrMGtnSzhiRXpSazRBY1JqTzNneEhmTm8zcWxGVWNzbnMzbW9jYUY3ZEhrdDFmeGhsUUdoYkJ0OTBGM21SZTdaN0hiQmdmZDBJTVNCNHhLbi91Nzh0aThwZ0xabGM9IiwiYW1yIjpbInB3ZCIsIm1mYSJdLCJhcHBpZCI6IjA0YjA3Nzk1LThkZGItNDYxYS1iYmVlLTAyZjllMWJmN2I0NiIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiZGhvbmRpIiwiZ2l2ZW5fbmFtZSI6InN1ZGhha2VyIiwiaXBhZGRyIjoiMTY1LjIyNS4xMDYuMTMzIiwibmFtZSI6InN1ZGhha2VyIGRob25kaSIsIm9pZCI6ImM1NWZlMWE4LTczNGMtNDUwOC1hNDkxLTMyODljYTJjNGYzNCIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0zMTIzNDU2ODc2LTIzNzIwMjYzNTAtOTc4MDU0ODEyLTcxMjIiLCJwdWlkIjoiMTAwMzIwMDI1QTY5NjlDNiIsInJoIjoiMC5BWGtBNzFhRkw4MUxDRVNweGllLUFQQ3dLYjhsNTNYT1p1cE1tNXBjVEtybGZ6TjVBTWsuIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiOTB3QXVMdWs4WUQ1cGJ3MHBGd2pfOGVrbjU5Ym1Cd0ZKVm53dHB4dF9jYyIsInRpZCI6IjJmODU1NmVmLTRiY2QtNDQwOC1hOWM2LTI3YmUwMGYwYjAyOSIsInVuaXF1ZV9uYW1lIjoic3VkaGFrZXIuZGhvbmRpQGNzbWFuZGV2LmNvbSIsInVwbiI6InN1ZGhha2VyLmRob25kaUBjc21hbmRldi5jb20iLCJ1dGkiOiJXLXdxVk1HUWFVdXd5Tk5aLUhwQ0FBIiwidmVyIjoiMS4wIn0.CkNR7Wg_wJe_WBwLIO0OPXHQ0w1m2dBcuEDpUEJP2FWSW4lwfP_Ips7dpml29AZvwR7Qm-p57oSZ58lucIY04-oLzTLpjDBebbclfiRp13OwUnON10ypAScWLSHij6SQdtuAHnPtSGnkUbnQj1pWqpDpAOUQLBXCLK_Pe8bgz2U4dr4PL2P87fJZugvftEK_2QezhCh0PHmN6MfJQZasWYP0L76QAOw4IQFMILBw59eT6mJDpdLhKMU4DOVwvyXisc45opQwtjFKSnQjBi8SwXknEfd1udU-LZYX7RQiYRIEq6EcXALk4HNXn4VnIQnNYzChrSSMWPhbMhKp9r7HNw');
      xhr.setRequestHeader('Accept', 'multipart/related; type="application/octet-stream"; transfer-syntax=*');
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
