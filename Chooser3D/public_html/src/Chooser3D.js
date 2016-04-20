/* 
 * @author ecivic / https://github.com/Toocat
 */

/* global THREE, Detector */

(function () {
    
    THREE.Chooser3D = function (canvasId, renderer, camera) {

        THREE.Object3D.call(this);
        this.name = 'chooser3d_' + this.id;

        this.container = document.getElementById(canvasId);   
        this.renderer = renderer;
        this.camera = camera;

        this.scene = new THREE.Scene();
        this.leftSelector = new Arrow(Side.LEFT);
        this.rightSelector = new Arrow(Side.RIGHT);
        this.selectorObjects = new SelectorObjects();
        
        return this;
    };

    THREE.Chooser3D.prototype = Object.create(THREE.Object3D.prototype);
    
    THREE.Chooser3D.prototype.addIconObject = function (imgUrl, ident) {
        this.selectorObjects.add(new IconObject(imgUrl, ident));
        return this;
    };
    
    THREE.Chooser3D.prototype.eventHandler = function (eventHandler) {
        this.selectorObjects.setEventHandler(eventHandler);
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

    THREE.Chooser3D.prototype.paint = function (scene) {
        if (this.selectorObjects.getObjectsCount() < 6) {
            throw '6 or more objects are required for Chooser3D.';
        }
        
        var paintTo = !scene ? this.setup() : scene;
        this.leftSelector.paint(this);
        this.rightSelector.paint(this);
        
        /** RAYCASTER SETUP **/
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        /** **/
        
        this.selectorObjects.paint(this);
        paintTo.add(this);
        
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        document.addEventListener('click', this.onDocumentMouseClick.bind(this), false);
        
        return this;
    };
    
    THREE.Chooser3D.prototype.onDocumentMouseMove = function(event) {
        event.preventDefault();

        var element = this.renderer.domElement.parentNode;
        this.mouse.x = ((event.clientX - element.offsetLeft + window.scrollX) / element.offsetWidth) * 2 - 1;
        this.mouse.y = - ((event.clientY - element.offsetTop + window.scrollY) / element.offsetHeight) * 2 + 1;
        
        this.handleMouseMove();
    };
    
    THREE.Chooser3D.prototype.onDocumentMouseClick = function(event) {
        event.preventDefault();

        var element = this.renderer.domElement.parentNode;
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
                }
            }
        }
    };
    
    THREE.Chooser3D.prototype.setup = function () {
        if (false /*Detector.webgl*/) {
            this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        } else {
            this.renderer = new THREE.SoftwareRenderer({alpha: true});
            this.renderer.setClearColor(0x000000, 0);
        }
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.renderer.domElement.parentNode.offsetWidth, this.renderer.domElement.parentNode.offsetHeight);
        
        var VIEW_ANGLE = 45;
        var ASPECT = this.renderer.domElement.parentNode.offsetWidth / this.renderer.domElement.parentNode.offsetHeight;
        var NEAR = 0.1;
        var FAR = 5000;
        
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.camera.position.z = 750;
        
        this.light = new THREE.DirectionalLight(0xD1E8E7, 2.5, 1000);
        this.light.position.set(0, 0, 750);
        this.scene.add(this.light);
    
        this.animate();
        
        return this.scene;
    };
    
    THREE.Chooser3D.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    
    THREE.Chooser3D.prototype.animate = function (singleCall) {
        this.leftSelector.animate();
        this.rightSelector.animate();
        this.selectorObjects.animate();
        
        this.render();
        
        if (singleCall) {
            return;
        }
        
        requestAnimationFrame(this.animate.bind(this, singleCall), this.renderer.domElement);
    };
    
    var ShiftDirection = {
        LEFT: -1,
        NONE: 0,
        RIGHT: 1
    };
    var SelectorObjects = function() {
        var self = this;
        var objects = [];
        var shiftDirection = ShiftDirection.NONE;
        var shiftCounter = 0;
        
        var speed = 1;
        var eventHandler;
        
        this.setSpeed = function(_speed) {
            speed = _speed;
        };
        
        this.setEventHandler = function(_eventHandler) {
            eventHandler = _eventHandler;
        };
        
        this.add = function(object) {
            objects.push(object);
            return self;
        };
        
        this.getObjectsCount = function() {
            return objects.length;
        };
        
        this.animate = function () {
            if (shiftDirection === ShiftDirection.NONE) {
                return;
            }
            
            shiftCounter++;
            
            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                var mesh = object.getMesh();
                switch (shiftDirection) {
                    case ShiftDirection.LEFT: {
                        object.getMesh().position.x -= 1 * speed;
                        switch (object.getIndex()) {
                            case 0: {
                                    if (mesh.material.opacity > 0) {
                                        mesh.material.opacity -= 0.05 * speed;
                                    }
                                    if (mesh.material.opacity < 0) {
                                        mesh.material.opacity = 0;
                                    }
                                    mesh.position.z -= 1 * speed;
                                    break;
                            }
                            case 1:
                            case 2: {
                                    mesh.position.z -= 1 * speed;
                                    break;
                            }
                            case 3:
                            case 4: {
                                    mesh.position.z += 1 * speed;
                                    break;
                            }
                            case 5: {
                                    if (mesh.material.opacity < 1) {
                                        mesh.material.opacity += 0.02 * speed;
                                    }
                                    if (mesh.material.opacity > 1) {
                                        mesh.material.opacity = 1;
                                    }
                                    
                                    if (mesh.position.x < 0) {
                                        mesh.position.x = 300;
                                        mesh.position.z = 0;
                                    }
                                    mesh.position.z += 1 * speed;
                                    break;
                            }
                            default: {
                                    mesh.material.opacity = 0;
                                    mesh.position.z = 0;
                            }
                        }
                        break;
                    }
                    case ShiftDirection.RIGHT: {
                        mesh.position.x += 1 * speed;
                        switch (object.getIndex()) {
                            case 0:
                            case 1: {
                                    mesh.position.z += 1 * speed;
                                    break;
                            }
                            case 2:
                            case 3: {
                                    mesh.position.z -= 1 * speed;
                                    break;
                            }
                            case 4: {
                                    if (mesh.material.opacity > 0) {
                                        mesh.material.opacity -= 0.05 * speed;
                                    }
                                    if (mesh.material.opacity < 0) {
                                        mesh.material.opacity = 0;
                                    }
                                    mesh.position.z -= 1 * speed;
                                    break;
                            }
                            case objects.length - 1: {
                                    if (mesh.material.opacity < 1) {
                                        mesh.material.opacity += 0.02 * speed;
                                    }
                                    if (mesh.material.opacity > 1) {
                                        mesh.material.opacity = 1;
                                    }
                                    if (mesh.position.x > 0) {
                                        mesh.position.x = -300;
                                        mesh.position.z = 0;
                                    }
                                    mesh.position.z += 1 * speed;
                                    break;
                            }
                            default: {
                                    mesh.material.opacity = 0;
                                    mesh.position.z = 0;
                            }
                        }
                    }
                }
            }
            
            if (shiftCounter === 100 / speed) {
                shiftCounter = 0;
                self.updateIndexes(shiftDirection);
                shiftDirection = ShiftDirection.NONE;
            }
        };
        
        this.updateIndexes = function(shiftDirection) {
            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                switch (shiftDirection) {
                    case ShiftDirection.LEFT: {
                            var index = object.getIndex();
                            index--;
                            if (index < 0) {
                                index = objects.length - 1;
                            }
                            object.setIndex(index);
                            
                            if (index === 2 && eventHandler) {
                                eventHandler(object);
                            }
                            
                            if (index > 4) {
                                object.getMesh().material.opacity = 0;
                            }
                            break;
                    }
                    case ShiftDirection.RIGHT: {
                            var index = object.getIndex();
                            index++;
                            if (index === objects.length) {
                                index = 0;
                            }
                            object.setIndex(index);
                            
                            if (index === 2 && eventHandler) {
                                eventHandler(object);
                            }
                            
                            if (index > 4) {
                                object.getMesh().material.opacity = 0;
                            }
                    }
                }
            }
        };
        
        this.paint = function(scene) {
            for (var i = -2; i < objects.length -2; i++) {
                var index = i + 2;
                var object = objects[index];
                object.paint(scene);
                object.getMesh().position.x = i * 100;
                object.getMesh().position.z = 300 - (Math.abs(i > 2 ? 3 : i) * 100);
                object.setIndex(index);
                
                if (index > 4) {
                    object.getMesh().material.opacity = 0;
                }
            }
        };
        
        this.shiftLeft = function() {
            if (shiftDirection !== ShiftDirection.NONE) {
                return;
            }
            
            shiftDirection = ShiftDirection.LEFT;
        };
        
        this.shiftRight = function() {
            if (shiftDirection !== ShiftDirection.NONE) {
                return;
            }
            
            shiftDirection = ShiftDirection.RIGHT;
        };
    };
    
    var IconObject = function(_imgUrl, _ident) {
        var imgUrl = _imgUrl;
        var ident = !_ident ? imgUrl : _ident;
        
        var mesh;
        var texture;
        var index;
        
        var loader = new THREE.TextureLoader();
        
        this.getIdent = function() {
            return ident;
        };
        
        this.setIndex = function(_index) {
            index = _index;
        };
        
        this.getIndex = function() {
            return index;
        };
        
        this.paint = function(scene) {
            var image = loader.load(imgUrl);
            
            var material = new THREE.MeshBasicMaterial({
                    map: image,
                    transparent: true,
                    opacity: 1
                });

            var geometry = new THREE.PlaneGeometry(60, 60);
            mesh = new THREE.Mesh(geometry, material);

            scene.add(mesh);
        };
        
        this.getMesh = function() {
            return mesh;
        };
    };

    var Side = {
        LEFT: -1,
        RIGHT: 1
    };
    var AnimationDirection = {
        LEFT: -1,
        RIGHT: 1
    };
    var Arrow = function(_side) {
        var self = this;
        
        var mesh;
        var group;
        var side = _side;
        var animationDirection;
        var mouseOver = false;
        var initialized = false;
        
        this.mouseOver = function() {
            if (!mouseOver) {
                animationDirection = AnimationDirection.RIGHT;
            }
            
            initialized = true;
            mouseOver = true;
        };
        
        this.mouseOut = function() {
            mouseOver = false;
        };
        
        this.mouseClick = function() {
            return side;
        };
        
        this.animate = function() {
            if (!mesh || !initialized) {
                return;
            }
            
            if (!mouseOver) {
                switch (side) {
                    case Side.LEFT: {
                            if (mesh.rotation.y > - Math.PI / 16) {
                                mesh.rotation.y -= Math.PI / 800;
                            }
                            if (mesh.rotation.y < - Math.PI / 16) {
                                mesh.rotation.y += Math.PI / 800;
                            }
                            break;
                    }
                    case Side.RIGHT: {
                            if (mesh.rotation.y > Math.PI / 16) {
                                mesh.rotation.y -= Math.PI / 800;
                            }
                            if (mesh.rotation.y < Math.PI / 16) {
                                mesh.rotation.y += Math.PI / 800;
                            }
                    }
                }
                return;
            }
            
            mesh.rotation.y += side * animationDirection * Math.PI / 400;
            
            switch (side) {
                case Side.LEFT: {
                        if (mesh.rotation.y > 0) {
                            animationDirection = AnimationDirection.RIGHT;
                        }
                        if (mesh.rotation.y < -2 * Math.PI / 16) {
                            animationDirection = AnimationDirection.LEFT;
                        }
                        break;
                }
                case Side.RIGHT: {
                        if (mesh.rotation.y > 2 * Math.PI / 16) {
                            animationDirection = AnimationDirection.LEFT;
                        }
                        if (mesh.rotation.y < 0) {
                            animationDirection = AnimationDirection.RIGHT;
                        }
                }
            }
        };

        this.paint = function(paintTo) {
            group = new THREE.Object3D();
            
            var texture = new THREE.MeshBasicMaterial({
                color: 0x1A5B80,
                side: THREE.FrontSide,
                transparent: true,
                opacity: 0.75
            });
            
            var geometry = new THREE.TetrahedronGeometry(30, 0);
            mesh = new THREE.Mesh(geometry, texture);
            mesh.rotation.z = side === Side.LEFT ? -Math.PI / 4 : -Math.PI / 4;
            mesh.rotation.y = side === Side.LEFT ? -Math.PI / 16 : Math.PI / 16;
            mesh.container = self;
            
            group.add(mesh);
            group.position.x = side === Side.LEFT ? -350 : 350;
            
            paintTo.add(group);
        };
        
        this.getChildren = function() {
            var objArray = new Array();
            objArray.push.apply(objArray, group.children);
            return objArray;
        };
    };

})();

