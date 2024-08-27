

function onSubmit(e) {
  e.preventDefault();
  var customMessage = document.getElementById("message");
  if (validateForm(customMessage)) {
    uploadVideo(customMessage);
  }
}

//truyền giá trị này vào thẻ h3

fetch("/api/interface-address")
  .then((response) => response.json())
  .then((data) => {
    var interfaceAddress = data.interfaceAddress;
    var qrImage = data.QR;
    document.getElementById("ip-address").innerHTML = interfaceAddress;
    document.getElementById("qr-image").src = qrImage;
    console.log(interfaceAddress);
  });

function validateForm(customMessage) {
  const uploadedFile =
    document.getElementById("video-upload").elements[0].files[0];
  if (!uploadedFile) {
    customMessage.innerHTML = "Please select a video to upload";
    return false;
  }
  const fileLimit = 104857600000000;
  if (uploadedFile.size > fileLimit) {
    customMessage.innerHTML = "Maximum video size allowed: 100MB";
    return false;
  }
  return true;
}

function uploadVideo(customMessage) {
  document.getElementById("submit").disabled = true;
  customMessage.innerHTML = "uploading video..";
  var formElement = document.getElementById("video-upload");
  var request = new XMLHttpRequest();
  request.open("POST", "/", true);
  request.onload = onComplete;
  request.upload.onprogress = fileUploadPercentage;
  const data = new FormData(formElement);
  request.send(data);
}

function onComplete(event) {
  var customMessage = document.getElementById("message");
  const response = JSON.parse(event.currentTarget.response);
  if (response.success) {
    document.getElementById("main-div").style.display = "none";
    customMessage.style.color = "#9C27B0";
    customMessage.innerHTML =
      "Gallery Uploaded successfully!!. Please <a href=" +
      "/gallery.html" +
      ">click gallery</a> to view the gallery.";
  } else {
    customMessage.innerHTML = response.error;
    customMessage.style.color = "red";
  }
  document.getElementById("submit").disabled = false;
}

function fileUploadPercentage(e) {
  if (e.lengthComputable) {
    var customMessage = document.getElementById("message");
    var percentage = (e.loaded / e.total) * 100;
    customMessage.innerHTML = "Uploading Video: " + percentage + " %";
  }
}
