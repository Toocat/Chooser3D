/** @namespace */
var THREEx = THREEx || {};

/**
 * Update renderer and camera when the window is resized
 * 
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
 */
THREEx.WindowResize = function (renderer, camera) {
    var callback = function () {

        renderer.setSize(window.innerWidth, window.innerHeight);

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };


    window.addEventListener('resize', callback, false);

    return {
        /**
         * Stop watching window resize
         */
        stop: function () {
            window.removeEventListener('resize', callback);
        }
    };
};



