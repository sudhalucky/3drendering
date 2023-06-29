import {
    RenderingEngine,
    Types,
    Enums,
    volumeLoader,
    CONSTANTS,
  } from '@cornerstonejs/core';
  import {
    initDemo,
    createImageIdsAndCacheMetaData,
    setTitleAndDescription,
    setCtTransferFunctionForVolumeActor,
  } from '../utils/demo/helpers';
  
  // This is for debugging purposes
  console.warn(
    'Click on index.ts to open source code for this example --------->'
  );
  
  const { ViewportType } = Enums;
  
  // ======== Set up page ======== //
  setTitleAndDescription(
    'Basic Volume',
    'Displays a DICOM series in a Volume viewport.'
  );
  
  const content = document.getElementById('content');
  const element = document.createElement('div');
  element.id = 'cornerstone-element';
  element.style.width = '500px';
  element.style.height = '500px';
  
  content.appendChild(element);
  // ============================= //
  
  /**
   * Runs the demo
   */
  async function run() {
    // Init Cornerstone and related libraries
    await initDemo();
  
    // Get Cornerstone imageIds and fetch metadata into RAM
    const imageIds = await createImageIdsAndCacheMetaData({
        StudyInstanceUID:
          '0999874917.48450.29868.214238.042012160046081083',
        SeriesInstanceUID:
          '0592518773.06401.25964.209171.127037213024246047',
        wadoRsRoot: 'https://dicomtestspace-dicom-service-1.dicom.azurehealthcareapis.com/v1',
      });
  
    // Instantiate a rendering engine
    const renderingEngineId = 'myRenderingEngine';
    const renderingEngine = new RenderingEngine(renderingEngineId);
  
    // Create a stack viewport
    const viewportId = 'CT_SAGITTAL_STACK';
    const viewportInput = {
      viewportId,
      type: ViewportType.ORTHOGRAPHIC,
      element,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
        background: [0.2, 0, 0.2],
      },
    };
  
    renderingEngine.enableElement(viewportInput);
  
    // Get the stack viewport that was created
    const viewport = (
      renderingEngine.getViewport(viewportId)
    );
  
    // Define a unique id for the volume
    const volumeName = 'CT_VOLUME_ID'; // Id of the volume less loader prefix
    const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
    const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
  
    // Define a volume in memory
    const volume = await volumeLoader.createAndCacheVolume(volumeId, {
      imageIds,
    });
  
    // Set the volume to load
    volume.load();
  
    // Set the volume on the viewport
    viewport.setVolumes([
      { volumeId, callback: setCtTransferFunctionForVolumeActor },
    ]);
  
    // Render the image
    viewport.render();
  }
  
  run();
  