import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    registerCreator,
    loginCreator,
    logoutCreator,
    refreshAccessToken,
    changeCredentials,
    getCurrentCreator,
    updateAccountDetails,
    updateAvatar,
    updateCoveringCity,
    addBio,
    updateBio,
    getCreatorChannelProfile,
    getTopCreators,
    getAllCreators,
} from "../controller/creator.controller.js";

const router = Router();

// Public routes
router.route("/all").get(getAllCreators);
router.route("/").get(getAllCreators);
router.route("/top").get(getTopCreators);
router.route("/register").post(upload.single("avatar"), registerCreator);
router.route("/login").post(loginCreator);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/c/:creatorName").get(getCreatorChannelProfile);

// Secured routes
router.route("/logout").post(verifyJWT, logoutCreator);
router.route("/change-password").post(verifyJWT, changeCredentials);
router.route("/current-creator").get(verifyJWT, getCurrentCreator);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/covering-city").patch(verifyJWT, updateCoveringCity);
router.route("/add-bio").post(verifyJWT, addBio);
router.route("/update-bio").patch(verifyJWT, updateBio);

export default router;
