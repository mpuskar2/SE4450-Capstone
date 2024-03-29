import React, { useRef } from 'react';

var delay = false;

export default function Camera({ttsEnabled, commands}) {

  const videoRef = useRef(null);
  let currentStream; // Variable to store the current stream
  // Function to start the video stream
  const startVideoStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        currentStream = stream;
  
        // Add event listener for when metadata is loaded
        video.addEventListener('loadedmetadata', () => {
          // Mirror the video
          video.style.transform = 'scaleX(-1)';
        });
  
        video.play();
      })
      .catch(err => {
        console.error(err);
      });
  };
  
  // Function to stop the video stream
  const stopVideoStream = () => {
    if (currentStream) {
      let tracks = currentStream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log('Stop camera');
    }
  };
  
  // Function to restart the video stream
  const restartVideoStream = () => {
    stopVideoStream();
    startVideoStream();
  };
  
  // Check if camera is enabled
  const isCameraRunning = () => {
    return currentStream !== undefined && currentStream.active;
  };

  // Display Google Assistant response
  function addOutput(outVal){
    let br = document.createElement("br");
    let div = document.getElementById("titleDiv");
    let output = document.createElement("output");
    output.value = "Google Assistant: " + outVal;
    div.appendChild(output);
    div.appendChild(br);
  }

  // Display user input
  function addInputSign(prediction){
    delay = true;
    let br = document.createElement("br");
    let div = document.getElementById("titleDiv");
    let input = document.createElement("output");
    input.value = "You: " + commands[prediction] + " (" + prediction + ")";
    div.appendChild(input);
    div.appendChild(br);

    // Sends the signed text to the backend and receive a response from the assistant
    let path = window.location.protocol + "//" + window.location.hostname + ":4000/send/" + commands[prediction];
    fetch(path)
    .then(res => res.text()
      .then(data => {
        const output = JSON.parse(data);
        addOutput(output.response_text);
          
        if (output.response_html !== "") {
          let html = document.createElement('div');
          html.innerHTML = output.response_html;
          div.appendChild(html);
        }

        if (ttsEnabled) {
          var audioElement = new Audio();
          audioElement.src = "data:audio/ogg;base64," + output.audio_response;
          audioElement.play();
        }

        setTimeout(() => {
          console.log("Delay");
          delay = false;
        }, 3000);
    }));
  }

  // Capture an image
  const captureImage = () => {
    if (isCameraRunning() && !delay) {
      let video = videoRef.current;
      let canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; // set image width
      canvas.height = video.videoHeight; // set image height
      let context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas image to a Blob
      canvas.toBlob(function (blob) {
        // Create a FormData object and append the Blob
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');

        // Make a POST request using fetch
        let uploadPath = window.location.protocol + "//" + window.location.hostname + ":4000/upload";
        fetch(uploadPath, {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server
                console.log('Prediction:', data.prediction_text);
                //document.getElementById('predictionText').textContent = 'Prediction Text: ' + data.prediction_text;
                if (data.prediction_text && typeof data.prediction_text === 'string' && data.prediction_text.trim() !== '') {
                    addInputSign(data.prediction_text);
                    //setPredictionText(data.prediction_text);
                } else {
                    // Handle the case where data.prediction_text is null, undefined, or an empty string
                    console.log("No sign detected");
                }
                })
            .catch(error => {
                console.error('Error uploading the image:', error);
            });
    }, 'image/jpeg'); // Specify the desired MIME type
    }
  };

  // Capture an image every 1000 ms, 1 fps
  setInterval(() => {
    captureImage();
  }, 1000);

  return(
    <>
    <center>
    <video ref={videoRef}></video>
    <br></br>
    <button onClick={() => stopVideoStream()}>Stop Camera</button>
    <button onClick={() => restartVideoStream()}>Start Camera</button>
    </center>
    </>
  )
}
