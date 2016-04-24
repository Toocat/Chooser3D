/* 
 * @author ecivic / https://github.com/Toocat
 */

/* global THREE, Detector */

(function () {
    
    THREE.Chooser3D = function (canvasId) {

        THREE.Object3D.call(this);
        this.name = 'chooser3d_' + this.id;

        this.container = document.getElementById(canvasId);

        this.scene = new THREE.Scene();
        this.leftSelector = new Arrow(Side.LEFT);
        this.rightSelector = new Arrow(Side.RIGHT);
        this.selectorObjects = new SelectorObjects();
        
        this.useSoftwareRenderer = false;
        
        return this;
    };

    THREE.Chooser3D.prototype = Object.create(THREE.Object3D.prototype);
    
    THREE.Chooser3D.prototype.setLeftSelector = function (leftSelector) {
        leftSelector.setSide(Side.LEFT);
        this.leftSelector = leftSelector;
        return this;
    };
    
    THREE.Chooser3D.prototype.setRightSelector = function (rightSelector) {
        rightSelector.setSide(Side.RIGHT);
        this.rightSelector = rightSelector;
        return this;
    };
    
    THREE.Chooser3D.prototype.softwareRendering = function () {
        this.useSoftwareRenderer = true;
        return this;
    };
    
    THREE.Chooser3D.prototype.addIconObject = function (imgUrl, ident, width, height) {
        this.selectorObjects.add(new IconObject(imgUrl, ident, width, height));
        return this;
    };
    
    THREE.Chooser3D.prototype.addJSONObject = function (modelUrl, ident, scale, rotation) {
        this.selectorObjects.add(new JSONObject(modelUrl, ident, scale, rotation));
        return this;
    };
    
    THREE.Chooser3D.prototype.setEventHandler = function (eventHandler) {
        this.selectorObjects.setEventHandler(eventHandler);
        return this;
    };
    
    THREE.Chooser3D.prototype.setArrowColor = function (arrowColor) {
        this.leftSelector.setColor(arrowColor);
        this.rightSelector.setColor(arrowColor);
        return this;
    };
    
    THREE.Chooser3D.prototype.slow = function () {
        this.selectorObjects.setSpeed(1);
        return this;
    };
    
    THREE.Chooser3D.prototype.normal = function () {
        this.selectorObjects.setSpeed(2);
        return this;
    };
    
    THREE.Chooser3D.prototype.fast = function () {
        this.selectorObjects.setSpeed(4);
        return this;
    };
    
    THREE.Chooser3D.prototype.veryFast = function () {
        this.selectorObjects.setSpeed(5);
        return this;
    };

    THREE.Chooser3D.prototype.paint = function (scene, camera) {
        if (this.selectorObjects.getObjectsCount() < 6) {
            throw '6 or more objects are required for Chooser3D.';
        }
        
        var paintTo = !scene ? this.setup() : scene;
        
        /** RAYCASTER SETUP **/
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.camera = !camera ? this.camera : camera;
        /** **/
        
        this.selectorObjects.paint(this);
        this.leftSelector.paint(this);
        this.rightSelector.paint(this);
        paintTo.add(this);
        
        this.container.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        this.container.addEventListener('click', this.onDocumentMouseClick.bind(this), false);
        this.container.addEventListener('dblclick', function(e) { e.preventDefault(); e.stopPropagation(); }, false);
        this.container.addEventListener('mousedown', function(e) { e.preventDefault(); e.stopPropagation(); }, false);
        this.container.addEventListener('mouseup', function(e) { e.preventDefault(); e.stopPropagation(); }, false);
        
        return this;
    };
    
    THREE.Chooser3D.prototype.onDocumentMouseMove = function(event) {
        event.stopPropagation();
        event.preventDefault();

        var element = this.container;
        this.mouse.x = ((event.clientX - element.offsetLeft + window.scrollX) / element.offsetWidth) * 2 - 1;
        this.mouse.y = - ((event.clientY - element.offsetTop + window.scrollY) / element.offsetHeight) * 2 + 1;
        
        this.handleMouseMove();
    };
    
    THREE.Chooser3D.prototype.onDocumentMouseClick = function(event) {
        event.stopPropagation();
        event.preventDefault();

        var element = this.container;
        this.mouse.x = ((event.clientX - element.offsetLeft + window.scrollX) / element.offsetWidth) * 2 - 1;
        this.mouse.y = - ((event.clientY - element.offsetTop + window.scrollY) / element.offsetHeight) * 2 + 1;
        
        this.handleMouseClick();
    };
    
    THREE.Chooser3D.prototype.handleMouseMove = function () {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        var objArray = new Array();
        objArray.push.apply(objArray, this.leftSelector.getChildren());
        objArray.push.apply(objArray, this.rightSelector.getChildren());
        
        var intersects = this.raycaster.intersectObjects(objArray);
        
        if (intersects.length > 0) {
            intersects[0].object.container.mouseOver();
            this.container.style.cursor = "pointer";
        } else {
            this.container.style.cursor = "default";
            this.leftSelector.mouseOut();
            this.rightSelector.mouseOut();
        }
    };
    
    THREE.Chooser3D.prototype.handleMouseClick = function () {
        if (!this.selectorObjects.allObjectsLoaded()) {
            console.log("[INFO] Component is still loading.");
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        var objArray = new Array();
        objArray.push.apply(objArray, this.leftSelector.getChildren());
        objArray.push.apply(objArray, this.rightSelector.getChildren());
        
        var intersects = this.raycaster.intersectObjects(objArray);
        
        if (intersects.length > 0) {
            var _side = intersects[0].object.container.mouseClick();
            switch (_side) {
                case Side.LEFT: {
                        this.selectorObjects.shiftLeft();
                        break;
                }
                case Side.RIGHT: {
                        this.selectorObjects.shiftRight();
                        break;
                }
                default: {
                        console.log("[INFO] Previous animation still going on.");
                }
            }
        }
    };
    
    THREE.Chooser3D.prototype.setup = function () {
        if (Detector.webgl && !this.useSoftwareRenderer) {
            this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        } else {
            this.renderer = new THREE.SoftwareRenderer({alpha: true});
        }
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.renderer.domElement.parentNode.offsetWidth, this.renderer.domElement.parentNode.offsetHeight);
        
        var VIEW_ANGLE = 45;
        var ASPECT = this.renderer.domElement.parentNode.offsetWidth / this.renderer.domElement.parentNode.offsetHeight;
        var NEAR = 0.1;
        var FAR = 5000;
        
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.camera.position.z = 750;
        
        this.light = !this.light ? new THREE.DirectionalLight(0xffffff, 2.5) : this.light;
        this.light.position.set(0, 0, 750);
        this.scene.add(this.light);
    
        this.animate();
        
        return this.scene;
    };
    
    THREE.Chooser3D.prototype.setLight = function (color, intensity) {
        this.scene.remove(this.light);
        this.light = new THREE.DirectionalLight(color, intensity);
        this.scene.add(this.light);
        
        return this;
    };
    
    THREE.Chooser3D.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    
    THREE.Chooser3D.prototype.animate = function (singleCall) {
        this.leftSelector.animate();
        this.rightSelector.animate();
        this.selectorObjects.animate();
        
        if (singleCall) {
            return;
        }
        
        this.render();
        
        requestAnimationFrame(this.animate.bind(this, singleCall), this.renderer.domElement);
    };
    
    var ShiftDirection = {
        LEFT: -1,
        NONE: 0,
        RIGHT: 1
    };
    var SelectorObjects = function() {
        var _self = this;
        var _objects = [];
        var _shiftDirection = ShiftDirection.NONE;
        var _shiftCounter = 0;
        
        var _speed = 1;
        var _eventHandler;
        
        this.allObjectsLoaded = function() {
            var numOfObjects = _objects.length;
            for (var i = 0; i < numOfObjects; i++) {
                var object = _objects[i];
                if (!object.isLoaded()) {
                    return false;
                }
            }
            
            return true;
        };
        
        this.setSpeed = function(speed) {
            _speed = speed;
        };
        
        this.setEventHandler = function(eventHandler) {
            _eventHandler = eventHandler;
        };
        
        this.add = function(object) {
            _objects.push(object);
            return _self;
        };
        
        this.getObjectsCount = function() {
            return _objects.length;
        };
        
        this.animate = function () {
            if (_shiftDirection === ShiftDirection.NONE) {
                return;
            }
            
            _shiftCounter++;
            
            for (var i = 0; i < _objects.length; i++) {
                var object = _objects[i];
                var mesh = object.getMesh();
                switch (_shiftDirection) {
                    case ShiftDirection.LEFT: {
                        object.getMesh().position.x -= 1 * _speed;
                        switch (object.getIndex()) {
                            case 0: {
                                    if (object.getOpacity() > 0) {
                                        object.addOpacity(-0.05 * _speed);
                                    }
                                    if (object.getOpacity() < 0) {
                                        object.setOpacity(0);
                                    }
                                    mesh.position.z -= 1 * _speed;
                                    break;
                            }
                            case 1:
                            case 2: {
                                    mesh.position.z -= 1 * _speed;
                                    break;
                            }
                            case 3:
                            case 4: {
                                    mesh.position.z += 1 * _speed;
                                    break;
                            }
                            case 5: {
                                    if (object.getOpacity() < 1) {
                                        object.addOpacity(0.02 * _speed);
                                    }
                                    if (object.getOpacity() > 1) {
                                        object.setOpacity(1);
                                    }
                                    
                                    if (mesh.position.x < 0) {
                                        mesh.position.x = 300;
                                        mesh.position.z = 0;
                                    }
                                    mesh.position.z += 1 * _speed;
                                    break;
                            }
                            default: {
                                    object.setOpacity(0);
                                    mesh.position.z = 0;
                            }
                        }
                        break;
                    }
                    case ShiftDirection.RIGHT: {
                        mesh.position.x += 1 * _speed;
                        switch (object.getIndex()) {
                            case 0:
                            case 1: {
                                    mesh.position.z += 1 * _speed;
                                    break;
                            }
                            case 2:
                            case 3: {
                                    mesh.position.z -= 1 * _speed;
                                    break;
                            }
                            case 4: {
                                    if (object.getOpacity() > 0) {
                                        object.addOpacity(-0.05 * _speed);
                                    }
                                    if (object.getOpacity() < 0) {
                                        object.setOpacity(0);
                                    }
                                    mesh.position.z -= 1 * _speed;
                                    break;
                            }
                            case _objects.length - 1: {
                                    if (object.getOpacity() < 1) {
                                        object.addOpacity(0.02 * _speed);
                                    }
                                    if (object.getOpacity() > 1) {
                                        object.setOpacity(1);
                                    }
                                    if (mesh.position.x > 0) {
                                        mesh.position.x = -300;
                                        mesh.position.z = 0;
                                    }
                                    mesh.position.z += 1 * _speed;
                                    break;
                            }
                            default: {
                                    object.setOpacity(0);
                                    mesh.position.z = 0;
                            }
                        }
                    }
                }
            }
            
            if (_shiftCounter === 100 / _speed) {
                _shiftCounter = 0;
                _self.updateIndexes(_shiftDirection);
                _shiftDirection = ShiftDirection.NONE;
            }
        };
        
        this.updateIndexes = function(shiftDirection) {
            for (var i = 0; i < _objects.length; i++) {
                var object = _objects[i];
                switch (shiftDirection) {
                    case ShiftDirection.LEFT: {
                            var index = object.getIndex();
                            index--;
                            if (index < 0) {
                                index = _objects.length - 1;
                            }
                            object.setIndex(index);
                            
                            if (index === 2 && _eventHandler) {
                                _eventHandler(object);
                            }
                            
                            if (index > 4) {
                                object.setOpacity(0);
                            }
                            break;
                    }
                    case ShiftDirection.RIGHT: {
                            var index = object.getIndex();
                            index++;
                            if (index === _objects.length) {
                                index = 0;
                            }
                            object.setIndex(index);
                            
                            if (index === 2 && _eventHandler) {
                                _eventHandler(object);
                            }
                            
                            if (index > 4) {
                                object.setOpacity(0);
                            }
                    }
                }
            }
        };
        
        function paintObject(object, scene, i, index) {
            if (!object.isLoaded()) {
                window.setTimeout(function() {
                    paintObject(object, scene, i, index);
                }, 200);
                return;
            }
            object.paint(scene);
            object.getMesh().position.x = i * 100;
            object.getMesh().position.z = 300 - (Math.abs(i > 2 ? 3 : i) * 100);
            object.setIndex(index);

            if (index > 4) {
                object.setOpacity(0);
            }
        }
        
        this.paint = function(scene) {
            for (var i = -2; i < _objects.length -2; i++) {
                var index = i + 2;
                var object = _objects[index];
                paintObject(object, scene, i, index);
            }
        };
        
        this.shiftLeft = function() {
            if (_shiftDirection !== ShiftDirection.NONE) {
                return;
            }
            
            _shiftDirection = ShiftDirection.LEFT;
        };
        
        this.shiftRight = function() {
            if (_shiftDirection !== ShiftDirection.NONE) {
                return;
            }
            
            _shiftDirection = ShiftDirection.RIGHT;
        };
    };
    
    var JSONObject = function(modelUrl, ident, scale, rotation) {
        var _modelUrl = modelUrl;
        var _ident = ident;
        var _scale = scale;
        var _rotation = !rotation ? {x:0, y:0, z:0} : rotation;
        
        var _index;
        var _mesh;
        
        var _loaded = false;
        
        var loader = new THREE.ObjectLoader();
            loader.load(_modelUrl, function(object) {
                clear(object);
                _mesh = object;
                _mesh.scale.multiplyScalar(_scale);
                _mesh.rotation.x = !_rotation.x ? 0 : _rotation.x;
                _mesh.rotation.y = !_rotation.y ? 0 : _rotation.y;
                _mesh.rotation.z = !_rotation.z ? 0 : _rotation.z;
                
                _loaded = true;
            });
            
        this.isLoaded = function() {
            return _loaded;
        };
            
        function clear(parentGroup) {
            var childrenLength = parentGroup.children.length;
            for (var i = childrenLength - 1; i >= 0; i--) {
                var child = parentGroup.children[i];
                if (child instanceof THREE.Scene
                        || child instanceof THREE.Object3D) {
                    clear(child);
                }
                if (!(child instanceof THREE.Mesh)) {
                    parentGroup.remove(child);
                } else {
                    child.material.transparent = true;
                }
            }
        }    
        
        this.getIdent = function() {
            return _ident;
        };
        
        this.setIndex = function(index) {
            _index = index;
        };
        
        this.getIndex = function() {
            return _index;
        };
        
        this.paint = function(scene) {
            scene.add(_mesh);
        };
        
        this.getMesh = function() {
            return _mesh;
        };
        
        this.addOpacity = function(opacity) {
            if (_mesh instanceof THREE.Mesh) {
                _mesh.material.opacity += opacity;
            } else if (_mesh instanceof THREE.Scene) {
                var childrenLenght = _mesh.children.length;
                for (var i = childrenLenght-1; i >= 0; i--) {
                    var child = _mesh.children[i];
                    if (child instanceof THREE.Mesh) {
                        child.material.opacity += opacity;
                    } else if (child instanceof THREE.Object3D) {
                        addOpacityForChildren(child, opacity);
                    }
                }
            }
        };
        
        function addOpacityForChildren(parent, opacity) {
            var childrenLenght = parent.children.length;
            for (var i = childrenLenght - 1; i >= 0; i--) {
                var child = parent.children[i];
                if (child instanceof THREE.Mesh) {
                    child.material.opacity += opacity;
                } else if (child instanceof THREE.Object3D) {
                    setOpacityForChildren(child, opacity);
                }
            }
        }
        
        function setOpacityForChildren(parent, newOpacity) {
            var childrenLenght = parent.children.length;
            for (var i = childrenLenght - 1; i >= 0; i--) {
                var child = parent.children[i];
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = newOpacity;
                } else if (child instanceof THREE.Object3D) {
                    setOpacityForChildren(child, newOpacity);
                }
            }
        }
        
        this.setOpacity = function(newOpacity) {
            if (_mesh instanceof THREE.Mesh) {
                _mesh.material.opacity = newOpacity;
            } else if (_mesh instanceof THREE.Scene) {
                setOpacityForChildren(_mesh, newOpacity);
            }
        };
        
        this.getOpacity = function() {
            if (_mesh instanceof THREE.Mesh) {
                return _mesh.material.opacity;
            } else if (_mesh instanceof THREE.Scene) {
                var childrenLenght = _mesh.children.length;
                for (var i = childrenLenght - 1; i >= 0; i--) {
                    var child = _mesh.children[i];
                    if (child instanceof THREE.Mesh) {
                        return child.material.opacity;
                    }
                }
            }
        };
    };
    
    var IconObject = function(imgUrl, ident, width, height) {
        var _imgUrl = imgUrl;
        var _ident = !ident ? _imgUrl : ident;
        var _width = !width ? 60 : width;
        var _height = !height ? 60 : height;
        
        var _mesh;
        var _index;
        
        var _loader = new THREE.TextureLoader();
        
        this.isLoaded = function() {
            return true;
        };
        
        this.getIdent = function() {
            return _ident;
        };
        
        this.setIndex = function(index) {
            _index = index;
        };
        
        this.getIndex = function() {
            return _index;
        };
        
        this.paint = function(scene) {
            var image = _loader.load(imgUrl);
            
            var material = new THREE.MeshBasicMaterial({
                    map: image,
                    transparent: true,
                    opacity: 1
                });

            var geometry = new THREE.PlaneGeometry(_width, _height);
            _mesh = new THREE.Mesh(geometry, material);

            scene.add(_mesh);
        };
        
        this.getMesh = function() {
            return _mesh;
        };
        
        this.addOpacity = function(opacity){
            _mesh.material.opacity += opacity;
        };
        
        this.setOpacity = function(newOpacity){
            _mesh.material.opacity = newOpacity;
        };
        
        this.getOpacity = function(){
            return _mesh.material.opacity;
        };
    };

    var Side = {
        LEFT: -1,
        NONE: 0,
        RIGHT: 1
    };
    var AnimationDirection = {
        LEFT: -1,
        RIGHT: 1
    };
    var Arrow = function(side) {
        var _self = this;
        
        var _color = 0x1A5B80;
        var _mesh;
        var _group;
        var _side = side;
        var _animationDirection;
        var _mouseOver = false;
        var _initialized = false;
        
        this.setSide = function(side) {
            _side = side;
        };
        
        this.mouseOver = function() {
            if (!_mouseOver) {
                _animationDirection = AnimationDirection.RIGHT;
            }
            
            _initialized = true;
            _mouseOver = true;
        };
        
        this.mouseOut = function() {
            _mouseOver = false;
        };
        
        this.mouseClick = function() {
            var opacity = _mesh.material.opacity;
            if (opacity === 0.75) {
                _mesh.material.opacity = 0.2;
            } else {
                return Side.NONE;
            }
            
            return _side;
        };
        
        this.animate = function() {
            if (!_mesh || !_initialized) {
                return;
            }
            
            var opacity = _mesh.material.opacity;
            if (opacity < 0.75) {
                _mesh.material.opacity += 0.025;
            }
            if (opacity >= 0.75) {
                _mesh.material.opacity = 0.75;
            }
            
            if (!_mouseOver) {
                switch (side) {
                    case Side.LEFT: {
                            if (_mesh.rotation.y > Math.PI / 32) {
                                _mesh.rotation.y -= Math.PI / 800;
                            }
                            if (_mesh.rotation.y < Math.PI / 32) {
                                _mesh.rotation.y += Math.PI / 1600;
                            }
                            break;
                    }
                    case Side.RIGHT: {
                            if (_mesh.rotation.y > -Math.PI / 32) {
                                _mesh.rotation.y -= Math.PI / 800;
                            }
                            if (_mesh.rotation.y < -Math.PI / 32) {
                                _mesh.rotation.y += Math.PI / 1600;
                            }
                    }
                }
                return;
            }
            
            _mesh.rotation.y += _side * _animationDirection * Math.PI / 800;
            
            switch (side) {
                case Side.LEFT: {
                        if (_mesh.rotation.y > Math.PI / 32) {
                            _animationDirection = AnimationDirection.RIGHT;
                        }
                        if (_mesh.rotation.y < -Math.PI / 32) {
                            _animationDirection = AnimationDirection.LEFT;
                        }
                        break;
                }
                case Side.RIGHT: {
                        if (_mesh.rotation.y > Math.PI / 32) {
                            _animationDirection = AnimationDirection.LEFT;
                        }
                        if (_mesh.rotation.y < -Math.PI / 32) {
                            _animationDirection = AnimationDirection.RIGHT;
                        }
                }
            }
        };
        
        this.setColor = function(arrowColor) {
            _color = arrowColor;
        };

        this.paint = function(paintTo) {
            _group = new THREE.Object3D();
            
            var texture = new THREE.MeshPhongMaterial({
                color: _color,
                side: THREE.FrontSide,
                transparent: true,
                opacity: 0.75
            });
            
            //var geometry = new THREE.TetrahedronGeometry(30, 0);
            var geometry = new THREE.CylinderGeometry(0, 25, 45, 4, 4);
            _mesh = new THREE.Mesh(geometry, texture);
            _mesh.rotation.y = _side === Side.LEFT ? Math.PI / 32 : -Math.PI / 32;
            _mesh.rotation.z = _side === Side.LEFT ? Math.PI / 2 : -Math.PI / 2;
            _mesh.container = _self;
            
            _group.add(_mesh);
            _group.position.x = _side === Side.LEFT ? -380 : 380;
            
            paintTo.add(_group);
        };
        
        this.getChildren = function() {
            var objArray = new Array();
            objArray.push.apply(objArray, _group.children);
            return objArray;
        };
    };

})();

