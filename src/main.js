import * as THREE from "three";
import GUI from "lil-gui";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { getMeshesByName } from "./common/utilityFunctions.js";
import { Sky } from 'three/addons/objects/Sky.js'


/*=============================================
=            common variables            =
=============================================*/
const parameters = {
  canvasWidth: window.innerWidth,
  canvasHeight: window.innerHeight,
}

/*=============================================
=            GUI setup            =
=============================================*/
const gui = new GUI();



/*=============================================
=            Models            =
=============================================*/
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/loaders/draco/')
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader)
let paperMesh = null;



/*=============================================
=            HTML step buttons            =
=============================================*/
const nextStepBtn = document.querySelector(".btn-next");
const prevStepBtn = document.querySelector(".btn-prev");
const flyAnimBtn = document.querySelector(".btn-fly");
const stepText = document.querySelector(".step");


nextStepBtn.addEventListener('click', e => {
  goToNextStep();
})
prevStepBtn.addEventListener('click', e => {
  goToPrevStep();
})
flyAnimBtn.addEventListener('click' , e => {
  
  playFlyAnimation();
})


let flyAnimationClip = null, flyAnimation = null, threeAnimationMixer = null;
gltfLoader.load("/models/paper-bird/paper-bird.glb",
  (gltf) => {
    // console.log("model",gltf);
    const model = gltf.scene;
    const mesh = getMeshesByName(model, "Paper");
    paperMesh = mesh[0];
    paperMesh.position.y = -1;
    paperMesh.rotation.y = -Math.PI / 0.5
    threeAnimationMixer = new THREE.AnimationMixer(paperMesh);
    scene.add(paperMesh);

    flyAnimationClip = gltf.animations.filter(e => e.name === 'fly')[0];
    flyAnimation = threeAnimationMixer.clipAction(flyAnimationClip);
    // console.log(flyAnimation);
    
  },
  (progress) => {
    // console.log('progress')
    // console.log(progress)
  },
  (error) => {
    // console.log('error')
    // console.log(error)
  }
)
let currentStep = -1;
function playFlyAnimation(){
  if(currentStep > 14){
    flyAnimation.play();
  }else{
    return
  }
}
function goToNextStep(){
  flyAnimation.stop();
  
  currentStep++;
  checkForStepRange()
  if(currentStep > 15){
    return;
  }else{
  }
  // console.log(currentStep);
  stepText.innerHTML = currentStep + 1;

  gsap.to(paperMesh.morphTargetInfluences, {
      [currentStep]: 1,
      duration: 0.5
  });

  if(currentStep > 14){
    flyAnimBtn.removeAttribute('disabled')
    return;
  }else{
    flyAnimBtn.setAttribute('disabled', true);
  }
}

function goToPrevStep(){
  flyAnimation.stop();
  flyAnimBtn.setAttribute('disabled', true);
  if(currentStep < 0){
    return;
  }
  stepText.innerHTML = currentStep;
  
  gsap.to(paperMesh.morphTargetInfluences, {
    [currentStep]: 0,
    duration: 0.5
  });
  
  currentStep--;
  // console.log(currentStep);

  checkForStepRange()
}

function checkForStepRange(){
  // console.log(currentStep);


  if(currentStep < 0){
    prevStepBtn.setAttribute('disabled', true)
  }else{
    prevStepBtn.removeAttribute('disabled')
  }

  if(currentStep > 14){
    nextStepBtn.setAttribute('disabled', true)
  }else{
    nextStepBtn.removeAttribute('disabled')
  }
}





/*=============================================
=            Scene and world setup            =
=============================================*/
const scene = new THREE.Scene();

/*=============================================
=            Camera setup            =
=============================================*/
const camera = new THREE.PerspectiveCamera(75, parameters.canvasWidth / parameters.canvasHeight, 0.1, 100)
camera.position.set(-16, 15, -16)
scene.add(camera)

/*=============================================
=            renderer setup            =
=============================================*/
const renderer = new THREE.WebGLRenderer();
renderer.domElement.classList.add('webgl')
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(parameters.canvasWidth, parameters.canvasHeight)
renderer.setAnimationLoop(animation)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

/*=============================================
=            Controls setup            =
=============================================*/
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true


/**
 * Sky
 */
const sky = new Sky();
sky.material.uniforms['turbidity'].value = 1.5
sky.material.uniforms['rayleigh'].value = 0.8
sky.material.uniforms['mieCoefficient'].value = 0.18
sky.material.uniforms['mieDirectionalG'].value = 0.5
sky.material.uniforms['sunPosition'].value.set(1.75, 0, 2)
sky.scale.setScalar( 10000 );
scene.add(sky);


gui.add(sky.material.uniforms.turbidity, 'value').min(0).max(20).step(0.5).name('sun turbidity');
gui.add(sky.material.uniforms.rayleigh, 'value').min(0).max(6).step(0.1).name('sun rayleigh');
gui.add(sky.material.uniforms.mieCoefficient, 'value').min(0).max(0.5).step(0.02).name('sun mieCoefficient');
gui.add(sky.material.uniforms.mieDirectionalG, 'value').min(0).max(2).step(0.5).name('sun mieDirectionalG');
gui.add(sky.material.uniforms.sunPosition.value, 'x').min(-2).max(2).step(0.05).name('sun sunPosition x');
gui.add(sky.material.uniforms.sunPosition.value, 'y').min(-2).max(2).step(0.05).name('sun sunPosition y');
gui.add(sky.material.uniforms.sunPosition.value, 'z').min(-2).max(2).step(0.05).name('sun sunPosition z');

/*=============================================
=            floor            =
=============================================*/
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: '#fcd8c1',
    metalness: 0.3,
    roughness: 0.4,
  })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
floor.position.y = -6;
scene.add(floor)

/*=============================================
=            lights            =
=============================================*/
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/*=============================================
=            animation loop            =
=============================================*/
const clock = new THREE.Clock();
let previousTime = 0;
let currentIntersect = null;
function animation() {

  //elapsed time
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (threeAnimationMixer) {
    threeAnimationMixer.update(deltaTime)
  }

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)
}




/*=============================================
=            Events setup            =
=============================================*/
window.addEventListener('resize', e => {
  parameters.canvasWidth = window.innerWidth;
  parameters.canvasHeight = window.innerHeight;

  renderer.setSize(parameters.canvasWidth, parameters.canvasHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  camera.aspect = parameters.canvasWidth / parameters.canvasHeight;
  camera.updateProjectionMatrix();
})







