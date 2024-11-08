// Configuración de la escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Iluminación de la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Cargador GLTF para cargar los modelos
const loader = new THREE.GLTFLoader();

// Texturas de fondo para cada modelo
const backgroundTextures = {
    'sonic-lost-world': new THREE.TextureLoader().load('img/sonicLostWord.jpg'),
    'junio_sonic': new THREE.TextureLoader().load('img/junioSonic.jpg'),
    'shadow': new THREE.TextureLoader().load('img/shadow.jpg'),
    'metal_sonic': new THREE.TextureLoader().load('img/metalSonic.jpg')
};

const characterInfos = [
    "Sonic the Hedgehog (Moderno) _____________________________ El veloz erizo azul y héroe principal, siempre listo para la acción, el es súper rápido, valiente, y confiado, usa giros y ataques de impulso, lucha contra el malvado Dr. Eggman, quien siempre intenta conquistar el mundo con sus robots.",
    "Sonic the Hedgehog (Clasico) _____________________________ La versión original de Sonic, querido por los fans retro, rápido y optimista, realiza ataques giratorios y defiende la naturaleza, lucha tambien con el Dr. Eggman, con robots más simples pero igual de peligrosos.",
    "Shadow the Hedgehog _____________________________ Un erizo oscuro y poderoso, creado por Gerald Robotnik (abuelo del Dr. Eggman) como la 'forma de vida definitiva', posee súper velocidad y poderes únicos como Chaos Control, es serio y en busca de justicia.",
    "Metal Sonic _____________________________ Una versión robótica de Sonic creada por Dr. Eggman para derrotarlo, posee súper velocidad y habilidades de combate avanzadas, ademas de ser frío y calculador, es el rival metálico de Sonic a quien quiere superar para cumplir su misión programada."
];

// Crea una variable para almacenar la música para cada modelo
let audioPlayers = {
    'sonic-lost-world': new Audio('sound/SonicModern.mp3'),
    'junio_sonic': new Audio('sound/SonicRetro.mp3'),
    'shadow': new Audio('sound/Shadow.mp3'),
    'metal_sonic': new Audio('sound/MetalSonic.mp3')
};

// Configurar la música para que se repita en bucle
Object.values(audioPlayers).forEach(audio => {
    audio.loop = true; // Repite la música
    audio.volume = 0.5; // Ajusta el volumen si lo necesitas
});



// Cargar el logo
let logo;
loader.load('sonic/sega_logo/scene.gltf', (gltf) => {
    logo = gltf.scene;
    logo.scale.set(0.080, 0.080, 0.080);
    logo.position.set(-5.6, -1.3, 0);
    scene.add(logo);
}, undefined, (error) => console.error('Error al cargar el logo:', error));

let mixer, model;
let currentAnimationIndex = 0;
let currentModelIndex = 0;
let changingModel = false;

// Array de configuraciones para cada anillo
const ringConfigs = [
    { position: new THREE.Vector3(2.5, 3.9, 2), scale: new THREE.Vector3(0.2, 0.2, 0.2) },
    { position: new THREE.Vector3(2.1, 2, 2), scale: new THREE.Vector3(0.2, 0.2, 0.2) },
    { position: new THREE.Vector3(2.6, 0.2, 2), scale: new THREE.Vector3(0.2, 0.2, 0.2) },
];

// Array para almacenar los mixers de animación
const ringMixers = [];

// Cargar el modelo de anillo y crear múltiples instancias con animación
loader.load('sonic/ring/scene.gltf', (gltf) => {
    ringConfigs.forEach(config => {
        const ringClone = gltf.scene.clone(); // Clona el modelo original
        ringClone.position.copy(config.position); // Asigna la posición específica
        ringClone.scale.copy(config.scale); // Asigna la escala específica
        scene.add(ringClone); // Añade el anillo clonado a la escena

        // Configurar la animación para cada clon
        const mixer = new THREE.AnimationMixer(ringClone);
        const action = mixer.clipAction(gltf.animations.find(anim => anim.name === "Action"));
        action.play(); // Inicia la animación

        ringMixers.push(mixer); // Guarda el mixer en el array para actualizarlo luego
    });
}, undefined, (error) => console.error('Error al cargar el anillo:', error));





const modelsPaths = [
    {
        path: 'sonic/sonic-lost-world/scene.gltf',
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, -0.5, 0),
        rotation: new THREE.Euler(0, 0, 0),
        allowedAnimations: ['Idle', 'Up', 'Walk', 'Jog', 'Hurt'],
        background: 'sonic-lost-world'
    },
    {
        path: 'sonic/junio_sonic/scene.gltf',
        scale: new THREE.Vector3(3, 3, 3),
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        allowedAnimations: ['look', 'pose 1', 'jogging'],
        background: 'junio_sonic'
    },
    {
        path: 'sonic/shadow/scene.gltf',
        scale: new THREE.Vector3(1.2, 1.2, 1.2),
        position: new THREE.Vector3(0, -0.8, 0),
        rotation: new THREE.Euler(0, 0, 0),
        allowedAnimations: ['pose 1', 'Animation'],
        background: 'shadow'
    },
    {
        path: 'sonic/metal_sonic/scene.gltf',
        scale: new THREE.Vector3(0.36, 0.36, 0.36),
        position: new THREE.Vector3(0, 1.8, 0), // centrar
        rotation: new THREE.Euler(0, 10.9, 0), // Rotación de 180 grados para que mire al frente
        allowedAnimations: ['IDLE', 'OVA IDLE', 'READY TO RACE'],
        background: 'metal_sonic'
    }
];

let audioInitialized = false;
let currentAudio = null;

function initializeAudio() {
    // Inicializar el audio solo después de la primera interacción del usuario
    if (!audioInitialized) {
        audioInitialized = true;
        document.removeEventListener('click', initializeAudio);
        document.removeEventListener('keydown', initializeAudio);

        // Reproducir la música del modelo actual después de la interacción del usuario
        playCharacterAudio(currentModelIndex);
    }
}

// Agregar eventos para esperar la primera interacción del usuario
document.addEventListener('click', initializeAudio);
document.addEventListener('keydown', initializeAudio);

function playCharacterAudio(index) {
    // Si hay música reproduciéndose actualmente, detenerla
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // Reiniciar al inicio para cuando volvamos al personaje
    }

    // Obtener y reproducir la música del personaje actual
    currentAudio = audioPlayers[modelsPaths[index].background];
    currentAudio.loop = true; // Asegurarse de que la música se repita en bucle
    if (audioInitialized) {
        currentAudio.play();
    }
}

function loadModel(index) {
    // Pausar la música actual antes de cargar el nuevo modelo
    playCharacterAudio(index);

    // Cargar el nuevo modelo
    loader.load(modelsPaths[index].path, (gltf) => {
        if (model) scene.remove(model);

        model = gltf.scene;
        model.scale.copy(modelsPaths[index].scale);
        model.position.copy(modelsPaths[index].position);
        model.rotation.copy(modelsPaths[index].rotation);
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);

        const allowedAnimations = modelsPaths[index].allowedAnimations;
        model.animations = gltf.animations.filter(anim => allowedAnimations.includes(anim.name));

        if (model.animations.length > 0) {
            mixer.clipAction(model.animations[0]).play();
        }

        currentAnimationIndex = 0;
        changingModel = false;

        // Cambiar el fondo
        scene.background = backgroundTextures[modelsPaths[index].background];

        // Actualizar el texto de la información del personaje
        document.getElementById('characterText').innerText = characterInfos[index];

        // Mostrar el cuadro de diálogo inmediatamente para el primer modelo
        if (index === 0) {
            document.getElementById('characterInfo').style.display = 'block';
        }

    }, undefined, (error) => console.error('Error al cargar el modelo:', error));
}



// Llama a `loadModel` con el índice inicial después de configurar el resto de la escena.
loadModel(currentModelIndex);


// Función para cambiar la animación y rotar el modelo
function onKeyPress(event) {
    const key = event.key.toLowerCase(); // Convertir cualquier tecla a minúscula

    switch (key) {
        case 'h': // Funciona tanto para 'h' como para 'H'
            if (model && model.animations.length > 0) {
                const currentAction = mixer.clipAction(model.animations[currentAnimationIndex]);
                currentAction.stop();

                const nextAnimationIndex = (currentAnimationIndex + 1) % model.animations.length;
                const nextAction = mixer.clipAction(model.animations[nextAnimationIndex]);
                nextAction.reset().play();

                console.log(`Animación actual: ${model.animations[nextAnimationIndex].name}`);
                currentAnimationIndex = nextAnimationIndex;
            }
            break;
        case 'arrowright':
            if (model) model.rotation.y -= Math.PI / 8;
            break;
        case 'arrowleft':
            if (model) model.rotation.y += Math.PI / 8;
            break;
        case 'arrowup':
            changeModel(1);
            break;
        case 'arrowdown':
            changeModel(-1);
            break;
    }
}

// Evento de teclas
window.addEventListener('keydown', onKeyPress, false);



// Cambiar el modelo según la dirección
function changeModel(direction) {
    if (changingModel) return; // Evitar cambios múltiples durante la transición

    changingModel = true;
    currentModelIndex = (currentModelIndex + direction + modelsPaths.length) % modelsPaths.length;

    // Llamar a la función de transición
    startTransition(() => {
        loadModel(currentModelIndex);
        changingModel = false;
    });
}

// Evento de teclas
window.addEventListener('keydown', onKeyPress, false);

// Referencia al overlay
const transitionOverlay = document.getElementById('transitionOverlay');
const titleImage = document.getElementById('titleImage'); // Referencia a la imagen del título

// Función para iniciar la transición de desvanecimiento
function startTransition(callback) {
    transitionOverlay.style.opacity = '1'; // Oscurece
    document.getElementById('characterInfo').style.display = 'none'; // Oculta el cuadro de diálogo
    titleImage.style.opacity = '0'; // Oculta el título

    setTimeout(() => {
        callback(); // Llama al callback (cargar el nuevo modelo) cuando la pantalla esté oscura
        endTransition(); // Luego aclara la pantalla
    }, 500); // Tiempo sincronizado con la duración de la transición en CSS
}

function endTransition() {
    setTimeout(() => {
        transitionOverlay.style.opacity = '0'; // Aclara
        document.getElementById('characterInfo').style.display = 'block'; // Muestra el cuadro de diálogo después de la transición
        titleImage.style.opacity = '1'; // Vuelve a mostrar el título
    }, 500);
}


// Animación de renderizado
const clock = new THREE.Clock();
// Actualizar la animación de los anillos en la función de animación principal
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Actualizar todos los mixers de los anillos
    ringMixers.forEach(mixer => mixer.update(delta));

    if (mixer) mixer.update(delta); // Actualiza el mixer del modelo principal si existe

    if (logo) logo.rotation.y += 0.012; // Rota el logo continuamente

    renderer.render(scene, camera);
}
animate();