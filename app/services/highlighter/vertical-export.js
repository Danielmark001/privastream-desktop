var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getVideoResolution } from './cut-highlight-clips';
import { isAiClip } from './models/highlighter.models';
export function addVerticalFilterToExportOptions(clips, renderingClips, exportOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clips || clips.length === 0) {
            throw new Error('No clips provided');
        }
        const originalResolution = yield getVideoResolution(renderingClips[0].sourcePath);
        if (!originalResolution) {
            throw new Error('Could not get video resolution');
        }
        const webcamCoordinates = getWebcamPosition(clips, renderingClips);
        const newResolution = {
            width: exportOptions.height,
            height: exportOptions.width,
        };
        exportOptions.complexFilter = getWebcamComplexFilterForFfmpeg(webcamCoordinates, newResolution, originalResolution);
    });
}
function getWebcamPosition(clips, renderingClips) {
    var _a, _b;
    const clipWithWebcam = clips.find(clip => {
        var _a, _b;
        return isAiClip(clip) &&
            !!((_b = (_a = clip === null || clip === void 0 ? void 0 : clip.aiInfo) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.webcam_coordinates) &&
            renderingClips.find(renderingClips => renderingClips.sourcePath === clip.path);
    });
    return ((_b = (_a = clipWithWebcam === null || clipWithWebcam === void 0 ? void 0 : clipWithWebcam.aiInfo) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.webcam_coordinates) || undefined;
}
function getWebcamComplexFilterForFfmpeg(webcamCoordinates, outputResolution, originalResolution) {
    if (!webcamCoordinates) {
        return `
      [0:v]crop=ih*${outputResolution.width}/${outputResolution.height}:ih,scale=${outputResolution.width}:-1:force_original_aspect_ratio=increase[final];
      `;
    }
    const scaleFactor = Math.max(outputResolution.width, outputResolution.height) /
        Math.max(originalResolution.width, originalResolution.height);
    const webcamTopX = Math.round((webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.x1) * scaleFactor);
    const webcamTopY = Math.round((webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.y1) * scaleFactor);
    const webcamWidth = Math.round(((webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.x2) - (webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.x1)) * scaleFactor);
    const webcamHeight = Math.round(((webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.y2) - (webcamCoordinates === null || webcamCoordinates === void 0 ? void 0 : webcamCoordinates.y1)) * scaleFactor);
    const oneThirdHeight = outputResolution.height / 3;
    const twoThirdsHeight = (outputResolution.height * 2) / 3;
    console.log({
        outputResolution: `${outputResolution.width}x${outputResolution.height}`,
        originalResolution: `${originalResolution.width}x${originalResolution.height}`,
        webcamPosition: { x1: webcamTopX, y1: webcamTopY, width: webcamWidth, height: webcamHeight },
        scaleFactor,
        oneThirdHeight,
        twoThirdsHeight,
    });
    return `
    [0:v]split=3[webcam][vid][blur_source];
    color=c=black:s=${outputResolution.width}x${outputResolution.height}:d=1[base];
    [webcam]crop=w=${webcamWidth}:h=${webcamHeight}:x=${webcamTopX}:y=${webcamTopY},scale=-1:${oneThirdHeight}[webcam_final];
    [vid]crop=ih*${outputResolution.width}/${twoThirdsHeight}:ih,scale=${outputResolution.width}:${twoThirdsHeight}[vid_cropped];
    [blur_source]crop=ih*${outputResolution.width}/${twoThirdsHeight}:ih,scale=${outputResolution.width}:${oneThirdHeight},gblur=sigma=50[blur];
    [base][blur]overlay=x=0:y=0[blur_base];
    [blur_base][webcam_final]overlay='(${outputResolution.width}-overlay_w)/2:(${oneThirdHeight}-overlay_h)/2'[base_webcam];
    [base_webcam][vid_cropped]overlay=x=0:y=${oneThirdHeight}[final];
    `;
}
//# sourceMappingURL=vertical-export.js.map