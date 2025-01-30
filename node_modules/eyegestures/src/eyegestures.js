export default class EyeGestures{ // strip export default before making cdn/web embeddable version 
    constructor(videoElement_ID, onGaze)
    {
        const cursor = document.createElement('div');
        cursor.id = "cursor";
        cursor.style.display = "None";
        document.body.appendChild(cursor);
        const calib_cursor = document.createElement('div');
        calib_cursor.id = "calib_cursor";
        calib_cursor.style.display = "None";

        const logoDiv = document.createElement('div');
        logoDiv.id = "logoDivEyeGestures";
        logoDiv.style.width = "200px";
        logoDiv.style.height = "60px";
        logoDiv.style.position = "fixed";
        logoDiv.style.bottom = "10px";
        logoDiv.style.right = "10px";
        logoDiv.style.zIndex = "9999";
        logoDiv.style.background = "black";
        logoDiv.style.borderRadius = "10px";
        logoDiv.style.display = "none";
        logoDiv.onclick = function() {
            window.location.href = "https://eyegestures.com/";
        };
        const logo = document.createElement('div');
        logo.style.margin = "10px";
        logo.innerHTML = '<img src="https://eyegestures.com/logoEyeGesturesNew.png" alt="Logo" width="120px">';
        logoDiv.appendChild(logo);
        const canvas = document.createElement('canvas');
        canvas.id = "output_canvas";
        canvas.width = "50"; 
        canvas.height = "50";
        canvas.style.margin = "5px";
        canvas.style.borderRadius = "10px";
        canvas.style.border = "none";
        canvas.style.background = "#222";
        logoDiv.appendChild(canvas);
        document.body.appendChild(logoDiv);
        
        document.body.appendChild(calib_cursor);
        
        this.calibrator = new Calibrator;
        this.screen_width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        this.screen_height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        this.prev_calib = [0.0,0.0];
        this.head_starting_pos = [0.0,0.0];
        this.calib_counter = 0;
        this.calib_max = 25;
        this.counter = 0;
        this.collected_points = 0;  
        this.buffor = [];
        this.buffor_max = 20;
        this.start_width = 0;
        this.start_height = 0;
        this.onGaze = onGaze;

        this.run = false;
        this.__invisible = false;

        if (window.isSecureContext) {
            this.init(videoElement_ID);
        }
        else {
            console.error('This application requires a secure context (HTTPS or localhost)');
        }
        
    }

    showCalibrationInstructions(onRead) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'calibrationOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '1000';

        // Create content container
        const content = document.createElement('div');
        content.style.textAlign = 'center';
        content.style.color = '#fff';
        content.style.fontFamily = 'Arial, sans-serif';

        // Create instructional text
        const instructionText1 = document.createElement('h3');
        instructionText1.textContent = 'EyeGestures Calibration:';
        instructionText1.style.fontSize = '1.5rem';
        instructionText1.style.marginBottom = '20px';

        const instructionText2 = document.createElement('p');
        instructionText2.innerHTML = 'To calibrate properly you need to gaze on <span style="color: #ff5757; font-weight: bold;">25 red circles</span>.';
        instructionText2.style.marginBottom = '20px';
        
        const instructionText3 = document.createElement('p');
        instructionText3.innerHTML = 'The <span style="color: #5e17eb; font-weight: bold;">blue circle</span> is your estimated gaze. With every calibration point, the tracker will gradually listen more and more to your gaze.';
        instructionText3.style.marginBottom = '20px';

        // Create button
        const button = document.createElement('button');
        button.textContent = 'Continue';
        button.style.padding = '10px 20px';
        button.style.fontSize = '1rem';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.backgroundColor = '#5e17eb';
        button.style.color = '#fff';
        button.style.cursor = 'pointer';

        // Button click event to remove overlay
        button.addEventListener('click', () => {
            document.body.removeChild(overlay);
            onRead();
        });
        // Append elements to content
        content.appendChild(instructionText1);
        content.appendChild(instructionText2);
        content.appendChild(instructionText3);
        content.appendChild(button);

        // Append content to overlay
        overlay.appendChild(content);

        // Append overlay to body
        document.body.appendChild(overlay);

        setTimeout(() => {
            document.body.removeChild(overlay);
            onRead();
        },15000)
    }


    // Status update function
    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    // Error display function
    showError(message) {
        const errorElement = document.getElementById('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Function to load script with promise
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Main initialization
    async init(videoElement_id) {
        try {
            this.updateStatus('Loading MediaPipe library...');
            
            // Load MediaPipe library
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
            
            this.updateStatus('MediaPipe library loaded, initializing...');
            
            if (typeof FaceMesh === 'undefined') {
                throw new Error('FaceMesh is not defined. Library not loaded correctly.');
            }

            await this.setupMediaPipe(videoElement_id);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Initialization error: ' + error.message);
        }
    }

    async setupMediaPipe(videoElement_id) {
        try {
            // Initialize FaceMesh solution
            const faceMesh = new FaceMesh({
                locateFile: (file) => {
                    console.log("Loading file:", file);
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                }
            });

            // Set options for FaceMesh
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Initialize the FaceMesh instance
            await faceMesh.initialize();
            this.updateStatus('FaceMesh initialized successfully');

            // Set callback for the results
            faceMesh.onResults(this.onFaceMeshResults.bind(this));

            // Access video stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {} 
            });
            
            const videoElement = document.getElementById(videoElement_id);
            videoElement.srcObject = stream;

            // Wait for video to be loaded
            videoElement.onloadeddata = () => {
                this.updateStatus('Video stream started');
                videoElement.play();
                requestAnimationFrame(processFrame);
            };

            async function processFrame() {
                const videoElement = document.getElementById("video");
                if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                    requestAnimationFrame(processFrame);
                    return;
                }

                const canvas = document.getElementById("output_canvas");
                const ctx = canvas.getContext("2d");
                try {
                    // ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    ctx.save();
                    ctx.scale(-1, 1); // Flip horizontally (invert x-axis)
                    ctx.translate(-canvas.width, 0); // Adjust translation to ensure the image is drawn correctly
                    faceMesh.send({ image: videoElement });
                    ctx.restore();
                } catch (error) {
                    console.error('Error processing frame:', error);
                    showError('Error processing frame: ' + error.message);
                }
                requestAnimationFrame(processFrame);
            }

        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            showError('Error initializing MediaPipe: ' + error.message);
        }
    }

    onFaceMeshResults(results) {
        
        // Draw the face mesh landmarks
        const LEFT_EYE_PUPIL_KEYPOINT = [473];
        const RIGHT_EYE_PUPIL_KEYPOINT = [468];
        const LEFT_EYE_KEYPOINTS = [
            33, 133, 160, 159, 158, 157, 173, 155, 154, 153, 144, 145, 153, 246, 468
        ];
        const RIGHT_EYE_KEYPOINTS = [
            362, 263, 387, 386, 385, 384, 398, 382, 381, 380, 374, 373, 374, 466, 473
        ];
        let offset_x = 0;
        let offset_y = 0;
        let width = 0;
        let height = 0;
        let max_x = 0;
        let max_y = 0;
        let left_eye_coordinates = [];
        let right_eye_coordinates = [];
        if (results.multiFaceLandmarks && this.run) {
            const canvas = document.getElementById("output_canvas");
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var landmarks of results.multiFaceLandmarks) {

                offset_x = (landmarks[0].x);
                offset_y = (landmarks[1].y);
                // offset_x = 0;
                // offset_y = 0;

                landmarks.forEach(landmark => {
                    offset_x = Math.min(offset_x,landmark.x);
                    offset_y = Math.min(offset_y,landmark.y);
                    max_x = Math.max(max_x,landmark.x);
                    max_y = Math.max(max_y,landmark.y);
                })

                width = max_x - offset_x;
                height = max_y - offset_y;

                if(this.start_width * this.start_height == 0){
                    this.start_width = width;
                    this.start_height = height;
                }

                let scale_x = width/this.start_width;
                let scale_y = height/this.start_height;

                let l_landmarks = LEFT_EYE_KEYPOINTS.map(index => landmarks[index]);
                let r_landmarks = RIGHT_EYE_KEYPOINTS.map(index => landmarks[index]);

                // Draw dots for each landmark
                ctx.fillStyle = '#ff5757';
                l_landmarks.forEach(landmark => {
                    left_eye_coordinates.push(
                        [
                            (((landmark.x- offset_x)/width) * scale_x ),
                            (((landmark.y- offset_y)/height) * scale_y )
                        ]
                    );
                    ctx.beginPath();
                    ctx.arc(
                        landmark.x * canvas.width,
                        landmark.y * canvas.height,
                        3, // radius
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                });

                // Draw dots for each landmark
                ctx.fillStyle = '#5e17eb';
                r_landmarks.forEach(landmark => {
                    right_eye_coordinates.push(
                        [
                            (((landmark.x- offset_x)/width) * scale_x ),
                            (((landmark.y- offset_y)/height) * scale_y )
                        ]
                    );
                    ctx.beginPath();
                    ctx.arc(
                        landmark.x * canvas.width,
                        landmark.y * canvas.height,
                        3, // radius
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                });

                this.processKeyPoints(
                    left_eye_coordinates,
                    right_eye_coordinates,
                    offset_x * scale_x,
                    offset_y * scale_x,
                    scale_x,
                    scale_y,
                    width,
                    height,
                )
            }

        }
    }

    processKeyPoints(left_eye_coordinates,right_eye_coordinates,offset_x,offset_y,scale_x,scale_y,width,height)
    {
        let keypoints = left_eye_coordinates;
        keypoints = keypoints.concat(right_eye_coordinates);
        keypoints = keypoints.concat([[scale_x,scale_y]]);
        keypoints = keypoints.concat([[width,height]]);
        
        if(this.head_starting_pos[0] == 0.0 && this.head_starting_pos[1] == 0.0){
            this.head_starting_pos[0] = offset_x;
            this.head_starting_pos[1] = offset_y;
        };

        keypoints = keypoints.concat([
            [
                offset_x - this.head_starting_pos[0],
                offset_y - this.head_starting_pos[1]
            ]
        ]);
        
        let calibration = this.calib_counter < this.calib_max;

        let calibration_point = [0.0,0.0];

        let point = this.calibrator.predict(keypoints);
        this.buffor.push(point);
        if(this.buffor_max < this.buffor.length){
            this.buffor.shift();
        }
        let average_point = [0, 0];
        if (this.buffor.length > 0) {
            average_point = this.buffor.reduce(
                (sum, current) => [sum[0] + current[0], sum[1] + current[1]],
                [0, 0]
            ).map(coord => coord / this.buffor.length);
        }
        point = average_point;

        if(calibration){
            calibration_point = this.calibrator.getCurrentPoint(this.screen_width,this.screen_height);

            this.calibrator.add(keypoints,calibration_point);
            if(euclideanDistance(point,calibration_point) < 0.1 *this.screen_width && this.counter > 20)
            {
                this.calibrator.movePoint();
                this.counter = 0;
            }
            else if(euclideanDistance(point,calibration_point) < 0.1 *this.screen_width){
                this.counter = this.counter + 1;
            }

            if(this.prev_calib[0] != calibration_point[0] || this.prev_calib[1] != calibration_point[1])
            {
                this.prev_calib = calibration_point;
                this.calib_counter = this.calib_counter + 1;
            }

        }
        else{
            let calib_cursor = document.getElementById("calib_cursor");
            calib_cursor.style.display = "None";
        }

        let cursor = document.getElementById("cursor");
        let left = Math.min(Math.max(point[0],0),this.screen_width)
        let top = Math.min(Math.max(point[1],0),this.screen_height)
        cursor.style.left = `${left - 25}px`;
        cursor.style.top = `${top - 25}px`;
        let calib_cursor = document.getElementById("calib_cursor");
        calib_cursor.style.left = `${this.prev_calib[0] - 100}px`;
        calib_cursor.style.top = `${this.prev_calib[1] - 100}px`;

        this.onGaze(point,calibration);
    }

    __run(){
        this.run = true;
    }

    start(){
        const logoDivEyeGestures = document.getElementById("logoDivEyeGestures");
        logoDivEyeGestures.style.display = "flex";

        this.showCalibrationInstructions(this.__run.bind(this));

        if(!this.__invisible){
            let cursor = document.getElementById("cursor");
            cursor.style.display = "block";
        }

        let calib_cursor = document.getElementById("calib_cursor");
        calib_cursor.style.display = "block";
        // this.run = true;
    };

    invisible()
    {
        this.__invisible = true;
        let cursor = document.getElementById("cursor");
        cursor.style.display = "none";
    }

    visible()
    {
        this.__invisible = false;
        let cursor = document.getElementById("cursor");
        cursor.style.display = "block";
    }

    stop(){
        this.run = false;
        console.log("stop");
    };

    recalibrate(){
        this.calibrator.unfit();
        this.calib_counter = 0;
    };
}