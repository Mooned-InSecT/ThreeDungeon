import * as THREE from "./three/three.module.min.js";
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById("dungeon");
const mapElement = document.getElementById("map");
const ctrlElement = document.getElementById("ctrl");

const renderer = new THREE.WebGLRenderer({ canvas: canvas });

function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
}

const scene = new THREE.Scene();

const player = new THREE.Object3D();
player.rotation.x = Math.PI / 2;
player.rotation.z = Math.PI;
scene.add(player)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.z = 0.5;
player.add(camera);

const light = new THREE.PointLight(0xFFFFFF, 0.5);
player.add(light);
// const light1 = new THREE.PointLight(0xFFFFFF, 50);
// light1.position.y = 10;
// player.add(light1);
// const light2 = new THREE.PointLight(0xFFFFFF, 50);
// light2.position.y = -10;
// player.add(light2);

// 键盘操作
window.addEventListener("keydown", e => {
    if (playingAnim) {
        return;
    }
    switch (e.key) {
        case "w":
        case "W":
            moveFoward();
            break;
        case "s":
        case "s":
            moveBack();
            break;
        case "a":
        case "A":
            moveLeft();
            break;
        case "d":
        case "D":
            moveRight();
            break;
        case "q":
        case "Q":
            rotateLeft();
            break;
        case "e":
        case "E":
            rotateRight();
            break;
        case "m":
        case "M":
            if (mapElement.classList.contains("hide")) {
                mapElement.classList.remove("hide");
            } else {
                mapElement.classList.add("hide");
            }
            break;
        case "z":
        case "z":
            if (ctrlElement.classList.contains("hide")) {
                ctrlElement.classList.remove("hide");
            } else {
                ctrlElement.classList.add("hide");
            }
            break;
        case " ":
            console.log(player.position);
            // testaction.reset().play();
            break;
    }
})

// 屏幕按钮操作
ctrlElement.querySelector("#fw").onclick = moveFoward;
ctrlElement.querySelector("#bk").onclick = moveBack;
ctrlElement.querySelector("#lf").onclick = moveLeft;
ctrlElement.querySelector("#rg").onclick = moveRight;
ctrlElement.querySelector("#lt").onclick = rotateLeft;
ctrlElement.querySelector("#rt").onclick = rotateRight;

// 移动相关

// 动画
const mixer = new THREE.AnimationMixer(player);
let playingAnim = false;
let animFinish = false;

function moveTo(x, y, anim) {
    if (playingAnim) {
        return;
    }
    x = Math.round(x);
    y = Math.round(y);
    if (map[y] && map[y][x]) {
        return;
    }
    if (anim) {
        playingAnim = true;
        mixer.stopAllAction();
        const trackX = new THREE.VectorKeyframeTrack(
            ".position[x]",
            [0, 1],
            [player.position.x, x]
        );
        const trackY = new THREE.VectorKeyframeTrack(
            ".position[y]",
            [0, 1],
            [player.position.y, y]
        );
        const clip = new THREE.AnimationClip("test", 1, [trackX, trackY]);
        const onfinish = () => {
            animFinish = true;
            mixer.removeEventListener("finished", onfinish);
            mixer.uncacheClip(clip);
            setTimeout(() => {
                player.position.x = x;
                player.position.y = y;
                playingAnim = false;
                animFinish = false;
                updateMap();
            }, 0)
        }
        mixer.addEventListener("finished", onfinish);
        const testaction = mixer.clipAction(clip).setLoop(THREE.LoopOnce);
        testaction.play();
    } else {
        player.position.x = x;
        player.position.y = y;
        updateMap();
    }
}
function move(direction, length) {
    direction = player.rotation.y + direction * Math.PI / 2;
    let x = - Math.sin(direction) * length + player.position.x;
    let y = Math.cos(direction) * length + player.position.y;
    moveTo(x, y, true);
}

function moveFoward() {
    move(0, 1);
}
function moveBack() {
    move(2, 1);
}
function moveLeft() {
    move(-1, 1);
}
function moveRight() {
    move(1, 1);
}

// 旋转相关
function rotateTo(direction, anim = false) {
    if (playingAnim) {
        return;
    }
    const rotation = Math.round(direction + 4) % 4;
    if (anim) {
        playingAnim = true;
        mixer.stopAllAction();
        const track = new THREE.VectorKeyframeTrack(
            ".rotation[y]",
            [0, 1],
            [player.rotation.y, direction * Math.PI / 2]
        );
        const clip = new THREE.AnimationClip("test", 1, [track]);
        const onfinish = () => {
            animFinish = true;
            mixer.removeEventListener("finished", onfinish);
            mixer.uncacheClip(clip);
            setTimeout(() => {
                player.rotation.y = rotation * Math.PI / 2;
                playingAnim = false;
                animFinish = false;
                updateMap();
            }, 0)
        }
        mixer.addEventListener("finished", onfinish);
        const testaction = mixer.clipAction(clip).setLoop(THREE.LoopOnce);
        testaction.play();
    } else {
        player.rotation.y = rotation * Math.PI / 2;
        updateMap();
    }
}
function rotate(direction) {
    const rotation = Math.round(2 * player.rotation.y / Math.PI + direction);
    rotateTo(rotation, true);
}

function rotateLeft() {
    rotate(-1);
}
function rotateRight() {
    rotate(1);
}

// 地形相关
const geometryWall = new THREE.BoxGeometry(1, 1, 1);
const geometryFloor = new THREE.PlaneGeometry(1, 1);
const geometryCeiling = new THREE.PlaneGeometry(1, 1);

const loader = new THREE.TextureLoader();
const textureWall = loader.load('resources/images/wall.png');
const textureFloor = loader.load('resources/images/floor.png');
const textureCeiling = loader.load('resources/images/ceiling.png');
textureWall.magFilter = THREE.NearestFilter;
textureFloor.magFilter = THREE.NearestFilter;
textureCeiling.magFilter = THREE.NearestFilter;
const materialWall = new THREE.MeshStandardMaterial({ map: textureWall });
const materialFloor = new THREE.MeshStandardMaterial({ map: textureFloor, side: THREE.DoubleSide });
const materialCeiling = new THREE.MeshStandardMaterial({ map: textureCeiling, side: THREE.DoubleSide });
// const materialWall = new THREE.MeshPhongMaterial({ color: "sienna", wireframe: false });
// const materialFloor = new THREE.MeshPhongMaterial({ color: "forestgreen", wireframe: false, side: THREE.DoubleSide });
// const materialCeiling = new THREE.MeshBasicMaterial({ color: "skyblue", wireframe: false, side: THREE.DoubleSide });

const walls = [];
const floors = [];
const ceilings = [];

function addWall(x, y) {
    const wall = new THREE.Mesh(geometryWall, materialWall);
    wall.position.set(x, y, 0);
    walls.push(wall);
    scene.add(wall);
}


function addFloor(x, y) {
    const floor = new THREE.Mesh(geometryFloor, materialFloor);
    floor.position.set(x, y, 0.5);
    floors.push(floor);
    scene.add(floor);
}

function addCeiling(x, y) {
    const ceiling = new THREE.Mesh(geometryCeiling, materialCeiling);
    ceiling.position.set(x, y, -0.5);
    ceilings.push(ceiling);
    scene.add(ceiling);
}

function clearWalls() {
    while (walls.length > 0) {
        walls[0].dispose();
        walls[0].parent.remove(walls[0]);
        walls.splice(0, 1);
    }
}

function readMap(map) {
    clearWalls();
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j]) {
                addWall(j, i);
            } else {
                addFloor(j, i);
                addCeiling(j, i);
            }
        }
    }
}

const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
readMap(map);
moveTo(4, 1);

function updateMap() {
    while (mapElement.lastChild) {
        mapElement.removeChild(mapElement.lastChild);
    }
    for (let i = 0; i < map.length; i++) {
        const line = document.createElement("div");
        mapElement.appendChild(line)
        for (let j = 0; j < map[i].length; j++) {
            const cell = document.createElement("div");
            line.appendChild(cell);
            if (map[i][j]) {
                cell.classList.add("wall");
            } else {
                cell.classList.add("floor");
            }
            const x = Math.round(player.position.x)
            const y = Math.round(player.position.y)
            if (x === j && y === i) {
                cell.classList.add("player");
                // console.log(Math.round(2 * player.rotation.y / Math.PI))
                switch (Math.round(2 * player.rotation.y / Math.PI)) {
                    case 0:
                        cell.classList.add("player-down");
                        break;
                    case 1:
                        cell.classList.add("player-left");
                        break;
                    case 2:
                        cell.classList.add("player-up");
                        break;
                    case 3:
                        cell.classList.add("player-right");
                        break;
                }
            }
        }
    }
}

updateMap();


// 测试镜头控制
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.update();


window.onresize = resize;
resize();

const clock = new THREE.Clock();

function render(time) {
    time *= 0.001;

    mixer.update(clock.getDelta());

    if (!animFinish) {
        renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
}

requestAnimationFrame(render);