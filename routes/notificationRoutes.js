import express from "express";

import { protect } from "../middleware/auth.js";

import {

    sendNotificationController,

    getNotificationsController,

    markAsReadController,

    markAllAsReadController,

    deleteNotificationController,

    clearAllNotificationsController,

} from "../controllers/notificationController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Send Notification (Admin)
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get User Notifications
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    protect,

    getNotificationsController

);

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

router.patch(

    "/:id/read",

    protect,

    markAsReadController

);

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

router.patch(

    "/read-all",

    protect,

    markAllAsReadController

);

/*
|--------------------------------------------------------------------------
| Clear All Notifications
|--------------------------------------------------------------------------
*/

router.delete(
    "/clear",
    protect,
    clearAllNotificationsController
);

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    protect,
    deleteNotificationController
);

export default router;