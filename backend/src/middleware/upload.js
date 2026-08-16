const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
  const isMimeOk = ALLOWED_MIMETYPES.includes(file.mimetype);
  const isExtOk = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeOk || isExtOk) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only PDF and DOCX files are allowed. Please upload a valid resume file."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

function handleUploadMiddleware(field) {
  return (req, res, next) => {
    const singleUpload = upload.single(field);
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.badRequest("File size exceeds 5MB limit. Please upload a smaller file."));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        return next(err);
      }
      if (!req.file) {
        return next(ApiError.badRequest("No resume file uploaded. Please select a PDF or DOCX file."));
      }
      next();
    });
  };
}

module.exports = {
  upload,
  handleUploadMiddleware,
};
