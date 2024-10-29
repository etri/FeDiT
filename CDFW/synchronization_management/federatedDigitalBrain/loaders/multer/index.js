const multer = require("multer");
const config = require("../../config");
const logger = require("../../lib/logger");
const uploadFolder = config.multer.uploadFolder; // NOTE: 업로드한 이미자가 잇을 express static folder
const fileSizeLimit = config.multer.fileSizeLimit;
const allowMimetype = config.multer.allowMimetype;

exports.init = () => {
   /**
    * for create visual model upload directory
    */

   const dirExists = (absolutePath) => {
      try {
         return fs.statSync(absolutePath).isDirectory();
      } catch (err) {
         logger.info(`Create visual model asset directory ${uploadFolder}`);
         return false;
      }
   };

   const fileExists = (files) => {
      let result = true;
      for (let i = 0; i < files.length; i += 1) {
         try {
            fs.statSync(files[i]).isFile();
         } catch (err) {
            result = false;
            break;
         }
      }
      return result;
   };
   if (!dirExists(uploadFolder)) {
      try {
         fs.mkdirSync(uploadFolder, { recursive: true });
      } catch (e) {
         throw e;
      }
   }
};

const diskStorage = multer.diskStorage({
   destination: function (req, file, done) {
      done(null, uploadFolder);
   },
   filename: function (req, file, done) {
      const ext = path.extname(file.originalname);
      // done(null, path.basename(file.originalname, ext) + ext);
      done(null, uuid() + ext);
   },
});

const visualModelUpload = multer({
   storage: diskStorage,
   limits: { fileSize: fileSizeLimit },
   fileFilter(req, file, done) {
      if (!allowMimetype.includes(path.extname(file.originalname))) {
         done(new Error("file mimetype is not allowed"), false);
      } else {
         done(null, true);
      }
   },
}).single("visual_data");

exports.visualModelUpload = visualModelUpload;
