const path = require('path');
const fs = require('fs/promises');
const fileUploadConfig = require('../config/file-upload-config').fileUploadConfig;
const handleDb = require('../db/handle-db');
const multer  = require('multer');

module.exports.initUploadPage = function(req, res) {
  res.sendFile(path.resolve(__dirname + '/../public/video_upload_test.html'));
}

module.exports.uploadFile = function(req, res) {
  var upload = multer(fileUploadConfig).array('user-file',1000);
  let links = [];

  upload(req, res, async function(uploadError) {
    if(uploadError) {
      var errorMessage;
      if(uploadError.code === 'LIMIT_FILE_TYPE') {
        errorMessage = uploadError.errorMessage;
      } else if(uploadError.code === 'LIMIT_FILE_SIZE'){
        errorMessage = 'Maximum file size allowed is ' + process.env.FILE_SIZE + 'MB';
      }
      return res.json({
        error: errorMessage
      });
    }

    try {
      // Xử lý các file song song để tăng tốc
      await Promise.all(req.files.map(async file => {
        const fileId = Date.now().toString();
        const fileName = fileId + '-' + file.originalname.replace(/ /g, '_');
        const filePath = path.join(process.env.FILE_UPLOAD_PATH, fileName);
        
        // Lưu file từ buffer xuống disk
        await fs.writeFile(filePath, file.buffer);

        const link = 'http://' + req.hostname + ':' + process.env.PORT + '/video/' + fileId;
        links.push(link);

        const attributesToBeSaved = {
          id: fileId,
          name: file.originalname,
          size: file.size,
          path: filePath,
          encoding: file.encoding,
          details: req.body.details ? req.body.details : '',
          timestamp: Date.now()
        };

        await handleDb.saveToDB(attributesToBeSaved);
      }));

      res.json({
        success: true,
        link: links
      });

    } catch (error) {
      console.error('Error processing files:', error);
      res.json({
        error: 'Có lỗi xảy ra khi xử lý file'
      });
    }
  });
}
