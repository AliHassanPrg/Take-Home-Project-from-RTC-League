const socket = io();

let scene, camera, renderer, ball;

async function updatePosition(x, y, z) {
    try {
        const response = await fetch('/position', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ x, y, z }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error updating position');
        }
    } catch (err) {
        console.error('Error updating position:', err);
    }
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(0.25, 15, 15);
    const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });
    ball = new THREE.Mesh(geometry, material);
    scene.add(ball);

    // Fetch initial position
    fetch('/position')
        .then(response => response.json())
        .then(data => {
            ball.position.set(data.x, data.y, data.z);
        })
        .catch(err => console.error('Error fetching initial position:', err));

    animate();
}

function updateBallPosition() {
    const x = parseFloat(document.getElementById('xCoord').value);
    const y = parseFloat(document.getElementById('yCoord').value);
    const z = parseFloat(document.getElementById('zCoord').value);

    if (x >= -7.5 && x <= 7.5 && y >= -3.5 && y <= 3.5 && z >= -4.0 && z <= 4.0) {
        ball.position.set(x, y, z);
        updatePosition(x, y, z);
    } else {
        alert('Please enter values within the allowed range:\nX: -7.5 to 7.5\nY: -3.5 to 3.5\nZ: -4.0 to 4.0');
    }
}

async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();
        if (response.ok) {
            window.location.href = data.index_page_link ;
        } else {
            alert('Logout failed');
        }
    } catch (err) {
        console.error('Error logging out:', err);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

socket.on('update_position', function(data) {
    ball.position.set(data.x, data.y, data.z);
});

init();