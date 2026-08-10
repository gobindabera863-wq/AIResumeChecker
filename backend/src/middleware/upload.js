const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");

  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only PDF files are allowed. Please upload a valid PDF file."));
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
          return next(ApiError.badRequest("File size exceeds 5MB limit. Please upload a smaller PDF."));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        return next(err);
      }
      if (!req.file) {
        return next(ApiError.badRequest("No PDF file uploaded. Please select a PDF file."));
      }
      next();
    });
  };
}

module.exports = {
  upload,
  handleUploadMiddleware,
};
