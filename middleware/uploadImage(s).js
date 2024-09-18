const multer = require('multer');
const path = require('path');

// Define storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/products');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Middleware for handling both thumbnail and multiple images
const uploadImages = upload.fields([
    { name: 'thumbnail', maxCount: 1 },  // Single thumbnail // // for products: by admin
    { name: 'images', maxCount: 6 },    // Multiple images (max 6) // for products: by admin
    { name: 'return_proof_image', maxCount: 1 },    // image uploaded by :user: while returning an order once recieved
]);

module.exports = uploadImages;


