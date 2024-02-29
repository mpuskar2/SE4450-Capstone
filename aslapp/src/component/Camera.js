import React, { useRef, useState, useEffect } from 'react';
import Text from './Text';

export default function Camera() {

  const videoRef = useRef(null);
  let currentStream; // Variable to store the current stream
  //const [predictionText, setPredictionText] = useState('');
  
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

  // funky stuff...
  function addOutput(outVal){
    let br = document.createElement("br");
    let div = document.getElementById("titleDiv");
    let output = document.createElement("output");
    output.value = "Google Assistant: " + outVal;
    div.appendChild(output);
    div.appendChild(br);
    
  }

  function addInputSign(prediction){
    let br = document.createElement("br");
    let div = document.getElementById("titleDiv");
    let input = document.createElement("output");
    input.value = "You: " + prediction;
    div.appendChild(input);
    div.appendChild(br);

    // Sends the typed text to the backend and receive a response from the assistant
    // This should eventually show the signed input as text and appropriate response
    let path = window.location.protocol + "//" + window.location.hostname + ":4000/send/" + prediction;
    fetch(path).then(res => res.text()
    .then(data => {
      addOutput(data);
    }));
  }

  // Capture an image
  const captureImage = () => {
    if (isCameraRunning()) {
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
        fetch('http://localhost:5000/upload', {
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
/*
      // Convert the canvas to an image
      let image = new Image();
      image.src = canvas.toDataURL('image/png');

      // Display image in the page body
      // This should go to the model input once connected
      document.body.removeChild(document.body.lastChild);
      document.body.appendChild(image); */
    }
  };

  // Capture an image every 83 ms ~ 12 fps
  setInterval(() => {
    captureImage();
  }, 2000);

  return(
    <>
    <center>
    <video ref={videoRef}></video>
    <br></br>
    <button onClick={() => stopVideoStream()}>Stop Camera</button>
    <button onClick={() => restartVideoStream()}>Start Camera</button>
    </center>
    {/*<Text predictionText={predictionText} />*/}
    </>
  )
}
