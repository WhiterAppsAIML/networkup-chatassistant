import multer from "multer";

const storage = multer.diskStorage({

    destination: (_req, _file, cb) => {

        cb(null, "knowledge/");
    },

    filename: (_req, file, cb) => {

        cb(null, file.originalname);
    }
});

export const upload = multer({
    storage,

    fileFilter: (_req, file, cb) => {

        if (
            file.mimetype === "text/plain" ||
            file.originalname.endsWith(".txt")
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only .txt files are currently supported."
                )
            );
        }
    }
});