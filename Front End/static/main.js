document.addEventListener('DOMContentLoaded', function () {
    let scene, camera, renderer, ball, raycaster, mouse;
    let isDragging = false;
    let dragOffset = new THREE.Vector3();

    function init() {
        // Create scene
        scene = new THREE.Scene();

        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        // Create renderer
        renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Create a ball (sphere geometry)
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });
        ball = new THREE.Mesh(geometry, material);
        scene.add(ball);

        // Create raycaster and mouse vector
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Add event listeners for mouse events
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        // Start animation loop
        animate();
    }

    function onMouseDown(event) {
        // Update mouse vector
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Check for intersections
        const intersects = raycaster.intersectObject(ball);

        if (intersects.length > 0) {
            isDragging = true;
            dragOffset.copy(intersects[0].point).sub(ball.position);
            console.log('Drag started:', dragOffset);
        }
    }

    function onMouseMove(event) {
        if (isDragging) {
            // Update mouse vector
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update raycaster
            raycaster.setFromCamera(mouse, camera);

            // Calculate new position
            const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -camera.position.z);
            const pos = new THREE.Vector3();
            raycaster.ray.intersectPlane(planeZ, pos);

            // Adjust ball position based on the drag offset
            pos.sub(dragOffset);
            ball.position.set(pos.x, pos.y, ball.position.z); // Keep the ball's z coordinate constant
            console.log('Ball position:', ball.position);
        }
    }

    function onMouseUp() {
        if (isDragging) {
            console.log('Drag ended');
        }
        isDragging = false;
    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Initialize the scene
    init();
});
