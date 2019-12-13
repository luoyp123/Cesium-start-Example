var scratchOrthoPickingFrustum = new Cesium.OrthographicOffCenterFrustum();
var scratchOrthoOrigin = new Cesium.Cartesian3();
var scratchOrthoDirection = new Cesium.Cartesian3();
var scratchOrthoPixelSize = new Cesium.Cartesian2();
var scratchOrthoPickVolumeMatrix4 = new Cesium.Matrix4();

function getPickOrthographicCullingVolume(scene, drawingBufferPosition, width, height, viewport) {
    var camera = scene.camera;
    var frustum = camera.frustum;
    if (Cesium.defined(frustum._offCenterFrustum)) {
        frustum = frustum._offCenterFrustum;
    }

    var x = 2.0 * (drawingBufferPosition.x - viewport.x) / viewport.width - 1.0;
    x *= (frustum.right - frustum.left) * 0.5;
    var y = 2.0 * (viewport.height - drawingBufferPosition.y - viewport.y) / viewport.height - 1.0;
    y *= (frustum.top - frustum.bottom) * 0.5;

    var transform = Cesium.Matrix4.clone(camera.transform, scratchOrthoPickVolumeMatrix4);
    camera._setTransform(Cesium.Matrix4.IDENTITY);

    var origin = Cesium.Cartesian3.clone(camera.position, scratchOrthoOrigin);
    Cesium.Cartesian3.multiplyByScalar(camera.right, x, scratchOrthoDirection);
    Cesium.Cartesian3.add(scratchOrthoDirection, origin, origin);
    Cesium.Cartesian3.multiplyByScalar(camera.up, y, scratchOrthoDirection);
    Cesium.Cartesian3.add(scratchOrthoDirection, origin, origin);

    camera._setTransform(transform);

    if (scene.mode === Cesium.SceneMode.SCENE2D) {
        Cesium.Cartesian3.fromElements(origin.z, origin.x, origin.y, origin);
    }

    var pixelSize = frustum.getPixelDimensions(viewport.width, viewport.height, 1.0, 1.0, scratchOrthoPixelSize);

    var ortho = scratchOrthoPickingFrustum;
    ortho.right = pixelSize.x * 0.5;
    ortho.left = -ortho.right;
    ortho.top = pixelSize.y * 0.5;
    ortho.bottom = -ortho.top;
    ortho.near = frustum.near;
    ortho.far = frustum.far;

    return ortho.computeCullingVolume(origin, camera.directionWC, camera.upWC);
}

var scratchPerspPickingFrustum = new Cesium.PerspectiveOffCenterFrustum();
var scratchPerspPixelSize = new Cesium.Cartesian2();

function getPickPerspectiveCullingVolume(scene, drawingBufferPosition, width, height, viewport) {
    var camera = scene.camera;
    var frustum = camera.frustum;
    var near = frustum.near;

    var tanPhi = Math.tan(frustum.fovy * 0.5);
    var tanTheta = frustum.aspectRatio * tanPhi;

    var x = 2.0 * (drawingBufferPosition.x - viewport.x) / viewport.width - 1.0;
    var y = 2.0 * (viewport.height - drawingBufferPosition.y - viewport.y) / viewport.height - 1.0;

    var xDir = x * near * tanTheta;
    var yDir = y * near * tanPhi;

    var pixelSize = frustum.getPixelDimensions(viewport.width, viewport.height, 1.0, 1.0, scratchPerspPixelSize);
    var pickWidth = pixelSize.x * width * 0.5;
    var pickHeight = pixelSize.y * height * 0.5;

    var offCenter = scratchPerspPickingFrustum;
    offCenter.top = yDir + pickHeight;
    offCenter.bottom = yDir - pickHeight;
    offCenter.right = xDir + pickWidth;
    offCenter.left = xDir - pickWidth;
    offCenter.near = near;
    offCenter.far = frustum.far;

    return offCenter.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
}

function getPickCullingVolume(scene, drawingBufferPosition, width, height, viewport) {
    var frustum = scene.camera.frustum;
    if (frustum instanceof Cesium.OrthographicFrustum || frustum instanceof Cesium.OrthographicOffCenterFrustum) {
        return getPickOrthographicCullingVolume(scene, drawingBufferPosition, width, height, viewport);
    }

    return getPickPerspectiveCullingVolume(scene, drawingBufferPosition, width, height, viewport);
}
/**
 * https://github.com/AnalyticalGraphicsInc/cesium/blob/2c488cc62108cd982b9289b22dfd2bc63dd4b17d/Source/Scene/Picking.js#L226
 * @param {*} scene 
 * @param {*} drawingBufferPosition 
 */
function renderTranslucentDepthForPick(scene, drawingBufferPosition) {
    // PERFORMANCE_IDEA: render translucent only and merge with the previous frame
    var context = scene.context;
    var frameState = scene.frameState;
    var environmentState = scene.environmentState;

    var view = scene.defaultView;
    scene.view = view;

    var viewport = view.viewport;
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = context.drawingBufferWidth;
    viewport.height = context.drawingBufferHeight;

    var passState = view.passState;
    passState.viewport = Cesium.BoundingRectangle.clone(viewport, passState.viewport);

    scene.clearPasses(frameState.passes);
    frameState.passes.pick = true;
    frameState.passes.depth = true;
    frameState.cullingVolume = getPickCullingVolume(scene, drawingBufferPosition, 1, 1, viewport);
    frameState.tilesetPassState = pickTilesetPassState;

    scene.updateEnvironment();
    environmentState.renderTranslucentDepthForPick = true;
    passState = view.pickDepthFramebuffer.update(context, drawingBufferPosition, viewport);

    scene.updateAndExecuteCommands(passState, scratchColorZero);
    scene.resolveFramebuffers(passState);

    context.endFrame();
}

function getPickDepth(scene, index) {
    var pickDepths = scene.view.pickDepths;
    var pickDepth = pickDepths[index];
    if (!Cesium.defined(pickDepth)) {
        pickDepth = new Cesium.PickDepth();
        pickDepths[index] = pickDepth;
    }
    return pickDepth;
};

// var _pickPositionCacheDirty = false;
// var _pickPositionCache = {};
var scratchPosition = new Cesium.Cartesian2();
var scratchPerspectiveFrustum = new Cesium.PerspectiveFrustum();
var scratchPerspectiveOffCenterFrustum = new Cesium.PerspectiveOffCenterFrustum();
var scratchOrthographicFrustum = new Cesium.OrthographicFrustum();
var scratchOrthographicOffCenterFrustum = new Cesium.OrthographicOffCenterFrustum();
/**
 * Cesium.Picking#pickPositionWorldCoordinates
 * https://github.com/AnalyticalGraphicsInc/cesium/blob/2c488cc62108cd982b9289b22dfd2bc63dd4b17d/Source/Scene/Picking.js#L265
 * @param {*} scene 
 * @param {*} windowPosition 
 * @param {*} camera 
 * @param {*} result 
 */
function pickPositionWorldCoordinates(scene, windowPosition, cameraParam, result) {
    if (!scene.useDepthPicking) {
        return undefined;
    }
    if (!Cesium.defined(windowPosition)) {
        throw new DeveloperError('windowPosition is undefined.');
    }
    if (!scene.context.depthTexture) {
        throw new DeveloperError('Picking from the depth buffer is not supported. Check pickPositionSupported.');
    }

    // var cacheKey = windowPosition.toString();

    // if (_pickPositionCacheDirty){
    //     _pickPositionCache = {};
    //     _pickPositionCacheDirty = false;
    // } else 
    // if (_pickPositionCache.hasOwnProperty(cacheKey)) {
    //     return Cesium.Cartesian3.clone(_pickPositionCache[cacheKey], result);
    // }

    var frameState = scene.frameState;
    var context = scene.context;
    var uniformState = context.uniformState;

    var view = scene.defaultView;
    scene.view = view;

    var drawingBufferPosition = Cesium.SceneTransforms.transformWindowToDrawingBuffer(scene, windowPosition, scratchPosition);
    if (scene.pickTranslucentDepth) {
        renderTranslucentDepthForPick(scene, drawingBufferPosition);
    } else {
        scene.updateFrameState();
        uniformState.update(frameState);
        scene.updateEnvironment();
    }
    drawingBufferPosition.y = scene.drawingBufferHeight - drawingBufferPosition.y;

    var camera;
    if (Cesium.defined(cameraParam)) {
        camera = cameraParam;
    } else {
        camera = scene.camera;
    }

    // Create a working frustum from the original camera frustum.
    var frustum;
    if (Cesium.defined(camera.frustum.fov)) {
        frustum = camera.frustum.clone(scratchPerspectiveFrustum);
    } else if (Cesium.defined(camera.frustum.infiniteProjectionMatrix)) {
        frustum = camera.frustum.clone(scratchPerspectiveOffCenterFrustum);
    } else if (Cesium.defined(camera.frustum.width)) {
        frustum = camera.frustum.clone(scratchOrthographicFrustum);
    } else {
        frustum = camera.frustum.clone(scratchOrthographicOffCenterFrustum);
    }

    var frustumCommandsList = view.frustumCommandsList;
    var numFrustums = frustumCommandsList.length;
    for (var i = 0; i < numFrustums; ++i) {
        var pickDepth = getPickDepth(scene, i);
        var depth = pickDepth.getDepth(context, drawingBufferPosition.x, drawingBufferPosition.y);
        if (depth > 0.0 && depth < 1.0) {
            var renderedFrustum = frustumCommandsList[i];
            var height2D;
            if (scene.mode === Cesium.SceneMode.SCENE2D) {
                height2D = camera.position.z;
                camera.position.z = height2D - renderedFrustum.near + 1.0;
                frustum.far = Math.max(1.0, renderedFrustum.far - renderedFrustum.near);
                frustum.near = 1.0;
                uniformState.update(frameState);
                uniformState.updateFrustum(frustum);
            } else {
                frustum.near = renderedFrustum.near * (i !== 0 ? scene.opaqueFrustumNearOffset : 1.0);
                frustum.far = renderedFrustum.far;
                uniformState.updateFrustum(frustum);
            }

            result = Cesium.SceneTransforms.drawingBufferToWgs84Coordinates(scene, drawingBufferPosition, depth, result);

            if (scene.mode === Cesium.SceneMode.SCENE2D) {
                camera.position.z = height2D;
                uniformState.update(frameState);
            }

            // _pickPositionCache[cacheKey] = Cesium.Cartesian3.clone(result);
            return result;
        }
    }
    // this._pickPositionCache[cacheKey] = undefined;
    return undefined;
}

var scratchPickPositionCartographic = new Cesium.Cartographic();
/**
 * Cesium.Picking#pickPosition
 * https://github.com/AnalyticalGraphicsInc/cesium/blob/2c488cc62108cd982b9289b22dfd2bc63dd4b17d/Source/Scene/Picking.js#L358
 * @param {*} scene 
 * @param {*} windowPosition 
 * @param {*} camera 
 * @param {*} result 
 */
function pickPosition(scene, windowPosition, camera, result) {
    result = pickPositionWorldCoordinates(scene, windowPosition, camera, result);
    if (Cesium.defined(result) && scene.mode !== Cesium.SceneMode.SCENE3D) {
        Cesium.Cartesian3.fromElements(result.y, result.z, result.x, result);

        var projection = scene.mapProjection;
        var ellipsoid = projection.ellipsoid;

        var cart = projection.unproject(result, scratchPickPositionCartographic);
        ellipsoid.cartographicToCartesian(cart, result);
    }

    return result;
}


///////////////////////////////////////////////

