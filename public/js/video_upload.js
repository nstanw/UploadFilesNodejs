function onSubmit(e) {
  e.preventDefault();
  var customMessage = document.getElementById("message");
  if (customMessage) {
    customMessage.style.display = 'block';
  }
  if (validateForm(customMessage)) {
    uploadVideo(customMessage);
  }
}

// Truy vấn thông tin địa chỉ giao diện và mã QR
fetch("/api/interface-address")
  .then((response) => response.json())
  .then((data) => {
    var interfaceAddress = data.interfaceAddress;
    var qrImage = data.QR;
    var ipElement = document.getElementById("ip-address");
    var qrElement = document.getElementById("qr-image");
    if (ipElement) {
      ipElement.innerHTML = interfaceAddress;
    }
    if (qrElement) {
      qrElement.src = qrImage;
    }
  })
  .catch((error) => {
    console.error("Lỗi khi lấy địa chỉ giao diện:", error);
  });

function validateForm(customMessage) {
  // Kiểm tra ID của form upload để tương thích với cả hai giao diện
  const fileInput = document.getElementById("file-input") || 
                    (document.getElementById("video-upload") && document.getElementById("video-upload").elements[0]);
  
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    if (customMessage) {
      customMessage.innerHTML = "Vui lòng chọn ít nhất một tệp để tải lên";
      customMessage.className = "error";
    }
    return false;
  }

  // Giới hạn kích thước tệp (100MB)
  const fileLimit = 104857600000000000;
  
  for (let i = 0; i < fileInput.files.length; i++) {
    const file = fileInput.files[i];
    if (file.size > fileLimit) {
      if (customMessage) {
        customMessage.innerHTML = `Tệp "${file.name}" vượt quá kích thước tối đa cho phép: 100MB`;
        customMessage.className = "error";
      }
      return false;
    }
  }
  
  return true;
}

function uploadVideo(customMessage) {
  try {
    // Vô hiệu hóa nút gửi để tránh gửi nhiều lần
    const submitButton = document.getElementById("submit");
    if (submitButton) {
      submitButton.disabled = true;
    }
    
    if (customMessage) {
      customMessage.innerHTML = "Đang chuẩn bị tải lên...";
    }

    // Hiển thị thanh tiến trình nếu có
    const progressContainer = document.getElementById("progress-container");
    if (progressContainer) {
      progressContainer.style.display = "block";
    }

    // Xác định form và file input
    const formElement = document.getElementById("upload-form") || document.getElementById("video-upload");
    const fileInput = document.getElementById("file-input") || 
                    (document.getElementById("video-upload") && document.getElementById("video-upload").elements[0]);
    
    if (!formElement || !fileInput || !fileInput.files || fileInput.files.length === 0) {
      throw new Error("Không tìm thấy form hoặc file để upload");
    }

    // Reset biến theo dõi tốc độ
    lastLoaded = 0;
    lastTime = Date.now();
    
    // Tạo và gửi request
    var request = new XMLHttpRequest();
    request.open("POST", "/", true);
    
    request.onerror = function(error) {
      console.error("Lỗi khi upload:", error);
      if (customMessage) {
        customMessage.innerHTML = "Có lỗi xảy ra khi tải lên";
        customMessage.className = "error";
      }
      if (submitButton) {
        submitButton.disabled = false;
      }
    };
    
    request.onload = onComplete;
    request.upload.onprogress = fileUploadPercentage;
    
    const data = new FormData(formElement);
    request.send(data);
    
  } catch (error) {
    console.error("Lỗi trong quá trình upload:", error);
    if (customMessage) {
      customMessage.innerHTML = error.message || "Có lỗi xảy ra khi tải lên";
      customMessage.className = "error";
    }
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function onComplete(event) {
  var customMessage = document.getElementById("message");
  
  // Ẩn thanh tiến trình nếu có
  const progressContainer = document.getElementById("progress-container");
  if (progressContainer) {
    progressContainer.style.display = "none";
  }

  try {
    const response = JSON.parse(event.currentTarget.response);
    if (response.success) {
      if (customMessage) {
        customMessage.innerHTML = "Tải lên thành công!";
        customMessage.className = "success";
      
        // Hiển thị thông báo thành công với đường dẫn đến thư viện
        setTimeout(() => {
          const mainDiv = document.getElementById("main-div");
          if (mainDiv) {
            // Nếu là giao diện mới, giữ nguyên container
            customMessage.innerHTML = "Tải lên thành công! <a href='/gallery.html' style='color: #004643; text-decoration: underline; font-weight: bold;'>Nhấn vào đây</a> để xem thư viện.";
          } else {
            // Nếu là giao diện cũ, ẩn container chính
            customMessage.innerHTML = "Tải lên thành công! <a href='/gallery.html'>Nhấn vào đây</a> để xem thư viện.";
          }
        }, 1000);
      }
    } else {
      if (customMessage) {
        customMessage.innerHTML = response.error || "Có lỗi xảy ra khi tải lên tệp";
        customMessage.className = "error";
      }
    }
  } catch (error) {
    if (customMessage) {
      customMessage.innerHTML = "Có lỗi xảy ra khi tải lên tệp";
      customMessage.className = "error";
    }
  }

  // Bật lại nút gửi
  const submitButton = document.getElementById("submit");
  if (submitButton) {
    submitButton.disabled = false;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFileInfo() {
  const fileInput = /** @type {HTMLInputElement} */ (document.getElementById("file-input"));
  const fileSizeDiv = document.getElementById("file-size");
  
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const fileSize = fileInput.files[0].size;
    fileSizeDiv.innerHTML = `Dung lượng file: ${formatFileSize(fileSize)}`;
  } else {
    fileSizeDiv.innerHTML = '';
  }
}

// Biến lưu thông tin để tính tốc độ
let lastLoaded = 0;
let lastTime = Date.now();

function calculateSpeed(loaded) {
  const now = Date.now();
  const timeDiff = (now - lastTime) / 1000; // Đổi sang giây
  const bytesDiff = loaded - lastLoaded;
  const speedBps = bytesDiff / timeDiff;
  
  // Cập nhật giá trị cho lần tính tiếp theo
  lastLoaded = loaded;
  lastTime = now;
  
  return formatFileSize(speedBps) + '/s';
}

function fileUploadPercentage(e) {
  if (e.lengthComputable) {
    var customMessage = document.getElementById("message");
    var percentage = Math.round((e.loaded / e.total) * 100);
    
    // Tính toán tốc độ
    const speed = calculateSpeed(e.loaded);
    
    // Cập nhật thanh tiến trình nếu có  
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    
    if (progressFill) {
      progressFill.style.width = percentage + "%";
    }
    if (progressText) {
      progressText.innerHTML = `${formatFileSize(e.loaded)} / ${formatFileSize(e.total)} (${percentage}%) - Tốc độ: ${speed}`;
    }
    
    if (customMessage) {
      customMessage.innerHTML = `Đang tải lên: ${formatFileSize(e.loaded)} / ${formatFileSize(e.total)} (${percentage}%) - Tốc độ: ${speed}`;
      if (percentage === 100) {
        customMessage.innerHTML = "Đang xử lý...";
      }
    }
  }
}
