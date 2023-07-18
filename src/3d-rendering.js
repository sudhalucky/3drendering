import {
  CONSTANTS,
  Enums,
  RenderingEngine,
  setVolumesForViewports,
  Types,
  utilities,
  volumeLoader,
  metaData,
} from "@cornerstonejs/core";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import * as cornerstoneTools from "@cornerstonejs/tools";
import removeInvalidTags from "../utils/demo/helpers/removeInvalidTags";
import {
  addDropdownToToolbar,
  createImageIdsAndCacheMetaData,
  initDemo,
  setTitleAndDescription,
} from "../utils/demo/helpers";
import {
  convertMultiframeImageIds,
  prefetchMetadataInformation,
} from "../utils/demo/helpers/convertMultiframeImageIds";

import { dicosMultiframeImageIds } from "../utils/demo/helpers/dicosMultiframeImageIds";

import TAG_DICT from "./dataDictionary";
import dicomParser from "dicom-parser";
import { vec3 } from "gl-matrix";
import dcmjs from "dcmjs";
import getPixelSpacingInformation from "../utils/demo/helpers/getPixelSpacingInformation";

const { DicomMetaDictionary } = dcmjs.data;
const { calibratedPixelSpacingMetadataProvider } = utilities;

// This is for debugging purposes
console.warn(
  "Click on index.ts to open source code for this example --------->"
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
const volumeName = "CT_VOLUME_ID"; // Id of the volume less loader prefix
//const volumeLoaderScheme = "cornerstoneDICOMImageLoader"; // Loader id which defines which volume loader to use
const volumeLoaderScheme = "cornerstoneStreamingImageVolume"; // Loader id which defines which volume loader to use
//const volumeLoaderScheme = "dicom"; // Loader id which defines which volume loader to use
const volumeId = `${volumeLoaderScheme}:${volumeName}`; // VolumeId with loader id + volume id
const renderingEngineId = "myRenderingEngine";
const viewportId = "3D_VIEWPORT";

// ======== Set up page ======== //
setTitleAndDescription(
  "3D Volume Rendering",
  "Here we demonstrate how to 3D render a HIF file."
);

const size = "500px";
const content = document.getElementById("content");
// Form
const form = document.createElement("form");
form.style.marginBottom = "20px";
const formInput = document.createElement("input");
formInput.id = "selectFile";
formInput.type = "file";
form.appendChild(formInput);
content.appendChild(form);

const viewportGrid = document.createElement("div");

viewportGrid.style.display = "flex";
viewportGrid.style.display = "flex";
viewportGrid.style.flexDirection = "row";

const element1 = document.createElement("div");
element1.oncontextmenu = () => false;

element1.style.width = size;
element1.style.height = size;

viewportGrid.appendChild(element1);

content.appendChild(viewportGrid);

// document
//   .getElementById('selectFile')
formInput.addEventListener("change", function (e) {
  // Add the file to the cornerstoneFileImageLoader and get unique
  // number for that file
  const file = e.target.files[0];
  const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
  // const imageId = cornerstoneDICOMImageLoader.wadors
  loadAndViewImage(imageId);
});

const instructions = document.createElement("p");
instructions.innerText = "Click the image to rotate it.";

content.append(instructions);

addDropdownToToolbar({
  options: {
    values: CONSTANTS.VIEWPORT_PRESETS.map((preset) => preset.name),
    defaultValue: "CT-Air",
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

  const toolGroupId = "TOOL_GROUP_ID";

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
  // const imageIds = await createImageIdsAndCacheMetaData({
  //   StudyInstanceUID:
  //     "1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339",
  //   SeriesInstanceUID:
  //     "1.3.6.1.4.1.14519.5.2.1.7009.2403.367700692008930469189923116409",
  //   wadoRsRoot: "https://domvja9iplmyu.cloudfront.net/dicomweb",
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
  // const volume = await volumeLoader.createAndCacheVolume(volumeId, {
  //   imageIds,
  // });

  // // Set the volume to load
  // volume.load();

  // setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]).then(
  //   () => {
  //     const volumeActor = renderingEngine
  //       .getViewport(viewportId)
  //       .getDefaultActor().actor;

  //     utilities.applyPreset(
  //       volumeActor,
  //       CONSTANTS.VIEWPORT_PRESETS.find((preset) => preset.name === "CT-Bone")
  //     );

  //     viewport.render();
  //   }
  // );

  // const viewport = renderingEngine.getViewport(viewportId);
  // renderingEngine.render();
}

function getTag(tag) {
  var group = tag.substring(1, 5);
  var element = tag.substring(5, 9);
  var tagIndex = ("(" + group + "," + element + ")").toUpperCase();
  var attr = TAG_DICT[tagIndex];
  return attr;
}

async function loadAndViewImage(imageId) {
  function dictObject(value) {
    return value;
  }
  const image = await cornerstoneDICOMImageLoader.wadouri.loadImage(imageId)
    .promise;
  // const mdata = cornerstoneDICOMImageLoader.wadouri.metaData.metaDataProvider("transferSyntax",imageId);
  // await prefetchMetadataInformation([imageId]);
  const imageIds = await dicosMultiframeImageIds(imageId);

  let instanceMetaData = image.data;

  // It was using JSON.parse(JSON.stringify(...)) before but it is 8x slower
  //instanceMetaData = removeInvalidTags(instanceMetaData);

  //  cornerstoneDICOMImageLoader.wadouri.metadata
  // cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
  //   imageId,
  //   instanceMetaData
  // );

  //const metadataDicom = new cornerstoneDICOMImageLoader.wadouri.metadata.metaDataProvider('multiframeModule',imageId);
  //  const imageIds = cornerstoneDICOMImageLoader.wadouri.dataSetCacheManager.get(imageId);

  // if (instanceMetaData) {
  //   // Add calibrated pixel spacing
  //   const metadata = DicomMetaDictionary.naturalizeDataset(instanceMetaData);
  //   const pixelSpacing = getPixelSpacingInformation(metadata);

  //   if (pixelSpacing) {
  //     calibratedPixelSpacingMetadataProvider.add(imageId, {
  //       rowPixelSpacing: parseFloat(pixelSpacing[0]),
  //       columnPixelSpacing: parseFloat(pixelSpacing[1]),
  //     });
  //   }
  // }

  /**********************************************************************************************************************/
  // const cacheInfo =
  //   cornerstoneDICOMImageLoader.wadouri.dataSetCacheManager.getInfo();

  var keys = {};
  for (var propertyName in TAG_DICT) {
    let { tag, name } = TAG_DICT[propertyName];
    keys[name] = "x" + tag.substring(1, 5) + tag.substring(6, 10);
  }

  //const imageDimensions = instanceMetaData.elements[keys["ImageDimensions"]];
  let dicosMetadata = {
    /** Number of bits allocated for each pixel sample. Each sample shall have the same number of bits allocated */
    BitsAllocated: instanceMetaData.uint16(keys["BitsAllocated"]),
    /** Number of bits stored for each pixel sample */
    BitsStored: instanceMetaData.uint16(keys["BitsStored"]),
    SamplesPerPixel: instanceMetaData.uint16(keys["SamplesPerPixel"]),
    /** Most significant bit for pixel sample data */
    HighBit: instanceMetaData.uint16(keys["HighBit"]),
    /** Specifies the intended interpretation of the pixel data */
    PhotometricInterpretation: instanceMetaData.string(
      keys["PhotometricInterpretation"]
    ),
    /** Data representation of the pixel samples. */
    PixelRepresentation: instanceMetaData.uint16(keys["PixelRepresentation"]),
    /** Image Modality */
    Modality: instanceMetaData.string(keys["Modality"]),
    /** SeriesInstanceUID of the volume */
    SeriesInstanceUID: instanceMetaData.string(keys["SeriesInstanceUID"]),
    /** The direction cosines of the first row and the first column with respect to the patient */
    ImageOrientationPatient: null, //instanceMetaData.elements[keys['SharedFunctionalGroupsSequence']].items[0].dataSet.elements[keys['PlaneOrientationSequence']].items[0].dataSet.elements[keys['ImageOrientationPatient']], //Array<number>;
    /** Physical distance in the patient between the center of each pixel */
    PixelSpacing: null, //instanceMetaData.elements[keys['SharedFunctionalGroupsSequence']].items[0].dataSet.elements[keys['PixelMeasuresSequence']].items[0].dataSet.elements[keys['PixelSpacing']], //Array<number>;
    ImagePositionPatient: null,
    SliceThickness: instanceMetaData.elements[
      keys["SharedFunctionalGroupsSequence"]
    ].items[0].dataSet.elements[
      keys["PixelMeasuresSequence"]
    ].items[0].dataSet.uint16(keys["SliceThickness"]), //Array<number>;
    /** Uniquely identifies the Frame of Reference for a Series */
    FrameOfReferenceUID: instanceMetaData.string(keys["FrameOfReferenceUID"]),
    /** Number of columns in the image. */
    Columns: instanceMetaData.uint16(keys["Columns"]),
    /** Number of rows in the image. */
    Rows: instanceMetaData.uint16(keys["Rows"]),
    NumberOfFrames: instanceMetaData.uint16(keys["NumberOfFrames"]),
    /** Window Level/Center for the image */
    voiLut: null, //Array<VOI>;
    /** VOILUTFunction for the image which is LINEAR or SAMPLED_SIGMOID */
    VOILUTFunction: "LINEAR", //string;
  };

  let intValues = [];
  let n =
    instanceMetaData.elements[keys["SharedFunctionalGroupsSequence"]].items[0]
      .dataSet.elements[keys["PlaneOrientationSequence"]].items[0].dataSet;
  for (let i = 0; i < n.numStringValues(keys["ImageOrientationPatient"]); i++) {
    intValues.push(n.intString(keys["ImageOrientationPatient"], i));
  }
  dicosMetadata.ImageOrientationPatient = intValues;

  let intValues1 = [];
  n =
    instanceMetaData.elements[keys["PerFrameFunctionalGroupsSequence"]].items[0]
      .dataSet.elements[keys["PlanePositionSequence"]].items[0].dataSet;
  for (let i = 0; i < n.numStringValues(keys["ImagePositionPatient"]); i++) {
    intValues1.push(n.intString(keys["ImagePositionPatient"], i));
  }
  dicosMetadata.ImagePositionPatient = intValues1;

  let floatValues = [];
  n =
    instanceMetaData.elements[keys["SharedFunctionalGroupsSequence"]].items[0]
      .dataSet.elements[keys["PixelMeasuresSequence"]].items[0].dataSet;
  for (let i = 0; i < n.numStringValues(keys["PixelSpacing"]); i++) {
    floatValues.push(n.floatString(keys["PixelSpacing"], i));
  }

  dicosMetadata.PixelSpacing = floatValues;

  calibratedPixelSpacingMetadataProvider.add(imageId, {
    rowPixelSpacing: parseFloat(dicosMetadata.PixelSpacing[0]),
    columnPixelSpacing: parseFloat(dicosMetadata.PixelSpacing[1]),
  });

  const rowCosineVec = vec3.fromValues(
    dicosMetadata.ImageOrientationPatient[0],
    dicosMetadata.ImageOrientationPatient[1],
    dicosMetadata.ImageOrientationPatient[2]
  );

  const colCosineVec = vec3.fromValues(
    dicosMetadata.ImageOrientationPatient[3],
    dicosMetadata.ImageOrientationPatient[4],
    dicosMetadata.ImageOrientationPatient[5]
  );

  const scanAxisNormal = vec3.create();

  vec3.cross(scanAxisNormal, rowCosineVec, colCosineVec);

  // Spacing goes [1] then [0], as [1] is column spacing (x) and [0] is row spacing (y)
  const spacing = [
    dicosMetadata.PixelSpacing[1],
    dicosMetadata.PixelSpacing[0],
    1,
  ]; //dicosMetadata.SliceThickness];
  const dimensions = [
    dicosMetadata.Columns,
    dicosMetadata.Rows,
    dicosMetadata.NumberOfFrames,
  ];
  const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal];

  //metaData.add(imageId, dicosMetadata);

  const localVolumeOptions = {
    scalarData: dicomParser.readEncapsulatedPixelData(
      instanceMetaData,
      instanceMetaData.elements.x7fe00010,
      0
    ),
    //    scalarData: image.data.byteArray,//image.data.byteArray, //image.getPixelData(),
    metadata: dicosMetadata,
    dimensions: dimensions,
    spacing: spacing,
    origin: [...dicosMetadata.ImagePositionPatient],
    direction: direction,
  };

  // const imageVolume = await volumeLoader.createLocalVolume(
  //   localVolumeOptions,
  //   volumeId
  // );

  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  // Set the volume to load
  // volume.load();

  // const viewport = renderingEngine.getViewport(viewportId);
  // viewport.setStack(imageIds).then(() => {
  //   // Set the VOI of the stack
  //   // viewport.setProperties({ voiRange: ctVoiRange });
  //   // Render the image
  //   viewport.render();

  //   const imageData = viewport.getImageData();

  //   const {
  //     pixelRepresentation,
  //     bitsAllocated,
  //     bitsStored,
  //     highBit,
  //     photometricInterpretation,
  //   } = metaData.get('imagePixelModule', imageId);

  //   const voiLutModule = metaData.get('voiLutModule', imageId);

  //   const sopCommonModule = metaData.get('sopCommonModule', imageId);
  //   const transferSyntax = metaData.get('transferSyntax', imageId);
  // });

  // imageIds.forEach((imageId) => {
  //   let instanceMetaData =
  //     cornerstoneDICOMImageLoader.wadors.metaDataManager.get(imageId);

  //   // It was using JSON.parse(JSON.stringify(...)) before but it is 8x slower
  //   instanceMetaData = removeInvalidTags(instanceMetaData);

  //   if (instanceMetaData) {
  //     // Add calibrated pixel spacing
  //     const metadata = DicomMetaDictionary.naturalizeDataset(instanceMetaData);
  //     const pixelSpacing = getPixelSpacingInformation(metadata);

  //     if (pixelSpacing) {
  //       calibratedPixelSpacingMetadataProvider.add(imageId, {
  //         rowPixelSpacing: parseFloat(pixelSpacing[0]),
  //         columnPixelSpacing: parseFloat(pixelSpacing[1]),
  //       });
  //     }
  //   }
  // });

  // // we don't want to add non-pet
  // // Note: for 99% of scanners SUV calculation is consistent bw slices
  // if (modality === 'PT') {
  //   const InstanceMetadataArray = [];
  //   imageIds.forEach((imageId) => {
  //     const instanceMetadata = getPTImageIdInstanceMetadata(imageId);

  //     // TODO: Temporary fix because static-wado is producing a string, not an array of values
  //     // (or maybe dcmjs isn't parsing it correctly?)
  //     // It's showing up like 'DECY\\ATTN\\SCAT\\DTIM\\RAN\\RADL\\DCAL\\SLSENS\\NORM'
  //     // but calculate-suv expects ['DECY', 'ATTN', ...]
  //     if (typeof instanceMetadata.CorrectedImage === 'string') {
  //       instanceMetadata.CorrectedImage =
  //         instanceMetadata.CorrectedImage.split('\\');
  //     }

  //     if (instanceMetadata) {
  //       InstanceMetadataArray.push(instanceMetadata);
  //     }
  //   });
  //   if (InstanceMetadataArray.length) {
  //     try {
  //       const suvScalingFactors = calculateSUVScalingFactors(
  //         InstanceMetadataArray
  //       );
  //       InstanceMetadataArray.forEach((instanceMetadata, index) => {
  //         ptScalingMetaDataProvider.addInstance(
  //           imageIds[index],
  //           suvScalingFactors[index]
  //         );
  //       });
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  // }

  // // Define a volume in memory
  // const volume = await volumeLoader.createAndCacheVolume(volumeId, {
  //   imageIds,
  // });

  // // Set the volume to load
  // volume.load();

  setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId]).then(
    () => {
      const volumeActor = renderingEngine
        .getViewport(viewportId)
        .getDefaultActor().actor;

      utilities.applyPreset(
        volumeActor,
        CONSTANTS.VIEWPORT_PRESETS.find((preset) => preset.name === "CT-Air")
      );

      viewport.render();
    }
  );
  const viewport = renderingEngine.getViewport(viewportId);
  renderingEngine.render();
}

run();
