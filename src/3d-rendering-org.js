import {
  CONSTANTS,
  Enums,
  RenderingEngine,
  setVolumesForViewports,
  Types,
  utilities,
  volumeLoader,
} from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  addDropdownToToolbar,
  createImageIdsAndCacheMetaData,
  initDemo,
  setTitleAndDescription,
} from '../utils/demo/helpers';

// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

const {
  ToolGroupManager,
  TrackballRotateTool,
  Enums: csToolsEnums,
} = cornerstoneTools;

const { ViewportType } = Enums;
const { MouseBindings } = csToolsEnums;

// Define a unique id for the volume
let renderingEngine;
const volumeName = 'CT_VOLUME_ID'; // Id of the volume less loader prefix
const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
const renderingEngineId = 'myRenderingEngine';
const viewportId = '3D_VIEWPORT';

// ======== Set up page ======== //
setTitleAndDescription(
  '3D Volume Rendering',
  'Here we demonstrate how to 3D render a volume.'
);

const size = '500px';
const content = document.getElementById('content');
const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'flex';
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

const element1 = document.createElement('div');
element1.oncontextmenu = () => false;

element1.style.width = size;
element1.style.height = size;

viewportGrid.appendChild(element1);

content.appendChild(viewportGrid);

const instructions = document.createElement('p');
instructions.innerText = 'Click the image to rotate it.';

content.append(instructions);

addDropdownToToolbar({
  options: {
    values: CONSTANTS.VIEWPORT_PRESETS.map((preset) => preset.name),
    defaultValue: 'CT-Bone',
  },
  onSelectedValueChange: (presetName) => {
    const volumeActor = renderingEngine
      .getViewport(viewportId)
      .getDefaultActor().actor;

    utilities.applyPreset(
      volumeActor,
      CONSTANTS.VIEWPORT_PRESETS.find((preset) => preset.name === presetName)
    );

    renderingEngine.render();
  },
});

// ============================= //

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  const toolGroupId = 'TOOL_GROUP_ID';

  // Add tools to Cornerstone3D
  cornerstoneTools.addTool(TrackballRotateTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  // Add the tools to the tool group and specify which volume they are pointing at
  toolGroup.addTool(TrackballRotateTool.toolName, {
    configuration: { volumeId },
  });

  // Set the initial state of the tools, here we set one tool active on left click.
  // This means left click will draw that tool.
  toolGroup.setToolActive(TrackballRotateTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });

  // Get Cornerstone imageIds and fetch metadata into RAM
  //https://dicomtestspace-dicom-service-1.dicom.azurehealthcareapis.com/v1/studies/0999874917.48450.29868.214238.042012160046081083/series/0592518773.06401.25964.209171.127037213024246047/instances/1820481158.14653.26942.135032.127013106252019119
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '0999874917.48450.29868.214238.042012160046081083',
    SeriesInstanceUID:
      '0592518773.06401.25964.209171.127037213024246047',
    wadoRsRoot: 'https://dicomtestspace-dicom-service-1.dicom.azurehealthcareapis.com/v1',
  });

  // const imageIds = await createImageIdsAndCacheMetaData({
  //   StudyInstanceUID:
  //     '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339',
  //   SeriesInstanceUID:
  //     '1.3.6.1.4.1.14519.5.2.1.7009.2403.367700692008930469189923116409',
  //   wadoRsRoot: 'https://domvja9iplmyu.cloudfront.net/dicomweb',
  // });

  // Instantiate a rendering engine
  renderingEngine = new RenderingEngine(renderingEngineId);

  // Create the viewports

  const viewportInputArray = [
    {
      viewportId: viewportId,
      type: ViewportType.VOLUME_3D,
      element: element1,
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
        background: [0.2, 0, 0.2],
      },
    },
  ];

  renderingEngine.setViewports(viewportInputArray);

  // Set the tool group on the viewports
  toolGroup.addViewport(viewportId, renderingEngineId);

  // Define a volume in memory
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  // Set the volume to load
  volume.load();

  setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]).then(
    () => {
      const volumeActor = renderingEngine
        .getViewport(viewportId)
        .getDefaultActor().actor;

      utilities.applyPreset(
        volumeActor,
        CONSTANTS.VIEWPORT_PRESETS.find((preset) => preset.name === 'CT-Bone')
      );

      viewport.render();
    }
  );

  const viewport = renderingEngine.getViewport(viewportId);
  renderingEngine.render();
}

run();
